<?php
/**
 * Dev-only PHPUnit test: Website Auditor sign-up attribution, plus the
 * browser telemetry string check. Runs without WordPress; HTTP functions are
 * recorders, so nothing leaves the box.
 *
 * Run: vendor/bin/phpunit tests/php/AuditorAttributionTest.php
 */

namespace {
	define( 'ABSPATH', '/tmp/' );
	define( 'BEEPTI_VERSION', '1.0.29' );
	define( 'BEEPTI_PLUGIN_ID', 'titles' );
	define( 'BEEPTI_SLUG', 'beepbeep-titles' );
	define( 'BEEPTI_API_BASE', 'https://backend.invalid' );

	$GLOBALS['t_opts'] = [];
	$GLOBALS['t_meta'] = [];
	$GLOBALS['t_user'] = 7;
	$GLOBALS['t_admin'] = true;
	$GLOBALS['t_requests'] = [];
	$GLOBALS['t_posthog'] = [];

	class WP_Error {
		public function __construct( public $code = '', public $message = '', public $data = [] ) {}
		public function get_error_message() { return $this->message; }
	}
	function is_wp_error( $v ) { return $v instanceof WP_Error; }
	function get_option( $k, $d = false ) { return $GLOBALS['t_opts'][ $k ] ?? $d; }
	function update_option( $k, $v, $a = null ) { $GLOBALS['t_opts'][ $k ] = $v; return true; }
	function delete_option( $k ) { unset( $GLOBALS['t_opts'][ $k ] ); return true; }
	function get_user_meta( $u, $k, $s = false ) { return $GLOBALS['t_meta'][ $u ][ $k ] ?? ''; }
	function update_user_meta( $u, $k, $v ) { $GLOBALS['t_meta'][ $u ][ $k ] = $v; return true; }
	function delete_user_meta( $u, $k ) { unset( $GLOBALS['t_meta'][ $u ][ $k ] ); return true; }
	function get_current_user_id() { return $GLOBALS['t_user']; }
	function is_admin() { return $GLOBALS['t_admin']; }
	function wp_doing_ajax() { return false; }
	function wp_unslash( $v ) { return is_string( $v ) ? stripslashes( $v ) : $v; }
	function apply_filters( $h, $v ) { return $v; }
	function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
	function sanitize_text_field( $s ) { return trim( (string) $s ); }
	function wp_strip_all_tags( $s ) { return strip_tags( (string) $s ); }
	function wp_json_encode( $d ) { return json_encode( $d ); }
	function home_url() { return 'https://example.test'; }
	function get_site_url() { return 'https://example.test'; }
	function get_bloginfo( $k ) { return '6.8'; }
	function is_multisite() { return false; }
	function absint( $v ) { return abs( (int) $v ); }
	function wp_generate_uuid4() { return 'uuid'; }
	function wp_generate_password( $n, $s = true ) { return str_repeat( 'x', $n ); }
	function __( $s, $d = null ) { return $s; }
	function wp_remote_request( $url, $args ) {
		$GLOBALS['t_requests'][] = [ 'url' => $url, 'body' => json_decode( $args['body'] ?? 'null', true ) ];
		return new WP_Error( 'stub', 'offline' );
	}
	function wp_remote_post( $url, $args ) { $GLOBALS['t_posthog'][] = $url; return []; }

	$root = dirname( __DIR__, 2 );
	require_once $root . '/includes/AuditorAttribution.php';
	require_once $root . '/includes/Api/Client.php';
	require_once $root . '/includes/Telemetry.php';
	require_once $root . '/includes/Rest/TelemetryController.php';
}

namespace BeepBeep_Titles\Tests {

	use BeepBeep_Titles\AuditorAttribution as A;
	use BeepBeep_Titles\Api\Client;
	use BeepBeep_Titles\Telemetry;
	use BeepBeep_Titles\Rest\TelemetryController;
	use PHPUnit\Framework\TestCase;

