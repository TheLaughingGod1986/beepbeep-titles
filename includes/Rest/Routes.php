<?php
/**
 * Registers OpptiAI Titles REST routes.
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
    private readonly SupportController $support;
    private readonly HealthController $health;

    public function __construct() {
        $client = new Client();
        $this->generate = new GenerateController( $client );
        $this->billing  = new BillingController( $client );
        $this->pages    = new PagesController( $client );
        $this->support  = new SupportController( $client );
        $this->health   = new HealthController( $client );
    }

    public function register(): void {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public function register_routes(): void {
        $ns = self::NS;
        $g  = $this->generate;
        $b  = $this->billing;
        $p  = $this->pages;
        $s  = $this->support;
        $h  = $this->health;

        // ── Health (dashboard-first score, priorities, item drill-down) ──
        register_rest_route( $ns, '/health', [
            'methods'             => 'GET',
            'callback'            => [ $h, 'get_health' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        register_rest_route( $ns, '/health/priorities', [
            'methods'             => 'GET',
            'callback'            => [ $h, 'get_priorities' ],
            'permission_callback' => [ $this, 'require_editor' ],
            'args'                => [
                'limit' => [ 'type' => 'integer', 'default' => 5, 'minimum' => 1, 'maximum' => 10 ],
            ],
        ] );

        register_rest_route( $ns, '/health/items', [
            'methods'             => 'GET',
            'callback'            => [ $h, 'get_items' ],
            'permission_callback' => [ $this, 'require_editor' ],
            'args'                => [
                'status'   => [ 'type' => 'string', 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ],
                'issue'    => [ 'type' => 'string', 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ],
                'sort'     => [ 'type' => 'string', 'default' => 'lowest-score', 'sanitize_callback' => 'sanitize_text_field' ],
                'page'     => [ 'type' => 'integer', 'default' => 1, 'minimum' => 1 ],
                'per_page' => [ 'type' => 'integer', 'default' => 20, 'maximum' => 200 ],
            ],
        ] );

        register_rest_route( $ns, '/health/scan', [
            'methods'             => 'POST',
            'callback'            => [ $h, 'run_scan' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        // ── Generation ─────────────────────────────────────────────
        register_rest_route( $ns, '/generate', [
            'methods'             => 'POST',
            'callback'            => [ $g, 'generate' ],
            'permission_callback' => [ $this, 'can_edit_requested_post' ],
            'args'                => [
                'post_id'  => [ 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ],
                'previous' => [ 'type' => 'object' ],
            ],
        ] );

        // ── Bulk jobs ──────────────────────────────────────────────
        register_rest_route( $ns, '/jobs', [
            'methods'             => 'POST',
            'callback'            => [ $g, 'submit_job' ],
            'permission_callback' => [ $this, 'can_edit_requested_posts' ],
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
            'permission_callback' => [ $this, 'can_poll_job' ],
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

        register_rest_route( $ns, '/auth/register', [
            'methods'             => 'POST',
            'callback'            => [ $b, 'register' ],
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

        // Account-level billing/subscription details (Stripe customer &
        // subscription IDs, plan status). Restricted to administrators.
        register_rest_route( $ns, '/billing/info', [
            'methods'             => 'GET',
            'callback'            => [ $b, 'billing_info' ],
            'permission_callback' => [ $this, 'require_admin' ],
        ] );

        // Admin-only billing diagnostics probe (booleans only).
        register_rest_route( $ns, '/billing/health', [
            'methods'             => 'GET',
            'callback'            => [ $b, 'billing_health' ],
            'permission_callback' => [ $this, 'require_admin' ],
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
            'permission_callback' => [ $this, 'can_list_pages' ],
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
                'permission_callback' => [ $this, 'can_edit_route_post' ],
            ],
            [
                'methods'             => 'PATCH',
                'callback'            => [ $p, 'update_page' ],
                'permission_callback' => [ $this, 'can_edit_route_post' ],
                'args'                => [
                    'seo_title' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
                    'meta_desc' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_textarea_field' ],
                ],
            ],
        ] );

        // ── Activity (recent improvements) ─────────────────────────
        register_rest_route( $ns, '/activity', [
            'methods'             => 'GET',
            'callback'            => [ $p, 'get_activity' ],
            'permission_callback' => [ $this, 'can_read_activity' ],
            'args'                => [
                'limit' => [ 'type' => 'integer', 'default' => 8, 'minimum' => 1, 'maximum' => 30 ],
            ],
        ] );

        // ── Scan ───────────────────────────────────────────────────
        register_rest_route( $ns, '/scan', [
            'methods'             => 'POST',
            'callback'            => [ $p, 'run_scan' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        // ── Support (contact form) ─────────────────────────────────
        register_rest_route( $ns, '/support/contact', [
            'methods'             => 'POST',
            'callback'            => [ $s, 'contact' ],
            'permission_callback' => [ $this, 'require_admin' ],
            'args'                => [
                'name'    => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
                'email'   => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_email' ],
                'message' => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_textarea_field' ],
            ],
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

    public function can_list_pages(): bool {
        // The handler filters every returned post with current_user_can( 'edit_post', $post_id ).
        return current_user_can( 'edit_posts' );
    }

    public function can_read_activity(): bool {
        // The handler filters every returned activity item by edit_post for its post_id.
        return current_user_can( 'edit_posts' );
    }

    public function can_edit_requested_post( \WP_REST_Request $request ): bool {
        return current_user_can( 'edit_post', absint( $request->get_param( 'post_id' ) ) );
    }

    public function can_edit_requested_posts( \WP_REST_Request $request ): bool {
        $post_ids = array_values( array_filter( array_map( 'absint', (array) $request->get_param( 'post_ids' ) ) ) );
        if ( empty( $post_ids ) || ! current_user_can( 'edit_posts' ) ) {
            return false;
        }

        foreach ( $post_ids as $post_id ) {
            if ( ! current_user_can( 'edit_post', $post_id ) ) {
                return false;
            }
        }

        return true;
    }

    public function can_edit_route_post( \WP_REST_Request $request ): bool {
        return current_user_can( 'edit_post', absint( $request['id'] ) );
    }

    public function can_poll_job( \WP_REST_Request $request ): bool {
        $job_id = preg_replace( '/[^A-Za-z0-9\-_]/', '', (string) $request['id'] );
        if ( $job_id === '' || ! current_user_can( 'edit_posts' ) ) {
            return false;
        }

        $post_ids = get_transient( 'beepti_job_' . $job_id );
        if ( ! is_array( $post_ids ) || empty( $post_ids ) ) {
            return false;
        }

        foreach ( array_map( 'absint', $post_ids ) as $post_id ) {
            if ( $post_id <= 0 || ! current_user_can( 'edit_post', $post_id ) ) {
                return false;
            }
        }

        return true;
    }
}
