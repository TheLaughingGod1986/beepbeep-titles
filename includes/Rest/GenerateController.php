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
use BeepBeep_Titles\Seo\MetaWriter;

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
            return ErrorResponder::from_wp_error( $result );
        }

        // Persist into the active SEO plugin.
        $title = (string) ( $result['title'] ?? '' );
        $meta  = (string) ( $result['meta'] ?? '' );
        MetaWriter::write( $post->ID, $title, $meta );
        ActivityLog::record( $post->ID, 'generated' );
        $this->bust_stats();

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
            return ErrorResponder::from_wp_error( $result );
        }

        $job_id = (string) ( $result['jobId'] ?? '' );
        if ( $job_id !== '' ) {
            // Cache ordered post ids so we can map poll items back even if the
            // backend assigns its own item ids.
            set_transient( 'beepti_job_' . $job_id, $ordered, HOUR_IN_SECONDS );
        }

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
                    MetaWriter::write( $post_id, (string) ( $item['title'] ?? '' ), (string) ( $item['meta'] ?? '' ) );
                    ActivityLog::record( $post_id, 'generated' );
                    $wrote = true;
                }
            }
        }
        unset( $item );

        $result['items'] = $items;

        if ( $wrote ) {
            $this->bust_stats();
        }

        // Clean up the mapping once the job is terminal.
        if ( in_array( $result['status'] ?? '', [ 'completed', 'failed' ], true ) ) {
            delete_transient( 'beepti_job_' . $job_id );
        }

        return new \WP_REST_Response( $result, 200 );
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

    private function bust_stats(): void {
        delete_transient( 'beepti_stats' );
    }
}
