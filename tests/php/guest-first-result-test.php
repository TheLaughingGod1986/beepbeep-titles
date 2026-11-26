<?php
/**
 * Dev-only (1.0.32 b): guest first result. A signed-out site can try one page
 * on the per-site guest allowance. The guest request carries only the trial
 * identity (no licence, site key, install hash or fingerprint), and anything
 * the backend refuses turns into GUEST_SIGNUP_REQUIRED so the UI opens
 * Create account. Runs without WordPress; nothing is sent (wp_remote_request
 * records the request). PHP 7.4 syntax so it also runs on the 7.4 floor.
 */
namespace BeepBeep_Titles {
	final class AdminCountry { public static function country(): string { return 'GB'; } }
	class PostPresenter { public static function envelope( $post ) { return [ 'url' => '/about', 'h1' => 'About us', 'content_excerpt' => 'Body text' ]; } }
	class ActivityLog { public static function record( ...$a ) { $GLOBALS['g_activity']++; } }
	class Telemetry {
		public static function capture( $e, $p = [] ) { $GLOBALS['g_events'][] = [ $e, $p ]; }
		public static function generation_saved( $p ) { $GLOBALS['g_events'][] = [ 'title_meta_generated', $p ]; }
	}
}
namespace BeepBeep_Titles\Seo {
	class MetaWriter {
		public static function read( $id ) { return [ 'title' => '', 'meta' => '' ]; }
		public static function write_verified( $id, $t, $m, $fill = false ) { $GLOBALS['g_writes'][] = [ $id, $t, $m ]; return true; }
	}
}
namespace BeepBeep_Titles\Scoring { class Metadata_Scoring_Engine { public function run() {} } }
namespace OptiAI\Core\Scan {
	class Schema { public static function items_table_exists() { return false; } }
	class Scan_Repository { public function __construct( ...$a ) {} public function mark_optimised( ...$a ) {} }
	class History_Repository { public function __construct( ...$a ) {} public function record( ...$a ) {} }
}
namespace {
	define( 'ABSPATH', '/tmp/' );
	define( 'BEEPTI_API_BASE', 'https://api.invalid' );
	define( 'BEEPTI_VERSION', '1.0.32' );
	define( 'BEEPTI_PLUGIN_ID', 'titles' );
	define( 'BEEPTI_PLUGIN_TITLE', 'OpptiAI Titles' );
	define( 'BEEPTI_PLUGIN_CHANNEL', 'test' );
	$GLOBALS['wp_version'] = '6.8';
	$GLOBALS['g_opts'] = [ 'beepti_site_id' => str_repeat( 'b', 32 ), 'beepti_install_hash' => 'install-1', 'beepti_site_fingerprint' => 'fp-1' ];
	$GLOBALS['g_calls'] = [];
	$GLOBALS['g_reply'] = [ 'code' => 401, 'body' => '{"success":false,"error":"LICENSE_REQUIRED","code":"LICENSE_REQUIRED"}' ];
	$GLOBALS['g_events'] = [];
	$GLOBALS['g_writes'] = [];
	$GLOBALS['g_activity'] = 0;

	class WP_Error {
		private $c; private $m; private $d;
		public function __construct( $c = '', $m = '', $d = null ) { $this->c = $c; $this->m = $m; $this->d = $d; }
		public function get_error_code() { return $this->c; }
		public function get_error_message() { return $this->m; }
		public function get_error_data() { return $this->d; }
	}
	class WP_REST_Request {
		private $p;
		public function __construct( array $p ) { $this->p = $p; }
		public function get_param( $k ) { return $this->p[ $k ] ?? null; }
	}
	class WP_REST_Response {
		public $data; public $status;
		public function __construct( $data = null, $status = 200 ) { $this->data = $data; $this->status = $status; }
	}
	function get_option( $k, $d = false ) { return $GLOBALS['g_opts'][ $k ] ?? $d; }
	function update_option( $k, $v, $a = null ) { $GLOBALS['g_opts'][ $k ] = $v; return true; }
	function delete_transient( $k ) { return true; }
	function home_url() { return 'https://site.example'; }
	function get_site_url() { return 'https://site.example'; }
	function is_multisite() { return false; }
	function get_bloginfo( $k ) { return 'Site'; }
	function wp_generate_uuid4() { return 'uuid'; }
	function wp_generate_password( $n = 12, $s = true ) { return 'pw'; }
	function wp_json_encode( $v ) { return json_encode( $v ); }
	function is_wp_error( $v ) { return $v instanceof WP_Error; }
	function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
	function sanitize_text_field( $s ) { return trim( (string) $s ); }
	function __( $s, $d = null ) { return $s; }
	function get_post( $id ) { return $id ? (object) [ 'ID' => (int) $id, 'post_type' => 'page' ] : null; }
	function wp_remote_request( $url, $args ) {
		$GLOBALS['g_calls'][] = [ 'url' => $url, 'headers' => $args['headers'], 'body' => json_decode( $args['body'] ?? 'null', true ) ];
		return $GLOBALS['g_reply'];
	}
	function wp_remote_retrieve_response_code( $r ) { return $r['code']; }
	function wp_remote_retrieve_body( $r ) { return $r['body']; }

