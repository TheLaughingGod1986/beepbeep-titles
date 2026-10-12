<?php
/**
 * Dashboard-first health data: Hero Score, Today's Priorities, Priority
 * Action Centre issue groups, and the Advanced Library item list. All of
 * this reads the local scoring engine's stored results — nothing here calls
 * the AI backend or spends a credit.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Rest;

use BeepBeep_Titles\ActivityLog;
use BeepBeep_Titles\Api\Client;
use BeepBeep_Titles\Scoring\AEO_Scoring_Engine;
use BeepBeep_Titles\Scoring\Metadata_Scoring_Engine;
use BeepBeep_Titles\Telemetry;
use OptiAI\Core\Health_Score;
use OptiAI\Core\Module_Registry;
use OptiAI\Core\Scan\History_Repository;
use OptiAI\Core\Scan\Scan_Repository;

defined( 'ABSPATH' ) || exit;

class HealthController {

    private const MODULE = 'titles';

    public function __construct( private readonly Client $client ) {}

    /**
     * Hero Score card data: score, band label, trend, last scan, counts.
     */
    public function get_health( \WP_REST_Request $req ): \WP_REST_Response {
        $repo = new Scan_Repository( self::MODULE );
        // Opportunistic cleanup so deleted posts stop polluting the Hero
        // Score / Priorities without requiring the user to re-scan first.
        $repo->prune_missing_posts();
        $summary = $repo->get_summary();
        $scanned = (int) ( $summary['total'] ?? 0 ) > 0;
        $prev    = $scanned ? $repo->get_previous_score() : null;
        $history = new History_Repository( self::MODULE );

        // Prefer the activity log (same source as "Latest Improvements") so
        // bulk/manual optimisations that never stamped last_optimised_at still
        // count. Fall back to scan/history counts for older data paths.
        $from_activity = ActivityLog::count_improved_since( time() - WEEK_IN_SECONDS );
        $by_kind       = ActivityLog::count_by_kind_since( time() - WEEK_IN_SECONDS );
        $optimised_this_week = max(
            $from_activity,
            (int) ( $summary['optimised_this_week'] ?? 0 ),
            $history->items_optimised_this_week()
        );

        return new \WP_REST_Response( [
            'score'                 => $scanned ? $summary['score'] : 0,
            'status'                => $scanned ? $summary['status'] : 'unknown',
            'label'                 => $scanned
                ? Health_Score::label( $summary['score'] )
                : __( 'Not scanned', 'beepbeep-titles' ),
            'trend'                 => $scanned ? Health_Score::trend( $summary['score'], $prev ) : null,
            'scanned'               => $scanned,
            'items_scanned'         => $summary['total'],
            'critical_issues'       => $summary['critical'],
            'optimised_this_week'   => $optimised_this_week,
            'manual_this_week'      => (int) ( $by_kind['generated'] ?? 0 ),
            'auto_this_week'        => (int) ( $by_kind['auto'] ?? 0 ),
            'credits_used_this_week' => $history->credits_used_this_week(),
            'by_status'             => $summary['by_status'],
            'last_scanned_at'       => $summary['last_scanned_at'],
            'disclaimer'            => Health_Score::disclaimer(),
            // Cross-plugin (Phase 3): null unless a sibling OptiAI module is
            // also active and has reported — see Module_Registry::all_reports().
            'combined_score'        => Module_Registry::aggregate_score(),
            'combined_modules'      => array_map( static fn( $r ) => [ 'name' => $r['name'], 'score' => $r['score'] ], Module_Registry::all_reports() ),
        ] );
    }

    /**
     * Priority Action Centre + "Today's Priorities" banner: the most
     * important issue groups, each with an affected-item count and an
     * estimated score gain from clearing it.
     *
     * Per-issue gains are heuristics (issue deductions / pages scanned).
     * They are capped so visible rows never imply a site score above 100:
     * remaining headroom is shared proportionally across the returned
     * actions (largest-remainder rounding).
     */
    public function get_priorities( \WP_REST_Request $req ): \WP_REST_Response {
        $repo  = new Scan_Repository( self::MODULE );
        $repo->prune_missing_posts();
        $limit = max( 1, min( 10, (int) $req->get_param( 'limit' ) ?: 5 ) );
        $summary = $repo->get_summary();
        $scanned = (int) ( $summary['total'] ?? 0 ) > 0;
        $issues  = $scanned
            ? self::cap_priority_estimates(
                $repo->get_priority_issues( $limit ),
                (int) $summary['score']
            )
            : [];

        return new \WP_REST_Response( [
            'priorities'              => $issues,
            'estimated_health_gain'   => array_sum( array_column( $issues, 'estimated_gain' ) ),
            'current_score'           => $scanned ? $summary['score'] : 0,
            'scanned'                 => $scanned,
        ] );
    }

    /**
     * Scale raw priority estimated_gain values so they sum to at most
     * (100 - current_score). Individual rows never claim more than the
     * remaining headroom either.
     *
     * @param array<int,array{code:string,severity:string,count:int,message:string,estimated_gain:int}> $issues
     * @param int                                                                                     $current_score
     * @return array<int,array{code:string,severity:string,count:int,message:string,estimated_gain:int}>
     */
    private static function cap_priority_estimates( array $issues, int $current_score ): array {
        $headroom = max( 0, 100 - $current_score );
        if ( empty( $issues ) ) {
            return $issues;
        }

        if ( 0 === $headroom ) {
            foreach ( $issues as &$issue ) {
                $issue['estimated_gain'] = 0;
            }
            unset( $issue );
            return $issues;
        }

        $raw_total = 0;
        foreach ( $issues as $issue ) {
            $raw_total += max( 0, (int) ( $issue['estimated_gain'] ?? 0 ) );
        }

        if ( $raw_total <= $headroom ) {
            foreach ( $issues as &$issue ) {
                $issue['estimated_gain'] = min( $headroom, max( 0, (int) ( $issue['estimated_gain'] ?? 0 ) ) );
            }
            unset( $issue );
            return $issues;
        }

        // Proportional allocation with largest-remainder so integers sum
        // exactly to headroom (never imply score > 100).
        $floors = [];
        $fracs  = [];
        foreach ( $issues as $i => $issue ) {
            $raw   = max( 0, (int) ( $issue['estimated_gain'] ?? 0 ) );
            $exact = ( $raw / $raw_total ) * $headroom;
            $floors[ $i ] = (int) floor( $exact );
            $fracs[ $i ]  = $exact - $floors[ $i ];
        }

        $allocated = array_sum( $floors );
        $remainder = $headroom - $allocated;
        arsort( $fracs );
        foreach ( array_keys( $fracs ) as $i ) {
            if ( $remainder <= 0 ) {
                break;
            }
            ++$floors[ $i ];
            --$remainder;
        }

        foreach ( $issues as $i => &$issue ) {
            $issue['estimated_gain'] = $floors[ $i ];
        }
        unset( $issue );

        return $issues;
    }

    /**
     * Affected items for one issue code (feeds an expanded Priority card),
     * or the full filtered/sorted list for the Advanced Library.
     */
    public function get_items( \WP_REST_Request $req ): \WP_REST_Response {
        $repo = new Scan_Repository( self::MODULE );
        $repo->prune_missing_posts();
        $result = $repo->get_items( [
            'status'   => (string) $req->get_param( 'status' ),
            'issue'    => (string) $req->get_param( 'issue' ),
            'filter'   => (string) $req->get_param( 'filter' ),
            'search'   => (string) $req->get_param( 'search' ),
            'sort'     => (string) $req->get_param( 'sort' ),
            'page'     => (int) $req->get_param( 'page' ),
            'per_page' => (int) $req->get_param( 'per_page' ),
        ] );

        $scanner = new \BeepBeep_Titles\Scanner();

        // Attach Library-ready page fields. The scan table only stores the WP
        // post ID + score/issues — title/meta/URL come from MetaWriter.
        $result['items'] = array_values( array_filter( array_map( static function ( array $item ) use ( $scanner ): ?array {
            $post = get_post( (int) $item['site_item_id'] );
            if ( ! $post || ! current_user_can( 'edit_post', $post->ID ) ) {
                return null;
            }
            $page = $scanner->format_post( $post );
            $page['score']        = (int) ( $item['score'] ?? 0 );
            $page['issues']       = is_array( $item['issues'] ?? null ) ? $item['issues'] : [];
            $page['status']       = self::library_status_from_issues( $page['issues'] );
            $page['post_title']   = $post->post_title;
            $page['edit_url']     = get_edit_post_link( $post->ID, 'raw' ) ?: '';
            // Preserve scan-row keys used by Priority Action Centre + Optimise.
            $page['site_item_id'] = (string) ( $item['site_item_id'] ?? $post->ID );
            $page['item_type']    = (string) ( $item['item_type'] ?? $post->post_type );
            return $page;
        }, $result['items'] ) ) );

        $counts           = $repo->get_library_counts();
        $counts['drafts'] = (int) ( ( new \BeepBeep_Titles\Scanner() )->get_stats()['drafts'] ?? 0 );
        $result['counts'] = $counts;
        // Legacy Library clients expect `pages` + `stats.drafts`.
        $result['pages'] = $result['items'];
        $result['stats'] = [
            'drafts'    => $counts['drafts'],
            'total'     => $counts['all'],
            'optimised' => $counts['ok'],
            'remaining' => $counts['needs'],
        ];

        return new \WP_REST_Response( $result );
    }

    /**
     * Map scoring-engine issues onto the Library row status pills.
     *
     * @param array<int,array{code?:string}> $issues
     */
    private static function library_status_from_issues( array $issues ): string {
        if ( empty( $issues ) ) {
            return 'ok';
        }
        $codes = [];
        foreach ( $issues as $issue ) {
            if ( ! empty( $issue['code'] ) ) {
                $codes[] = (string) $issue['code'];
            }
        }
        $has_title = in_array( 'missing_title', $codes, true );
        $has_meta  = in_array( 'missing_description', $codes, true );
        if ( $has_title && $has_meta ) {
            return 'missing-both';
        }
        if ( $has_title ) {
            return 'missing-title';
        }
        if ( $has_meta ) {
            return 'missing-meta';
        }
        return 'needs-attention';
    }

    /**
     * Trigger a fresh, free, local health scan on demand ("Run Full Scan" /
     * "Quick Scan" buttons) without going through the coverage-stats scan.
     */
    public function run_scan( \WP_REST_Request $req ): \WP_REST_Response {
        Telemetry::capture( 'scan_started', [ 'scan_type' => 'health' ] );
        $result = ( new Metadata_Scoring_Engine() )->run();
        Telemetry::capture( 'scan_completed', [
            'scan_type'     => 'health',
            'items_scanned' => (int) ( $result['total'] ?? $result['items_scanned'] ?? 0 ),
        ] );
        return new \WP_REST_Response( $result );
    }

    /**
     * Site-wide AI Search Readiness (AEO) summary — powers the "AI Search
     * Readiness" Summary Card. Computed from the same scan pass as the
     * regular health score, so it never requires a separate scan.
     */
    public function get_aeo( \WP_REST_Request $req ): \WP_REST_Response {
        global $wpdb;
        $table = \OptiAI\Core\Scan\Schema::items_table();

        if ( ! \OptiAI\Core\Scan\Schema::items_table_exists() ) {
            return new \WP_REST_Response( [
                'score' => 0, 'label' => __( 'Not scanned', 'beepbeep-titles' ), 'items_scanned' => 0,
                'scanned' => false,
                'disclaimer' => AEO_Scoring_Engine::disclaimer(),
            ] );
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared -- value bound via prepare().
        $rows = $wpdb->get_col( $wpdb->prepare(
            "SELECT current_value FROM {$table} WHERE module = %s",
            self::MODULE
        ) );

        $scores = [];
        foreach ( (array) $rows as $row ) {
            $decoded = json_decode( (string) $row, true );
            if ( is_array( $decoded ) && isset( $decoded['aeo_score'] ) ) {
                $scores[] = (int) $decoded['aeo_score'];
            }
        }

        if ( empty( $scores ) ) {
            return new \WP_REST_Response( [
                'score'         => 0,
                'label'         => __( 'Not scanned', 'beepbeep-titles' ),
                'items_scanned' => 0,
                'scanned'       => false,
                'disclaimer'    => AEO_Scoring_Engine::disclaimer(),
            ] );
        }

        $average = (int) round( array_sum( $scores ) / count( $scores ) );

        return new \WP_REST_Response( [
            'score'         => $average,
            'label'         => AEO_Scoring_Engine::label_for_score( $average ),
            'items_scanned' => count( $scores ),
            'scanned'       => true,
            'disclaimer'    => AEO_Scoring_Engine::disclaimer(),
        ] );
    }
}
