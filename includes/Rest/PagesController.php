<?php
/**
 * Pages, scan, and settings REST handlers.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Rest;

use BeepBeep_Titles\Api\Client;
use BeepBeep_Titles\Scanner;
use BeepBeep_Titles\Seo\MetaWriter;

defined( 'ABSPATH' ) || exit;

class PagesController {

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
        if ( ! $post || $post->post_status !== 'publish' ) {
            return new \WP_Error( 'not_found', __( 'Page not found.', 'beepbeep-titles' ), [ 'status' => 404 ] );
        }
        return new \WP_REST_Response( ( new Scanner() )->format_post( $post ) );
    }

    public function update_page( \WP_REST_Request $req ): \WP_REST_Response|\WP_Error {
        $post = get_post( (int) $req['id'] );
        if ( ! $post || $post->post_status !== 'publish' ) {
            return new \WP_Error( 'not_found', __( 'Page not found.', 'beepbeep-titles' ), [ 'status' => 404 ] );
        }

        $title = $req->get_param( 'seo_title' );
        $meta  = $req->get_param( 'meta_desc' );

        if ( null !== $title || null !== $meta ) {
            MetaWriter::write( $post->ID, (string) $title, (string) $meta );
            $this->bust_stats();
        }

        return new \WP_REST_Response( ( new Scanner() )->format_post( get_post( $post->ID ) ) );
    }

    public function run_scan( \WP_REST_Request $req ): \WP_REST_Response {
        return new \WP_REST_Response( ( new Scanner() )->scan_and_cache() );
    }

    public function get_settings( \WP_REST_Request $req ): \WP_REST_Response {
        $settings               = get_option( 'bbt_settings', [] );
        $settings               = is_array( $settings ) ? $settings : [];
        $settings['seo_plugin'] = MetaWriter::active();
        $settings['connected']  = $this->client->has_license();
        return new \WP_REST_Response( $settings );
    }

    public function update_settings( \WP_REST_Request $req ): \WP_REST_Response {
        $current  = get_option( 'bbt_settings', [] );
        $current  = is_array( $current ) ? $current : [];
        $allowed  = [ 'tone', 'title_length', 'meta_length', 'auto_generate', 'custom_instructions', 'brand_name_override', 'notifications', 'scan_daily', 'weekly_digest', 'notify_new_pages', 'notify_quota_warning', 'delete_on_uninstall' ];
        $incoming = $req->get_json_params() ?? [];

        foreach ( $allowed as $key ) {
            if ( array_key_exists( $key, $incoming ) ) {
                $current[ $key ] = $incoming[ $key ];
            }
        }

        update_option( 'bbt_settings', $current );
        return new \WP_REST_Response( $current );
    }

    private function bust_stats(): void {
        delete_transient( 'bbt_stats' );
    }
}
