<?php
/**
 * Plugin Name:       OpptiAI Titles
 * Plugin URI:        https://oppti.dev
 * Description:       AI-powered title tag and meta description generation for WordPress. Keeps your site's page SEO coverage climbing in the background.
 * Version:           1.0.21
 * Author:            OpptiAI
 * License:           GPL-2.0-or-later
 * Text Domain:       beepbeep-titles
 * Requires at least: 6.3
 * Requires PHP:      8.1
 */

defined( 'ABSPATH' ) || exit;

define( 'BEEPTI_VERSION', '1.0.21' );
define( 'BEEPTI_FILE',    __FILE__ );
define( 'BEEPTI_DIR',     plugin_dir_path( __FILE__ ) );
define( 'BEEPTI_URL',     plugin_dir_url( __FILE__ ) );
define( 'BEEPTI_SLUG',    'beepbeep-titles' );
define( 'BEEPTI_PLUGIN_ID', 'titles' );
define( 'BEEPTI_PLUGIN_TITLE', 'OpptiAI Titles' );

// Backend API base. Override in wp-config.php with BEEPBEEP_TITLES_API_URL
// for local/staging backends (mirrors the alt-text plugin's BEEPBEEP_AI_API_URL).
// Default matches the sibling alt-text plugin's production backend — the
// titles endpoints (/api/titles/*) are served from the same host.
define( 'BEEPTI_API_BASE',
    defined( 'BEEPBEEP_TITLES_API_URL' )
        ? rtrim( BEEPBEEP_TITLES_API_URL, '/' )
        : 'https://alttext-ai-backend.onrender.com'
);
define( 'BEEPTI_PLUGIN_CHANNEL', 'stable' );
define( 'BEEPTI_PLUGIN_ENV',
    ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ? 'development' : 'production'
);

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

register_activation_hook( __FILE__,   [ BeepBeep_Titles\Plugin::class, 'activate' ] );
register_deactivation_hook( __FILE__, [ BeepBeep_Titles\Plugin::class, 'deactivate' ] );
