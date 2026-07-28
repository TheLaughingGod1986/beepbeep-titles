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

use BeepBeep_Titles\Api\Client;
use BeepBeep_Titles\Scoring\AEO_Scoring_Engine;
use BeepBeep_Titles\Scoring\Metadata_Scoring_Engine;
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
        $repo    = new Scan_Repository( self::MODULE );
        $summary = $repo->get_summary();
        $prev    = $repo->get_previous_score();
        $history = new History_Repository( self::MODULE );

        return new \WP_REST_Response( [
            'score'                 => $summary['score'],
            'status'                => $summary['status'],
            'label'                 => Health_Score::label( $summary['score'] ),
            'trend'                 => Health_Score::trend( $summary['score'], $prev ),
            'items_scanned'         => $summary['total'],
            'critical_issues'       => $summary['critical'],
            'optimised_this_week'   => $summary['optimised_this_week'],
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
     */
    public function get_priorities( \WP_REST_Request $req ): \WP_REST_Response {
        $repo    = new Scan_Repository( self::MODULE );
        $limit   = max( 1, min( 10, (int) $req->get_param( 'limit' ) ?: 5 ) );
        $issues  = $repo->get_priority_issues( $limit );
        $summary = $repo->get_summary();

        $estimated_total_gain = array_sum( array_column( $issues, 'estimated_gain' ) );

        return new \WP_REST_Response( [
            'priorities'              => $issues,
            'estimated_health_gain'   => min( 100 - $summary['score'], $estimated_total_gain ),
            'current_score'           => $summary['score'],
        ] );
    }

    /**
     * Affected items for one issue code (feeds an expanded Priority card),
     * or the full filtered/sorted list for the Advanced Library.
     */
    public function get_items( \WP_REST_Request $req ): \WP_REST_Response {
        $repo = new Scan_Repository( self::MODULE );
        $result = $repo->get_items( [
            'status'   => (string) $req->get_param( 'status' ),
            'sort'     => (string) $req->get_param( 'sort' ),
            'page'     => (int) $req->get_param( 'page' ),
            'per_page' => (int) $req->get_param( 'per_page' ),
        ] );

        $issue_code = (string) $req->get_param( 'issue' );
        if ( '' !== $issue_code ) {
            $result['items'] = array_values( array_filter(
                $result['items'],
                static function ( array $item ) use ( $issue_code ): bool {
                    foreach ( $item['issues'] as $issue ) {
                        if ( ( $issue['code'] ?? '' ) === $issue_code ) {
                            return true;
                        }
                    }
                    return false;
                }
            ) );
            $result['total'] = count( $result['items'] );
        }

        // Attach the page title/URL for display — the scan table only stores
        // the WP post ID, not a denormalised copy of page metadata.
        $result['items'] = array_map( static function ( array $item ): array {
            $post = get_post( (int) $item['site_item_id'] );
            $item['post_title'] = $post ? $post->post_title : '';
            $item['edit_url']   = $post ? get_edit_post_link( $post->ID, 'raw' ) : '';
            return $item;
        }, $result['items'] );

        return new \WP_REST_Response( $result );
    }

    /**
     * Trigger a fresh, free, local health scan on demand ("Run Full Scan" /
     * "Quick Scan" buttons) without going through the coverage-stats scan.
     */
    public function run_scan( \WP_REST_Request $req ): \WP_REST_Response {
        $result = ( new Metadata_Scoring_Engine() )->run();
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
                'score' => 0, 'label' => 'Weak', 'items_scanned' => 0,
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

        $average = empty( $scores ) ? 0 : (int) round( array_sum( $scores ) / count( $scores ) );

        return new \WP_REST_Response( [
            'score'         => $average,
            'label'         => AEO_Scoring_Engine::label_for_score( $average ),
            'items_scanned' => count( $scores ),
            'disclaimer'    => AEO_Scoring_Engine::disclaimer(),
        ] );
    }
}
