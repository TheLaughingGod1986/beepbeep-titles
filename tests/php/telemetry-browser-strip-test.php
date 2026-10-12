<?php
/**
 * Dev-only: browser events posted to REST /telemetry reach capture() with only
 * allowlisted, token-shaped properties. No network: wp_remote_post records.
 */
namespace BeepBeep_Titles\Api {
	class Client {
		public function get_account_email() { return ''; }
		public function install_hash() { return 'x'; }
		public function has_license() { return false; }
	}
}
namespace {
	define( 'ABSPATH', '/tmp/' );
	define( 'BEEPTI_VERSION', '1.0.29' );
	$GLOBALS['o'] = [ 'beepti_telemetry_consent' => 'yes' ]; $GLOBALS['http'] = [];
	function get_option( $k, $d = false ) { return $GLOBALS['o'][ $k ] ?? $d; }
	function update_option( $k, $v, $a = null ) { $GLOBALS['o'][ $k ] = $v; return true; }
	function delete_option( $k ) { unset( $GLOBALS['o'][ $k ] ); return true; }
	function apply_filters( $h, $v ) { return $v; }
	function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
	function sanitize_text_field( $s ) { return trim( strip_tags( (string) $s ) ); }
	function untrailingslashit( $s ) { return rtrim( $s, '/' ); }
	function wp_json_encode( $d ) { return json_encode( $d ); }
	function wp_generate_uuid4() { return '12345678-1234-4123-a123-123456789abc'; }
	function wp_remote_post( $u, $a ) { $GLOBALS['http'][] = json_decode( $a['body'], true ); return []; }
	class WP_REST_Request { public function __construct( private array $p ) {} public function get_param( $k ) { return $this->p[ $k ] ?? null; } }
	class WP_REST_Response { public function __construct( public $data = null, public $status = 200 ) {} }

	$root = getenv( 'BEEPTI_ROOT' ) ?: dirname( __DIR__, 2 );
	require $root . '/includes/Telemetry.php';
	require $root . '/includes/Rest/TelemetryController.php';
	$fail = 0;
	function check( $c, $l ) { global $fail; if ( ! $c ) { fwrite( STDERR, "FAIL: $l\n" ); $fail++; } }

	$bad = [
		'url' => 'https://customer.example/wp-admin/admin.php?page=x&s=secret',
		'page_url' => 'https://customer.example/about/',
		'$current_url' => 'https://customer.example/?p=5', '$pathname' => '/wp-admin/admin.php',
		'referrer' => 'https://google.com/?q=term', '$referrer' => 'https://google.com/', '$referring_domain' => 'google.com',
		'hostname' => 'customer.example', '$host' => 'customer.example', 'host' => 'customer.example',
		'post_title' => 'My Secret Post', 'title' => 'Another', 'post_id' => 42, 'post_ids' => [ 1, 2 ],
		'screen_url' => 'admin.php?page=beepbeep-titles&tab=library', 'search' => 'private term', 'search_term' => 'q',
		'error_message' => 'Failed in /var/www/html/wp-content/plugins/x.php:12', 'message' => 'boom',
		'tab' => 'library?x=1', 'error_code' => '/var/www/x.php', 'source' => 'https://evil.example/',
		'plan' => 'a b', 'trigger' => 'user@qa.oppti.dev',
	];
	$good = [
		'tab' => 'library', 'session_id' => 's_abc123_def', 'journey_id' => 'j_abc_xyz',
		'page_count' => 3, 'plugin_version' => '1.0.29', 'is_logged_in' => false,
		'is_returning_user' => true, 'feature_name' => 'library', 'error_code' => 'rate_limited',
	];
	$c = new BeepBeep_Titles\Rest\TelemetryController();
	$c->ingest( new WP_REST_Request( [ 'events' => [
		[ 'event' => 'library_viewed', 'properties' => $good + $bad ],
		[ 'event' => 'login_failed', 'properties' => $bad ],
	] ] ) );
	check( 2 === count( $GLOBALS['http'] ), 'both events captured' );
	$p0 = $GLOBALS['http'][0]['properties'];
	$p1 = $GLOBALS['http'][1]['properties'];
	$blob = json_encode( $GLOBALS['http'] );
	foreach ( [ 'customer.example', 'google.com', 'Secret', 'Another', 'wp-admin', '/var/www', 'private term', 'evil.example', 'qa.oppti.dev', 'page=' ] as $n ) {
		check( false === stripos( $blob, $n ), "payload has no '$n'" );
	}
	foreach ( array_keys( $bad ) as $k ) {
		$nk = sanitize_key( $k );
		if ( in_array( $k, [ 'tab', 'error_code', 'source', 'plan', 'trigger' ], true ) ) { continue; }
		check( ! isset( $p0[ $k ] ) && ! isset( $p0[ $nk ] ), "key $k stripped" );
	}
	foreach ( [ 'tab', 'error_code', 'source', 'plan', 'trigger' ] as $k ) {
		check( ! isset( $p1[ $k ] ), "unsafe value for $k stripped" );
	}
	foreach ( $good as $k => $v ) {
		check( ( $p0[ $k ] ?? null ) === $v, "kept $k" );
	}
	check( 'library_viewed' === $GLOBALS['http'][0]['event'], 'event name kept' );
	foreach ( [ 'wp_version', 'php_version', 'plugin_version' ] as $k ) { check( isset( $p0[ $k ] ), "server adds $k" ); }

	// Server-side capture can't leak post ids/urls either.
	$GLOBALS['http'] = [];
	BeepBeep_Titles\Telemetry::capture( 'page_undone', [ 'post_id' => 9, 'url' => 'https://customer.example/' ] );
	$p = $GLOBALS['http'][0]['properties'];
	check( ! isset( $p['post_id'] ) && ! isset( $p['url'] ), 'server capture strips post_id/url' );

	if ( $fail ) { exit( 1 ); }
	echo "OK: browser telemetry properties are allowlisted\n";
}