	$root = getenv( 'BEEPTI_ROOT' ) ?: dirname( __DIR__, 2 );
	require $root . '/includes/Api/Client.php';
	require $root . '/includes/Rest/ErrorResponder.php';
	require $root . '/includes/Rest/GenerateController.php';
	use BeepBeep_Titles\Api\Client;
	use BeepBeep_Titles\Rest\GenerateController;

	$fail = 0;
	function g_check( $ok, $label ) { global $fail; if ( ! $ok ) { fwrite( STDERR, "FAIL: {$label}\n" ); $fail++; } else { echo "ok - {$label}\n"; } }

	// 1. Header set for a guest request.
	$h = Client::guest_headers( [ 'X-License-Key' => 'k', 'X-Site-Hash' => 's', 'X-Site-Key' => 's', 'X-Install-Hash' => 'i', 'X-Site-Fingerprint' => 'f', 'X-Plugin-ID' => 'titles' ], 'hash-1' );
	foreach ( [ 'X-License-Key', 'X-Site-Hash', 'X-Site-Key', 'X-Install-Hash', 'X-Site-Fingerprint' ] as $k ) {
		g_check( ! array_key_exists( $k, $h ), "guest request drops {$k}" );
	}
	g_check( 'true' === $h['X-Trial-Mode'] && 'hash-1' === $h['X-Trial-Site-Hash'], 'guest request carries the trial headers' );
	g_check( 'titles' === $h['X-Plugin-ID'], 'plugin headers are kept' );

	// 2. Signed-out controller path uses the guest call.
	$controller = new GenerateController( new Client() );
	$res = $controller->generate( new WP_REST_Request( [ 'post_id' => 7 ] ) );
	g_check( 1 === count( $GLOBALS['g_calls'] ), 'one backend call for one page' );
	$call = $GLOBALS['g_calls'][0];
	g_check( 'https://api.invalid/api/titles/generate' === $call['url'], 'guest call goes to /api/titles/generate' );
	g_check( ! isset( $call['headers']['X-License-Key'] ) && ! isset( $call['headers']['X-Site-Key'] ), 'no licence or site key on the wire' );
	g_check( str_repeat( 'b', 32 ) === $call['headers']['X-Trial-Site-Hash'], 'trial hash is the shared site id' );
	g_check( true === $call['body']['trial_mode'], 'body marks trial mode' );

	// 3. Today's backend (no guest allowance for Titles) -> sign-up prompt, nothing written.
	g_check( 401 === $res->status && 'GUEST_SIGNUP_REQUIRED' === $res->data['code'], 'LICENSE_REQUIRED becomes GUEST_SIGNUP_REQUIRED' );
	g_check( [] === $GLOBALS['g_writes'] && 0 === $GLOBALS['g_activity'], 'refused guest call writes nothing' );
	g_check( 'generation_failed' === $GLOBALS['g_events'][0][0] && 'guest_signup_required' === $GLOBALS['g_events'][0][1]['error_code'], 'refusal is counted as guest_signup_required' );

	// 4. Allowance used up -> same prompt.
	$GLOBALS['g_reply'] = [ 'code' => 402, 'body' => '{"success":false,"code":"TRIAL_EXHAUSTED"}' ];
	$res = $controller->generate( new WP_REST_Request( [ 'post_id' => 7 ] ) );
	g_check( 'GUEST_SIGNUP_REQUIRED' === $res->data['code'], 'used-up allowance becomes GUEST_SIGNUP_REQUIRED' );

	// 5. Server fault stays an ordinary error (not a sign-up prompt).
	$GLOBALS['g_reply'] = [ 'code' => 503, 'body' => '{"success":false,"code":"SERVICE_UNAVAILABLE"}' ];
	$res = $controller->generate( new WP_REST_Request( [ 'post_id' => 7 ] ) );
	g_check( 503 === $res->status && 'SERVICE_UNAVAILABLE' === $res->data['code'], '5xx stays an ordinary error' );

	// 6. Backend with a guest allowance -> the result is saved like any other.
	$GLOBALS['g_reply'] = [ 'code' => 200, 'body' => '{"success":true,"title":"About Us | Site","meta":"Who we are."}' ];
	$res = $controller->generate( new WP_REST_Request( [ 'post_id' => 7 ] ) );
	g_check( 200 === $res->status && true === $res->data['guest'], 'guest success returns the result marked guest' );
	g_check( [ 7, 'About Us | Site', 'Who we are.' ] === $GLOBALS['g_writes'][0], 'guest result is written to the page' );

	// 7. Mapping table.
	$map = [
		[ [ 'status' => 401, 'code' => 'X' ], true ],
		[ [ 'status' => 403, 'code' => 'SIGN_IN_REQUIRED' ], true ],
		[ [ 'status' => 400, 'code' => 'ANONYMOUS_TRIAL_EXHAUSTED' ], true ],
		[ [ 'status' => 429, 'code' => 'RATE_LIMIT_EXCEEDED' ], false ],
		[ [ 'status' => 502, 'code' => 'NETWORK_ERROR' ], false ],
	];
	foreach ( $map as $i => $row ) {
		g_check( $row[1] === GenerateController::guest_needs_account( new WP_Error( 'beepti_api_error', '', $row[0] ) ), "mapping row {$i}" );
	}

	if ( $fail ) { exit( 1 ); }
	echo "OK: guest first result\n";
}
