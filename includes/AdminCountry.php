<?php
/**
 * Resolve the WP admin's country for upgrade checkout currency.
 *
 * Checkout calls reach the OpptiAI backend server-to-server from the WordPress
 * host, so backend edge geo sees the hosting server (a Polish site on a US host
 * looks "US"). The plugin resolves the admin's own country and forwards it as
 * X-Admin-Country / admin_country. Same order as Alt Text's BBAI_Admin_Country:
 *  1. CDN country header on the admin's own wp-admin request.
 *  2. WordPress site timezone (Settings > General), e.g. Europe/Warsaw -> PL.
 *  3. Admin user locale region, e.g. pl_PL -> PL (en_US ignored: WP default).
 * Unknown -> '' (backend and plugin fall back to GBP). No geo API call.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

defined( 'ABSPATH' ) || exit;

final class AdminCountry {

    /** @var array{country:string,source:string}|null */
    private static ?array $cache = null;

    /** Keep in lockstep with Alt Text (same keys, same order). */
    private const EDGE_HEADER_KEYS = [
        'HTTP_CF_IPCOUNTRY',              // Cloudflare
        'CF-IPCountry',
        'HTTP_CLOUDFRONT_VIEWER_COUNTRY', // CloudFront
        'HTTP_X_COUNTRY_CODE',
        'HTTP_X_APPENGINE_COUNTRY',       // App Engine
        'HTTP_X_VERCEL_IP_COUNTRY',       // Vercel
    ];

    /** @return array{country:string,source:string} */
    public static function resolve(): array {
        if ( self::$cache !== null ) {
            return self::$cache;
        }
        $result = self::from_edge_headers();
        if ( $result['country'] === '' ) {
            $result = self::from_timezone();
        }
        if ( $result['country'] === '' ) {
            $result = self::from_locale();
        }
        return self::$cache = $result;
    }

    public static function country(): string {
        return self::resolve()['country'];
    }

    /** Test helper. */
    public static function reset_cache(): void {
        self::$cache = null;
    }

    private static function valid( string $code ): bool {
        return (bool) preg_match( '/^[A-Z]{2}$/', $code ) && ! in_array( $code, [ 'XX', 'T1', 'ZZ', 'EU', 'AP' ], true );
    }

    private static function none(): array {
        return [ 'country' => '', 'source' => '' ];
    }

    private static function from_edge_headers(): array {
        foreach ( self::EDGE_HEADER_KEYS as $key ) {
            if ( empty( $_SERVER[ $key ] ) || ! is_string( $_SERVER[ $key ] ) ) {
                continue;
            }
            $code = strtoupper( preg_replace( '/[^A-Za-z]/', '', wp_unslash( (string) $_SERVER[ $key ] ) ) );
            if ( self::valid( $code ) ) {
                return [ 'country' => $code, 'source' => $key ];
            }
        }
        return self::none();
    }

    private static function from_timezone(): array {
        $tz = (string) get_option( 'timezone_string', '' );
        if ( $tz === '' || str_starts_with( $tz, 'UTC' ) || str_starts_with( $tz, 'Etc/' ) ) {
            return self::none();
        }
        try {
            $loc  = ( new \DateTimeZone( $tz ) )->getLocation();
            $code = is_array( $loc ) ? strtoupper( (string) ( $loc['country_code'] ?? '' ) ) : '';
            if ( self::valid( $code ) ) {
                return [ 'country' => $code, 'source' => 'timezone' ];
            }
        } catch ( \Exception $e ) {
            // Invalid timezone string: ignore.
        }
        return self::none();
    }

    private static function from_locale(): array {
        $locale = function_exists( 'get_user_locale' ) ? (string) get_user_locale() : ( function_exists( 'get_locale' ) ? (string) get_locale() : '' );
        if ( $locale === '' || $locale === 'en_US' ) {
            return self::none();
        }
        if ( preg_match( '/^[a-z]{2,3}_([A-Z]{2})(?:_|$)/', $locale, $m ) && self::valid( $m[1] ) ) {
            return [ 'country' => $m[1], 'source' => 'locale' ];
        }
        return self::none();
    }
}
