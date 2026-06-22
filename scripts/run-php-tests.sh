#!/usr/bin/env bash
# Dev-only PHP smoke tests (excluded from release via .distignore).
set -euo pipefail

cd "$(dirname "$0")/.."
export BBT_ROOT="$(pwd)"

php <<'PHP'
<?php
$root = getenv( 'BBT_ROOT' );
if ( ! is_string( $root ) || $root === '' ) {
	fwrite( STDERR, "FAIL: BBT_ROOT not set\n" );
	exit( 1 );
}

if ( ! function_exists( 'sanitize_text_field' ) ) {
	function sanitize_text_field( $str ) {
		return trim( preg_replace( '/<[^>]*>/', '', (string) $str ) );
	}
}
if ( ! function_exists( 'sanitize_textarea_field' ) ) {
	function sanitize_textarea_field( $str ) {
		return trim( (string) $str );
	}
}

require $root . '/includes/SettingsSanitizer.php';

use BeepBeep_Titles\SettingsSanitizer;

function bbt_test_assert_eq( mixed $expected, mixed $actual, string $label ): void {
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

bbt_test_assert_eq( null, $patch['tone'] ?? null, 'invalid tone skipped' );
bbt_test_assert_eq( true, $patch['auto_generate'], 'auto_generate coerced to bool' );
bbt_test_assert_eq( 'hello world', $patch['custom_instructions'], 'custom_instructions trimmed' );
bbt_test_assert_eq( null, $patch['unknown_key'] ?? null, 'unknown key ignored' );

$valid = SettingsSanitizer::sanitize_patch( [ 'tone' => 'direct', 'title_length' => 'standard' ] );
bbt_test_assert_eq( 'direct', $valid['tone'], 'valid tone kept' );
bbt_test_assert_eq( 'standard', $valid['title_length'], 'valid title_length kept' );

$legacy = SettingsSanitizer::normalize_settings( [
	'notifications' => [
		'new_page'   => true,
		'digest'     => '1',
		'limit_warn' => false,
	],
] );
bbt_test_assert_eq( true, $legacy['notify_new_pages'], 'legacy new_page → notify_new_pages' );
bbt_test_assert_eq( true, $legacy['weekly_digest'], 'legacy digest → weekly_digest' );
bbt_test_assert_eq( false, $legacy['notify_quota_warning'], 'legacy limit_warn → notify_quota_warning' );
bbt_test_assert_eq( null, $legacy['notifications'] ?? null, 'legacy notifications key removed' );

$flat_wins = SettingsSanitizer::normalize_settings( [
	'notify_new_pages' => false,
	'notifications'    => [ 'new_page' => true ],
] );
bbt_test_assert_eq( false, $flat_wins['notify_new_pages'], 'flat key wins over legacy nested' );

echo "OK: SettingsSanitizer\n";

$contents = file_get_contents( $root . '/uninstall.php' );
if ( $contents === false ) {
	fwrite( STDERR, "FAIL: could not read uninstall.php\n" );
	exit( 1 );
}

$required = [
	'bbt_license_key',
	'bbt_account_email',
	'bbt_install_hash',
	'bbt_site_fingerprint',
	'bbt_settings',
	'bbt_seo_plugin',
	'bbt_last_scan',
	'bbt_db_version',
];

foreach ( $required as $option ) {
	if ( ! str_contains( $contents, "'{$option}'" ) ) {
		fwrite( STDERR, "FAIL: uninstall.php missing option {$option}\n" );
		exit( 1 );
	}
}

echo "OK: uninstall.php lists all required options\n";
PHP
