<?php
// Stubbed regression checks; no network or WordPress installation required.
define( 'ABSPATH', __DIR__ );
$GLOBALS['options'] = [];
$GLOBALS['events'] = [];
$GLOBALS['metadata'] = [];
$GLOBALS['fail_write'] = false;
function get_option( $k, $default = false ) { return $GLOBALS['options'][$k] ?? $default; }
function add_option( $k, $value, $deprecated = '', $autoload = false ) {
    if ( array_key_exists( $k, $GLOBALS['options'] ) ) { return false; }
    $GLOBALS['options'][$k] = $value; return true;
}
function apply_filters( $name, $value, ...$args ) {
    if ( 'beepti_posthog_server_capture_enabled' === $name ) {
        $GLOBALS['events'][] = [ $args[0], $args[1] ]; return false;
    }
    return $value;
}
function wp_generate_uuid4() { return '00000000-0000-4000-8000-000000000000'; }
function sanitize_key( $v ) { return strtolower( preg_replace( '/[^a-zA-Z0-9_\-]/', '', $v ) ); }
function get_post_meta( $id, $key, $single ) { return $GLOBALS['metadata'][$id][$key] ?? ''; }
function update_post_meta( $id, $key, $v ) {
    if ( $GLOBALS['fail_write'] ) { return false; }
    $GLOBALS['metadata'][$id][$key] = $v; return true;
}
class RegressionReviewPrompt { public static function mark_first_success(): void {} }
class_alias( RegressionReviewPrompt::class, 'BeepBeep_Titles\\ReviewPrompt' );
require dirname( __DIR__, 2 ) . '/includes/Telemetry.php';
require dirname( __DIR__, 2 ) . '/includes/Seo/MetaWriter.php';
use BeepBeep_Titles\Telemetry;
use BeepBeep_Titles\Seo\MetaWriter;
function check( $ok, $label ) { if ( ! $ok ) { throw new RuntimeException( $label ); } echo "ok - $label\n"; }
Telemetry::generation_saved( [ 'generation_surface' => 'dashboard' ] );
check( [] === $GLOBALS['events'] && [] === $GLOBALS['options'], 'unset consent stores and emits nothing' );
$GLOBALS['options'][Telemetry::CONSENT_OPTION] = 'no';
Telemetry::generation_saved( [] );
check( ! isset( $GLOBALS['options']['beepti_first_successful_generation_at'] ), 'opt-out has no first-value marker' );
$GLOBALS['options'][Telemetry::CONSENT_OPTION] = 'yes';
$GLOBALS['options'][Telemetry::ACTIVATION_MARKER] = time() - 100;
foreach ( [ 'dashboard', 'bulk_generation', 'autopilot' ] as $surface ) { Telemetry::generation_saved( [ 'generation_surface' => $surface ] ); }
check( 3 === count( $GLOBALS['events'] ), 'all generation surfaces tracked' );
check( true === $GLOBALS['events'][0][1]['is_first_generation'], 'first success atomically claims marker' );
check( false === $GLOBALS['events'][1][1]['is_first_generation'] && false === $GLOBALS['events'][2][1]['is_first_generation'], 'later successes never reclaim first value' );
check( $GLOBALS['events'][0][1]['time_to_first_value_seconds'] >= 100, 'activation timing populated' );
check( ! isset( $GLOBALS['events'][1][1]['time_to_first_value_seconds'] ), 'timing belongs only to first value' );
foreach ( [ 'fallback', 'yoast', 'rank_math' ] as $provider ) {
    $GLOBALS['options']['beepti_seo_plugin'] = $provider;
    check( MetaWriter::write_verified( 1, 'Title', 'Description' ), "$provider saves and verifies" );
    check( MetaWriter::write_verified( 1, 'Title', 'Description' ), "$provider unchanged metadata is successful" );
    check( MetaWriter::write_verified( 1, '', 'Updated meta', true ), "$provider autopilot preserves existing title" );
    check( 'Title' === MetaWriter::read( 1 )['title'], "$provider title remains unchanged" );
    $GLOBALS['fail_write'] = true;
    check( ! MetaWriter::write_verified( 1, 'Changed', 'Changed description' ), "$provider failed persistence rejected" );
    $GLOBALS['fail_write'] = false;
    check( ! MetaWriter::write_verified( 1, '', 'Description' ), "$provider empty generation rejected" );
}
