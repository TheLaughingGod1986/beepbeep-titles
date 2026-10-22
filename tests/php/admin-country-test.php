<?php
/**
 * Dev-only: checkout currency follows the WP admin (edge header -> site
 * timezone -> admin locale), not the hosting server. Runs without WordPress.
 */
define( 'ABSPATH', '/tmp/' );
$GLOBALS['opts']   = [];
$GLOBALS['locale'] = 'en_US';
function get_option( $k, $d = false ) { return $GLOBALS['opts'][ $k ] ?? $d; }
function get_user_locale() { return $GLOBALS['locale']; }
function wp_unslash( $v ) { return $v; }
require __DIR__ . '/../../includes/AdminCountry.php';

use BeepBeep_Titles\AdminCountry;

$fail = false;
function check( $cond, $msg ) { global $fail; if ( ! $cond ) { $fail = true; fwrite( STDERR, "FAIL: $msg\n" ); } }
function resolve_with( array $server, string $tz, string $locale ): array {
	foreach ( [ 'HTTP_CF_IPCOUNTRY', 'CF-IPCountry', 'HTTP_CLOUDFRONT_VIEWER_COUNTRY', 'HTTP_X_COUNTRY_CODE', 'HTTP_X_APPENGINE_COUNTRY', 'HTTP_X_VERCEL_IP_COUNTRY' ] as $k ) { unset( $_SERVER[ $k ] ); }
	foreach ( $server as $k => $v ) { $_SERVER[ $k ] = $v; }
	$GLOBALS['opts']['timezone_string'] = $tz;
	$GLOBALS['locale'] = $locale;
	AdminCountry::reset_cache();
	return AdminCountry::resolve();
}

check( resolve_with( [ 'HTTP_CF_IPCOUNTRY' => 'pl' ], 'America/New_York', 'en_US' ) === [ 'country' => 'PL', 'source' => 'HTTP_CF_IPCOUNTRY' ], 'edge header wins' );
check( resolve_with( [ 'HTTP_CF_IPCOUNTRY' => 'XX' ], 'Europe/Warsaw', 'en_US' ) === [ 'country' => 'PL', 'source' => 'timezone' ], 'XX falls through to timezone' );
check( resolve_with( [], 'UTC+1', 'pl_PL' ) === [ 'country' => 'PL', 'source' => 'locale' ], 'locale region when no tz city' );
check( resolve_with( [], '', 'en_US' ) === [ 'country' => '', 'source' => '' ], 'default en_US is not a signal' );
check( resolve_with( [], 'America/Chicago', 'en_GB' )['country'] === 'US', 'US timezone -> US' );
check( resolve_with( [], 'Bogus/Zone', 'de_DE' )['country'] === 'DE', 'invalid tz ignored' );

if ( $fail ) { exit( 1 ); }
echo "OK: admin country resolves from edge header, timezone, locale\n";
