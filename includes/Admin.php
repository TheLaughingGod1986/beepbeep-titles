<?php
namespace BeepBeep_Titles;

use BeepBeep_Titles\Api\Client;
use BeepBeep_Titles\Seo\MetaWriter;

class Admin {

    public function __construct( private readonly Plugin $plugin ) {}

    public function init(): void {
        add_action( 'admin_menu',             [ $this, 'register_menus' ] );
        add_action( 'admin_enqueue_scripts',  [ $this, 'enqueue_assets' ] );
        add_action( 'admin_head',             [ $this, 'inject_head_styles' ] );
    }

    // ----------------------------------------------------------------
    // Menu
    // ----------------------------------------------------------------

    public function register_menus(): void {
        add_menu_page(
            __( 'BeepBeep Titles', 'beepbeep-titles' ),
            __( 'BB Titles', 'beepbeep-titles' ),
            'edit_posts',
            BBT_SLUG,
            [ $this, 'render_page' ],
            $this->get_menu_icon(),
            30
        );
    }

    public function render_page(): void {
        // The React app mounts here. Negative margin makes the chrome
        // full-bleed against WP's #wpcontent/.wrap padding (≈10px top, 20px
        // left) so the sticky tab bar sits flush under the WP admin bar with
        // no white gap. The earlier content-overlap issue was a duplicate
        // in-page header (since removed), not this offset.
        echo '<div id="bbt-root" style="margin:0 -20px 0;min-height:calc(100vh - 32px);"></div>';
    }

    // ----------------------------------------------------------------
    // Assets
    // ----------------------------------------------------------------

    public function enqueue_assets( string $hook ): void {
        if ( $hook !== 'toplevel_page_' . BBT_SLUG ) {
            return;
        }

        // Google Fonts — Geist (sans + mono). Loaded here so it works
        // inside wp-admin without a separate <head> injection.
        wp_enqueue_style(
            'beepbeep-titles-fonts',
            'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap',
            [],
            null
        );

        $asset_file = BBT_DIR . 'build/index.asset.php';
        $asset      = file_exists( $asset_file )
            ? require $asset_file
            : [ 'dependencies' => [], 'version' => BBT_VERSION ];

        wp_enqueue_style(
            'beepbeep-titles',
            BBT_URL . 'build/index.css',
            [ 'beepbeep-titles-fonts' ],
            $asset['version']
        );

        wp_enqueue_script(
            'beepbeep-titles',
            BBT_URL . 'build/index.js',
            $asset['dependencies'],
            $asset['version'],
            true
        );

        // Localize initial state so the React app can hydrate immediately.
        // Quota is backend-owned and fetched on mount via /quota — we only
        // seed identity, settings, and the license-connected flag here.
        global $wp_version;
        $user_id  = get_current_user_id();
        $settings = get_option( 'bbt_settings', [] );
        $settings = is_array( $settings ) ? $settings : [];
        $settings = SettingsSanitizer::normalize_settings( $settings );
        $client = new Client();
        // If another BeepBeep plugin on this site already stores a license
        // (same key works across all of them), connect with it automatically.
        $adopted = $client->adopt_shared_license();

        wp_localize_script( 'beepbeep-titles', 'bbtData', [
            'nonce'      => wp_create_nonce( 'wp_rest' ),
            'apiBase'    => get_rest_url( null, 'beepbeep-titles/v1' ),
            'siteUrl'    => get_site_url(),
            'user'       => [
                'id'    => $user_id,
                'name'  => wp_get_current_user()->display_name,
                'email' => wp_get_current_user()->user_email,
            ],
            'accountEmail' => $client->get_account_email(),
            'connected'  => $client->has_license(),
            'licenseAdopted' => $adopted,
            'seoPlugin'  => MetaWriter::active(),
            'settings'   => $settings,
            'wpVersion'  => (string) $wp_version,
            'phpVersion' => PHP_VERSION,
            'version'    => BBT_VERSION,
        ] );
    }

    // ----------------------------------------------------------------
    // Head styles — override WP admin defaults on our page only.
    // ----------------------------------------------------------------

    public function inject_head_styles(): void {
        $screen = get_current_screen();
        if ( ! $screen || $screen->id !== 'toplevel_page_' . BBT_SLUG ) {
            return;
        }
        ?>
        <style>
            /* Let our app control its own background + spacing */
            #wpwrap, #wpcontent { background: #F6F8FB; }
            #wpbody-content, #wpbody-content .wrap { overflow-x: hidden; }
            /* Zero WP's default top content spacing so the sticky tab bar sits
               flush under the admin bar with no white gap. (Horizontal full-bleed
               is handled by #bbt-root's -20px side margins, so leave #wpcontent
               padding-left intact.) */
            #wpbody { padding-top: 0 !important; }
            #wpbody-content { padding-top: 0 !important; padding-bottom: 0 !important; }
            #wpbody-content .wrap { margin: 0 !important; padding: 0 !important; }
            #bbt-root { font-family: "Geist", "Helvetica Neue", system-ui, sans-serif; max-width: 100%; overflow-x: hidden; }
            /* Keep WP admin bar + sidebar unchanged */
        </style>
        <?php
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    private function get_menu_icon(): string {
        // Inline SVG data URI — BeepBeep lightning bolt logo.
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>';
        return 'data:image/svg+xml;base64,' . base64_encode( $svg );
    }
}
