<?php
/**
 * Plugin bootstrap. Loaded by beepbeep-titles.php once the PHP version check passes.
 */

defined( 'ABSPATH' ) || exit;

// PSR-4-style autoloader for BeepBeep_Titles\ namespace.
spl_autoload_register( static function ( string $class ): void {
    if ( ! str_starts_with( $class, 'BeepBeep_Titles\\' ) ) {
        return;
    }
    $rel  = str_replace( 'BeepBeep_Titles\\', '', $class );
    $file = BEEPTI_DIR . 'includes/' . str_replace( '\\', DIRECTORY_SEPARATOR, $rel ) . '.php';
    if ( is_readable( $file ) ) {
        require_once $file;
    }
} );

// Shared OptiAI\Core\ package — vendored copy, no cross-plugin dependency.
// See includes/OptiAICore/ for the shared scoring engine + scan storage this
// plugin's health dashboard is built on.
require_once BEEPTI_DIR . 'includes/OptiAICore/autoload.php';

// Tell Plugin Check to skip dev-only paths (mirrors .distignore / release zip).
add_filter( 'wp_plugin_check_ignore_directories', static function ( array $directories ): array {
    return array_merge( $directories, [ 'tests', 'scripts', '.github', '.claude', 'node_modules', 'dist' ] );
} );
add_filter( 'wp_plugin_check_ignore_files', static function ( array $files ): array {
    return array_merge( $files, [
        '.wp-env.json',
        '.eslintrc.json',
        '.gitignore',
        '.distignore',
        '.plugin-check.json',
        'docker-compose.yml',
        'README.md',
    ] );
} );

// Bootstrap on plugins_loaded so all WP APIs are available.
add_action( 'plugins_loaded', static function (): void {
    ( new BeepBeep_Titles\Plugin() )->init();
} );

register_activation_hook( BEEPTI_FILE,   [ BeepBeep_Titles\Plugin::class, 'activate' ] );
register_deactivation_hook( BEEPTI_FILE, [ BeepBeep_Titles\Plugin::class, 'deactivate' ] );
