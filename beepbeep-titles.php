<?php
/**
 * Plugin Name:       BeepBeep Titles
 * Plugin URI:        https://beepbeep.ai
 * Description:       AI-powered title tag and meta description generation for WordPress. Keeps your site's page SEO coverage climbing in the background.
 * Version:           1.0.0
 * Author:            BeepBeep AI
 * License:           GPL-2.0-or-later
 * Text Domain:       beepbeep-titles
 * Requires at least: 6.3
 * Requires PHP:      8.1
 */

defined( 'ABSPATH' ) || exit;

define( 'BBT_VERSION', '1.0.0' );
define( 'BBT_FILE',    __FILE__ );
define( 'BBT_DIR',     plugin_dir_path( __FILE__ ) );
define( 'BBT_URL',     plugin_dir_url( __FILE__ ) );
define( 'BBT_SLUG',    'beepbeep-titles' );

// PSR-4-style autoloader for BeepBeep_Titles\ namespace.
spl_autoload_register( static function ( string $class ): void {
    if ( ! str_starts_with( $class, 'BeepBeep_Titles\\' ) ) {
        return;
    }
    $rel  = str_replace( 'BeepBeep_Titles\\', '', $class );
    $file = BBT_DIR . 'includes/' . str_replace( '\\', DIRECTORY_SEPARATOR, $rel ) . '.php';
    if ( is_readable( $file ) ) {
        require_once $file;
    }
} );

// Bootstrap on plugins_loaded so all WP APIs are available.
add_action( 'plugins_loaded', static function (): void {
    ( new BeepBeep_Titles\Plugin() )->init();
} );

register_activation_hook( __FILE__,   [ BeepBeep_Titles\Plugin::class, 'activate' ] );
register_deactivation_hook( __FILE__, [ BeepBeep_Titles\Plugin::class, 'deactivate' ] );
