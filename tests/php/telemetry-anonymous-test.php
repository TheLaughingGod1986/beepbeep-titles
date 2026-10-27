<?php
/**
 * Dev-only guard (1.0.30): PostHog telemetry stays anonymous. No identify or
 * alias call, no account-linking helper, no account id as distinct_id.
 * Static source checks; runs without WordPress and sends nothing.
 */
$root = dirname( __DIR__, 2 );
function ta_assert( $cond, $label ) {
	if ( ! $cond ) { fwrite( STDERR, "FAIL: {$label}\n" ); exit( 1 ); }
}
$files = [];
foreach ( [ 'includes', 'src' ] as $dir ) {
	$it = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $root . '/' . $dir, FilesystemIterator::SKIP_DOTS ) );
	foreach ( $it as $f ) {
		if ( preg_match( '/\.(php|js|jsx)$/', (string) $f ) ) { $files[ (string) $f ] = (string) file_get_contents( (string) $f ); }
	}
}
foreach ( $files as $path => $src ) {
	$rel = substr( $path, strlen( $root ) + 1 );
	ta_assert( false === strpos( $src, '$identify' ), "no \$identify event in {$rel}" );
	ta_assert( false === strpos( $src, '$create_alias' ), "no \$create_alias event in {$rel}" );
	ta_assert( ! preg_match( '/\$anon_distinct_id|posthog\.(identify|alias)\s*\(/i', $src ), "no PostHog identify/alias in {$rel}" );
	ta_assert( ! preg_match( '/Telemetry::(identify|on_account_connected|maybe_activate)\s*\(/', $src ), "no account-linking telemetry call in {$rel}" );
}
$t = $files[ $root . '/includes/Telemetry.php' ];
ta_assert( ! preg_match( '/function\s+(identify|on_account_connected|has_account_consent|maybe_activate)\s*\(/', $t ), 'Telemetry has no identify/account helpers' );
ta_assert( 1 === preg_match( "/return 'anon_' \\. \\\$id;/", $t ), 'distinct_id is the anonymous per-install id' );
preg_match_all( "/'distinct_id'\s*=>\s*([^,\n]+)/", $t, $m );
ta_assert( count( $m[1] ) > 0, 'payload has a distinct_id' );
foreach ( $m[1] as $v ) {
	ta_assert( in_array( trim( $v ), [ 'self::distinct_id()', '$distinct_id' ], true ), 'every distinct_id comes from distinct_id(): ' . trim( $v ) );
}
ta_assert( 1 === preg_match( '/\$distinct_id\s*=\s*self::distinct_id\(\);/', $t ), '$distinct_id is assigned from distinct_id()' );
ta_assert( false !== strpos( $t, "'account_id'" ), 'account_id stays on the property strip list' );
echo "OK: telemetry is anonymous (no identify/alias, no account id)\n";