	final class AuditorAttributionTest extends TestCase {

		protected function setUp(): void {
			$GLOBALS['t_opts'] = [];
			$GLOBALS['t_meta'] = [];
			$GLOBALS['t_user'] = 7;
			$GLOBALS['t_admin'] = true;
			$GLOBALS['t_requests'] = [];
			$GLOBALS['t_posthog'] = [];
			$_GET = [];
			$_REQUEST = [];
		}

		public function test_allow_list_matches_fixture_exactly(): void {
			$fixture = json_decode( (string) file_get_contents( dirname( __DIR__ ) . '/fixtures/auditor-check-ids.json' ), true );
			$this->assertIsArray( $fixture );
			$this->assertCount( 19, $fixture );
			$this->assertSame( count( $fixture ), count( array_unique( $fixture ) ) );
			$known = A::known_findings();
			$this->assertSame( count( $known ), count( array_unique( $known ) ) );
			sort( $fixture );
			sort( $known );
			$this->assertSame( $fixture, $known );
			$this->assertContains( 'title_too_long', $known );
		}

		public function test_old_names_map_to_new(): void {
			$this->assertSame( 'search_engines_discouraged', A::normalize_finding( 'search_indexing' ) );
			$this->assertSame( 'https_not_enforced', A::normalize_finding( 'https' ) );
			$this->assertSame( 'sitemap_missing', A::normalize_finding( 'sitemap' ) );
			$this->assertSame( 'canonical_missing', A::normalize_finding( 'canonical' ) );
			$this->assertSame( 'og_tags_missing', A::normalize_finding( 'open_graph' ) );
			$this->assertSame( 'missing_title', A::normalize_finding( 'Missing_Title' ) );
		}

		public function test_unknown_overlong_and_non_scalar_dropped(): void {
			$this->assertSame( '', A::normalize_finding( 'title_too_short' ) );
			$this->assertSame( '', A::normalize_finding( '' ) );
			$this->assertSame( '', A::normalize_finding( [ 'missing_title' ] ) );
			$this->assertSame( '', A::normalize_finding( null ) );
			// Over 64 raw chars is dropped even if cleaning would shorten it to a valid id.
			$this->assertSame( '', A::normalize_finding( 'missing_title' . str_repeat( '!', 60 ) ) );
			$this->assertSame( 'missing_title', A::normalize_finding( 'missing_title' . str_repeat( '!', 51 ) ) );
		}

		public function test_landing_remembers_finding_or_auditor_source(): void {
			$_GET = $_REQUEST = [ 'page' => 'beepbeep-titles', 'source' => 'auditor', 'finding' => 'duplicate_title' ];
			A::remember();
			$this->assertSame( 'duplicate_title', A::stored_finding() );

			$this->setUp();
			$_GET = $_REQUEST = [ 'page' => 'beepbeep-titles', 'source' => 'auditor', 'auditor_source' => 'sitemap' ];
			A::remember();
			$this->assertSame( 'sitemap_missing', A::stored_finding() );
		}

		public function test_landing_ignores_other_pages_junk_and_guests(): void {
			$_GET = $_REQUEST = [ 'page' => 'other-plugin', 'source' => 'auditor', 'finding' => 'missing_title' ];
			A::remember();
			$_GET = $_REQUEST = [ 'page' => 'beepbeep-titles', 'source' => 'auditor', 'finding' => 'nope' ];
			A::remember();
			$this->assertSame( [], $GLOBALS['t_meta'] );
			$GLOBALS['t_user'] = 0;
			$_GET = $_REQUEST = [ 'page' => 'beepbeep-titles', 'source' => 'auditor', 'finding' => 'missing_title' ];
			A::remember();
			$this->assertSame( [], $GLOBALS['t_meta'] );
		}

