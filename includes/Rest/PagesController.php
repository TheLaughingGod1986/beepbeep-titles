<?php
/**
 * Pages, scan, and settings REST handlers.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Rest;

use BeepBeep_Titles\ActivityLog;
use BeepBeep_Titles\Api\Client;
use BeepBeep_Titles\Scanner;
use BeepBeep_Titles\Scoring\Metadata_Scoring_Engine;
use BeepBeep_Titles\Seo\MetaWriter;
use BeepBeep_Titles\SettingsSanitizer;

defined( 'ABSPATH' ) || exit;

class PagesController {

    /** Statuses the Library can read/edit: live pages plus pre-publish drafts. */
    private const EDITABLE_STATUSES = [ 'publish', 'draft', 'pending', 'future' ];

    public function __construct( private readonly Client $client ) {}

    public function get_pages( \WP_REST_Request $req ): \WP_REST_Response {
        $scanner = new Scanner();
        $result  = $scanner->get_pages(
            $req->get_param( 'filter' ),
            $req->get_param( 'search' ),
            (int) $req->get_param( 'page' ),
            (int) $req->get_param( 'per_page' )
        );

        $stats = $scanner->get_stats();
        return new \WP_REST_Response( [
            'pages'           => $result['items'],
            'total'           => $result['total'],
            'total_optimised' => $stats['optimised'] ?? 0,
            'stats'           => $stats,
        ] );
    }

    public function get_page( \WP_REST_Request $req ): \WP_REST_Response|\WP_Error {
        $post = get_post( (int) $req['id'] );
        if ( ! $post || ! in_array( $post->post_status, self::EDITABLE_STATUSES, true ) ) {
            return new \WP_Error( 'beepti_not_found', __( 'Page not found.', 'beepbeep-titles' ), [ 'status' => 404 ] );
        }
        return new \WP_REST_Response( ( new Scanner() )->format_post( $post ) );
    }

    public function update_page( \WP_REST_Request $req ): \WP_REST_Response|\WP_Error {
        $post = get_post( (int) $req['id'] );
        if ( ! $post || ! in_array( $post->post_status, self::EDITABLE_STATUSES, true ) ) {
            return new \WP_Error( 'beepti_not_found', __( 'Page not found.', 'beepbeep-titles' ), [ 'status' => 404 ] );
        }

        $title = $req->get_param( 'seo_title' );
        $meta  = $req->get_param( 'meta_desc' );

        if ( null !== $title || null !== $meta ) {
            MetaWriter::write( $post->ID, (string) $title, (string) $meta );
            ActivityLog::record( $post->ID, 'edited' );
            $this->bust_stats();
        }

        return new \WP_REST_Response( ( new Scanner() )->format_post( get_post( $post->ID ) ) );
    }

    /**
     * Recent optimisation events for the Dashboard's "Latest improvements"
     * strip. Each event carries a precomputed human-friendly "ago" string so
     * the client renders without re-deriving relative time.
     */
    public function get_activity( \WP_REST_Request $req ): \WP_REST_Response {
        $limit  = (int) $req->get_param( 'limit' );
        $now    = time();
        $events = array_values( array_filter(
            ActivityLog::all(),
            static function ( array $e ): bool {
                $post_id = (int) ( $e['post_id'] ?? 0 );
                return $post_id > 0 && current_user_can( 'edit_post', $post_id );
            }
        ) );
        $events = array_slice( $events, 0, $limit > 0 ? $limit : 8 );

        $events = array_map(
            static function ( array $e ) use ( $now ): array {
                $time = (int) ( $e['time'] ?? 0 );
                return [
                    'post_id' => (int) ( $e['post_id'] ?? 0 ),
                    'title'   => (string) ( $e['title'] ?? '' ),
                    'kind'    => (string) ( $e['kind'] ?? 'edited' ),
                    'time'    => $time,
                    'ago'     => $time > 0
                        /* translators: %s: human-readable time difference, e.g. "5 mins". */
                        ? sprintf( __( '%s ago', 'beepbeep-titles' ), human_time_diff( $time, $now ) )
                        : '',
                ];
            },
            $events
        );

        return new \WP_REST_Response( [ 'events' => $events ] );
    }

    public function run_scan( \WP_REST_Request $req ): \WP_REST_Response {
        $stats  = ( new Scanner() )->scan_and_cache();
        // Free, local health scoring runs alongside the coverage scan — no
        // AI credits are used for this, only for the optimise step later.
        $health = ( new Metadata_Scoring_Engine() )->run();
        return new \WP_REST_Response( array_merge( $stats, [ 'health' => $health ] ) );
    }

    public function get_settings( \WP_REST_Request $req ): \WP_REST_Response {
        $settings               = get_option( 'beepti_settings', [] );
        $settings               = is_array( $settings ) ? $settings : [];
        $settings               = SettingsSanitizer::normalize_settings( $settings );
        $settings['seo_plugin'] = MetaWriter::active();
        $settings['connected']  = $this->client->has_license();
        $settings['available_post_types'] = array_map(
            static function ( string $slug ): array {
                $object = get_post_type_object( $slug );
                return [
                    'slug'  => $slug,
                    'label' => $object ? $object->labels->name : ucfirst( $slug ),
                ];
            },
            Scanner::all_public_post_types()
        );
        return new \WP_REST_Response( $settings );
    }

    public function update_settings( \WP_REST_Request $req ): \WP_REST_Response {
        $current  = get_option( 'beepti_settings', [] );
        $current  = is_array( $current ) ? $current : [];
        $current  = SettingsSanitizer::normalize_settings( $current );
        $incoming = $req->get_json_params() ?? [];
        $incoming = is_array( $incoming ) ? $incoming : [];

        foreach ( SettingsSanitizer::sanitize_patch( $incoming ) as $key => $value ) {
            $current[ $key ] = $value;
        }

        $current = SettingsSanitizer::normalize_settings( $current );
        update_option( 'beepti_settings', $current );
        return new \WP_REST_Response( $current );
    }

    private function bust_stats(): void {
        delete_transient( 'beepti_stats' );
    }
}
