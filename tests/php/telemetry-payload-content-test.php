<?php
/**
 * Dev-only (1.0.32): what Titles usage stats actually contain. Runs the real
 * Telemetry, TelemetryController, GenerateController and PagesController with
 * usage stats on, feeds page text, generated titles and meta, and settings
 * text through them, and checks none of it reaches a PostHog payload.
 * Generation itself does send page text to the OpptiAI API (that is how a
 * title is written); this test records that too, so the claim is scoped to
 * usage stats. No WordPress, no network. PHP 7.4 syntax.
 */
namespace BeepBeep_Titles {
	final class AdminCountry { public static function country(): string { return 'GB'; } }
	class PostPresenter {
		public static function envelope( $post ) {
			return [ 'url' => '/zqx-sentinel-slug', 'h1' => 'ZQX Sentinel Page Title', 'content_excerpt' => 'ZQX sentinel page body text' ];
		}
	}
	class ActivityLog { public static function record( ...$a ) {} }
	class Plugin { public static function sync_scheduled_scan() {} }
	class AutopilotGuard { public static function resume() {} }
}
namespace BeepBeep_Titles\Seo {
	class MetaWriter {
		public static function read( $id ) { return [ 'title' => 'ZQX Old Title', 'meta' => 'ZQX old meta' ]; }
		public static function write_verified( $id, $t, $m, $fill = false ) { return true; }
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
	$GLOBALS['o'] = [ 'beepti_site_id' => str_repeat( 'b', 32 ), 'beepti_telemetry_consent' => 'yes', 'beepti_telemetry_activation_sent' => 1 ];
	$GLOBALS['posthog'] = [];
	$GLOBALS['api'] = [];

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
		public function get_json_params() { return $this->p; }
	}
	class WP_REST_Response {
		public $data; public $status;
		public function __construct( $data = null, $status = 200 ) { $this->data = $data; $this->status = $status; }
	}
	function get_option( $k, $d = false ) { return array_key_exists( $k, $GLOBALS['o'] ) ? $GLOBALS['o'][ $k ] : $d; }
	function update_option( $k, $v, $a = null ) { $GLOBALS['o'][ $k ] = $v; return true; }
	function add_option( $k, $v, $dep = '', $a = null ) { if ( array_key_exists( $k, $GLOBALS['o'] ) ) { return false; } $GLOBALS['o'][ $k ] = $v; return true; }
	function delete_option( $k ) { unset( $GLOBALS['o'][ $k ] ); return true; }
	function delete_transient( $k ) { return true; }
	function apply_filters( $h, $v, ...$rest ) { return $v; }
	function home_url() { return 'https://zqx-customer-site.example'; }
	function get_site_url() { return home_url(); }
	function is_multisite() { return false; }
	function get_bloginfo( $k ) { return 'ZQX Site Name'; }
	function wp_generate_uuid4() { return '00000000-0000-4000-a000-000000000001'; }
	function wp_generate_password( $n = 12, $s = true ) { return 'pw'; }
	function wp_json_encode( $v ) { return json_encode( $v ); }
	function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
	function untrailingslashit( $s ) { return rtrim( $s, '/' ); }
	function is_wp_error( $v ) { return $v instanceof WP_Error; }
	function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
	function sanitize_text_field( $s ) { return trim( strip_tags( (string) $s ) ); }
	function sanitize_textarea_field( $s ) { return trim( (string) $s ); }
	function __( $s, $d = null ) { return $s; }
	function current_user_can( $c ) { return true; }
	function get_post( $id ) { return $id ? (object) [ 'ID' => (int) $id, 'post_type' => 'page', 'post_title' => 'ZQX Sentinel Page Title', 'post_content' => 'ZQX sentinel page body text' ] : null; }
	function wp_remote_post( $url, $args ) { $GLOBALS['posthog'][] = (string) $args['body']; return []; }
	function wp_remote_request( $url, $args ) {
		$GLOBALS['api'][] = (string) ( $args['body'] ?? '' );
		return [ 'code' => 200, 'body' => '{"success":true,"title":"ZQX Generated Title | Site","meta":"ZQX generated meta description."}' ];
	}
	function wp_remote_retrieve_response_code( $r ) { return $r['code']; }
	function wp_remote_retrieve_body( $r ) { return $r['body']; }