		public function test_finding_without_auditor_tag_stores_nothing(): void {
			foreach ( [
				[ 'page' => 'beepbeep-titles', 'finding' => 'missing_title' ],
				[ 'page' => 'beepbeep-titles', 'auditor_source' => 'missing_title' ],
				[ 'page' => 'beepbeep-titles', 'auditor_source' => 'auditor', 'finding' => 'missing_title' ],
				[ 'page' => 'beepbeep-titles', 'source' => 'wporg', 'finding' => 'missing_title' ],
				[ 'page' => 'beepbeep-titles', 'source' => [ 'auditor' ], 'finding' => 'missing_title' ],
			] as $get ) {
				$_GET = $_REQUEST = $get;
				A::remember();
				$this->assertSame( [], $GLOBALS['t_meta'], json_encode( $get ) );
			}
			( new Client() )->register( 'a@example.test', 'password123' );
			$this->assertArrayNotHasKey( 'finding', $GLOBALS['t_requests'][0]['body'] );
		}

		public function test_expired_entry_is_dropped(): void {
			update_user_meta( 7, A::META_KEY, [ 'finding' => 'missing_meta', 'expires_at' => time() - 1 ] );
			$this->assertSame( [], A::signup_fields() );
			$this->assertArrayNotHasKey( A::META_KEY, $GLOBALS['t_meta'][7] ?? [] );
		}

		private function register_body(): array {
			$_GET = $_REQUEST = [ 'page' => 'beepbeep-titles', 'source' => 'auditor', 'finding' => 'title_too_long' ];
			A::remember();
			( new Client() )->register( 'a@example.test', 'password123', [ 'signup_source' => 'wporg' ] );
			$this->assertCount( 1, $GLOBALS['t_requests'] );
			$this->assertStringEndsWith( '/auth/register', $GLOBALS['t_requests'][0]['url'] );
			return $GLOBALS['t_requests'][0]['body'];
		}

		public function test_register_body_has_fields_with_consent_off_and_nothing_to_posthog(): void {
			$this->assertFalse( Telemetry::has_consent() );
			$body = $this->register_body();
			$this->assertSame( 'auditor', $body['auditor_source'] );
			$this->assertSame( 'title_too_long', $body['finding'] );
			$this->assertSame( 'wporg', $body['signup_source'] );
			$this->assertSame( [], $GLOBALS['t_posthog'] );
		}

		public function test_register_body_has_fields_with_consent_on_and_finding_not_sent_to_posthog(): void {
			update_option( Telemetry::CONSENT_OPTION, 'yes' );
			$this->assertTrue( Telemetry::has_consent() );
			$body = $this->register_body();
			$this->assertSame( 'auditor', $body['auditor_source'] );
			$this->assertSame( 'title_too_long', $body['finding'] );
			$this->assertSame( [], $GLOBALS['t_posthog'] );
		}

		public function test_register_without_deeplink_is_unchanged(): void {
			( new Client() )->register( 'a@example.test', 'password123' );
			$body = $GLOBALS['t_requests'][0]['body'];
			$this->assertArrayNotHasKey( 'auditor_source', $body );
			$this->assertArrayNotHasKey( 'finding', $body );
		}

		public function test_browser_string_check(): void {
			$ok  = [ 'library', 'plugin-opened', 'wp_admin', '1.0.29', '2.3', '1.0.0-beta' ];
			$bad = [ 'example.com', 'shop.example.co.uk', '192.168.1.10', 'gmail.com', 'a@b', 'has space',
				'https://x', str_repeat( 'a', 65 ), '', '../etc' ];
			foreach ( $ok as $v ) {
				$this->assertTrue( TelemetryController::is_safe_client_string( $v ), $v );
			}
			foreach ( $bad as $v ) {
				$this->assertFalse( TelemetryController::is_safe_client_string( $v ), $v );
			}
			$out = TelemetryController::filter_client_properties( [ 'tab' => 'example.com', 'plugin_version' => '1.0.29', 'source' => str_repeat( 'b', 65 ) ] );
			$this->assertSame( [ 'plugin_version' => '1.0.29' ], $out );
		}
	}
}
