<?php
/**
 * Orchestrates a free, local, no-AI scan of every scanned page's title and
 * meta description, scores each one, and stores the result in the shared
 * OptiAI scan table so the dashboard, Priority Action Centre and Advanced
 * Library can all read from one place.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring;

use BeepBeep_Titles\Seo\MetaWriter;
use OptiAI\Core\Scan\Scan_Repository;
use OptiAI\Core\Scoring\Score_Service;

defined( 'ABSPATH' ) || exit;

final class Metadata_Scoring_Engine {

    private const MODULE = 'titles';

    private readonly Scan_Repository $repository;
    private readonly Score_Service $title_scorer;
    private readonly Score_Service $description_scorer;

    public function __construct() {
        $this->repository          = new Scan_Repository( self::MODULE );
        $this->title_scorer        = new Score_Service( Metadata_Rule_Registry::title_rules() );
        $this->description_scorer  = new Score_Service( Metadata_Rule_Registry::description_rules() );
    }

    /**
     * Run a full scan across every scanned post type's published pages.
     * Free — no AI calls, no credit usage.
     *
     * @return array{items_scanned:int,issues_found:int,average_score:int}
     */
    public function run(): array {
        $post_types = \BeepBeep_Titles\Scanner::post_types();
        if ( empty( $post_types ) ) {
            return [ 'items_scanned' => 0, 'issues_found' => 0, 'average_score' => 0 ];
        }

        $posts = get_posts( [
            'post_type'      => $post_types,
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'fields'         => 'ids',
            'no_found_rows'  => true,
        ] );

        // First pass: read every page's current title/meta so duplicate
        // counts reflect the whole scanned set, not just earlier pages.
        $pages = [];
        $title_counts = [];
        $desc_counts  = [];
        foreach ( $posts as $post_id ) {
            $seo   = MetaWriter::read( $post_id );
            $title = trim( (string) $seo['title'] );
            $meta  = trim( (string) $seo['meta'] );
            $pages[ $post_id ] = [ 'title' => $title, 'meta' => $meta ];

            if ( '' !== $title ) {
                $key = Text_Utils::normalise( $title );
                $title_counts[ $key ] = ( $title_counts[ $key ] ?? 0 ) + 1;
            }
            if ( '' !== $meta ) {
                $key = Text_Utils::normalise( $meta );
                $desc_counts[ $key ] = ( $desc_counts[ $key ] ?? 0 ) + 1;
            }
        }

        $items_scanned = 0;
        $issues_found  = 0;
        $item_scores   = [];

        foreach ( $pages as $post_id => $seo ) {
            $post = get_post( $post_id );
            if ( ! $post ) {
                continue;
            }

            $title_key = '' !== $seo['title'] ? Text_Utils::normalise( $seo['title'] ) : null;
            $desc_key  = '' !== $seo['meta'] ? Text_Utils::normalise( $seo['meta'] ) : null;

            $context = new Metadata_Context(
                post_id: $post_id,
                post_type: $post->post_type,
                seo_title: $seo['title'],
                meta_description: $seo['meta'],
                native_title: $post->post_title,
                content_excerpt: wp_trim_words( wp_strip_all_tags( $post->post_content ), 40, '' ),
                title_duplicate_count: $title_key && isset( $title_counts[ $title_key ] ) ? max( 0, $title_counts[ $title_key ] - 1 ) : 0,
                description_duplicate_count: $desc_key && isset( $desc_counts[ $desc_key ] ) ? max( 0, $desc_counts[ $desc_key ] - 1 ) : 0,
            );

            $title_result = $this->title_scorer->evaluate_item( $context );
            $desc_result  = $this->description_scorer->evaluate_item( $context );
            $aeo_result   = AEO_Scoring_Engine::evaluate( $post );

            $overall_score = (int) round( ( $title_result['score'] + $desc_result['score'] ) / 2 );
            $all_issues    = array_merge( $title_result['issues'], $desc_result['issues'] );

            $this->repository->upsert_item(
                site_item_id: (string) $post_id,
                item_type: $post->post_type,
                score: $overall_score,
                status: Score_Service::status_for_score( $overall_score ),
                issues: $all_issues,
                current_value: wp_json_encode( [
                    'title'          => $seo['title'],
                    'meta'           => $seo['meta'],
                    'title_score'    => $title_result['score'],
                    'description_score' => $desc_result['score'],
                    'aeo_score'      => $aeo_result['score'],
                    'aeo_label'      => $aeo_result['label'],
                ] )
            );

            ++$items_scanned;
            $issues_found += count( $all_issues );
            $item_scores[] = $overall_score;
        }

        $average_score = Score_Service::site_score( $item_scores );
        $this->repository->record_run( $items_scanned, $issues_found, $average_score );

        update_option( 'beepti_last_scan', current_time( 'mysql' ) );

        return [
            'items_scanned' => $items_scanned,
            'issues_found'  => $issues_found,
            'average_score' => $average_score,
        ];
    }

    public function repository(): Scan_Repository {
        return $this->repository;
    }
}
