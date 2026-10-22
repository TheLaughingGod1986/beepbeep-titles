<?php
/**
 * Dev-only: contact-form messages go to support@oppti.dev by default, the
 * BEEPTI_SUPPORT_EMAIL constant and the beepti_contact_support_recipient
 * filter can override it, and an invalid override falls back to the default.
 * Runs without WordPress; nothing is sent.
 */
namespace {
	define( 'ABSPATH', '/tmp/' );
	$GLOBALS['si_filter'] = null;
	function apply_filters( $hook, $value ) {
		if ( 'beepti_contact_support_recipient' === $hook && is_callable( $GLOBALS['si_filter'] ) ) {
			return ( $GLOBALS['si_filter'] )( $value );
		}
		return $value;
	}
	function sanitize_email( $e ) { return trim( (string) $e ); }
	function is_email( $e ) { return false !== filter_var( $e, FILTER_VALIDATE_EMAIL ) ? $e : false; }

	require dirname( __DIR__, 2 ) . '/includes/Rest/SupportController.php';

	use BeepBeep_Titles\Rest\SupportController;

	function si_assert( $cond, $label ) {
		if ( ! $cond ) { fwrite( STDERR, "FAIL: {$label}\n" ); exit( 1 ); }
	}

	si_assert( 'support@oppti.dev' === SupportController::support_inbox(), 'default inbox is support@oppti.dev' );

	$GLOBALS['si_filter'] = static fn( $v ) => 'help@agency.example';
	si_assert( 'help@agency.example' === SupportController::support_inbox(), 'filter overrides the inbox' );

	$GLOBALS['si_filter'] = static fn( $v ) => 'not-an-email';
	si_assert( 'support@oppti.dev' === SupportController::support_inbox(), 'invalid filter value falls back to default' );

	$GLOBALS['si_filter'] = null;
	define( 'BEEPTI_SUPPORT_EMAIL', 'ops@site.example' );
	si_assert( 'ops@site.example' === SupportController::support_inbox(), 'BEEPTI_SUPPORT_EMAIL constant is used' );

	$root = dirname( __DIR__, 2 );
	$main = (string) file_get_contents( $root . '/beepbeep-titles.php' );
	si_assert( str_contains( $main, "define( 'BEEPTI_SUPPORT_EMAIL', 'support@oppti.dev' )" ), 'main file defines BEEPTI_SUPPORT_EMAIL' );
	foreach ( [ 'includes', 'src' ] as $dir ) {
		$it = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $root . '/' . $dir, FilesystemIterator::SKIP_DOTS ) );
		foreach ( $it as $f ) {
			si_assert( false === stripos( (string) file_get_contents( (string) $f ), 'gmail.com' ), 'no gmail address in ' . $f );
		}
	}

	echo "OK: support inbox (default, filter, invalid fallback, constant, no gmail)\n";
}
