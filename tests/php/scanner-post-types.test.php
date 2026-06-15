<?php
/**
 * Unit smoke for Scanner::post_types() (no WordPress bootstrap).
 *
 * Guards the contract that the dashboard/Library scanner and the
 * auto-generate-on-publish hook resolve the same post-type set, defaulting
 * to every public post type (minus attachments) and honouring the
 * `bbt_scanned_post_types` filter.
 *
 * Run: php tests/php/scanner-post-types.test.php
 */

define( 'ABSPATH', __DIR__ );

// Minimal WP stubs for CLI.
$GLOBALS['__bbt_filters'] = [];

if ( ! function_exists( 'get_post_types' ) ) {
	function get_post_types( $args = [], $output = 'names' ) {
		// Mirror a typical install: core types + a public CPT + a non-public
		// one + attachment (which must be filtered out).
		return [
			'post'       => 'post',
			'page'       => 'page',
			'attachment' => 'attachment',
			'product'    => 'product',
			'sfwd-courses' => 'sfwd-courses',
		];
	}
}
if ( ! function_exists( 'apply_filters' ) ) {
	function apply_filters( $hook, $value ) {
		$cb = $GLOBALS['__bbt_filters'][ $hook ] ?? null;
		return $cb ? $cb( $value ) : $value;
	}
}
if ( ! function_exists( 'add_filter' ) ) {
	function add_filter( $hook, callable $cb ) {
		$GLOBALS['__bbt_filters'][ $hook ] = $cb;
	}
}

require dirname( __DIR__, 2 ) . '/includes/Scanner.php';

use BeepBeep_Titles\Scanner;

function assert_eq( mixed $expected, mixed $actual, string $label ): void {
	if ( $expected !== $actual ) {
		fwrite( STDERR, "FAIL: {$label}\n  expected: " . var_export( $expected, true ) . "\n  actual:   " . var_export( $actual, true ) . "\n" );
		exit( 1 );
	}
}

// Default: all public types, attachments stripped, including CPTs.
assert_eq(
	[ 'post', 'page', 'product', 'sfwd-courses' ],
	Scanner::post_types(),
	'defaults to public post types minus attachment'
);

// Filter can narrow / reorder the set.
add_filter( 'bbt_scanned_post_types', fn( $types ) => [ 'page', 'product', 'product' ] );
assert_eq(
	[ 'page', 'product' ],
	Scanner::post_types(),
	'filter applied, deduped'
);

// Filter returning junk is sanitised to a clean string list.
add_filter( 'bbt_scanned_post_types', fn( $types ) => [ 'page', '', 0, 'course' ] );
assert_eq(
	[ 'page', 'course' ],
	Scanner::post_types(),
	'filter output sanitised (empties dropped)'
);

echo "OK: Scanner::post_types smoke passed\n";
