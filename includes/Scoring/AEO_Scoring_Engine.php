<?php
/**
 * Light AI Search Readiness (AEO) health check.
 *
 * Deliberately narrow: this reviews whether a page clearly explains its
 * topic, answers likely questions, and presents information in a structure
 * search engines and AI systems may find easier to use. It does not claim
 * privileged knowledge of any AI provider's ranking system, and it does not
 * guarantee inclusion in AI-generated answers — see disclaimer().
 *
 * Free and local, same as the metadata scoring engine — no AI calls.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring;

defined( 'ABSPATH' ) || exit;

final class AEO_Scoring_Engine {

    /**
     * @return array{score:int,label:string,checks:array<string,bool>}
     */
    public static function evaluate( \WP_Post $post ): array {
        $content = (string) $post->post_content;
        $plain   = wp_strip_all_tags( $content );

        $checks = [
            'clear_topic'        => self::has_clear_topic( $post ),
            'descriptive_headings' => self::has_descriptive_headings( $content ),
            'direct_answer_near_top' => self::has_direct_answer( $plain ),
            'faq_style_content'  => self::has_faq_content( $content, $plain ),
            'author_information' => self::has_author_info( $post ),
            'structured_data_available' => self::has_structured_data(),
        ];

        $passed = count( array_filter( $checks ) );
        $total  = count( $checks );
        $score  = $total > 0 ? (int) round( ( $passed / $total ) * 100 ) : 0;

        return [
            'score'  => $score,
            'label'  => self::label_for_score( $score ),
            'checks' => $checks,
        ];
    }

    public static function label_for_score( int $score ): string {
        return match ( true ) {
            $score >= 80 => 'Strong',
            $score >= 55 => 'Good',
            $score >= 30 => 'Developing',
            default      => 'Weak',
        };
    }

    /** A clear, non-generic H1/title that isn't just the site name. */
    private static function has_clear_topic( \WP_Post $post ): bool {
        $title = trim( $post->post_title );
        if ( '' === $title || strlen( $title ) < 8 ) {
            return false;
        }
        return ! Text_Utils::is_generic_title( $title );
    }

    /** At least one H2/H3 in the content — a structure a summariser can parse. */
    private static function has_descriptive_headings( string $content ): bool {
        return (bool) preg_match( '/<h[23][^>]*>.{4,}<\/h[23]>/i', $content );
    }

    /** A substantial opening paragraph — a proxy for "answers the question up front". */
    private static function has_direct_answer( string $plain ): bool {
        $first_chunk = trim( mb_substr( $plain, 0, 400 ) );
        $word_count  = str_word_count( $first_chunk );
        return $word_count >= 25;
    }

    /** Question-style headings, or an explicit FAQ section. */
    private static function has_faq_content( string $content, string $plain ): bool {
        if ( false !== stripos( $plain, 'frequently asked questions' ) ) {
            return true;
        }
        // A heading ending in "?" is a reasonable, low-noise FAQ signal.
        return (bool) preg_match( '/<h[2-4][^>]*>[^<]*\?\s*<\/h[2-4]>/i', $content );
    }

    /** The post author has a bio — a small, genuine "who wrote this" signal. */
    private static function has_author_info( \WP_Post $post ): bool {
        $bio = get_the_author_meta( 'description', (int) $post->post_author );
        return '' !== trim( (string) $bio );
    }

    /** An SEO plugin capable of emitting structured data is active. */
    private static function has_structured_data(): bool {
        return \BeepBeep_Titles\Seo\MetaWriter::active() !== 'fallback';
    }

    /**
     * The disclaimer every AEO surface must show alongside the score.
     */
    public static function disclaimer(): string {
        return __(
            'This score reviews whether the page clearly explains its topic, answers likely questions and presents information in a structure that search engines and AI systems may understand. It is not a guarantee of inclusion in any AI-generated answer.',
            'beepbeep-titles'
        );
    }
}
