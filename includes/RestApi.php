<?php
/**
 * WP REST proxy for BeepBeep Titles.
 *
 * Exposes /wp-json/beepbeep-titles/v1/* endpoints that forward to the
 * BeepBeep backend with the license + identity headers injected server-side,
 * and persist returned copy into the active SEO plugin. The license key never
 * reaches JS; the browser authenticates with the WP REST nonce.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

use BeepBeep_Titles\Api\Client;
use BeepBeep_Titles\Seo\MetaWriter;

defined( 'ABSPATH' ) || exit;

class RestApi {

    private const NS = 'beepbeep-titles/v1';

    private Client $client;

    public function __construct( private readonly Plugin $plugin ) {
        $this->client = new Client();
    }

    public function init(): void {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public function register_routes(): void {
        $ns = self::NS;

        // ── Generation ─────────────────────────────────────────────
        register_rest_route( $ns, '/generate', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'generate' ],
            'permission_callback' => [ $this, 'require_editor' ],
            'args'                => [
                'post_id'  => [ 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ],
                'previous' => [ 'type' => 'object' ],
            ],
        ] );

        // ── Bulk jobs ──────────────────────────────────────────────
        register_rest_route( $ns, '/jobs', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'submit_job' ],
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
            'callback'            => [ $this, 'poll_job' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        // ── Quota ──────────────────────────────────────────────────
        register_rest_route( $ns, '/quota', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_quota' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        // ── License (admin only) ───────────────────────────────────
        register_rest_route( $ns, '/license', [
            [
                'methods'             => 'POST',
                'callback'            => [ $this, 'set_license' ],
                'permission_callback' => [ $this, 'require_admin' ],
                'args'                => [
                    'license_key' => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
                ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [ $this, 'clear_license' ],
                'permission_callback' => [ $this, 'require_admin' ],
            ],
        ] );

        // ── Billing (shared account: Pro + credit packs) ──────────
        register_rest_route( $ns, '/billing/plans', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'billing_plans' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        register_rest_route( $ns, '/billing/info', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'billing_info' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        register_rest_route( $ns, '/billing/checkout', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'billing_checkout' ],
            'permission_callback' => [ $this, 'require_admin' ],
            'args'                => [
                'plan'     => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
                'price_id' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );

        register_rest_route( $ns, '/billing/portal', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'billing_portal' ],
            'permission_callback' => [ $this, 'require_admin' ],
        ] );

        // ── Pages (read + manual edit) ─────────────────────────────
        register_rest_route( $ns, '/pages', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_pages' ],
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
                'callback'            => [ $this, 'get_page' ],
                'permission_callback' => [ $this, 'require_editor' ],
            ],
            [
                'methods'             => 'PATCH',
                'callback'            => [ $this, 'update_page' ],
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
            'callback'            => [ $this, 'run_scan' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        // ── Settings ───────────────────────────────────────────────
        register_rest_route( $ns, '/settings', [
            [
                'methods'             => 'GET',
                'callback'            => [ $this, 'get_settings' ],
                'permission_callback' => [ $this, 'require_editor' ],
            ],
            [
                'methods'             => 'PATCH',
                'callback'            => [ $this, 'update_settings' ],
                'permission_callback' => [ $this, 'require_admin' ],
            ],
        ] );
    }

    // ----------------------------------------------------------------
    // Generation
    // ----------------------------------------------------------------

    public function generate( \WP_REST_Request $req ): \WP_REST_Response {
        $post = get_post( (int) $req->get_param( 'post_id' ) );
        if ( ! $post ) {
            return new \WP_REST_Response( [ 'success' => false, 'code' => 'INVALID_REQUEST', 'message' => __( 'Page not found.', 'beepbeep-titles' ) ], 400 );
        }

        $previous = $req->get_param( 'previous' );
        $previous = $this->sanitize_previous( $previous );

        $result = $this->client->generate(
            $this->page_envelope( $post ),
            $this->generation_options(),
            $previous
        );

        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        // Persist into the active SEO plugin.
        $title = (string) ( $result['title'] ?? '' );
        $meta  = (string) ( $result['meta'] ?? '' );
        MetaWriter::write( $post->ID, $title, $meta );
        $this->bust_stats();

        $result['wp_post_id'] = $post->ID;
        return new \WP_REST_Response( $result, 200 );
    }

    // ----------------------------------------------------------------
    // Bulk jobs
    // ----------------------------------------------------------------

    public function submit_job( \WP_REST_Request $req ): \WP_REST_Response {
        $post_ids = (array) $req->get_param( 'post_ids' );
        $post_ids = array_slice( $post_ids, 0, 100 );

        $pages   = [];
        $ordered = [];
        foreach ( $post_ids as $post_id ) {
            $post = get_post( $post_id );
            if ( ! $post ) {
                continue;
            }
            $envelope       = $this->page_envelope( $post );
            $envelope['id'] = (string) $post->ID; // client ref echoed back in poll items
            $pages[]        = $envelope;
            $ordered[]      = $post->ID;
        }

        if ( empty( $pages ) ) {
            return new \WP_REST_Response( [ 'success' => false, 'code' => 'INVALID_REQUEST', 'message' => __( 'No valid pages to generate.', 'beepbeep-titles' ) ], 400 );
        }

        $scope   = $req->get_param( 'scope' );
        $context = $scope ? [ 'scope' => sanitize_text_field( $scope ) ] : [];

        $result = $this->client->submit_job( $pages, $this->generation_options(), $context );
        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        $job_id = (string) ( $result['jobId'] ?? '' );
        if ( $job_id !== '' ) {
            // Cache ordered post ids so we can map poll items back even if the
            // backend assigns its own item ids.
            set_transient( 'bbt_job_' . $job_id, $ordered, HOUR_IN_SECONDS );
        }

        return new \WP_REST_Response( $result, 200 );
    }

    public function poll_job( \WP_REST_Request $req ): \WP_REST_Response {
        $job_id  = (string) $req['id'];
        $result  = $this->client->poll_job( $job_id );
        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        $ordered = get_transient( 'bbt_job_' . $job_id );
        $ordered = is_array( $ordered ) ? $ordered : [];
        $items   = isset( $result['items'] ) && is_array( $result['items'] ) ? $result['items'] : [];
        $wrote   = false;

        foreach ( $items as $i => &$item ) {
            $post_id = $this->resolve_item_post_id( $item, $ordered, $i );
            if ( $post_id > 0 ) {
                $item['wp_post_id'] = $post_id;
                $post               = get_post( $post_id );
                if ( $post ) {
                    $item['url']     = $this->permalink_path( $post );
                    $item['section'] = $this->section_for( $post );
                }

                if ( ( $item['status'] ?? '' ) === 'completed' ) {
                    MetaWriter::write( $post_id, (string) ( $item['title'] ?? '' ), (string) ( $item['meta'] ?? '' ) );
                    $wrote = true;
                }
            }
        }
        unset( $item );

        $result['items'] = $items;

        if ( $wrote ) {
            $this->bust_stats();
        }

        // Clean up the mapping once the job is terminal.
        if ( in_array( $result['status'] ?? '', [ 'completed', 'failed' ], true ) ) {
            delete_transient( 'bbt_job_' . $job_id );
        }

        return new \WP_REST_Response( $result, 200 );
    }

    // ----------------------------------------------------------------
    // Quota + license
    // ----------------------------------------------------------------

    public function get_quota( \WP_REST_Request $req ): \WP_REST_Response {
        if ( ! $this->client->has_license() ) {
            return new \WP_REST_Response( [ 'success' => false, 'code' => 'INVALID_LICENSE', 'connected' => false ], 200 );
        }
        $result = $this->client->quota();
        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }
        $result['connected']     = true;
        $result['account_email'] = $this->client->get_account_email();
        return new \WP_REST_Response( $result, 200 );
    }

    public function set_license( \WP_REST_Request $req ): \WP_REST_Response {
        $key = (string) $req->get_param( 'license_key' );
        $this->client->set_license_key( $key );

        // Validate by reading quota; on failure, roll the key back out.
        $result = $this->client->quota();
        if ( is_wp_error( $result ) ) {
            $this->client->clear_license_key();
            return $this->error_response( $result );
        }

        $result['connected']     = true;
        $result['license_last4'] = substr( $key, -4 );
        $result['account_email'] = $this->client->refresh_account_email();
        return new \WP_REST_Response( $result, 200 );
    }

    public function clear_license( \WP_REST_Request $req ): \WP_REST_Response {
        $this->client->clear_license_key();
        return new \WP_REST_Response( [ 'success' => true, 'connected' => false ], 200 );
    }

    // ----------------------------------------------------------------
    // Billing — proxies the shared account's checkout/portal. A Pro upgrade
    // or credit pack purchased here lands on the same account/wallet every
    // BeepBeep plugin shares.
    // ----------------------------------------------------------------

    public function billing_plans( \WP_REST_Request $req ): \WP_REST_Response {
        $result = $this->client->billing_plans();
        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }
        return new \WP_REST_Response( $result, 200 );
    }

    public function billing_info( \WP_REST_Request $req ): \WP_REST_Response {
        $result = $this->client->billing_info();
        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }
        return new \WP_REST_Response( $result, 200 );
    }

    public function billing_checkout( \WP_REST_Request $req ): \WP_REST_Response {
        $price_id = (string) $req->get_param( 'price_id' );
        $plan     = (string) $req->get_param( 'plan' );

        // Resolve a plan key ('pro' | 'agency' | 'credits') to its Stripe price.
        if ( $price_id === '' && $plan !== '' ) {
            $plans = $this->client->billing_plans();
            if ( is_wp_error( $plans ) ) {
                return $this->error_response( $plans );
            }
            $price_id = $this->resolve_price_id( $plans, $plan );
        }

        if ( $price_id === '' ) {
            return new \WP_REST_Response( [ 'success' => false, 'code' => 'INVALID_REQUEST', 'message' => __( 'No plan or price selected.', 'beepbeep-titles' ) ], 400 );
        }

        $base    = admin_url( 'admin.php?page=' . BBT_SLUG );
        $success = add_query_arg( 'bbt_billing', 'success',   $base );
        $cancel  = add_query_arg( 'bbt_billing', 'cancelled', $base );

        $result = $this->client->create_checkout( $price_id, $success, $cancel );
        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }
        return new \WP_REST_Response( $result, 200 );
    }

    public function billing_portal( \WP_REST_Request $req ): \WP_REST_Response {
        $return = admin_url( 'admin.php?page=' . BBT_SLUG );
        $result = $this->client->billing_portal( $return );
        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }
        return new \WP_REST_Response( $result, 200 );
    }

    /** Map a plan key to its Stripe price id from the backend /plans payload. */
    private function resolve_price_id( array $plans, string $plan ): string {
        if ( isset( $plans['priceIds'][ $plan ] ) && is_string( $plans['priceIds'][ $plan ] ) ) {
            return $plans['priceIds'][ $plan ];
        }
        foreach ( (array) ( $plans['plans'] ?? [] ) as $p ) {
            if ( ( $p['id'] ?? '' ) === $plan && ! empty( $p['priceId'] ) ) {
                return (string) $p['priceId'];
            }
        }
        return '';
    }

    // ----------------------------------------------------------------
    // Pages (Scanner-backed)
    // ----------------------------------------------------------------

    public function get_pages( \WP_REST_Request $req ): \WP_REST_Response {
        $scanner = new Scanner();
        $result  = $scanner->get_pages(
            $req->get_param( 'filter' ),
            $req->get_param( 'search' ),
            (int) $req->get_param( 'page' ),
            (int) $req->get_param( 'per_page' )
        );

        $stats = $scanner->get_stats();
        return new \WP_REST_Response( [
            'pages'           => $result['items'],
            'total'           => $result['total'],
            'total_optimised' => $stats['optimised'] ?? 0,
            'stats'           => $stats,
        ] );
    }

    public function get_page( \WP_REST_Request $req ): \WP_REST_Response|\WP_Error {
        $post = get_post( (int) $req['id'] );
        if ( ! $post || $post->post_status !== 'publish' ) {
            return new \WP_Error( 'not_found', __( 'Page not found.', 'beepbeep-titles' ), [ 'status' => 404 ] );
        }
        return new \WP_REST_Response( ( new Scanner() )->format_post( $post ) );
    }

    public function update_page( \WP_REST_Request $req ): \WP_REST_Response|\WP_Error {
        $post = get_post( (int) $req['id'] );
        if ( ! $post || $post->post_status !== 'publish' ) {
            return new \WP_Error( 'not_found', __( 'Page not found.', 'beepbeep-titles' ), [ 'status' => 404 ] );
        }

        $title = $req->get_param( 'seo_title' );
        $meta  = $req->get_param( 'meta_desc' );

        if ( null !== $title || null !== $meta ) {
            MetaWriter::write( $post->ID, (string) $title, (string) $meta );
            $this->bust_stats();
        }

        return new \WP_REST_Response( ( new Scanner() )->format_post( get_post( $post->ID ) ) );
    }

    public function run_scan( \WP_REST_Request $req ): \WP_REST_Response {
        return new \WP_REST_Response( ( new Scanner() )->scan_and_cache() );
    }

    // ----------------------------------------------------------------
    // Settings
    // ----------------------------------------------------------------

    public function get_settings( \WP_REST_Request $req ): \WP_REST_Response {
        $settings              = get_option( 'bbt_settings', [] );
        $settings              = is_array( $settings ) ? $settings : [];
        $settings['seo_plugin'] = MetaWriter::active();
        $settings['connected']  = $this->client->has_license();
        return new \WP_REST_Response( $settings );
    }

    public function update_settings( \WP_REST_Request $req ): \WP_REST_Response {
        $current  = get_option( 'bbt_settings', [] );
        $current  = is_array( $current ) ? $current : [];
        $allowed  = [ 'tone', 'title_length', 'meta_length', 'auto_generate', 'custom_instructions', 'brand_name_override', 'notifications', 'scan_daily', 'weekly_digest', 'notify_new_pages', 'notify_quota_warning', 'delete_on_uninstall' ];
        $incoming = $req->get_json_params() ?? [];

        foreach ( $allowed as $key ) {
            if ( array_key_exists( $key, $incoming ) ) {
                $current[ $key ] = $incoming[ $key ];
            }
        }

        update_option( 'bbt_settings', $current );
        return new \WP_REST_Response( $current );
    }

    // ----------------------------------------------------------------
    // Permission callbacks
    // ----------------------------------------------------------------

    public function require_editor(): bool {
        return current_user_can( 'edit_posts' );
    }

    public function require_admin(): bool {
        return current_user_can( 'manage_options' );
    }

    // ----------------------------------------------------------------
    // Shared helpers
    // ----------------------------------------------------------------

    /** Build the backend `page` envelope from a post. */
    private function page_envelope( \WP_Post $post ): array {
        $current = MetaWriter::read( $post->ID );
        $excerpt = wp_strip_all_tags( strip_shortcodes( $post->post_content ) );
        $excerpt = trim( preg_replace( '/\s+/', ' ', $excerpt ) );

        return [
            'url'             => $this->permalink_path( $post ),
            'section'         => $this->section_for( $post ),
            'h1'              => $post->post_title,
            'current_title'   => $current['title'] !== '' ? $current['title'] : null,
            'current_meta'    => $current['meta'] !== '' ? $current['meta'] : null,
            'content_excerpt' => function_exists( 'mb_substr' ) ? mb_substr( $excerpt, 0, 4000 ) : substr( $excerpt, 0, 4000 ),
        ];
    }

    /** Options block shared by single + bulk generation. */
    private function generation_options(): array {
        $settings = get_option( 'bbt_settings', [] );
        $settings = is_array( $settings ) ? $settings : [];

        $brand = ! empty( $settings['brand_name_override'] )
            ? (string) $settings['brand_name_override']
            : get_bloginfo( 'name' );

        $options = [ 'brand_name' => $brand ];

        if ( ! empty( $settings['tone'] ) ) {
            $options['tone'] = (string) $settings['tone'];
        }

        $title_max = [ 'compact' => 50, 'standard' => 60, 'rich' => 65 ];
        $meta_max  = [ 'brief' => 130, 'standard' => 160, 'detailed' => 170 ];
        if ( isset( $settings['title_length'], $title_max[ $settings['title_length'] ] ) ) {
            $options['title_max_chars'] = $title_max[ $settings['title_length'] ];
        }
        if ( isset( $settings['meta_length'], $meta_max[ $settings['meta_length'] ] ) ) {
            $options['meta_max_chars'] = $meta_max[ $settings['meta_length'] ];
        }

        return $options;
    }

    private function sanitize_previous( $previous ): ?array {
        if ( ! is_array( $previous ) ) {
            return null;
        }
        $title = isset( $previous['title'] ) ? sanitize_text_field( (string) $previous['title'] ) : '';
        $meta  = isset( $previous['meta'] ) ? sanitize_textarea_field( (string) $previous['meta'] ) : '';
        if ( $title === '' && $meta === '' ) {
            return null;
        }
        return [ 'title' => $title, 'meta' => $meta ];
    }

    /** Map a poll item to a WP post id: prefer the echoed client id, else order. */
    private function resolve_item_post_id( array $item, array $ordered, int $index ): int {
        $id = $item['id'] ?? null;
        if ( is_numeric( $id ) && in_array( (int) $id, $ordered, true ) ) {
            return (int) $id;
        }
        return $ordered[ $index ] ?? 0;
    }

    private function permalink_path( \WP_Post $post ): string {
        return '/' . ltrim( (string) wp_parse_url( (string) get_permalink( $post->ID ), PHP_URL_PATH ), '/' );
    }

    private function section_for( \WP_Post $post ): string {
        switch ( $post->post_type ) {
            case 'page':
                return 'Pages';
            case 'product':
                return 'Shop';
            default:
                $cats = get_the_category( $post->ID );
                return $cats ? $cats[0]->name : 'Blog';
        }
    }

    private function bust_stats(): void {
        delete_transient( 'bbt_stats' );
    }

    /**
     * Translate a Client WP_Error into a flat JSON response the JS can read
     * uniformly: { success:false, code, message, entitlement_state? }.
     */
    private function error_response( \WP_Error $error ): \WP_REST_Response {
        $data    = $error->get_error_data();
        $data    = is_array( $data ) ? $data : [];
        $status  = (int) ( $data['status'] ?? 500 );
        $code    = (string) ( $data['code'] ?? 'API_ERROR' );

        $body = [
            'success' => false,
            'code'    => $code,
            'message' => $error->get_error_message(),
        ];
        if ( isset( $data['entitlement_state'] ) ) {
            $body['entitlement_state'] = $data['entitlement_state'];
        }

        return new \WP_REST_Response( $body, $status );
    }
}
