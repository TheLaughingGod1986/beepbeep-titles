<?php
/**
 * Dev-only: Autopilot fills only empty fields. An existing SEO title survives
 * when only the meta description is missing (and vice versa).
 * Run: php tests/php/autopilot-fill-test.php
 */
namespace {
	define( 'ABSPATH', '/tmp/' );
	$root = getenv( 'BEEPTI_ROOT' ) ?: dirname( __DIR__, 2 );
	require_once $root . '/includes/AutopilotFill.php';
	use BeepBeep_Titles\AutopilotFill as F;

	$fail = 0;
	$ok = function ( $cond, $label ) use ( &$fail ) { if ( ! $cond ) { $fail++; fwrite( STDERR, "FAIL: $label\n" ); } };
	$gen = [ 'title' => 'AI Title | Site', 'meta' => 'AI meta description.' ];

	// Existing title, missing meta: title survives, meta is filled.
	$cur = [ 'title' => 'My Hand-Written Title', 'meta' => '' ];
	$w = F::writes( $cur, $gen );
	$ok( '' === $w['title'], 'existing title is not written' );
	$ok( 'AI meta description.' === $w['meta'], 'missing meta is filled' );
	$a = F::after( $cur, $gen );
	$ok( 'My Hand-Written Title' === $a['title'], 'existing title survives in the result' );
	$ok( 'AI meta description.' === $a['meta'], 'filled meta in the result' );

	// Existing meta, missing title.
	$w = F::writes( [ 'title' => '', 'meta' => 'Keep me.' ], $gen );
	$ok( 'AI Title | Site' === $w['title'] && '' === $w['meta'], 'existing meta survives; missing title filled' );

	// Both missing: both filled. Whitespace-only counts as missing.
	$w = F::writes( [ 'title' => '   ', 'meta' => '' ], $gen );
	$ok( 'AI Title | Site' === $w['title'] && 'AI meta description.' === $w['meta'], 'both empty: both filled' );

	// Both present: nothing written.
	$w = F::writes( [ 'title' => 'T', 'meta' => 'M' ], $gen );
	$ok( '' === $w['title'] && '' === $w['meta'], 'both present: nothing written' );

	// Plugin.php writes through AutopilotFill, not the raw generated result.
	$plugin = (string) file_get_contents( $root . '/includes/Plugin.php' );
	$ok( str_contains( $plugin, "MetaWriter::write_verified( \$post_id, \$writes['title'], \$writes['meta'], true )" ), 'Plugin autopilot verifies only AutopilotFill writes while preserving existing fields' );
	$ok( false === strpos( $plugin, "MetaWriter::write( \$post_id, (string) ( \$result['title']" ), 'no raw result write left in Plugin' );

	if ( $fail ) { exit( 1 ); }
	echo "OK: Autopilot fills only empty fields\n";
}
