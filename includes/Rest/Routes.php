<?php
/**
 * Registers BeepBeep Titles REST routes.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Rest;

use BeepBeep_Titles\Api\Client;

defined( 'ABSPATH' ) || exit;

class Routes {

    private const NS = 'beepbeep-titles/v1';

    private readonly GenerateController $generate;
    private readonly BillingController $billing;
    private readonly PagesController $pages;

    public function __construct() {
        $client = new Client();
        $this->generate = new GenerateController( $client );
        $this->billing  = new BillingController( $client );
        $this->pages    = new PagesController( $client );
    }

    public function register(): void {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public function register_routes(): void {
        $ns = self::NS;
        $g  = $this->generate;
        $b  = $this->billing;
        $p  = $this->pages;

        // ── Generation ─────────────────────────────────────────────
        register_rest_route( $ns, '/generate', [
            'methods'             => 'POST',
            'callback'            => [ $g, 'generate' ],
            'permission_callback' => [ $this, 'require_editor' ],
            'args'                => [
                'post_id'  => [ 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ],
                'previous' => [ 'type' => 'object' ],
            ],
        ] );

        // ── Bulk jobs ──────────────────────────────────────────────
        register_rest_route( $ns, '/jobs', [
            'methods'             => 'POST',
            'callback'            => [ $g, 'submit_job' ],
            'permission_callback' => [ $this, 'require_editor' ],
            'args'                => [
                'post_ids' => [
                    'required'          => true,
                    'type'              => 'array',
                    'items'             => [ 'type' => 'integer' ],
                    'sanitize_callback' => static fn( $v ) => array_values( array_filter( array_map( 'absint', (array) $v ) ) ),
                ],
                'scope'    => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );

        register_rest_route( $ns, '/jobs/(?P<id>[A-Za-z0-9\-_]+)', [
            'methods'             => 'GET',
            'callback'            => [ $g, 'poll_job' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        // ── Quota ──────────────────────────────────────────────────
        register_rest_route( $ns, '/quota', [
            'methods'             => 'GET',
            'callback'            => [ $b, 'get_quota' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        // ── License (admin only) ───────────────────────────────────
        register_rest_route( $ns, '/license', [
            [
                'methods'             => 'POST',
                'callback'            => [ $b, 'set_license' ],
                'permission_callback' => [ $this, 'require_admin' ],
                'args'                => [
                    'license_key' => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
                ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [ $b, 'clear_license' ],
                'permission_callback' => [ $this, 'require_admin' ],
            ],
        ] );

        register_rest_route( $ns, '/auth/login', [
            'methods'             => 'POST',
            'callback'            => [ $b, 'login' ],
            'permission_callback' => [ $this, 'require_admin' ],
            'args'                => [
                'email'    => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_email' ],
                'password' => [ 'required' => true, 'type' => 'string' ],
            ],
        ] );

        // ── Billing (shared account: Pro + credit packs) ──────────
        register_rest_route( $ns, '/billing/plans', [
            'methods'             => 'GET',
            'callback'            => [ $b, 'billing_plans' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        register_rest_route( $ns, '/billing/info', [
            'methods'             => 'GET',
            'callback'            => [ $b, 'billing_info' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        register_rest_route( $ns, '/billing/checkout', [
            'methods'             => 'POST',
            'callback'            => [ $b, 'billing_checkout' ],
            'permission_callback' => [ $this, 'require_admin' ],
            'args'                => [
                'plan'     => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
                'price_id' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );

        register_rest_route( $ns, '/billing/portal', [
            'methods'             => 'POST',
            'callback'            => [ $b, 'billing_portal' ],
            'permission_callback' => [ $this, 'require_admin' ],
        ] );

        // ── Pages (read + manual edit) ─────────────────────────────
        register_rest_route( $ns, '/pages', [
            'methods'             => 'GET',
            'callback'            => [ $p, 'get_pages' ],
            'permission_callback' => [ $this, 'require_editor' ],
            'args'                => [
                'filter'   => [ 'type' => 'string', 'default' => 'needs', 'sanitize_callback' => 'sanitize_text_field' ],
                'search'   => [ 'type' => 'string', 'default' => '',      'sanitize_callback' => 'sanitize_text_field' ],
                'page'     => [ 'type' => 'integer', 'default' => 1,      'minimum' => 1 ],
                'per_page' => [ 'type' => 'integer', 'default' => 30,     'maximum' => 100 ],
            ],
        ] );

        register_rest_route( $ns, '/pages/(?P<id>\d+)', [
            [
                'methods'             => 'GET',
                'callback'            => [ $p, 'get_page' ],
                'permission_callback' => [ $this, 'require_editor' ],
            ],
            [
                'methods'             => 'PATCH',
                'callback'            => [ $p, 'update_page' ],
                'permission_callback' => [ $this, 'require_editor' ],
                'args'                => [
                    'seo_title' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
                    'meta_desc' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_textarea_field' ],
                ],
            ],
        ] );

        // ── Scan ───────────────────────────────────────────────────
        register_rest_route( $ns, '/scan', [
            'methods'             => 'POST',
            'callback'            => [ $p, 'run_scan' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        // ── Settings ───────────────────────────────────────────────
        register_rest_route( $ns, '/settings', [
            [
                'methods'             => 'GET',
                'callback'            => [ $p, 'get_settings' ],
                'permission_callback' => [ $this, 'require_editor' ],
            ],
            [
                'methods'             => 'PATCH',
                'callback'            => [ $p, 'update_settings' ],
                'permission_callback' => [ $this, 'require_admin' ],
            ],
        ] );
    }

    public function require_editor(): bool {
        return current_user_can( 'edit_posts' );
    }

    public function require_admin(): bool {
        return current_user_can( 'manage_options' );
    }
}
