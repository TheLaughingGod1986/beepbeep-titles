<?php
/**
 * Smoke check: uninstall.php lists every plugin-owned option.
 *
 * Run: php tests/php/uninstall-options.test.php
 */

$contents = file_get_contents( dirname( __DIR__, 2 ) . '/uninstall.php' );
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
