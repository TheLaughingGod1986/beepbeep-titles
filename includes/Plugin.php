<?php
/**
 * Plugin bootstrap.
 *
 * Quota lives on the backend now — there is no local usage table and no
 * direct Anthropic path. This class wires the admin UI + REST proxy, the
 * fallback head filters (when no SEO plugin is active), and the optional
 * auto-generate-on-publish behaviour.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

use BeepBeep_Titles\Api\Client;
use BeepBeep_Titles\Seo\MetaWriter;

defined( 'ABSPATH' ) || exit;

class Plugin {

    public function init(): void {
        ( new Admin( $this ) )->init();
        ( new RestApi( $this ) )->init();

        // When no SEO plugin owns the head, emit our generated title + meta.
        if ( MetaWriter::active() === 'fallback' ) {
            MetaWriter::register_fallback_filters();
        }

        // Keep the cached SEO-plugin choice fresh if the user (de)activates one.
        add_action( 'activated_plugin',   [ MetaWriter::class, 'refresh' ] );
        add_action( 'deactivated_plugin', [ MetaWriter::class, 'refresh' ] );

        // Auto-generate on publish when enabled; remote generation may require
        // an account and available BeepBeep AI service credits.
        add_action( 'save_post', [ $this, 'maybe_auto_generate' ], 20, 3 );

        // Keep the cached stats (Home's "Today's Pass") in step with the live
        // Library: any publish/unpublish/trash changes the counts, so bust the
        // transient on status transitions and deletes — not just when Autopilot
        // happens to run. Without this the dashboard reads up to 15 min stale.
        add_action( 'transition_post_status', [ $this, 'invalidate_stats_on_transition' ], 10, 3 );
        add_action( 'deleted_post', [ $this, 'invalidate_stats_on_delete' ], 10, 1 );

        // Surface deferred admin notices (e.g. auto-generate failures).
        add_action( 'admin_notices', [ $this, 'render_admin_notices' ] );
    }

    // ----------------------------------------------------------------
    // Activation / deactivation
    // ----------------------------------------------------------------

    public static function activate(): void {
        self::set_defaults();
        self::drop_legacy_table();

        // Establish stable identity + detect the SEO plugin once.
        $client = new Client();
        $client->install_hash();
        $client->fingerprint();
        MetaWriter::refresh();

        flush_rewrite_rules();
    }

    public static function deactivate(): void {
        delete_transient( 'beepti_scan_lock' );
        delete_transient( 'beepti_stats' );
        flush_rewrite_rules();
    }

    private static function set_defaults(): void {
        add_option( 'beepti_settings', [
            'tone'                 => 'direct',
            'title_length'         => 'standard',
            'meta_length'          => 'standard',
            'auto_generate'        => false,
            'onboarding_complete'  => false,
            'custom_instructions'  => '',
            'brand_name_override'  => '',
            'delete_on_uninstall'    => false,
            'notify_new_pages'     => true,
            'weekly_digest'        => false,
            'notify_quota_warning' => true,
        ] );
    }

    /** Remove the pre-1.0 local usage table — quota is backend-owned now. */
    private static function drop_legacy_table(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'beepti_usage_log';
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- $table is a prefix-built identifier (cannot be a placeholder); static DDL with no user input.
        $wpdb->query( "DROP TABLE IF EXISTS {$table}" );
        delete_option( 'beepti_db_version' );
    }

    // ----------------------------------------------------------------
    // Auto-generate on publish
    // ----------------------------------------------------------------

    public function maybe_auto_generate( int $post_id, \WP_Post $post, bool $update ): void {
        if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
            return;
        }
        if ( $post->post_status !== 'publish' ) {
            return;
        }
        // Cover the same post types the scanner/Library does (all public types
        // incl. custom post types) so Autopilot doesn't lag behind the manual
        // pipeline — shares the `beepti_scanned_post_types` filter as one source.
        if ( ! in_array( $post->post_type, Scanner::post_types(), true ) ) {
            return;
        }

        $settings = get_option( 'beepti_settings', [] );
        if ( empty( $settings['auto_generate'] ) ) {
            return;
        }

        // Only fill gaps — never overwrite copy that already exists.
        $current = MetaWriter::read( $post_id );
        if ( $current['title'] !== '' && $current['meta'] !== '' ) {
            return;
        }

        $client = new Client();
        if ( ! $client->has_license() ) {
            return;
        }

        $result = $client->generate(
            $this->autopilot_page_envelope( $post, $current ),
            $this->autopilot_options( $settings )
        );

        if ( is_wp_error( $result ) ) {
            $this->queue_admin_notice(
                sprintf(
                    /* translators: 1: post title, 2: error message */
                    __( 'BeepBeep Titles could not auto-generate SEO for “%1$s”: %2$s', 'beepbeep-titles' ),
                    $post->post_title,
                    $result->get_error_message()
                ),
                'warning'
            );
            return;
        }

        MetaWriter::write( $post_id, (string) ( $result['title'] ?? '' ), (string) ( $result['meta'] ?? '' ) );
        ActivityLog::record( $post_id, 'auto' );
        delete_transient( 'beepti_stats' );
    }

    /**
     * Bust the cached stats when a scanned post enters or leaves 'publish'
     * (new post published, draft → publish, publish → trash, etc.). Anything
     * that doesn't touch the published set leaves the counts unchanged.
     */
    public function invalidate_stats_on_transition( string $new_status, string $old_status, \WP_Post $post ): void {
        if ( $new_status === $old_status ) {
            return;
        }
        if ( $new_status !== 'publish' && $old_status !== 'publish' ) {
            return;
        }
        if ( ! in_array( $post->post_type, Scanner::post_types(), true ) ) {
            return;
        }
        delete_transient( 'beepti_stats' );
    }

    /** Permanently deleting a published, scanned post lowers the counts. */
    public function invalidate_stats_on_delete( int $post_id ): void {
        $post = get_post( $post_id );
        if ( ! $post || $post->post_status !== 'publish' ) {
            return;
        }
        if ( ! in_array( $post->post_type, Scanner::post_types(), true ) ) {
            return;
        }
        delete_transient( 'beepti_stats' );
    }

    private function autopilot_page_envelope( \WP_Post $post, array $current ): array {
        $envelope = PostPresenter::envelope( $post, $current );

        // Preserve the v1 auto-generate payload: the publish hook has always
        // sent a simplified section (no Shop / taxonomy lookup on save_post).
        $envelope['section'] = $post->post_type === 'page' ? 'Pages' : 'Blog';

        return $envelope;
    }

    private function autopilot_options( array $settings ): array {
        $brand = ! empty( $settings['brand_name_override'] ) ? (string) $settings['brand_name_override'] : get_bloginfo( 'name' );
        $opts  = [ 'brand_name' => $brand ];
        if ( ! empty( $settings['tone'] ) ) {
            $opts['tone'] = (string) $settings['tone'];
        }
        return $opts;
    }

    // ----------------------------------------------------------------
    // Admin notices (deferred)
    // ----------------------------------------------------------------

    private function queue_admin_notice( string $message, string $type = 'info' ): void {
        $notices   = get_transient( 'beepti_admin_notices' );
        $notices   = is_array( $notices ) ? $notices : [];
        $notices[] = [ 'message' => $message, 'type' => $type ];
        set_transient( 'beepti_admin_notices', $notices, 5 * MINUTE_IN_SECONDS );
    }

    public function render_admin_notices(): void {
        $notices = get_transient( 'beepti_admin_notices' );
        if ( empty( $notices ) || ! is_array( $notices ) ) {
            return;
        }
        delete_transient( 'beepti_admin_notices' );

        foreach ( $notices as $notice ) {
            $class = 'notice notice-' . ( $notice['type'] === 'warning' ? 'warning' : 'info' ) . ' is-dismissible';
            printf( '<div class="%1$s"><p>%2$s</p></div>', esc_attr( $class ), esc_html( $notice['message'] ) );
        }
    }
}