	$root = getenv( 'BEEPTI_ROOT' ) ?: dirname( __DIR__, 2 );
	foreach ( [ 'Api/Client', 'Telemetry', 'SettingsSanitizer', 'Rest/ErrorResponder', 'Rest/GenerateController', 'Rest/TelemetryController', 'Rest/PagesController' ] as $f ) { require_once $root . "/includes/$f.php"; }
	use BeepBeep_Titles\Api\Client;
	use BeepBeep_Titles\Rest\GenerateController;
	use BeepBeep_Titles\Rest\TelemetryController;
	use BeepBeep_Titles\Rest\PagesController;
	use BeepBeep_Titles\Telemetry;

	$fail = 0;
	function pc_check( $c, $l ) { global $fail; if ( ! $c ) { fwrite( STDERR, "FAIL: $l\n" ); $fail++; } else { echo "ok - $l\n"; } }

	// 1. A single optimise (guest path, backend returns a title and meta).
	$res = ( new GenerateController( new Client() ) )->generate( new WP_REST_Request( [ 'post_id' => 42 ] ) );
	pc_check( 200 === $res->status, 'generation ran' );

	// 2. Settings save with free text in it.
	( new PagesController( new Client() ) )->update_settings( new WP_REST_Request( [
		'custom_instructions' => 'ZQX custom instructions text',
		'brand_name_override' => 'ZQX Brand',
		'tone'                => 'direct',
	] ) );

	// 3. Browser events carrying page text under allowed and disallowed keys.
	( new TelemetryController() )->ingest( new WP_REST_Request( [ 'events' => [
		[ 'event' => 'library_viewed', 'properties' => [ 'tab' => 'ZQX Sentinel Page Title', 'source' => 'ZQX sentinel page body text', 'title' => 'ZQX Generated Title', 'meta' => 'ZQX generated meta', 'content' => 'ZQX sentinel page body text', 'url' => 'https://zqx-customer-site.example/zqx-sentinel-slug', 'search' => 'ZQX search' ] ],
		[ 'event' => 'generation_failed', 'properties' => [ 'error_code' => 'ZQX error message with spaces' ] ],
	] ] ) );

	// 4. Opt-in lifecycle events.
	Telemetry::set_consent( false );
	Telemetry::set_consent( true, 'guest_card' );

	$events = array_map( function ( $b ) { return json_decode( $b, true ); }, $GLOBALS['posthog'] );
	$names  = array_map( function ( $e ) { return $e['event']; }, $events );
	pc_check( count( $events ) >= 6, 'usage events were captured (' . implode( ', ', $names ) . ')' );
	foreach ( [ 'generation_completed', 'title_meta_generated', 'settings_saved', 'library_viewed', 'consent_granted' ] as $n ) {
		pc_check( in_array( $n, $names, true ), "$n captured" );
	}
	$all = implode( "\n", $GLOBALS['posthog'] );
	pc_check( false === stripos( $all, 'zqx' ), 'no page title, page text, generated title or meta, settings text, slug, site name or site URL in any usage event' );
	pc_check( false === strpos( $all, '"post_id"' ), 'no post id in any usage event' );

	$keys = [];
	foreach ( $events as $e ) { $keys = array_merge( $keys, array_keys( $e['properties'] ) ); }
	$keys = array_values( array_unique( $keys ) );
	sort( $keys );
	foreach ( [ 'title', 'meta', 'content', 'content_excerpt', 'h1', 'url', 'post_title', 'post_content', 'search', 'error_message', 'site_url', 'host', 'email' ] as $k ) {
		pc_check( ! in_array( $k, $keys, true ), "no '$k' property" );
	}
	echo 'Usage event property keys: ' . implode( ', ', $keys ) . "\n";

	// Generation itself (not usage stats) sends page text to the OpptiAI API.
	$api = implode( "\n", $GLOBALS['api'] );
	pc_check( false !== strpos( $api, 'ZQX sentinel page body text' ), 'generation request to the OpptiAI API carries page text (expected; not usage stats)' );

	if ( $fail ) { exit( 1 ); }
	echo "OK: usage stats carry no page content, titles or meta\n";
}
