<?php
namespace BeepBeep_Titles;

use BeepBeep_Titles\Api\Client;
use BeepBeep_Titles\Seo\MetaWriter;

defined( 'ABSPATH' ) || exit;

class Admin {

    public function __construct( private readonly Plugin $plugin ) {}

    public function init(): void {
        add_action( 'admin_menu',             [ $this, 'register_menus' ] );
        add_action( 'admin_enqueue_scripts',  [ $this, 'enqueue_assets' ] );
    }

    // ----------------------------------------------------------------
    // Menu
    // ----------------------------------------------------------------

    public function register_menus(): void {
        add_menu_page(
            __( 'OpptiAI Titles', 'beepbeep-titles' ),
            __( 'OpptiAI Titles', 'beepbeep-titles' ),
            'edit_posts',
            BEEPTI_SLUG,
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
        echo '<div id="beepti-root"></div>';
    }

    // ----------------------------------------------------------------
    // Assets
    // ----------------------------------------------------------------

    public function enqueue_assets( string $hook ): void {
        if ( $hook !== 'toplevel_page_' . BEEPTI_SLUG ) {
            return;
        }

        $asset_file = BEEPTI_DIR . 'build/index.asset.php';
        $asset      = file_exists( $asset_file )
            ? require $asset_file
            : [ 'dependencies' => [], 'version' => BEEPTI_VERSION ];

        wp_enqueue_style(
            'beepti-admin',
            BEEPTI_URL . 'build/index.css',
            [],
            $asset['version']
        );

        wp_enqueue_script(
            'beepti-admin',
            BEEPTI_URL . 'build/index.js',
            $asset['dependencies'],
            $asset['version'],
            true
        );

        // Localize initial state so the React app can hydrate immediately.
        // Quota is backend-owned and fetched on mount via /quota — we only
        // seed identity, settings, and the license-connected flag here.
        global $wp_version;
        $user_id  = get_current_user_id();
        $settings = get_option( 'beepti_settings', [] );
        $settings = is_array( $settings ) ? $settings : [];
        $settings = SettingsSanitizer::normalize_settings( $settings );
        $client = new Client();
        // If another OpptiAI plugin on this site already stores a license
        // (same key works across all of them), connect with it automatically.
        $adopted = $client->adopt_shared_license();
        $alt_text_companion        = $this->get_alt_text_companion();
        $internal_linking_companion = $this->get_internal_linking_companion();

        wp_localize_script( 'beepti-admin', 'beeptiAdminData', [
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
            'version'    => BEEPTI_VERSION,
            // Admin-only billing diagnostics gating + environment display.
            'isAdmin'    => current_user_can( 'manage_options' ),
            'backendUrl' => BEEPTI_API_BASE,
            'lastScan'   => (string) get_option( 'beepti_last_scan', '' ),
            'altTextCompanion' => $alt_text_companion,
            'internalLinkingCompanion' => $internal_linking_companion,
        ] );
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    /**
     * Both companion detections below delegate to OptiAI Core's
     * Module_Registry::detect() (generalised from this method's original,
     * hand-rolled version) so every OptiAI plugin on this site is detected
     * the same way, ready for a future Hub to reuse the same call.
     */
    private function get_alt_text_companion(): array {
        $companion = \OptiAI\Core\Module_Registry::detect(
            'beepbeep-ai-alt-text-generator/beepbeep-ai-alt-text-generator.php',
            admin_url( 'admin.php?page=bbai' ),
            'OpptiAI Alt Text'
        );
        $labels = [
            'active'    => __( 'Open ALT Text', 'beepbeep-titles' ),
            'installed' => __( 'Activate ALT Text', 'beepbeep-titles' ),
            'missing'   => __( 'Install ALT Text', 'beepbeep-titles' ),
        ];
        $companion['label'] = $labels[ $companion['state'] ] ?? $companion['label'];
        return $companion;
    }

    /**
     * OpptiAI Internal Linking — a sibling module already sharing this
     * site's OptiAI credit wallet (see its own plugin description). Not yet
     * scored/optimised through OptiAI Core (it is still v0.1.0, building
     * out its own REST/account plumbing) — this is detection only, exactly
     * how the Alt Text companion started before it had its own dashboard.
     */
    private function get_internal_linking_companion(): array {
        $companion = \OptiAI\Core\Module_Registry::detect(
            'oppti-internal-linking/oppti-internal-linking.php',
            admin_url( 'admin.php?page=oppti-internal-linking' ),
            'OpptiAI Internal Linking'
        );
        $labels = [
            'active'    => __( 'Open Internal Linking', 'beepbeep-titles' ),
            'installed' => __( 'Activate Internal Linking', 'beepbeep-titles' ),
            'missing'   => __( 'Install Internal Linking', 'beepbeep-titles' ),
        ];
        $companion['label'] = $labels[ $companion['state'] ] ?? $companion['label'];
        return $companion;
    }

    private function get_menu_icon(): string {
        // Inline SVG data URI — OpptiAI lightning bolt logo.
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>';
        return 'data:image/svg+xml;base64,' . base64_encode( $svg );
    }
}
