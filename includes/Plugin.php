<?php
namespace BeepBeep_Titles;

class Plugin {

    public function init(): void {
        ( new Admin( $this ) )->init();
        ( new RestApi( $this ) )->init();

        // Auto-generate on publish when Pro + setting enabled.
        add_action( 'publish_post',  [ $this, 'maybe_auto_generate' ], 10, 2 );
        add_action( 'publish_page',  [ $this, 'maybe_auto_generate' ], 10, 2 );
    }

    // ----------------------------------------------------------------
    // Activation / deactivation
    // ----------------------------------------------------------------

    public static function activate(): void {
        self::create_tables();
        self::set_defaults();
        flush_rewrite_rules();
    }

    public static function deactivate(): void {
        delete_transient( 'bbt_scan_lock' );
        flush_rewrite_rules();
    }

    private static function create_tables(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'bbt_usage_log';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$table} (
            id          BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id     BIGINT(20) UNSIGNED NOT NULL,
            post_id     BIGINT(20) UNSIGNED DEFAULT NULL,
            action      VARCHAR(50)  NOT NULL DEFAULT 'generate',
            created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_user_date (user_id, created_at),
            KEY idx_post (post_id)
        ) {$charset_collate};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );

        update_option( 'bbt_db_version', BBT_VERSION );
    }

    private static function set_defaults(): void {
        add_option( 'bbt_settings', [
            'tone'                 => 'direct',
            'title_length'        => 'standard',
            'meta_length'         => 'standard',
            'auto_generate'       => false,
            'custom_instructions' => '',
            'notifications'       => [
                'new_page'    => true,
                'digest'      => false,
                'limit_warn'  => true,
            ],
        ] );
    }

    // ----------------------------------------------------------------
    // Quota
    // ----------------------------------------------------------------

    public function get_quota( int $user_id ): array {
        $plan = $this->get_user_plan( $user_id );

        if ( $plan === 'pro' ) {
            return [
                'plan'           => 'pro',
                'daily_used'     => $this->count_usage( $user_id, 'day' ),
                'daily_limit'    => PHP_INT_MAX,
                'monthly_used'   => $this->count_usage( $user_id, 'month' ),
                'monthly_limit'  => PHP_INT_MAX,
                'daily_remaining'=> PHP_INT_MAX,
            ];
        }

        $daily_used    = $this->count_usage( $user_id, 'day' );
        $monthly_used  = $this->count_usage( $user_id, 'month' );
        $daily_limit   = 5;
        $monthly_limit = 50;

        return [
            'plan'           => 'free',
            'daily_used'     => $daily_used,
            'daily_limit'    => $daily_limit,
            'monthly_used'   => $monthly_used,
            'monthly_limit'  => $monthly_limit,
            'daily_remaining'=> max( 0, $daily_limit - $daily_used ),
        ];
    }

    public function get_user_plan( int $user_id ): string {
        return get_user_meta( $user_id, 'bbt_plan', true ) ?: 'free';
    }

    public function log_usage( int $user_id, int $post_id, string $action = 'generate' ): void {
        global $wpdb;
        $wpdb->insert(
            $wpdb->prefix . 'bbt_usage_log',
            [
                'user_id'    => $user_id,
                'post_id'    => $post_id,
                'action'     => $action,
                'created_at' => current_time( 'mysql' ),
            ],
            [ '%d', '%d', '%s', '%s' ]
        );
    }

    private function count_usage( int $user_id, string $period ): int {
        global $wpdb;
        $table = $wpdb->prefix . 'bbt_usage_log';

        $since = $period === 'day'
            ? current_time( 'Y-m-d' ) . ' 00:00:00'
            : date( 'Y-m-01', current_time( 'timestamp' ) ) . ' 00:00:00';

        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table}
             WHERE user_id = %d AND action = 'generate' AND created_at >= %s",
            $user_id,
            $since
        ) );
    }

    // ----------------------------------------------------------------
    // Auto-generate on publish
    // ----------------------------------------------------------------

    public function maybe_auto_generate( int $post_id, \WP_Post $post ): void {
        $user_id  = get_current_user_id() ?: (int) $post->post_author;
        $plan     = $this->get_user_plan( $user_id );
        $settings = get_option( 'bbt_settings', [] );

        if ( $plan !== 'pro' || empty( $settings['auto_generate'] ) ) {
            return;
        }

        // Skip if title + meta already exist.
        $has_title = (bool) get_post_meta( $post_id, '_bbt_seo_title', true );
        $has_meta  = (bool) get_post_meta( $post_id, '_bbt_meta_description', true );
        if ( $has_title && $has_meta ) {
            return;
        }

        $generator = new Generator();
        $result    = $generator->generate( $post, $settings );
        if ( is_wp_error( $result ) ) {
            return;
        }

        if ( ! $has_title && ! empty( $result['title'] ) ) {
            update_post_meta( $post_id, '_bbt_seo_title', sanitize_text_field( $result['title'] ) );
        }
        if ( ! $has_meta && ! empty( $result['meta'] ) ) {
            update_post_meta( $post_id, '_bbt_meta_description', sanitize_text_field( $result['meta'] ) );
        }

        $this->log_usage( $user_id, $post_id, 'generate' );
    }
}
