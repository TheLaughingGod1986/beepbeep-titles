<?php
/**
 * Dev-only (1.0.32 b): PHP 7.4 floor. Checks the declared minimum, that a
 * server below the floor gets an admin notice instead of a fatal error, and
 * that code rewritten away from PHP 8 syntax still behaves the same.
 * PHP 7.4 syntax; run it on the 7.4 binary as well as 8.x.
 */
define( 'ABSPATH', '/tmp/' );

function pf_assert( $cond, $label ) {
	if ( ! $cond ) {
		fwrite( STDERR, "FAIL: {$label}\n" );
		exit( 1 );
	}
}

$root   = dirname( __DIR__, 2 );
$main   = (string) file_get_contents( $root . '/beepbeep-titles.php' );
$readme = (string) file_get_contents( $root . '/readme.txt' );

pf_assert( 1 === preg_match( '/^ \* Requires PHP:\s+7\.4$/m', $main ), 'plugin header Requires PHP is 7.4' );
pf_assert( 1 === preg_match( '/^Requires PHP: 7\.4$/m', $readme ), 'readme Requires PHP is 7.4' );
pf_assert( false === strpos( $readme, 'PHP 8.1+' ), 'readme FAQ no longer says PHP 8.1+' );
$guard = strpos( $main, "version_compare( PHP_VERSION, BEEPTI_MIN_PHP, '<' )" );
$boot  = strpos( $main, "includes/bootstrap.php" );
pf_assert( false !== $guard && false !== $boot && $guard < $boot, 'version check runs before the plugin code loads' );
pf_assert( false === strpos( $main, 'static function' ) && false === strpos( $main, '): ' ), 'main file has no typed closures (parses on old PHP)' );

// --- Below the floor: notice, no fatal, plugin code not loaded. -------------
$GLOBALS['pf_actions'] = [];
function add_action( $hook, $cb ) { $GLOBALS['pf_actions'][] = [ $hook, $cb ]; }
function current_user_can( $cap ) { return true; }
function esc_html( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function __( $s, $d = null ) { return $s; }
function plugin_dir_path( $f ) { return dirname( $f ) . '/'; }
function plugin_dir_url( $f ) { return 'https://example.test/'; }

$tmp = sys_get_temp_dir() . '/beepti-floor-' . getmypid() . '.php';
file_put_contents( $tmp, str_replace( "define( 'BEEPTI_MIN_PHP', '7.4' );", "define( 'BEEPTI_MIN_PHP', '99.0' );", $main ) );
include $tmp;
unlink( $tmp );

pf_assert( ! defined( 'BEEPTI_VERSION' ), 'plugin constants not defined below the floor' );
pf_assert( ! class_exists( 'BeepBeep_Titles\\Plugin', true ), 'plugin classes not loaded below the floor' );
pf_assert( [ [ 'admin_notices', 'beepti_php_version_notice' ] ] === $GLOBALS['pf_actions'], 'only the admin notice is hooked' );
ob_start();
beepti_php_version_notice();
$notice = ob_get_clean();
pf_assert( false !== strpos( $notice, 'needs PHP 99.0 or newer' ) && false !== strpos( $notice, PHP_VERSION ), 'notice names both versions' );
echo "OK: below the PHP floor shows a notice and loads nothing\n";

// --- Rewritten PHP 8 syntax behaves the same. ------------------------------
function sanitize_text_field( $s ) { return trim( preg_replace( '/<[^>]*>/', '', (string) $s ) ); }
function sanitize_textarea_field( $s ) { return trim( (string) $s ); }
function sanitize_key( $s ) { return strtolower( preg_replace( '/[^a-z0-9_\-]/i', '', (string) $s ) ); }

require $root . '/includes/SettingsSanitizer.php';
use BeepBeep_Titles\SettingsSanitizer;
pf_assert( null === SettingsSanitizer::sanitize_value( 'tone', 'nope' ), 'invalid tone skipped' );
pf_assert( true === SettingsSanitizer::sanitize_value( 'scan_daily', '1' ), 'bool key coerced' );
pf_assert( false === SettingsSanitizer::sanitize_value( 'onboarding_complete', 'no' ), 'bool key false' );
pf_assert( 'ab' === SettingsSanitizer::sanitize_value( 'brand_name_override', ' <b>ab</b> ' ), 'text key sanitised' );
pf_assert( null === SettingsSanitizer::sanitize_value( '0', 'x' ), 'unknown key (numeric string) skipped' );
pf_assert( null === SettingsSanitizer::sanitize_value( 'notifications', 'x' ), 'notifications non-array skipped' );

require $root . '/includes/Scoring/AEO_Scoring_Engine.php';
use BeepBeep_Titles\Scoring\AEO_Scoring_Engine;
pf_assert( 'Strong' === AEO_Scoring_Engine::label_for_score( 80 ), 'AEO 80 Strong' );
pf_assert( 'Good' === AEO_Scoring_Engine::label_for_score( 55 ), 'AEO 55 Good' );
pf_assert( 'Developing' === AEO_Scoring_Engine::label_for_score( 30 ), 'AEO 30 Developing' );
pf_assert( 'Weak' === AEO_Scoring_Engine::label_for_score( 29 ), 'AEO 29 Weak' );

require $root . '/includes/Scoring/Metadata_Context.php';
$ctx = new BeepBeep_Titles\Scoring\Metadata_Context( 7, 'page', 'T', 'M', 'N', 'E', 2 );
pf_assert( 7 === $ctx->post_id && 'page' === $ctx->post_type && 'M' === $ctx->meta_description && 2 === $ctx->title_duplicate_count && 0 === $ctx->description_duplicate_count, 'Metadata_Context positional args' );

require $root . '/includes/Api/Client.php';
$ref    = new ReflectionClass( 'BeepBeep_Titles\\Api\\Client' );
$client = $ref->newInstanceWithoutConstructor();
$cfs    = $ref->getMethod( 'code_for_status' );
$cfs->setAccessible( true );
pf_assert( 'QUOTA_EXCEEDED' === $cfs->invoke( $client, 402 ) && 'API_ERROR' === $cfs->invoke( $client, 418 ), 'code_for_status map' );
$sbe = $ref->getMethod( 'status_for_backend_error' );
$sbe->setAccessible( true );
pf_assert( 409 === $sbe->invoke( $client, 200, [ 'error' => [ 'code' => 'user_exists' ] ] ), 'backend USER_EXISTS -> 409' );
pf_assert( 503 === $sbe->invoke( $client, 200, [ 'code' => 'SERVICE_UNAVAILABLE' ] ), 'backend SERVICE_UNAVAILABLE -> 503' );
pf_assert( 400 === $sbe->invoke( $client, 200, [ 'error' => 'weird' ] ), 'unknown backend code -> 400' );
pf_assert( 500 === $sbe->invoke( $client, 500, [] ), 'HTTP error status passes through' );

echo "OK: PHP 7.4 rewrites (settings, AEO label, metadata context, client status maps)\n";
