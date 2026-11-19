<?php
/**
 * Dev-only: usage-stats toggle save path, capability gate, anonymous payload.
 * No WordPress, no network: wp_remote_post is a recorder.
 */
namespace BeepBeep_Titles\Api {
	class Client {
		public function get_account_email() { return 'person@qa.oppti.dev'; }
		public function install_hash() { return '11111111-2222-3333-4444-555555555555'; }
		public function has_license() { return true; }
	}
}
namespace BeepBeep_Titles {
	class Plugin { public static function sync_scheduled_scan(): void {} }
}
namespace {
	define( 'ABSPATH', '/tmp/' );
	define( 'BEEPTI_VERSION', '1.0.29' );
	$GLOBALS['o'] = []; $GLOBALS['http'] = []; $GLOBALS['caps'] = [];
	function get_option( $k, $d = false ) { return array_key_exists( $k, $GLOBALS['o'] ) ? $GLOBALS['o'][ $k ] : $d; }
	function update_option( $k, $v, $a = null ) { $GLOBALS['o'][ $k ] = $v; return true; }
	function delete_option( $k ) { unset( $GLOBALS['o'][ $k ] ); return true; }
	function apply_filters( $h, $v ) { return $v; }
	function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
	function sanitize_text_field( $s ) { return trim( strip_tags( (string) $s ) ); }
	function sanitize_textarea_field( $s ) { return trim( (string) $s ); }
	function untrailingslashit( $s ) { return rtrim( $s, '/' ); }
	function wp_json_encode( $d ) { return json_encode( $d ); }
	function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
	function home_url() { return 'https://customer-site.example'; }
	function wp_generate_uuid4() { return sprintf( '%04x%04x-%04x-4%03x-a%03x-%04x%04x%04x', ...array_map( fn() => random_int( 0, 0xfff ), range( 1, 8 ) ) ); }
	function wp_remote_post( $url, $args ) { $GLOBALS['http'][] = $args['body']; return []; }
	function current_user_can( $c ) { return in_array( $c, $GLOBALS['caps'], true ); }
	function absint( $v ) { return abs( (int) $v ); }
	class WP_REST_Request { public function __construct( private array $j ) {} public function get_json_params() { return $this->j; } }
	class WP_REST_Response { public function __construct( public $data = null ) {} }

	$root = getenv( 'BEEPTI_ROOT' ) ?: dirname( __DIR__, 2 );
	foreach ( [ 'SettingsSanitizer', 'Telemetry', 'Rest/PagesController', 'Rest/Routes' ] as $f ) { require_once $root . "/includes/$f.php"; }
	use BeepBeep_Titles\Telemetry;
	use BeepBeep_Titles\Rest\PagesController;
	use BeepBeep_Titles\Rest\Routes;

	$fail = 0;
	function check( $c, $l ) { global $fail; if ( ! $c ) { fwrite( STDERR, "FAIL: $l\n" ); $fail++; } }
	$pages = new PagesController( new BeepBeep_Titles\Api\Client() );

	// Save: on -> 'yes', off -> 'no', unrelated save leaves consent unset.
	$GLOBALS['o'] = [];
	$r = $pages->update_settings( new WP_REST_Request( [ 'weekly_digest' => true ] ) );
	check( false === get_option( Telemetry::CONSENT_OPTION ), 'unrelated save does not store consent' );
	check( false === $r->data['usage_stats_opt_in'], 'response reports off by default' );
	check( [] === $GLOBALS['http'], 'no capture while consent unset' );

	$r = $pages->update_settings( new WP_REST_Request( [ 'usage_stats_opt_in' => true ] ) );
	check( 'yes' === get_option( Telemetry::CONSENT_OPTION ), 'toggle on saves yes' );
	check( true === $r->data['usage_stats_opt_in'], 'response reports on' );

	$GLOBALS['http'] = [];
	$r = $pages->update_settings( new WP_REST_Request( [ 'usage_stats_opt_in' => false ] ) );
	check( 'no' === get_option( Telemetry::CONSENT_OPTION ), 'toggle off saves no' );
	check( [] === $GLOBALS['http'], 'opting out sends nothing' );
	$pages->update_settings( new WP_REST_Request( [ 'usage_stats_opt_in' => 'garbage' ] ) );
	check( 'no' === get_option( Telemetry::CONSENT_OPTION ), 'junk value saves no' );

	// Capability: PATCH /settings is manage_options only (nonce enforced by WP REST cookie auth).
	$src = file_get_contents( $root . '/includes/Rest/Routes.php' );
	check( 1 === preg_match( "/'PATCH',\s*'callback'\s*=>\s*\[\s*\\\$p,\s*'update_settings'\s*\],\s*'permission_callback'\s*=>\s*\[\s*\\\$this,\s*'require_admin'\s*\]/", $src ), 'PATCH /settings uses require_admin' );
	$routes = ( new ReflectionClass( Routes::class ) )->newInstanceWithoutConstructor();
	$GLOBALS['caps'] = [ 'edit_posts' ];
	check( false === $routes->require_admin(), 'editor cannot save settings' );
	$GLOBALS['caps'] = [ 'manage_options', 'edit_posts' ];
	check( true === $routes->require_admin(), 'admin can save settings' );

	// Anonymous payload.
	$GLOBALS['o'] = [ Telemetry::CONSENT_OPTION => 'yes' ]; $GLOBALS['http'] = [];
	Telemetry::capture( 'plugin_opened', [ 'host' => 'x', 'site_hash' => 'y', 'site_install_id' => 'z' ] );
	Telemetry::capture( 'plugin_opened' );
	check( 2 === count( $GLOBALS['http'] ), 'opted-in captures sent' );
	$p = json_decode( $GLOBALS['http'][0], true );
	$all = $GLOBALS['http'][0];
	check( $p['properties']['site_install_id'] === $p['distinct_id'], 'safe anonymous installation attribution' );
	check( true === $p['properties']['telemetry_consent'], 'consent tagged' );
	check( 'title_meta' === $p['properties']['product'], 'canonical product' );
	check( 1 === preg_match( '/^anon_[0-9a-f-]{36}$/', $p['distinct_id'] ), 'distinct_id is anon UUID' );
	check( $p['distinct_id'] === json_decode( $GLOBALS['http'][1], true )['distinct_id'], 'distinct_id stable per install' );
	foreach ( [ 'customer-site.example', 'person@qa.oppti.dev', hash( 'sha256', 'person@qa.oppti.dev' ), substr( hash( 'sha256', 'person@qa.oppti.dev' ), 0, 32 ), '11111111-2222-3333-4444-555555555555', hash( 'sha256', '11111111-2222-3333-4444-555555555555' ) ] as $needle ) {
		check( false === strpos( $all, $needle ), "payload has no $needle" );
	}
	foreach ( [ 'host', 'site_host', 'site_hash', 'site_id', 'email' ] as $k ) {
		check( ! array_key_exists( $k, $p['properties'] ), "payload has no $k key" );
	}
	foreach ( [ 'wp_version', 'php_version', 'plugin_version', 'is_logged_in' ] as $k ) {
		check( array_key_exists( $k, $p['properties'] ), "payload keeps $k" );
	}

	if ( $fail ) { exit( 1 ); }
	echo "OK: usage-stats toggle saves consent, admin-only, payload anonymous\n";
}
