<?php
/**
 * Shared post → presentation/payload helpers.
 *
 * Single source of truth for the pieces RestApi, Plugin (auto-generate) and
 * Scanner previously each computed on their own: the permalink path, the
 * display "section", the content excerpt, and the backend `page` envelope.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

use BeepBeep_Titles\Seo\MetaWriter;

defined( 'ABSPATH' ) || exit;

class PostPresenter {

    /** Maximum number of characters of post content sent to the backend. */
    private const EXCERPT_MAX = 4000;

    /** Site-relative permalink path with a single leading slash. */
    public static function permalink_path( \WP_Post $post ): string {
        return '/' . ltrim( (string) wp_parse_url( (string) get_permalink( $post->ID ), PHP_URL_PATH ), '/' );
    }

    /** Display section: Pages / Shop / first category / Blog. */
    public static function section_for( \WP_Post $post ): string {
        switch ( $post->post_type ) {
            case 'page':
                return 'Pages';
            case 'product':
                return 'Shop';
            default:
                $cats = get_the_category( $post->ID );
                return $cats ? $cats[0]->name : 'Blog';
        }
    }

    /** Plain-text content excerpt, whitespace-collapsed and capped. */
    public static function excerpt( \WP_Post $post ): string {
        $excerpt = wp_strip_all_tags( strip_shortcodes( $post->post_content ) );
        $excerpt = trim( preg_replace( '/\s+/', ' ', $excerpt ) );

        return function_exists( 'mb_substr' )
            ? mb_substr( $excerpt, 0, self::EXCERPT_MAX )
            : substr( $excerpt, 0, self::EXCERPT_MAX );
    }

    /**
     * Build the backend `page` envelope for a post.
     *
     * @param \WP_Post   $post    Source post.
     * @param array|null $current Optional pre-read SEO state { title, meta };
     *                            read via MetaWriter when omitted.
     */
    public static function envelope( \WP_Post $post, ?array $current = null ): array {
        if ( null === $current ) {
            $current = MetaWriter::read( $post->ID );
        }

        return [
            'url'             => self::permalink_path( $post ),
            'section'         => self::section_for( $post ),
            'h1'              => $post->post_title,
            'current_title'   => $current['title'] !== '' ? $current['title'] : null,
            'current_meta'    => $current['meta'] !== '' ? $current['meta'] : null,
            'content_excerpt' => self::excerpt( $post ),
        ];
    }
}
