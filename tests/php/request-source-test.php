<?php
/**
 * Dev-only: publish-time Autopilot generations send
 * X-Request-Source: beepbeep_titles_autopilot; manual generate, bulk jobs and
 * other calls keep beepbeep_titles. Runs without WordPress; nothing is sent
 * (wp_remote_request is stubbed and records the headers).
 */
namespace BeepBeep_Titles {
	final class AdminCountry { public static function country(): string { return 'GB'; } }
}
namespace {
	define( 'ABSPATH', '/tmp/' );
	define( 'BEEPTI_API_BASE', 'https://api.invalid' );
	define( 'BEEPTI_VERSION', '1.0.30' );
	define( 'BEEPTI_PLUGIN_ID', 'beepbeep-titles' );
	define( 'BEEPTI_PLUGIN_TITLE', 'OpptiAI Titles' );
	define( 'BEEPTI_PLUGIN_CHANNEL', 'test' );
	$GLOBALS['wp_version'] = '6.8';
	$GLOBALS['rs_opts']    = [ 'beepti_license_key' => 'lic-test', 'beepti_site_id' => str_repeat( 'a', 32 ), 'beepti_install_hash' => 'ih', 'beepti_site_fingerprint' => 'fp' ];
	$GLOBALS['rs_calls']   = [];
	class WP_Error { public function __construct( ...$a ) {} public function get_error_message() { return ''; } }
	function get_option( $k, $d = false ) { return $GLOBALS['rs_opts'][ $k ] ?? $d; }
	function update_option( $k, $v, $a = null ) { $GLOBALS['rs_opts'][ $k ] = $v; return true; }
	function home_url() { return 'https://site.example'; }
	function wp_generate_uuid4() { return 'uuid'; }
	function wp_generate_password( $n = 12, $s = true ) { return 'pw'; }
	function wp_json_encode( $v ) { return json_encode( $v ); }
	function is_wp_error( $v ) { return $v instanceof WP_Error; }
	function __( $s, $d = null ) { return $s; }
	function wp_remote_request( $url, $args ) { $GLOBALS['rs_calls'][] = [ $url, $args['headers'] ]; return [ 'code' => 200, 'body' => '{"success":true}' ]; }
	function wp_remote_retrieve_response_code( $r ) { return $r['code']; }
	function wp_remote_retrieve_body( $r ) { return $r['body']; }

	$root = dirname( __DIR__, 2 );
	require $root . '/includes/Api/Client.php';
	use BeepBeep_Titles\Api\Client;

	function rs_assert( $cond, $label ) {
		if ( ! $cond ) { fwrite( STDERR, "FAIL: {$label}\n" ); exit( 1 ); }
	}
	function rs_last_source(): string { $c = end( $GLOBALS['rs_calls'] ); return (string) ( $c[1]['X-Request-Source'] ?? '' ); }

	$client = new Client();
	$page   = [ 'url' => 'https://site.example/p', 'section' => 'post', 'h1' => 'H', 'current_title' => '', 'current_meta' => '', 'content_excerpt' => 'x' ];
	$opts   = [ 'brand_name' => 'B', 'tone' => 'direct' ];

	$client->generate( $page, $opts );
	rs_assert( 'beepbeep_titles' === rs_last_source(), 'manual generate sends beepbeep_titles' );
	rs_assert( str_ends_with( end( $GLOBALS['rs_calls'] )[0], '/api/titles/generate' ), 'manual hits /api/titles/generate' );

	$client->generate( $page, $opts, null, Client::SOURCE_AUTOPILOT );
	rs_assert( 'beepbeep_titles_autopilot' === rs_last_source(), 'autopilot generate sends beepbeep_titles_autopilot' );

	$client->submit_job( [ $page ], $opts );
	rs_assert( 'beepbeep_titles' === rs_last_source(), 'source resets after autopilot; bulk job sends beepbeep_titles' );

	$client->generate( $page, $opts, [ 'title' => 't', 'meta' => 'm' ] );
	rs_assert( 'beepbeep_titles' === rs_last_source(), 'regenerate sends beepbeep_titles' );

	// The publish-time Autopilot call site passes the autopilot source; the manual REST path does not.
	$plugin = (string) file_get_contents( $root . '/includes/Plugin.php' );
	rs_assert( 1 === preg_match( '/\$client->generate\(\s*\$this->autopilot_page_envelope\([^;]*Client::SOURCE_AUTOPILOT\s*\);/s', $plugin ), 'Plugin autopilot generate passes SOURCE_AUTOPILOT' );
	$rest = (string) file_get_contents( $root . '/includes/Rest/GenerateController.php' );
	rs_assert( false === strpos( $rest, 'SOURCE_AUTOPILOT' ), 'manual GenerateController does not use SOURCE_AUTOPILOT' );

	echo "OK: request source (manual, autopilot, reset, bulk, regenerate, call sites)\n";
}
