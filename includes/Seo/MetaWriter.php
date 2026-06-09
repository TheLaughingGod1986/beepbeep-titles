<?php
/**
 * SEO meta read/write abstraction.
 *
 * Detects the site's active SEO plugin once (cached in the `bbt_seo_plugin`
 * option) and routes title/meta reads and writes to the right storage:
 *
 *   - Yoast SEO     → postmeta `_yoast_wpseo_title` / `_yoast_wpseo_metadesc`
 *   - Rank Math     → postmeta `rank_math_title`    / `rank_math_description`
 *   - AIOSEO 4.x    → custom table `{prefix}aioseo_posts` (via model, $wpdb fallback)
 *   - none detected → our own keys + front-end head filters
 *
 * We never write to post_content or the_title — only to the SEO layer.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Seo;

defined( 'ABSPATH' ) || exit;

class MetaWriter {

    public const FALLBACK_TITLE_KEY = '_bbt_seo_title';
    public const FALLBACK_META_KEY  = '_bbt_meta_description';

    private const OPT_ACTIVE = 'bbt_seo_plugin';

    // ----------------------------------------------------------------
    // Detection
    // ----------------------------------------------------------------

    /**
     * Detect the active SEO plugin right now (no caching).
     *
     * Priority order: a site running two SEO plugins should defer to the one
     * that actually controls front-end output; Yoast → Rank Math → AIOSEO.
     *
     * @return 'yoast'|'rank_math'|'aioseo'|'fallback'
     */
    public static function detect(): string {
        if ( defined( 'WPSEO_VERSION' ) || class_exists( 'WPSEO_Options' ) ) {
            return 'yoast';
        }
        if ( class_exists( 'RankMath' ) || defined( 'RANK_MATH_VERSION' ) ) {
            return 'rank_math';
        }
        if ( function_exists( 'aioseo' ) || defined( 'AIOSEO_VERSION' ) ) {
            return 'aioseo';
        }
        return 'fallback';
    }

    /**
     * The active SEO plugin, using the cached choice when present.
     * Falls back to a live detect() if the option was never set.
     */
    public static function active(): string {
        $cached = get_option( self::OPT_ACTIVE, '' );
        if ( is_string( $cached ) && in_array( $cached, [ 'yoast', 'rank_math', 'aioseo', 'fallback' ], true ) ) {
            return $cached;
        }
        return self::refresh();
    }

    /** Re-run detection and persist the result. */
    public static function refresh(): string {
        $active = self::detect();
        update_option( self::OPT_ACTIVE, $active, false );
        return $active;
    }

    /**
     * Postmeta keys for the active plugin, for fast SQL stats/filtering.
     * Returns null for AIOSEO (custom table — no postmeta to query).
     *
     * @return array{0:string,1:string}|null [ title_key, meta_key ]
     */
    public static function postmeta_keys(): ?array {
        switch ( self::active() ) {
            case 'yoast':
                return [ '_yoast_wpseo_title', '_yoast_wpseo_metadesc' ];
            case 'rank_math':
                return [ 'rank_math_title', 'rank_math_description' ];
            case 'aioseo':
                return null;
            default:
                return [ self::FALLBACK_TITLE_KEY, self::FALLBACK_META_KEY ];
        }
    }

    // ----------------------------------------------------------------
    // Read
    // ----------------------------------------------------------------

    /**
     * Current SEO title + meta for a post.
     *
     * @return array{title:string, meta:string}
     */
    public static function read( int $post_id ): array {
        switch ( self::active() ) {
            case 'yoast':
                return [
                    'title' => (string) get_post_meta( $post_id, '_yoast_wpseo_title', true ),
                    'meta'  => (string) get_post_meta( $post_id, '_yoast_wpseo_metadesc', true ),
                ];
            case 'rank_math':
                return [
                    'title' => (string) get_post_meta( $post_id, 'rank_math_title', true ),
                    'meta'  => (string) get_post_meta( $post_id, 'rank_math_description', true ),
                ];
            case 'aioseo':
                return self::read_aioseo( $post_id );
            default:
                return [
                    'title' => (string) get_post_meta( $post_id, self::FALLBACK_TITLE_KEY, true ),
                    'meta'  => (string) get_post_meta( $post_id, self::FALLBACK_META_KEY, true ),
                ];
        }
    }

    // ----------------------------------------------------------------
    // Write
    // ----------------------------------------------------------------

    /**
     * Persist a generated title + meta. Empty strings are treated as
     * "leave unchanged" so a single-field edit doesn't wipe the other.
     */
    public static function write( int $post_id, string $title, string $meta ): void {
        $title = trim( $title );
        $meta  = trim( $meta );

        switch ( self::active() ) {
            case 'yoast':
                if ( $title !== '' ) {
                    update_post_meta( $post_id, '_yoast_wpseo_title', $title );
                }
                if ( $meta !== '' ) {
                    update_post_meta( $post_id, '_yoast_wpseo_metadesc', $meta );
                }
                break;

            case 'rank_math':
                if ( $title !== '' ) {
                    update_post_meta( $post_id, 'rank_math_title', $title );
                }
                if ( $meta !== '' ) {
                    update_post_meta( $post_id, 'rank_math_description', $meta );
                }
                break;

            case 'aioseo':
                self::write_aioseo( $post_id, $title, $meta );
                break;

            default:
                if ( $title !== '' ) {
                    update_post_meta( $post_id, self::FALLBACK_TITLE_KEY, $title );
                }
                if ( $meta !== '' ) {
                    update_post_meta( $post_id, self::FALLBACK_META_KEY, $meta );
                }
                break;
        }
    }

    // ----------------------------------------------------------------
    // AIOSEO custom-table path
    // ----------------------------------------------------------------

    private static function read_aioseo( int $post_id ): array {
        // Prefer the official model (handles its own table + defaults).
        if ( class_exists( '\AIOSEO\Plugin\Common\Models\Post' ) ) {
            try {
                $aioseo_post = \AIOSEO\Plugin\Common\Models\Post::getPost( $post_id );
                if ( $aioseo_post && ! empty( $aioseo_post->exists ) ) {
                    return [
                        'title' => (string) ( $aioseo_post->title ?? '' ),
                        'meta'  => (string) ( $aioseo_post->description ?? '' ),
                    ];
                }
            } catch ( \Throwable $e ) {
                // Fall through to direct read.
            }
        }

        global $wpdb;
        $table = $wpdb->prefix . 'aioseo_posts';
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $row = $wpdb->get_row(
            $wpdb->prepare( "SELECT title, description FROM {$table} WHERE post_id = %d", $post_id ),
            ARRAY_A
        );
        return [
            'title' => (string) ( $row['title'] ?? '' ),
            'meta'  => (string) ( $row['description'] ?? '' ),
        ];
    }

    private static function write_aioseo( int $post_id, string $title, string $meta ): void {
        // Primary path: the official model, which fills required columns.
        if ( class_exists( '\AIOSEO\Plugin\Common\Models\Post' ) ) {
            try {
                $aioseo_post = \AIOSEO\Plugin\Common\Models\Post::getPost( $post_id );
                if ( $aioseo_post ) {
                    if ( $title !== '' ) {
                        $aioseo_post->title = $title;
                    }
                    if ( $meta !== '' ) {
                        $aioseo_post->description = $meta;
                    }
                    $aioseo_post->post_id = $post_id;
                    $aioseo_post->save();
                    return;
                }
            } catch ( \Throwable $e ) {
                // Fall through to direct table write.
            }
        }

        // Fallback: write the table directly (best-effort; verify per install).
        global $wpdb;
        $table = $wpdb->prefix . 'aioseo_posts';
        $now   = current_time( 'mysql' );

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $exists = (int) $wpdb->get_var(
            $wpdb->prepare( "SELECT id FROM {$table} WHERE post_id = %d", $post_id )
        );

        $fields = [];
        $format = [];
        if ( $title !== '' ) {
            $fields['title'] = $title;
            $format[]        = '%s';
        }
        if ( $meta !== '' ) {
            $fields['description'] = $meta;
            $format[]              = '%s';
        }
        if ( empty( $fields ) ) {
            return;
        }

        if ( $exists ) {
            $fields['updated'] = $now;
            $format[]          = '%s';
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            $wpdb->update( $table, $fields, [ 'post_id' => $post_id ], $format, [ '%d' ] );
        } else {
            $fields['post_id'] = $post_id;
            $fields['created'] = $now;
            $fields['updated'] = $now;
            $format[]          = '%d';
            $format[]          = '%s';
            $format[]          = '%s';
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            $wpdb->insert( $table, $fields, $format );
        }
    }

    // ----------------------------------------------------------------
    // Fallback front-end output (only registered when active === 'fallback')
    // ----------------------------------------------------------------

    /**
     * Wire the title filter + meta-description echo. Called from Plugin::init
     * when no SEO plugin is detected, so generated copy still reaches the HTML.
     */
    public static function register_fallback_filters(): void {
        add_filter( 'pre_get_document_title', [ self::class, 'filter_document_title' ], 20 );
        add_action( 'wp_head', [ self::class, 'echo_meta_description' ], 1 );
    }

    public static function filter_document_title( $title ) {
        if ( ! is_singular() ) {
            return $title;
        }
        $custom = (string) get_post_meta( get_queried_object_id(), self::FALLBACK_TITLE_KEY, true );
        return $custom !== '' ? $custom : $title;
    }

    public static function echo_meta_description(): void {
        if ( ! is_singular() ) {
            return;
        }
        $meta = (string) get_post_meta( get_queried_object_id(), self::FALLBACK_META_KEY, true );
        if ( $meta !== '' ) {
            echo '<meta name="description" content="' . esc_attr( $meta ) . '" />' . "\n";
        }
    }
}
