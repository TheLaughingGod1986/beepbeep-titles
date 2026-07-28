<?php
/**
 * Small text helpers shared across the metadata scoring rules.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Scoring;

defined( 'ABSPATH' ) || exit;

final class Text_Utils {

    /** Curated, deliberately short — high-confidence-only generic phrases. */
    private const GENERIC_TITLES = [
        'home', 'homepage', 'welcome', 'untitled', 'new page', 'page 1',
        'blog', 'shop', 'products', 'services', 'about', 'about us',
        'contact', 'contact us', 'sample page',
    ];

    private const GENERIC_DESCRIPTIONS = [
        'this is the page description', 'add your description here',
        'welcome to our website', 'lorem ipsum', 'this is a wordpress page',
        'this is a wordpress post', 'page description', 'default description',
        'description goes here', 'enter description here',
    ];

    /** Common English stopwords excluded from the repeated-word check. */
    private const STOPWORDS = [
        'the', 'and', 'for', 'with', 'your', 'you', 'our', 'are', 'this',
        'that', 'from', 'have', 'has', 'was', 'were', 'will', 'can', 'all',
        'not', 'but', 'about', 'into', 'over', 'more', 'best', 'top',
    ];

    public static function is_generic_title( string $title ): bool {
        return in_array( self::normalise( $title ), self::GENERIC_TITLES, true );
    }

    public static function is_generic_description( string $description ): bool {
        $normalised = self::normalise( $description );
        foreach ( self::GENERIC_DESCRIPTIONS as $phrase ) {
            if ( str_contains( $normalised, $phrase ) ) {
                return true;
            }
        }
        return false;
    }

    /** [Insert], {{template}}, %tag%, [shortcode attr="x"] left unresolved. */
    public static function has_unresolved_placeholder( string $text ): bool {
        if ( '' === trim( $text ) ) {
            return false;
        }
        return (bool) preg_match( '/\{\{\s*[\w.-]+\s*\}\}|\[[a-z0-9_\-]+(?:\s[^\]]*)?\]|%[a-z_]+%/i', $text );
    }

    /** True when a title has three or more consecutive punctuation marks, or 3+ "!" total. */
    public static function has_excessive_punctuation( string $title ): bool {
        if ( preg_match( '/[!?.]{3,}/', $title ) ) {
            return true;
        }
        return substr_count( $title, '!' ) >= 3;
    }

    /** True when any non-trivial word appears 3 or more times. */
    public static function has_repeated_words( string $text ): bool {
        $words = preg_split( '/[^\p{L}\p{N}]+/u', self::normalise( $text ), -1, PREG_SPLIT_NO_EMPTY );
        if ( ! $words ) {
            return false;
        }
        $counts = [];
        foreach ( $words as $word ) {
            if ( strlen( $word ) <= 3 || in_array( $word, self::STOPWORDS, true ) ) {
                continue;
            }
            $counts[ $word ] = ( $counts[ $word ] ?? 0 ) + 1;
            if ( $counts[ $word ] >= 3 ) {
                return true;
            }
        }
        return false;
    }

    /** True when the same word is repeated back-to-back-to-back or the text is dominated by one word (basic stuffing signal). */
    public static function has_excessive_repetition( string $text ): bool {
        return self::has_repeated_words( $text );
    }

    public static function normalise( string $text ): string {
        return trim( strtolower( preg_replace( '/\s+/', ' ', $text ) ?? $text ) );
    }
}
