<?php
/**
 * Dev-only: the review prompt becomes eligible after the first applied
 * title/meta, stays per-user, and is gone for good once answered.
 * Runs without WordPress; no HTTP functions exist here, so nothing can leave the box.
 */
namespace {
	define( 'ABSPATH', '/tmp/' );
	$GLOBALS['rp_opts'] = [];
	$GLOBALS['rp_meta'] = [];
	$GLOBALS['rp_user'] = 7;
	function get_option( $k, $d = false ) { return array_key_exists( $k, $GLOBALS['rp_opts'] ) ? $GLOBALS['rp_opts'][ $k ] : $d; }
	function add_option( $k, $v, $dep = '', $a = null ) { if ( array_key_exists( $k, $GLOBALS['rp_opts'] ) ) { return false; } $GLOBALS['rp_opts'][ $k ] = $v; return true; }
	function get_current_user_id() { return $GLOBALS['rp_user']; }
	function get_user_meta( $u, $k, $s = false ) { return $GLOBALS['rp_meta'][ $u ][ $k ] ?? ''; }
	function update_user_meta( $u, $k, $v ) { $GLOBALS['rp_meta'][ $u ][ $k ] = $v; return true; }
	function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
	class WP_REST_Request { private $p; function __construct( $p ) { $this->p = $p; } function get_param( $k ) { return $this->p[ $k ] ?? null; } }
	class WP_REST_Response { public $data; function __construct( $d ) { $this->data = $d; } }

	require dirname( __DIR__, 2 ) . '/includes/ReviewPrompt.php';

	use BeepBeep_Titles\ReviewPrompt;

	function rp_assert( $cond, $label ) {
		if ( ! $cond ) { fwrite( STDERR, "FAIL: {$label}\n" ); exit( 1 ); }
	}

	$c = ReviewPrompt::client_config();
	rp_assert( false === $c['eligible'] && false === $c['done'], 'not eligible before any success' );
	rp_assert( 'https://wordpress.org/support/plugin/opptiai-titles/reviews/#new-post' === $c['url'], 'review URL' );

	ReviewPrompt::mark_first_success();
	$first = get_option( ReviewPrompt::FIRST_SUCCESS_OPTION );
	ReviewPrompt::mark_first_success();
	rp_assert( $first && get_option( ReviewPrompt::FIRST_SUCCESS_OPTION ) === $first, 'first success recorded once' );
	rp_assert( true === ReviewPrompt::client_config()['eligible'], 'eligible after first success' );

	ReviewPrompt::rest_record( new WP_REST_Request( [ 'choice' => 'dismiss' ] ) );
	rp_assert( true === ReviewPrompt::client_config()['done'], 'done after dismiss' );

	$GLOBALS['rp_user'] = 8;
	rp_assert( false === ReviewPrompt::client_config()['done'], 'per-user: another admin still sees it' );

	$GLOBALS['rp_user'] = 0;
	rp_assert( true === ReviewPrompt::client_config()['done'], 'no user: never shown' );

	echo "OK: review prompt shows once per user after first success\n";
}
