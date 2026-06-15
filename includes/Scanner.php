<?php
/**
 * Page enumeration + coverage stats.
 *
 * WordPress is the source of truth for which pages need a title/meta. This
 * reads the current SEO state through MetaWriter (so it reflects Yoast /
 * Rank Math / AIOSEO / fallback alike) and produces the page list + counters
 * the React Library and Dashboard render.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

use BeepBeep_Titles\Seo\MetaWriter;

defined( 'ABSPATH' ) || exit;

class Scanner {

    /**
     * Unpublished statuses surfaced by the Library's Drafts tab so titles &
     * meta can be generated before a page goes live. Coverage stats stay
     * publish-only — drafts aren't crawlable, so they don't count against SEO.
     */
    private const DRAFT_STATUSES = [ 'draft', 'pending', 'future' ];

    /**
     * Every front-facing post type SEO actually applies to — computed at
     * runtime so custom post types (page-builder landing pages, WooCommerce,
     * LMS courses, etc.) are covered, not just the core page/post/product.
     * Attachments are excluded: media has no editable title/meta here.
     *
     * @return string[]
     */
    private function post_types(): array {
        $types = get_post_types( [ 'public' => true ], 'names' );
        unset( $types['attachment'] );

        /**
         * Filter the post types BeepBeep Titles scans for SEO coverage.
         *
         * @param string[] $types Public post-type names (attachment removed).
         */
        $types = apply_filters( 'bbt_scanned_post_types', array_values( $types ) );

        return array_values( array_filter( array_map( 'strval', (array) $types ) ) );
    }

    // ----------------------------------------------------------------
    // Paginated page list
    // ----------------------------------------------------------------

    public function get_pages( string $filter, string $search, int $page, int $per_page ): array {
        $args = [
            'post_type'      => $this->post_types(),
            'post_status'    => $filter === 'drafts' ? self::DRAFT_STATUSES : 'publish',
            'posts_per_page' => $per_page,
            'paged'          => max( 1, $page ),
            'orderby'        => 'modified',
            'order'          => 'DESC',
            'no_found_rows'  => false,
        ];

        if ( $search !== '' ) {
            $args['s'] = $search;
        }

        if ( $filter === 'new' ) {
            $args['date_query'] = [ [ 'after' => '-7 days', 'column' => 'post_date' ] ];
        } elseif ( $filter !== 'drafts' ) {
            $meta_query = $this->filter_to_meta_query( $filter );
            if ( $meta_query ) {
                $args['meta_query'] = $meta_query;
            }
        }

        $query = new \WP_Query( $args );

        return [
            'items' => array_map( [ $this, 'format_post' ], $query->posts ),
            'total' => $query->found_posts,
        ];
    }

    // ----------------------------------------------------------------
    // Summary statistics (cached 15 min)
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

    public function scan_and_cache(): array {
        delete_transient( 'bbt_stats' );
        $stats = $this->compute_stats();
        set_transient( 'bbt_stats', $stats, 15 * MINUTE_IN_SECONDS );
        update_option( 'bbt_last_scan', current_time( 'mysql' ) );

        // Shape used by the onboarding/scan modal.
        $stats['missing_title'] = $stats['total'] - $stats['with_title'];
        $stats['missing_meta']  = $stats['total'] - $stats['with_meta'];
        return $stats;
    }

    // ----------------------------------------------------------------
    // Public formatter (shared with RestApi single-page endpoints)
    // ----------------------------------------------------------------

    public function format_post( \WP_Post $post ): array {
        $seo       = MetaWriter::read( $post->ID );
        $seo_title = $seo['title'];
        $meta_desc = $seo['meta'];

        $status = match ( true ) {
            $seo_title === '' && $meta_desc === '' => 'missing-both',
            $seo_title === ''                      => 'missing-title',
            $meta_desc === ''                      => 'missing-meta',
            default                                => 'ok',
        };

        $hue = ( (int) $post->ID * 47 ) % 360;

        return [
            'id'          => $post->ID,
            'url'         => PostPresenter::permalink_path( $post ),
            'title'       => $post->post_title,
            'seo_title'   => $seo_title,
            'meta_desc'   => $meta_desc,
            'section'     => PostPresenter::section_for( $post ),
            'status'      => $status,
            'post_status' => $post->post_status,
            'hue'         => $hue,
            'traffic'     => (int) get_post_meta( $post->ID, '_bbt_monthly_traffic', true ),
            'type'        => $post->post_type,
            'is_new'      => strtotime( $post->post_date ) > strtotime( '-7 days' ),
        ];
    }

    // ----------------------------------------------------------------
    // Internals
    // ----------------------------------------------------------------

    private function compute_stats(): array {
        global $wpdb;
        $types_in = "'" . implode( "','", array_map( 'esc_sql', $this->post_types() ) ) . "'";

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $total = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->posts}
             WHERE post_status = 'publish' AND post_type IN ({$types_in})"
        );

        $keys = MetaWriter::postmeta_keys();

        if ( null === $keys ) {
            // AIOSEO: counts come from its custom table.
            [ $with_title, $with_meta, $both ] = $this->aioseo_counts( $types_in );
        } else {
            [ $title_key, $meta_key ] = $keys;

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared
            $with_title = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(DISTINCT pm.post_id)
                 FROM {$wpdb->postmeta} pm
                 JOIN {$wpdb->posts} p ON p.ID = pm.post_id
                 WHERE pm.meta_key = %s AND pm.meta_value != ''
                   AND p.post_status = 'publish' AND p.post_type IN ({$types_in})",
                $title_key
            ) );

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared
            $with_meta = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(DISTINCT pm.post_id)
                 FROM {$wpdb->postmeta} pm
                 JOIN {$wpdb->posts} p ON p.ID = pm.post_id
                 WHERE pm.meta_key = %s AND pm.meta_value != ''
                   AND p.post_status = 'publish' AND p.post_type IN ({$types_in})",
                $meta_key
            ) );

            // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared
            $both = $total > 0 ? (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(DISTINCT p.ID)
                 FROM {$wpdb->posts} p
                 JOIN {$wpdb->postmeta} pm1 ON pm1.post_id = p.ID AND pm1.meta_key = %s AND pm1.meta_value != ''
                 JOIN {$wpdb->postmeta} pm2 ON pm2.post_id = p.ID AND pm2.meta_key = %s AND pm2.meta_value != ''
                 WHERE p.post_status = 'publish' AND p.post_type IN ({$types_in})",
                $title_key,
                $meta_key
            ) ) : 0;
        }

        $optimised = $both;
        $remaining = max( 0, $total - $optimised );
        $coverage  = $total > 0 ? (int) round( ( $optimised / $total ) * 100 ) : 0;

        // Unpublished pages the Drafts tab can pre-optimise (excluded from coverage).
        $draft_statuses_in = "'" . implode( "','", array_map( 'esc_sql', self::DRAFT_STATUSES ) ) . "'";
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared
        $drafts = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->posts}
             WHERE post_status IN ({$draft_statuses_in}) AND post_type IN ({$types_in})"
        );

        return compact( 'total', 'with_title', 'with_meta', 'coverage', 'optimised', 'remaining', 'drafts' );
    }

    /**
     * @return array{0:int,1:int,2:int} [ with_title, with_meta, both ]
     */
    private function aioseo_counts( string $types_in ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'aioseo_posts';

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $found = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );
        if ( $found !== $table ) {
            return [ 0, 0, 0 ];
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared
        $with_title = (int) $wpdb->get_var(
            "SELECT COUNT(DISTINCT a.post_id)
             FROM {$table} a JOIN {$wpdb->posts} p ON p.ID = a.post_id
             WHERE a.title IS NOT NULL AND a.title != ''
               AND p.post_status = 'publish' AND p.post_type IN ({$types_in})"
        );
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared
        $with_meta = (int) $wpdb->get_var(
            "SELECT COUNT(DISTINCT a.post_id)
             FROM {$table} a JOIN {$wpdb->posts} p ON p.ID = a.post_id
             WHERE a.description IS NOT NULL AND a.description != ''
               AND p.post_status = 'publish' AND p.post_type IN ({$types_in})"
        );
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared
        $both = (int) $wpdb->get_var(
            "SELECT COUNT(DISTINCT a.post_id)
             FROM {$table} a JOIN {$wpdb->posts} p ON p.ID = a.post_id
             WHERE a.title IS NOT NULL AND a.title != ''
               AND a.description IS NOT NULL AND a.description != ''
               AND p.post_status = 'publish' AND p.post_type IN ({$types_in})"
        );

        return [ $with_title, $with_meta, $both ];
    }

    private function filter_to_meta_query( string $filter ): array {
        $keys = MetaWriter::postmeta_keys();
        if ( null === $keys ) {
            // AIOSEO stores in a custom table — no meta_query path. The list
            // still returns posts with correct per-row status; SQL pre-filter
            // is skipped (a known v1 limitation for AIOSEO sites).
            return [];
        }
        [ $title_key, $meta_key ] = $keys;

        switch ( $filter ) {
            case 'missing-title':
                return [
                    'relation' => 'OR',
                    [ 'key' => $title_key, 'compare' => 'NOT EXISTS' ],
                    [ 'key' => $title_key, 'compare' => '=', 'value' => '' ],
                ];
            case 'missing-meta':
                return [
                    'relation' => 'OR',
                    [ 'key' => $meta_key, 'compare' => 'NOT EXISTS' ],
                    [ 'key' => $meta_key, 'compare' => '=', 'value' => '' ],
                ];
            case 'needs':
                return [
                    'relation' => 'OR',
                    [ 'key' => $title_key, 'compare' => 'NOT EXISTS' ],
                    [ 'key' => $title_key, 'compare' => '=', 'value' => '' ],
                    [ 'key' => $meta_key,  'compare' => 'NOT EXISTS' ],
                    [ 'key' => $meta_key,  'compare' => '=', 'value' => '' ],
                ];
            case 'ok':
            case 'optimised':
                return [
                    'relation' => 'AND',
                    [ 'key' => $title_key, 'compare' => 'EXISTS' ],
                    [ 'key' => $title_key, 'compare' => '!=', 'value' => '' ],
                    [ 'key' => $meta_key,  'compare' => 'EXISTS' ],
                    [ 'key' => $meta_key,  'compare' => '!=', 'value' => '' ],
                ];
            default:
                return [];
        }
    }
}
