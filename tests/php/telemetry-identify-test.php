<?php
/**
 * Dev-only: PostHog identify / signup / activation are opt-in, sent once,
 * carry plugin_slug=opptiai-titles and never the email.
 * Runs without WordPress; wp_remote_post is a recorder, so no HTTP leaves the box.
 */
namespace BeepBeep_Titles\Api {
	class Client {
		public function get_account_email() { return 'person@site.test'; }
		public function install_hash() { return 'testhash'; }
		public function has_license() { return true; }
	}
}

namespace {
	define( 'ABSPATH', '/tmp/' );
	define( 'BEEPTI_VERSION', '1.0.30' );
	$GLOBALS['wp_version'] = '6.8';
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
	function wp_generate_uuid4() { return '00000000-0000-4000-8000-000000000000'; }
	function wp_remote_post( $url, $args ) { $GLOBALS['beepti_http'][] = json_decode( $args['body'], true ); return []; }

	$root = getenv( 'BEEPTI_ROOT' ) ?: dirname( __DIR__, 2 );
	require $root . '/includes/Telemetry.php';
	use BeepBeep_Titles\Telemetry;

	$fail = 0;
	function check( $cond, $label ) { global $fail; if ( ! $cond ) { fwrite( STDERR, "FAIL: $label\n" ); $fail++; } else { echo "ok - $label\n"; } }
	function reset_state( array $opts ) { $GLOBALS['beepti_opts'] = $opts; $GLOBALS['beepti_http'] = []; }
	function events() { return array_map( fn( $p ) => $p['event'], $GLOBALS['beepti_http'] ); }
	$acct = '3f2b9c1e-1111-4222-8333-444455556666';

	// 1. No consent: nothing sent, nothing stored.
	reset_state( [] );
	Telemetry::on_account_connected( $acct, 'register' );
	Telemetry::capture( 'title_meta_generated', [ 'generation_mode' => 'single' ] );
	check( [] === $GLOBALS['beepti_http'], 'no consent: no identify/signup/activation sent' );
	check( ! isset( $GLOBALS['beepti_opts'][ Telemetry::IDENTIFIED_OPTION ] ), 'no consent: identified marker not stored' );
	check( ! isset( $GLOBALS['beepti_opts'][ Telemetry::ACTIVATED_OPTION ] ), 'no consent: activation marker not stored' );

	// 1b. Consent saved under the old "anonymous" wording (v1): anonymous
	// events still flow, but no identify until the toggle is re-saved.
	reset_state( [ Telemetry::CONSENT_OPTION => 'yes' ] );
	Telemetry::on_account_connected( $acct, 'register' );
	check( [ 'account_signed_up' ] === events(), 'v1 consent: signup sent anonymously, no identify' );

	// 2. Consent v2: register -> $identify then account_signed_up.
	reset_state( [] );
	Telemetry::save_consent( true );
	Telemetry::on_account_connected( $acct, 'register' );
	check( [ '$identify', 'account_signed_up' ] === events(), 'consent: identify then account_signed_up' );
	$id = $GLOBALS['beepti_http'][0];
	check( $acct === $id['distinct_id'], 'identify distinct_id is backend account id' );
	check( str_starts_with( $id['properties']['$anon_distinct_id'], 'anon_' ), 'identify merges the anon install id' );
	check( 'opptiai-titles' === $id['properties']['plugin_slug'], 'identify plugin_slug' );
	check( 'opptiai-titles' === $GLOBALS['beepti_http'][1]['properties']['plugin_slug'], 'signup plugin_slug' );
	check( false === strpos( json_encode( $GLOBALS['beepti_http'] ), 'person@site.test' ), 'email never sent' );

	// 3. Second login with same account: no second identify.
	$GLOBALS['beepti_http'] = [];
	Telemetry::on_account_connected( $acct, 'login' );
	check( [ 'account_logged_in' ] === events(), 'same account: identify not repeated' );

	// 4. Bad ids are ignored.
	$GLOBALS['beepti_http'] = [];
	Telemetry::identify( 'person@site.test', 'login' );
	Telemetry::identify( '', 'login' );
	check( [] === events(), 'non-uuid ids are never identified' );

	// 5. Activation once on first title_meta_generated.
	$GLOBALS['beepti_http'] = [];
	Telemetry::capture( 'title_meta_generated', [ 'generation_surface' => 'dashboard', 'generation_mode' => 'single' ] );
	Telemetry::capture( 'title_meta_generated', [ 'generation_surface' => 'dashboard', 'generation_mode' => 'single' ] );
	check( [ 'title_meta_generated', 'user_activated', 'title_meta_generated' ] === events(), 'user_activated sent once' );
	check( 'first_title_meta_generated' === $GLOBALS['beepti_http'][1]['properties']['activation_type'], 'activation_type' );
	check( 'opptiai-titles' === $GLOBALS['beepti_http'][1]['properties']['plugin_slug'], 'activation plugin_slug' );

	// 6. Consent revoked via save_consent: nothing, markers cleared.
	Telemetry::save_consent( false );
	$GLOBALS['beepti_http'] = [];
	check( ! isset( $GLOBALS['beepti_opts'][ Telemetry::IDENTIFIED_OPTION ] ), 'opt-out clears identified marker' );
	Telemetry::on_account_connected( $acct, 'login' );
	Telemetry::capture( 'title_meta_generated' );
	check( [] === $GLOBALS['beepti_http'], 'revoked consent: nothing sent' );

	exit( $fail ? 1 : 0 );
}
