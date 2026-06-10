<?php
/**
 * Unit smoke for SettingsSanitizer (no WordPress bootstrap).
 *
 * Run: php tests/php/settings-sanitize.test.php
 */

// Minimal WP sanitise stubs for CLI.
if ( ! function_exists( 'sanitize_text_field' ) ) {
	function sanitize_text_field( $str ) {
		return trim( strip_tags( (string) $str ) );
	}
}
if ( ! function_exists( 'sanitize_textarea_field' ) ) {
	function sanitize_textarea_field( $str ) {
		return trim( (string) $str );
	}
}

require dirname( __DIR__, 2 ) . '/includes/SettingsSanitizer.php';

use BeepBeep_Titles\SettingsSanitizer;

function assert_eq( mixed $expected, mixed $actual, string $label ): void {
	if ( $expected !== $actual ) {
		fwrite( STDERR, "FAIL: {$label}\n  expected: " . var_export( $expected, true ) . "\n  actual:   " . var_export( $actual, true ) . "\n" );
		exit( 1 );
	}
}

$patch = SettingsSanitizer::sanitize_patch( [
	'tone'                => '<script>alert(1)</script>direct',
	'auto_generate'       => 'yes',
	'custom_instructions' => "  hello\nworld  ",
	'unknown_key'         => 'ignored',
] );

assert_eq( null, $patch['tone'] ?? null, 'invalid tone skipped' );
assert_eq( true, $patch['auto_generate'], 'auto_generate coerced to bool' );
assert_eq( 'hello world', $patch['custom_instructions'], 'custom_instructions trimmed' );
assert_eq( null, $patch['unknown_key'] ?? null, 'unknown key ignored' );

$valid = SettingsSanitizer::sanitize_patch( [ 'tone' => 'direct', 'title_length' => 'standard' ] );
assert_eq( 'direct', $valid['tone'], 'valid tone kept' );
assert_eq( 'standard', $valid['title_length'], 'valid title_length kept' );

echo "OK: SettingsSanitizer\n";
