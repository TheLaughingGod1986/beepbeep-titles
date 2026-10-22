<?php
/**
 * Dev-only: AutopilotGuard pause/resume. No WordPress, no network.
 * Run: php tests/php/autopilot-guard-test.php
 */
namespace {
	define( 'ABSPATH', '/tmp/' );
	$GLOBALS['t'] = [];
	function get_transient( $k ) { return $GLOBALS['t'][ $k ] ?? false; }
	function set_transient( $k, $v, $ttl = 0 ) { $GLOBALS['t'][ $k ] = $v; return true; }
	function delete_transient( $k ) { unset( $GLOBALS['t'][ $k ] ); return true; }
	function __( $s, $d = null ) { return $s; }
	class WP_Error {
		public function __construct( private $c = '', private $m = '', private $d = null ) {}
		public function get_error_data() { return $this->d; }
		public function get_error_code() { return $this->c; }
	}

	$root = getenv( 'BEEPTI_ROOT' ) ?: dirname( __DIR__, 2 );
	require_once $root . '/includes/AutopilotGuard.php';
	use BeepBeep_Titles\AutopilotGuard as G;

	$fail = 0; $n = 0;
	$ok = function ( $cond, $label ) use ( &$fail, &$n ) { $n++; if ( ! $cond ) { $fail++; echo "FAIL: $label\n"; } else { echo "ok - $label\n"; } };

	$ok( ! G::is_paused(), 'starts unpaused' );
	$ok( G::is_credit_error( new WP_Error( 'beepti_api_error', 'x', [ 'status' => 402, 'code' => 'X' ] ) ), '402 is a credit error' );
	$ok( G::is_credit_error( new WP_Error( 'beepti_api_error', 'x', [ 'status' => 429, 'code' => 'quota_exceeded' ] ) ), 'QUOTA_EXCEEDED (any case) is a credit error' );
	$ok( ! G::is_credit_error( new WP_Error( 'beepti_api_error', 'x', [ 'status' => 502, 'code' => 'NETWORK_ERROR' ] ) ), 'network error is not a credit error' );
	$ok( ! G::is_credit_error( new WP_Error( 'beepti_api_error', 'x', [ 'status' => 401, 'code' => 'INVALID_LICENSE' ] ) ), 'invalid license is not a credit error' );
	$ok( ! G::is_credit_error( [ 'status' => 402 ] ), 'non-WP_Error is not a credit error' );

	$ok( G::pause_for_credits() === true, 'first pause returns true (notify once)' );
	$ok( G::is_paused(), 'paused after credit error' );
	$ok( G::pause_for_credits() === false, 'second pause returns false (no duplicate notice)' );

	G::resume_if_credits( [ 'credits_remaining' => 0 ] );
	$ok( G::is_paused(), 'zero credits keeps pause' );
	G::resume_if_credits( [ 'plan' => 'starter' ] );
	$ok( G::is_paused(), 'unknown credits keeps pause' );
	G::resume_if_credits( 'nope' );
	$ok( G::is_paused(), 'non-array quota keeps pause' );
	G::resume_if_credits( [ 'entitlement_state' => [ 'credits_remaining' => 12 ] ] );
	$ok( ! G::is_paused(), 'nested credits_remaining > 0 resumes' );

	G::pause_for_credits();
	G::resume_if_credits( [ 'credits_remaining' => '3' ] );
	$ok( ! G::is_paused(), 'top-level credits_remaining > 0 resumes' );

	G::pause_for_credits();
	G::resume();
	$ok( ! G::is_paused(), 'explicit resume (toggle on) clears pause' );

	$ok( str_contains( G::paused_notice(), 'paused' ), 'notice text mentions pause' );

	echo "\n$n checks, $fail failed\n";
	exit( $fail ? 1 : 0 );
}
