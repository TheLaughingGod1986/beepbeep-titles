<?php
/**
 * Single + bulk generation REST handlers.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Rest;

use BeepBeep_Titles\ActivityLog;
use BeepBeep_Titles\Api\Client;
use BeepBeep_Titles\PostPresenter;
use BeepBeep_Titles\Scoring\Metadata_Scoring_Engine;
use BeepBeep_Titles\Seo\MetaWriter;
use BeepBeep_Titles\Telemetry;
use OptiAI\Core\Scan\History_Repository;
use OptiAI\Core\Scan\Scan_Repository;

defined( 'ABSPATH' ) || exit;

class GenerateController {

    public function __construct( private readonly Client $client ) {}

    public function generate( \WP_REST_Request $req ): \WP_REST_Response {
        $post = get_post( (int) $req->get_param( 'post_id' ) );
        if ( ! $post ) {
            return new \WP_REST_Response( [ 'success' => false, 'code' => 'INVALID_REQUEST', 'message' => __( 'Page not found.', 'beepbeep-titles' ) ], 400 );
        }

        $previous = $req->get_param( 'previous' );
        $previous = $this->sanitize_previous( $previous );

        $result = $this->client->generate(
            PostPresenter::envelope( $post ),
            $this->generation_options(),
            $previous
        );

        if ( is_wp_error( $result ) ) {
            $code = (string) $result->get_error_code();
            $event = ( false !== stripos( $code, 'credit' ) || false !== stripos( $code, 'quota' ) )
                ? 'generation_failed_no_credits'
                : 'generation_failed';
            Telemetry::capture( $event, [
                'generation_surface' => 'dashboard',
                'generation_mode'    => 'single',
                'error_code'         => sanitize_key( $code ),
                'post_id'            => (int) $post->ID,
            ] );
            return ErrorResponder::from_wp_error( $result );
        }

        // Snapshot the pre-optimise state so this can be undone.
        $before       = MetaWriter::read( $post->ID );
        $score_before = $this->current_item_score( $post->ID );

        // Persist into the active SEO plugin.
        $title = (string) ( $result['title'] ?? '' );
        $meta  = (string) ( $result['meta'] ?? '' );
        MetaWriter::write( $post->ID, $title, $meta );
        ActivityLog::record( $post->ID, 'generated' );
        Telemetry::capture( 'generation_completed', [
            'generation_surface' => 'dashboard',
            'generation_mode'    => 'single',
            'page_count'         => 1,
            'is_regenerate'      => ! empty( $previous ),
        ] );
        Telemetry::capture( 'title_meta_generated', [
            'generation_surface' => 'dashboard',
            'generation_mode'    => 'single',
            'page_count'         => 1,
        ] );
        ( new Scan_Repository( 'titles' ) )->mark_optimised( (string) $post->ID, $post->post_type );
        $this->bust_stats();
        // Refresh the local health score so the dashboard shows the
        // improvement immediately — free, no credits used.
        ( new Metadata_Scoring_Engine() )->run();
        $score_after = $this->current_item_score( $post->ID );

        ( new History_Repository( 'titles' ) )->record(
            (string) $post->ID,
            wp_json_encode( [ 'title' => $before['title'], 'meta' => $before['meta'] ] ),
            wp_json_encode( [ 'title' => $title, 'meta' => $meta ] ),
            $score_before,
            $score_after,
            1
        );

        $result['wp_post_id'] = $post->ID;
        return new \WP_REST_Response( $result, 200 );
    }

    public function submit_job( \WP_REST_Request $req ): \WP_REST_Response {
        $post_ids = (array) $req->get_param( 'post_ids' );
        $post_ids = array_slice( $post_ids, 0, 100 );

        $pages   = [];
        $ordered = [];
        foreach ( $post_ids as $post_id ) {
            $post = get_post( $post_id );
            if ( ! $post ) {
                continue;
            }
            $envelope       = PostPresenter::envelope( $post );
            $envelope['id'] = (string) $post->ID; // client ref echoed back in poll items
            $pages[]        = $envelope;
            $ordered[]      = $post->ID;
        }

        if ( empty( $pages ) ) {
            return new \WP_REST_Response( [ 'success' => false, 'code' => 'INVALID_REQUEST', 'message' => __( 'No valid pages to generate.', 'beepbeep-titles' ) ], 400 );
        }

        $scope   = $req->get_param( 'scope' );
        $context = $scope ? [ 'scope' => sanitize_text_field( $scope ) ] : [];

        $result = $this->client->submit_job( $pages, $this->generation_options(), $context );
        if ( is_wp_error( $result ) ) {
            Telemetry::capture( 'batch_generation_failed', [
                'generation_surface' => 'bulk_generation',
                'page_count'         => count( $pages ),
                'error_code'         => sanitize_key( (string) $result->get_error_code() ),
            ] );
            return ErrorResponder::from_wp_error( $result );
        }

        $job_id = (string) ( $result['jobId'] ?? '' );
        if ( $job_id !== '' ) {
            // Cache ordered post ids so we can map poll items back even if the
            // backend assigns its own item ids.
            set_transient( 'beepti_job_' . $job_id, $ordered, HOUR_IN_SECONDS );
        }

        Telemetry::capture( 'batch_generation_started', [
            'generation_surface' => 'bulk_generation',
            'generation_mode'    => 'batch',
            'page_count'         => count( $pages ),
            'job_id'             => $job_id,
        ] );

        return new \WP_REST_Response( $result, 200 );
    }

    public function poll_job( \WP_REST_Request $req ): \WP_REST_Response {
        $job_id = (string) $req['id'];
        $result = $this->client->poll_job( $job_id );
        if ( is_wp_error( $result ) ) {
            return ErrorResponder::from_wp_error( $result );
        }

        $ordered = get_transient( 'beepti_job_' . $job_id );
        $ordered = is_array( $ordered ) ? $ordered : [];
        $items   = isset( $result['items'] ) && is_array( $result['items'] ) ? $result['items'] : [];
        $wrote   = false;

        foreach ( $items as $i => &$item ) {
            $post_id = $this->resolve_item_post_id( $item, $ordered, $i );
            if ( $post_id > 0 ) {
                if ( ! current_user_can( 'edit_post', $post_id ) ) {
                    continue;
                }
                $item['wp_post_id'] = $post_id;
                $post               = get_post( $post_id );
                if ( $post ) {
                    $item['url']     = PostPresenter::permalink_path( $post );
                    $item['section'] = PostPresenter::section_for( $post );
                }

                if ( ( $item['status'] ?? '' ) === 'completed' ) {
                    // Polls re-hit completed items — persist once per post per job.
                    // claim_job_item_write() is atomic across overlapping polls so
                    // we never double-write ActivityLog / history / meta.
                    if ( $this->claim_job_item_write( $job_id, $post_id ) ) {
                        $title_out    = (string) ( $item['title'] ?? '' );
                        $meta_out     = (string) ( $item['meta'] ?? '' );
                        $before       = MetaWriter::read( $post_id );
                        $score_before = $this->current_item_score( $post_id );
                        MetaWriter::write( $post_id, $title_out, $meta_out );
                        ActivityLog::record( $post_id, 'generated' );
                        if ( $post ) {
                            ( new Scan_Repository( 'titles' ) )->mark_optimised( (string) $post_id, $post->post_type );
                        }
                        ( new History_Repository( 'titles' ) )->record(
                            (string) $post_id,
                            wp_json_encode( [ 'title' => $before['title'], 'meta' => $before['meta'] ] ),
                            wp_json_encode( [ 'title' => $title_out, 'meta' => $meta_out ] ),
                            $score_before,
                            null,
                            1
                        );
                        $wrote = true;
                    }
                }
            }
        }
        unset( $item );

        $result['items'] = $items;

        if ( $wrote ) {
            $this->bust_stats();
        }

        // Clean up the post-id mapping once the job is terminal, and refresh
        // the local health score exactly once (not on every poll tick) so the
        // dashboard's "before / after" celebration reflects the new scores.
        // Keep per-item write guards (option + transient) so a late / overlapping
        // poll cannot re-persist activity + history for the same job items.
        if ( in_array( $result['status'] ?? '', [ 'completed', 'failed' ], true ) ) {
            delete_transient( 'beepti_job_' . $job_id );
            $this->release_job_item_option_guards( $job_id, $ordered );
            if ( $wrote ) {
                ( new Metadata_Scoring_Engine() )->run();
            }
            $telemetry_key = 'beepti_job_telemetry_' . $job_id;
            if ( ! get_transient( $telemetry_key ) ) {
                set_transient( $telemetry_key, 1, HOUR_IN_SECONDS );
                $completed_count = 0;
                foreach ( $items as $item ) {
                    if ( ( $item['status'] ?? '' ) === 'completed' ) {
                        ++$completed_count;
                    }
                }
                $status_event = ( $result['status'] ?? '' ) === 'completed'
                    ? 'batch_generation_completed'
                    : 'batch_generation_failed';
                Telemetry::capture( $status_event, [
                    'generation_surface' => 'bulk_generation',
                    'generation_mode'    => 'batch',
                    'page_count'         => count( $ordered ),
                    'completed_count'    => $completed_count,
                    'job_id'             => $job_id,
                ] );
                if ( $completed_count > 0 ) {
                    Telemetry::capture( 'title_meta_generated', [
                        'generation_surface' => 'bulk_generation',
                        'generation_mode'    => 'batch',
                        'page_count'         => $completed_count,
                    ] );
                }
            }
        }

        return new \WP_REST_Response( $result, 200 );
    }

    /**
     * Revert one page's title/meta to whatever it was immediately before the
     * most recent optimisation, per the shared history log. Undoing does not
     * refund the credit that was spent — it only reverts the content.
     */
    public function undo( \WP_REST_Request $req ): \WP_REST_Response|\WP_Error {
        $post_id = (int) $req->get_param( 'post_id' );
        $post    = get_post( $post_id );
        if ( ! $post ) {
            return new \WP_Error( 'beepti_not_found', __( 'Page not found.', 'beepbeep-titles' ), [ 'status' => 404 ] );
        }

        $history = ( new History_Repository( 'titles' ) )->get_latest_for_item( (string) $post_id );
        if ( ! $history ) {
            return new \WP_Error( 'beepti_no_history', __( 'Nothing to undo for this page.', 'beepbeep-titles' ), [ 'status' => 404 ] );
        }

        $old = json_decode( (string) $history['old_value'], true );
        if ( ! is_array( $old ) ) {
            return new \WP_Error( 'beepti_undo_failed', __( 'Could not read the previous version.', 'beepbeep-titles' ), [ 'status' => 500 ] );
        }

        // restore() (not write()) — the pre-optimise value may genuinely be
        // empty, and write() treats an empty string as "leave unchanged",
        // which would silently no-op the undo for exactly the pages that
        // had no title/meta before OptiAI touched them.
        MetaWriter::restore( $post_id, (string) ( $old['title'] ?? '' ), (string) ( $old['meta'] ?? '' ) );
        ActivityLog::record( $post_id, 'edited' );
        Telemetry::capture( 'page_undone', [ 'post_id' => $post_id ] );
        $this->bust_stats();
        ( new Metadata_Scoring_Engine() )->run();

        return new \WP_REST_Response( ( new \BeepBeep_Titles\Scanner() )->format_post( get_post( $post_id ) ) );
    }

    /**
     * Bulk "Reset generated title & meta" (Settings → Danger zone). Reverts
     * every page this plugin has ever optimised back to its earliest
     * recorded pre-optimise snapshot — i.e. how it looked before OptiAI
     * touched it for the first time — using the same history log undo()
     * relies on. Manual edits made through the Library's edit modal are
     * untouched since they never go through GenerateController and so never
     * write a history row.
     */
    public function reset_all( \WP_REST_Request $req ): \WP_REST_Response {
        $snapshots = ( new History_Repository( 'titles' ) )->earliest_snapshots();
        $reset     = 0;

        foreach ( $snapshots as $site_item_id => $old_value_json ) {
            $post_id = (int) $site_item_id;
            $post    = get_post( $post_id );
            if ( ! $post ) {
                continue;
            }
            $old = json_decode( (string) $old_value_json, true );
            if ( ! is_array( $old ) ) {
                continue;
            }
            MetaWriter::restore( $post_id, (string) ( $old['title'] ?? '' ), (string) ( $old['meta'] ?? '' ) );
            ActivityLog::record( $post_id, 'edited' );
            ++$reset;
        }

        if ( $reset > 0 ) {
            $this->bust_stats();
            ( new Metadata_Scoring_Engine() )->run();
        }

        Telemetry::capture( 'generated_reset', [ 'reset_count' => $reset ] );

        return new \WP_REST_Response( [ 'success' => true, 'reset_count' => $reset ] );
    }

    private function current_item_score( int $post_id ): ?int {
        global $wpdb;
        if ( ! \OptiAI\Core\Scan\Schema::items_table_exists() ) {
            return null;
        }
        $table = \OptiAI\Core\Scan\Schema::items_table();
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared -- values bound via prepare().
        $score = $wpdb->get_var( $wpdb->prepare(
            "SELECT score FROM {$table} WHERE module = %s AND site_item_id = %s",
            'titles',
            (string) $post_id
        ) );
        return null === $score ? null : (int) $score;
    }

    /** Options block shared by single + bulk generation. */
    private function generation_options(): array {
        $settings = get_option( 'beepti_settings', [] );
        $settings = is_array( $settings ) ? $settings : [];

        $brand = ! empty( $settings['brand_name_override'] )
            ? (string) $settings['brand_name_override']
            : get_bloginfo( 'name' );

        $options = [ 'brand_name' => $brand ];

        if ( ! empty( $settings['tone'] ) ) {
            $options['tone'] = (string) $settings['tone'];
        }

        $title_max = [ 'compact' => 50, 'standard' => 60, 'rich' => 65 ];
        $meta_max  = [ 'brief' => 130, 'standard' => 160, 'detailed' => 170 ];
        if ( isset( $settings['title_length'], $title_max[ $settings['title_length'] ] ) ) {
            $options['title_max_chars'] = $title_max[ $settings['title_length'] ];
        }
        if ( isset( $settings['meta_length'], $meta_max[ $settings['meta_length'] ] ) ) {
            $options['meta_max_chars'] = $meta_max[ $settings['meta_length'] ];
        }

        return $options;
    }

    private function sanitize_previous( $previous ): ?array {
        if ( ! is_array( $previous ) ) {
            return null;
        }
        $title = isset( $previous['title'] ) ? sanitize_text_field( (string) $previous['title'] ) : '';
        $meta  = isset( $previous['meta'] ) ? sanitize_textarea_field( (string) $previous['meta'] ) : '';
        if ( $title === '' && $meta === '' ) {
            return null;
        }
        return [ 'title' => $title, 'meta' => $meta ];
    }

    /** Map a poll item to a WP post id: prefer the echoed client id, else order. */
    private function resolve_item_post_id( array $item, array $ordered, int $index ): int {
        $id = $item['id'] ?? null;
        if ( is_numeric( $id ) && in_array( (int) $id, $ordered, true ) ) {
            return (int) $id;
        }
        return $ordered[ $index ] ?? 0;
    }

    /**
     * Atomically claim the right to persist one completed job item.
     * Overlapping polls both see status=completed; only the first writer wins.
     *
     * Uses add_option (atomic) plus a day-long transient so late polls after
     * the option guard is released still skip.
     */
    private function claim_job_item_write( string $job_id, int $post_id ): bool {
        if ( $job_id === '' || $post_id <= 0 ) {
            return false;
        }
        $key = $this->job_item_guard_key( $job_id, $post_id );
        if ( get_transient( $key ) ) {
            return false;
        }
        // add_option returns false when the key already exists — safe under concurrency.
        if ( ! add_option( $key, time(), '', false ) ) {
            return false;
        }
        set_transient( $key, 1, DAY_IN_SECONDS );

        $recorded_key         = 'beepti_job_hist_' . $job_id;
        $recorded             = get_transient( $recorded_key );
        $recorded             = is_array( $recorded ) ? $recorded : [];
        $recorded[ $post_id ] = true;
        set_transient( $recorded_key, $recorded, DAY_IN_SECONDS );

        return true;
    }

    /**
     * Drop the durable option locks once the job is terminal; the matching
     * transients remain for a day so a late poll cannot re-claim.
     *
     * @param array<int,int> $ordered
     */
    private function release_job_item_option_guards( string $job_id, array $ordered ): void {
        foreach ( $ordered as $post_id ) {
            $post_id = (int) $post_id;
            if ( $post_id <= 0 ) {
                continue;
            }
            delete_option( $this->job_item_guard_key( $job_id, $post_id ) );
        }
    }

    private function job_item_guard_key( string $job_id, int $post_id ): string {
        return 'beepti_ji_' . md5( $job_id . ':' . $post_id );
    }

    private function bust_stats(): void {
        delete_transient( 'beepti_stats' );
    }
}
