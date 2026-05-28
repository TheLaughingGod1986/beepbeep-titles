<?php
namespace BeepBeep_Titles;

class Scanner {

    private const POST_TYPES = [ 'page', 'post', 'product' ];

    // ----------------------------------------------------------------
    // Paginated page list
    // ----------------------------------------------------------------

    public function get_pages( string $filter, string $search, int $page, int $per_page ): array {
        $args = [
            'post_type'      => self::POST_TYPES,
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'orderby'        => 'modified',
            'order'          => 'DESC',
            'no_found_rows'  => false,
        ];

        if ( $search !== '' ) {
            $args['s'] = $search;
        }

        $meta_query = $this->filter_to_meta_query( $filter );
        if ( $meta_query ) {
            $args['meta_query'] = $meta_query;
        }

        $query = new \WP_Query( $args );

        return [
            'items' => array_map( [ $this, 'format_post' ], $query->posts ),
            'total' => $query->found_posts,
        ];
    }

    // ----------------------------------------------------------------
    // Summary statistics (cached for 15 min)
    // ----------------------------------------------------------------

    public function get_stats(): array {
        $cached = get_transient( 'bbt_stats' );
        if ( false !== $cached ) {
            return $cached;
        }

        $stats = $this->compute_stats();
        set_transient( 'bbt_stats', $stats, 15 * MINUTE_IN_SECONDS );
        return $stats;
    }

    // Force a fresh scan and cache the result.
    public function scan_and_cache(): array {
        delete_transient( 'bbt_stats' );
        $stats = $this->compute_stats();
        set_transient( 'bbt_stats', $stats, 15 * MINUTE_IN_SECONDS );
        update_option( 'bbt_last_scan', current_time( 'mysql' ) );
        return $stats;
    }

    // ----------------------------------------------------------------
    // Internals
    // ----------------------------------------------------------------

    private function compute_stats(): array {
        global $wpdb;
        $types_in = "'" . implode( "','", array_map( 'esc_sql', self::POST_TYPES ) ) . "'";

        $total = (int) $wpdb->get_var(
            "SELECT COUNT(*)
             FROM {$wpdb->posts}
             WHERE post_status = 'publish' AND post_type IN ({$types_in})"
        );

        $with_title = (int) $wpdb->get_var(
            "SELECT COUNT(DISTINCT pm.post_id)
             FROM {$wpdb->postmeta} pm
             JOIN {$wpdb->posts} p ON p.ID = pm.post_id
             WHERE pm.meta_key = '_bbt_seo_title' AND pm.meta_value != ''
               AND p.post_status = 'publish' AND p.post_type IN ({$types_in})"
        );

        $with_meta = (int) $wpdb->get_var(
            "SELECT COUNT(DISTINCT pm.post_id)
             FROM {$wpdb->postmeta} pm
             JOIN {$wpdb->posts} p ON p.ID = pm.post_id
             WHERE pm.meta_key = '_bbt_meta_description' AND pm.meta_value != ''
               AND p.post_status = 'publish' AND p.post_type IN ({$types_in})"
        );

        $both_covered = $total > 0
            ? (int) $wpdb->get_var(
                "SELECT COUNT(DISTINCT p.ID)
                 FROM {$wpdb->posts} p
                 JOIN {$wpdb->postmeta} pm1 ON pm1.post_id = p.ID AND pm1.meta_key = '_bbt_seo_title'   AND pm1.meta_value != ''
                 JOIN {$wpdb->postmeta} pm2 ON pm2.post_id = p.ID AND pm2.meta_key = '_bbt_meta_description' AND pm2.meta_value != ''
                 WHERE p.post_status = 'publish' AND p.post_type IN ({$types_in})"
            )
            : 0;

        $coverage  = $total > 0 ? round( ( $both_covered / $total ) * 100 ) : 0;
        $optimised = $both_covered;
        $remaining = $total - $optimised;

        return compact(
            'total',
            'with_title',
            'with_meta',
            'both_covered',
            'coverage',
            'optimised',
            'remaining'
        );
    }

    private function format_post( \WP_Post $post ): array {
        $seo_title = (string) get_post_meta( $post->ID, '_bbt_seo_title',       true );
        $meta_desc = (string) get_post_meta( $post->ID, '_bbt_meta_description', true );

        $missing = match ( true ) {
            $seo_title === '' && $meta_desc === '' => 'both',
            $seo_title === ''                      => 'title',
            $meta_desc === ''                      => 'meta',
            default                                => 'none',
        };

        $section = match ( $post->post_type ) {
            'page'    => 'Pages',
            'product' => 'Shop',
            default   => $this->primary_category( $post->ID ),
        };

        return [
            'id'        => $post->ID,
            'url'       => '/' . ltrim( (string) parse_url( (string) get_permalink( $post->ID ), PHP_URL_PATH ), '/' ),
            'title'     => $post->post_title,
            'seo_title' => $seo_title,
            'meta_desc' => $meta_desc,
            'section'   => $section,
            'missing'   => $missing,
            'traffic'   => (int) get_post_meta( $post->ID, '_bbt_monthly_traffic', true ),
            'type'      => $post->post_type,
            'is_new'    => strtotime( $post->post_date ) > strtotime( '-7 days' ),
        ];
    }

    private function primary_category( int $post_id ): string {
        $cats = get_the_category( $post_id );
        return $cats ? $cats[0]->name : 'Blog';
    }

    private function filter_to_meta_query( string $filter ): array {
        return match ( $filter ) {
            'missing-title' => [ [ 'key' => '_bbt_seo_title',       'compare' => 'NOT EXISTS' ] ],
            'missing-meta'  => [ [ 'key' => '_bbt_meta_description', 'compare' => 'NOT EXISTS' ] ],
            'needs'         => [
                'relation' => 'OR',
                [ 'key' => '_bbt_seo_title',       'compare' => 'NOT EXISTS' ],
                [ 'key' => '_bbt_seo_title',       'compare' => '=', 'value' => '' ],
                [ 'key' => '_bbt_meta_description', 'compare' => 'NOT EXISTS' ],
                [ 'key' => '_bbt_meta_description', 'compare' => '=', 'value' => '' ],
            ],
            'optimised' => [
                'relation' => 'AND',
                [ 'key' => '_bbt_seo_title',       'compare' => 'EXISTS' ],
                [ 'key' => '_bbt_meta_description', 'compare' => 'EXISTS' ],
            ],
            default => [],
        };
    }
}
