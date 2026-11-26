<?php
/**
 * Plugin Name:       OpptiAI Titles – AI SEO Titles and Meta Descriptions
 * Plugin URI:        https://oppti.dev
 * Description:       AI-powered title tag and meta description generation for WordPress. Keeps your site's page SEO coverage climbing in the background.
 * Version:           1.0.32
 * Author:            OpptiAI
 * Author URI:        https://oppti.dev
 * License:           GPL-2.0-or-later
 * Text Domain:       beepbeep-titles
 * Requires at least: 6.3
 * Requires PHP:      7.4
 */

defined( 'ABSPATH' ) || exit;

// Minimum PHP version. This file only uses syntax every PHP version
// WordPress supports can parse, so an older server gets a notice instead of
// a fatal error. The plugin code itself loads only when the floor is met.
define( 'BEEPTI_MIN_PHP', '7.4' );

if ( version_compare( PHP_VERSION, BEEPTI_MIN_PHP, '<' ) ) {
    if ( ! function_exists( 'beepti_php_version_notice' ) ) {
        /**
         * Admin notice shown when the server PHP version is below the floor.
         */
        function beepti_php_version_notice() {
            if ( ! current_user_can( 'activate_plugins' ) ) {
                return;
            }
            echo '<div class="notice notice-error"><p>' . esc_html(
                sprintf(
                    /* translators: 1: required PHP version, 2: current PHP version. */
                    __( 'OpptiAI Titles needs PHP %1$s or newer. This site runs PHP %2$s, so the plugin is paused. Ask your host to update PHP.', 'beepbeep-titles' ),
                    BEEPTI_MIN_PHP,
                    PHP_VERSION
                )
            ) . '</p></div>';
        }
    }
    add_action( 'admin_notices', 'beepti_php_version_notice' );
    return;
}

define( 'BEEPTI_VERSION', '1.0.32' );
define( 'BEEPTI_FILE',    __FILE__ );
define( 'BEEPTI_DIR',     plugin_dir_path( __FILE__ ) );
define( 'BEEPTI_URL',     plugin_dir_url( __FILE__ ) );
define( 'BEEPTI_SLUG',    'beepbeep-titles' );
define( 'BEEPTI_PLUGIN_ID', 'titles' );
define( 'BEEPTI_PLUGIN_TITLE', 'OpptiAI Titles' );

// Support inbox for the Settings contact form. Override in wp-config.php, or
// filter with 'beepti_contact_support_recipient' (mirrors Alt Text's BBAI_SUPPORT_EMAIL).
if ( ! defined( 'BEEPTI_SUPPORT_EMAIL' ) ) {
    define( 'BEEPTI_SUPPORT_EMAIL', 'support@oppti.dev' );
}

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

// Everything below needs PHP 7.4+, so it lives in its own file.
require_once BEEPTI_DIR . 'includes/bootstrap.php';
