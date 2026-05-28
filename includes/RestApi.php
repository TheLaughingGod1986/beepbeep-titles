<?php
namespace BeepBeep_Titles;

class RestApi {

    private const NS = 'beepbeep-titles/v1';

    public function __construct( private readonly Plugin $plugin ) {}

    public function init(): void {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public function register_routes(): void {
        $ns = self::NS;

        // Pages (read)
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

        // Single page (read + update)
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

        // Batch generate
        register_rest_route( $ns, '/generate', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'generate' ],
            'permission_callback' => [ $this, 'require_editor' ],
            'args'                => [
                'page_ids' => [
                    'required'          => true,
                    'type'              => 'array',
                    'items'             => [ 'type' => 'integer' ],
                    'sanitize_callback' => static fn( $v ) => array_map( 'absint', (array) $v ),
                ],
            ],
        ] );

        // Quota (read)
        register_rest_route( $ns, '/quota', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_quota' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        // Scan
        register_rest_route( $ns, '/scan', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'run_scan' ],
            'permission_callback' => [ $this, 'require_editor' ],
        ] );

        // Settings (read + write)
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
    // Handlers
    // ----------------------------------------------------------------

    public function get_pages( \WP_REST_Request $req ): \WP_REST_Response {
        $scanner = new Scanner();
        $result  = $scanner->get_pages(
            $req->get_param( 'filter' ),
            $req->get_param( 'search' ),
            (int) $req->get_param( 'page' ),
            (int) $req->get_param( 'per_page' )
        );

        return new \WP_REST_Response( [
            'pages' => $result['items'],
            'total' => $result['total'],
            'stats' => $scanner->get_stats(),
        ] );
    }

    public function get_page( \WP_REST_Request $req ): \WP_REST_Response|\WP_Error {
        $post = get_post( (int) $req['id'] );
        if ( ! $post || $post->post_status !== 'publish' ) {
            return new \WP_Error( 'not_found', __( 'Page not found.', 'beepbeep-titles' ), [ 'status' => 404 ] );
        }
        return new \WP_REST_Response( $this->format_post( $post ) );
    }

    public function update_page( \WP_REST_Request $req ): \WP_REST_Response|\WP_Error {
        $post = get_post( (int) $req['id'] );
        if ( ! $post || $post->post_status !== 'publish' ) {
            return new \WP_Error( 'not_found', __( 'Page not found.', 'beepbeep-titles' ), [ 'status' => 404 ] );
        }

        $updated = false;
        if ( null !== $req->get_param( 'seo_title' ) ) {
            update_post_meta( $post->ID, '_bbt_seo_title', $req->get_param( 'seo_title' ) );
            $updated = true;
        }
        if ( null !== $req->get_param( 'meta_desc' ) ) {
            update_post_meta( $post->ID, '_bbt_meta_description', $req->get_param( 'meta_desc' ) );
            $updated = true;
        }

        if ( $updated ) {
            $this->plugin->log_usage( get_current_user_id(), $post->ID, 'edit' );
        }

        return new \WP_REST_Response( $this->format_post( get_post( $post->ID ) ) );
    }

    public function generate( \WP_REST_Request $req ): \WP_REST_Response|\WP_Error {
        $user_id  = get_current_user_id();
        $quota    = $this->plugin->get_quota( $user_id );
        $page_ids = (array) $req->get_param( 'page_ids' );

        if ( $quota['plan'] === 'free' ) {
            $remaining = $quota['daily_remaining'];
            if ( $remaining <= 0 ) {
                return new \WP_Error(
                    'quota_exceeded',
                    __( 'Daily limit reached. Upgrade to Pro for unlimited generations.', 'beepbeep-titles' ),
                    [ 'status' => 429 ]
                );
            }
            $page_ids = array_slice( $page_ids, 0, $remaining );
        }

        $generator = new Generator();
        $settings  = get_option( 'bbt_settings', [] );
        $results   = [];

        foreach ( $page_ids as $post_id ) {
            $post = get_post( $post_id );
            if ( ! $post ) {
                continue;
            }

            $generated = $generator->generate( $post, $settings );

            if ( is_wp_error( $generated ) ) {
                $results[] = [
                    'id'    => $post_id,
                    'error' => $generated->get_error_message(),
                ];
                continue;
            }

            update_post_meta( $post_id, '_bbt_seo_title',       sanitize_text_field( $generated['title'] ) );
            update_post_meta( $post_id, '_bbt_meta_description', sanitize_textarea_field( $generated['meta'] ) );
            $this->plugin->log_usage( $user_id, $post_id, 'generate' );

            $results[] = [
                'id'        => $post_id,
                'seo_title' => $generated['title'],
                'meta_desc' => $generated['meta'],
            ];
        }

        return new \WP_REST_Response( [
            'results' => $results,
            'quota'   => $this->plugin->get_quota( $user_id ),
        ] );
    }

    public function get_quota( \WP_REST_Request $req ): \WP_REST_Response {
        return new \WP_REST_Response( $this->plugin->get_quota( get_current_user_id() ) );
    }

    public function run_scan( \WP_REST_Request $req ): \WP_REST_Response {
        $scanner = new Scanner();
        return new \WP_REST_Response( $scanner->scan_and_cache() );
    }

    public function get_settings( \WP_REST_Request $req ): \WP_REST_Response {
        return new \WP_REST_Response( get_option( 'bbt_settings', [] ) );
    }

    public function update_settings( \WP_REST_Request $req ): \WP_REST_Response {
        $current  = get_option( 'bbt_settings', [] );
        $allowed  = [ 'tone', 'title_length', 'meta_length', 'auto_generate', 'custom_instructions', 'notifications' ];
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
    // Helpers
    // ----------------------------------------------------------------

    private function format_post( \WP_Post $post ): array {
        $seo_title = (string) get_post_meta( $post->ID, '_bbt_seo_title',       true );
        $meta_desc = (string) get_post_meta( $post->ID, '_bbt_meta_description', true );

        $missing = match( true ) {
            $seo_title === '' && $meta_desc === '' => 'both',
            $seo_title === ''                      => 'title',
            $meta_desc === ''                      => 'meta',
            default                                => 'none',
        };

        return [
            'id'        => $post->ID,
            'url'       => '/' . ltrim( (string) parse_url( (string) get_permalink( $post->ID ), PHP_URL_PATH ), '/' ),
            'title'     => $post->post_title,
            'seo_title' => $seo_title,
            'meta_desc' => $meta_desc,
            'section'   => $this->get_section( $post ),
            'missing'   => $missing,
            'traffic'   => (int) get_post_meta( $post->ID, '_bbt_monthly_traffic', true ),
            'type'      => $post->post_type,
            'is_new'    => strtotime( $post->post_date ) > strtotime( '-7 days' ),
        ];
    }

    private function get_section( \WP_Post $post ): string {
        return match ( $post->post_type ) {
            'page'    => 'Pages',
            'product' => 'Shop',
            default   => $this->primary_category( $post->ID ),
        };
    }

    private function primary_category( int $post_id ): string {
        $cats = get_the_category( $post_id );
        return $cats ? $cats[0]->name : 'Blog';
    }
}
