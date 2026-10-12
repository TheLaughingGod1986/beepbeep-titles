<?php
/**
 * Dev-only: PostHog capture must be opt-in. No saved consent = nothing sent.
 * Runs without WordPress; wp_remote_post is a recorder, so no HTTP leaves the box.
 */
namespace BeepBeep_Titles\Api {
	class Client {
		public function get_account_email() { return ''; }
		public function install_hash() { return 'testhash'; }
		public function has_license() { return false; }
	}
}

namespace {
	define( 'ABSPATH', '/tmp/' );
	define( 'BEEPTI_VERSION', '1.0.29' );
	$GLOBALS['beepti_opts'] = [];
	$GLOBALS['beepti_http'] = [];
	function get_option( $k, $d = false ) { return array_key_exists( $k, $GLOBALS['beepti_opts'] ) ? $GLOBALS['beepti_opts'][ $k ] : $d; }
	function update_option( $k, $v, $a = null ) { $GLOBALS['beepti_opts'][ $k ] = $v; return true; }
	function delete_option( $k ) { unset( $GLOBALS['beepti_opts'][ $k ] ); return true; }
	function apply_filters( $h, $v ) { return $v; }
	function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
	function sanitize_text_field( $s ) { return trim( (string) $s ); }
	function untrailingslashit( $s ) { return rtrim( $s, '/' ); }
	function wp_json_encode( $d ) { return json_encode( $d ); }
	function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
	function home_url() { return 'https://example.qa.oppti.dev'; }
	function wp_generate_uuid4() { return 'uuid'; }
	function wp_remote_post( $url, $args ) { $GLOBALS['beepti_http'][] = $url; return []; }

	$root = getenv( 'BEEPTI_ROOT' ) ?: dirname( __DIR__, 2 );
	require $root . '/includes/Telemetry.php';
	use BeepBeep_Titles\Telemetry;

	$fail = 0;
	function check( $cond, $label ) { global $fail; if ( ! $cond ) { fwrite( STDERR, "FAIL: $label\n" ); $fail++; } }
	function reset_state( array $opts ) { $GLOBALS['beepti_opts'] = $opts; $GLOBALS['beepti_http'] = []; }

	// 1. Upgrade from 1.0.28: version option set, consent never saved, an old queued event present.
	reset_state( [
		Telemetry::CURRENT_VERSION_OPTION => '1.0.28',
		Telemetry::ACTIVATION_MARKER      => 1,
		Telemetry::LIFECYCLE_QUEUE_OPTION => [ [ 'event' => 'plugin_activated', 'properties' => [] ] ],
	] );
	check( false === Telemetry::has_consent(), 'unset consent is not consent' );
	Telemetry::maybe_record_update();
	Telemetry::flush_lifecycle_queue();
	Telemetry::on_activate();
	Telemetry::capture( 'plugin_opened' );
	Telemetry::capture( 'generation_completed', [ 'count' => 1 ] );
	Telemetry::on_deactivate();
	check( [] === $GLOBALS['beepti_http'], 'upgrade 1.0.28 without consent sends nothing' );
	check( ! isset( $GLOBALS['beepti_opts'][ Telemetry::LIFECYCLE_QUEUE_OPTION ] ), 'pre-consent queue is dropped, not kept for later' );
	check( false === Telemetry::client_config()['enabled'], 'JS config disabled without consent' );

	// 2. Fresh install, no consent.
	reset_state( [] );
	Telemetry::on_activate();
	Telemetry::flush_lifecycle_queue();
	check( [] === $GLOBALS['beepti_http'], 'fresh install sends nothing' );
	check( ! isset( $GLOBALS['beepti_opts'][ Telemetry::LIFECYCLE_QUEUE_OPTION ] ), 'fresh install queues nothing' );

	// 3. Explicit "no" and junk values.
	foreach ( [ 'no', '0', 0, '', null, 'maybe', [] ] as $v ) {
		reset_state( [ Telemetry::CONSENT_OPTION => $v ] );
		Telemetry::capture( 'plugin_opened' );
		check( [] === $GLOBALS['beepti_http'], 'non-yes consent sends nothing: ' . var_export( $v, true ) );
	}

	// 4. Explicit opt-in still works.
	reset_state( [ Telemetry::CONSENT_OPTION => 'yes' ] );
	Telemetry::capture( 'plugin_opened' );
	check( 1 === count( $GLOBALS['beepti_http'] ), 'opted-in capture is sent once' );
	check( true === Telemetry::client_config()['enabled'], 'JS config enabled after opt-in' );

	if ( $fail ) { exit( 1 ); }
	echo "OK: PostHog telemetry is opt-in only\n";
}
