<?php
/**
 * Backend API client for BeepBeep Titles.
 *
 * Thin wrapper around wp_remote_request that injects the license + identity
 * headers every BeepBeep backend request needs, and normalises error
 * responses into WP_Error objects whose error_data preserves the backend
 * `code` and `entitlement_state` so the REST proxy can pass them to JS.
 *
 * Mirrors the header/encryption/timeout patterns from the alt-text plugin's
 * includes/class-api-client-v2.php, minus the JWT login flow (license only).
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Api;

defined( 'ABSPATH' ) || exit;

class Client {

    private const OPT_LICENSE       = 'bbt_license_key';
    private const OPT_ACCOUNT_EMAIL = 'bbt_account_email';
    private const OPT_INSTALL_HASH  = 'bbt_install_hash';
    private const OPT_FINGERPRINT   = 'bbt_site_fingerprint';
    private const OPT_DISCONNECTED  = 'bbt_license_disconnected';
    private const ENC_PREFIX        = 'enc:';

    /**
     * License options written by sibling BeepBeep plugins on this site.
     * They use the identical enc: AES-256-CBC scheme keyed on wp_salt('auth'),
     * so maybe_decrypt() reads them directly.
     */
    private const SIBLING_LICENSE_OPTIONS = [
        'beepbeepai_license_key', // BeepBeep AI Alt Text
    ];

    // ----------------------------------------------------------------
    // Public API
    // ----------------------------------------------------------------

    /**
     * Generate a single page's title + meta.
     *
     * @param array      $page     { url, section, h1, current_title, current_meta, content_excerpt }
     * @param array      $options  { brand_name, tone, title_max_chars, meta_max_chars }
     * @param array|null $previous { title, meta } — only on Regenerate.
     * @return array|\WP_Error Backend body on success.
     */
    public function generate( array $page, array $options, ?array $previous = null ): array|\WP_Error {
        $body = [
            'page'    => $page,
            'options' => $options,
        ];
        if ( $previous !== null ) {
            $body['previous'] = $previous;
        }
        return $this->request( 'POST', '/api/titles/generate', $body, 90 );
    }

    /**
     * Submit a bulk job.
     *
     * @param array $pages   List of page envelopes (1-100).
     * @param array $options { brand_name, tone }
     * @param array $context Optional { scope }.
     * @return array|\WP_Error Job envelope { jobId, pollUrl, total, status }.
     */
    public function submit_job( array $pages, array $options, array $context = [] ): array|\WP_Error {
        $body = [
            'pages'    => array_values( $pages ),
            'options'  => $options,
            'priority' => 'normal',
        ];
        if ( ! empty( $context ) ) {
            $body['context'] = $context;
        }
        return $this->request( 'POST', '/api/titles/jobs', $body, 60 );
    }

    /**
     * Poll a bulk job's status.
     *
     * @param string $job_id Job identifier.
     * @return array|\WP_Error Job payload with per-item status.
     */
    public function poll_job( string $job_id ): array|\WP_Error {
        $job_id = trim( $job_id );
        if ( $job_id === '' ) {
            return new \WP_Error( 'bbt_invalid_job', __( 'Invalid job id.', 'beepbeep-titles' ), [ 'status' => 400 ] );
        }
        return $this->request( 'GET', '/api/titles/jobs/' . rawurlencode( $job_id ), null, 60 );
    }

    /**
     * Read-only entitlement / quota status.
     *
     * @return array|\WP_Error entitlement_state body.
     */
    public function quota(): array|\WP_Error {
        return $this->request( 'GET', '/api/titles/quota', null, 30 );
    }

    // ----------------------------------------------------------------
    // Billing — shared account/wallet, same backend the alt-text plugin uses.
    // A Pro upgrade or credit pack bought here applies to the whole account,
    // so credits/Pro are available to every BeepBeep plugin on this site.
    // ----------------------------------------------------------------

    /** Available plans + Stripe price ids ({ starter, pro, agency, credits }). */
    public function billing_plans(): array|\WP_Error {
        return $this->request( 'GET', '/billing/plans', null, 30 );
    }

    /** Current billing/subscription info for this account. */
    public function billing_info(): array|\WP_Error {
        return $this->request( 'GET', '/billing/info', null, 30 );
    }

    /** Backend "can checkout work right now?" probe (booleans only). */
    public function billing_health(): array|\WP_Error {
        return $this->request( 'GET', '/billing/health', null, 15 );
    }

    /**
     * Resolve the BeepBeep account email for the stored license and cache it.
     * Best-effort: returns the cached value on backend failure.
     */
    public function refresh_account_email(): string {
        $key = $this->get_license_key();
        if ( $key === '' ) {
            return '';
        }
        $result = $this->request( 'POST', '/license/validate', [ 'license_key' => $key ], 30 );
        if ( is_wp_error( $result ) ) {
            return $this->get_account_email();
        }
        $email = isset( $result['license']['email'] ) && is_string( $result['license']['email'] )
            ? sanitize_email( $result['license']['email'] )
            : '';
        if ( $email !== '' ) {
            update_option( self::OPT_ACCOUNT_EMAIL, $email, false );
        }
        return $email;
    }

    public function get_account_email(): string {
        $email = get_option( self::OPT_ACCOUNT_EMAIL, '' );
        return is_string( $email ) ? $email : '';
    }

    /** Create a Stripe Checkout session; returns { url } to redirect to. */
    public function create_checkout( string $price_id, string $success_url, string $cancel_url, string $plan = '' ): array|\WP_Error {
        return $this->request( 'POST', '/billing/checkout', [
            'priceId'     => $price_id,
            'successUrl'  => $success_url,
            'cancelUrl'   => $cancel_url,
            'target_plan' => $plan,
            'source_page' => 'beepbeep_titles_admin',
        ], 45 );
    }

    /** Create a Stripe billing-portal session for managing an existing plan. */
    public function billing_portal( string $return_url ): array|\WP_Error {
        return $this->request( 'POST', '/billing/portal', [
            'returnUrl' => $return_url,
        ], 45 );
    }

    // ----------------------------------------------------------------
    // License storage (encrypted at rest)
    // ----------------------------------------------------------------

    public function has_license(): bool {
        return $this->get_license_key() !== '';
    }

    public function get_license_key(): string {
        $stored = get_option( self::OPT_LICENSE, '' );
        if ( ! is_string( $stored ) || $stored === '' ) {
            return '';
        }
        return $this->maybe_decrypt( $stored );
    }

    public function set_license_key( string $key ): void {
        $key = trim( $key );
        if ( $key === '' ) {
            $this->clear_license_key();
            return;
        }
        $stored = $this->encrypt( $key );
        update_option( self::OPT_LICENSE, $stored !== '' ? $stored : $key, false );
        delete_option( self::OPT_DISCONNECTED );
    }

    public function clear_license_key(): void {
        delete_option( self::OPT_LICENSE );
        delete_option( self::OPT_ACCOUNT_EMAIL );
        // Remember the explicit disconnect so we don't immediately re-adopt a
        // sibling plugin's license on the next page load.
        update_option( self::OPT_DISCONNECTED, '1', false );
    }

    /**
     * Adopt a license key already stored on this site by another BeepBeep
     * plugin (the same key works across all of them). No-op when we already
     * have a key or the user explicitly signed out of this plugin.
     *
     * @return bool Whether a sibling license was adopted.
     */
    public function adopt_shared_license(): bool {
        if ( $this->has_license() || get_option( self::OPT_DISCONNECTED, '' ) !== '' ) {
            return false;
        }
        foreach ( self::SIBLING_LICENSE_OPTIONS as $option ) {
            $stored = get_option( $option, '' );
            if ( ! is_string( $stored ) || $stored === '' ) {
                continue;
            }
            $key = $this->maybe_decrypt( $stored );
            if ( $key !== '' ) {
                $this->set_license_key( $key );
                return true;
            }
        }
        return false;
    }

    // ----------------------------------------------------------------
    // Account login — exchange BeepBeep credentials for the license key.
    // Same /auth/login route the alt-text plugin uses; the backend returns
    // the account's license key alongside the JWT, which is all we need.
    // ----------------------------------------------------------------

    /**
     * @return array|\WP_Error Backend user payload on success (license stored).
     */
    public function login( string $email, string $password ): array|\WP_Error {
        $result = $this->do_request( 'POST', '/auth/login', [
            'email'        => $email,
            'password'     => $password,
            'site_id'      => $this->site_hash(),
            'site_url'     => get_site_url(),
            'blog_id'      => function_exists( 'get_current_blog_id' ) ? absint( get_current_blog_id() ) : 0,
            'network_id'   => function_exists( 'get_current_network_id' ) ? absint( get_current_network_id() ) : 0,
            'is_multisite' => is_multisite(),
        ], 45 );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return $this->store_account_license_from_auth_result( $result, $email, 'login' );
    }

    /**
     * Create a BeepBeep account and store its returned license key.
     *
     * @return array|\WP_Error Backend user payload on success (license stored).
     */
    public function register( string $email, string $password ): array|\WP_Error {
        $result = $this->do_request( 'POST', '/auth/register', [
            'email'             => $email,
            'password'          => $password,
            'site_id'           => $this->site_hash(),
            'install_uuid'      => $this->install_hash(),
            'site_url'          => get_site_url(),
            'site_fingerprint'  => $this->fingerprint(),
            'plugin_version'    => BBT_VERSION,
            'wordpress_version' => get_bloginfo( 'version' ),
            'blog_id'           => function_exists( 'get_current_blog_id' ) ? absint( get_current_blog_id() ) : 0,
            'network_id'        => function_exists( 'get_current_network_id' ) ? absint( get_current_network_id() ) : 0,
            'is_multisite'      => is_multisite(),
        ], 45 );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return $this->store_account_license_from_auth_result( $result, $email, 'register' );
    }

    // ----------------------------------------------------------------
    // Identity
    // ----------------------------------------------------------------

    /** Stable per-install UUID, generated once. */
    public function install_hash(): string {
        $hash = get_option( self::OPT_INSTALL_HASH, '' );
        if ( ! is_string( $hash ) || $hash === '' ) {
            $hash = wp_generate_uuid4();
            update_option( self::OPT_INSTALL_HASH, $hash, false );
        }
        return $hash;
    }

    /**
     * Site hash — the BeepBeep site identity SHARED with the alt-text plugin.
     *
     * Credits are pooled per backend "canonical site", which is resolved from
     * this hash. To share one wallet across both BeepBeep plugins, we reuse the
     * same `beepbeepai_site_id` option the alt-text plugin stores. If neither
     * plugin has established an id yet, we create one under that shared key so
     * whichever plugin is installed later reuses it.
     */
    public function site_hash(): string {
        $shared = $this->shared_site_id();
        return $shared !== '' ? $shared : md5( home_url() );
    }

    private function shared_site_id(): string {
        $keys = [];
        if ( is_multisite() ) {
            $keys[] = 'beepbeepai_site_id_' . get_current_blog_id();
        }
        $keys[] = 'beepbeepai_site_id';

        foreach ( $keys as $key ) {
            $value = get_option( $key, '' );
            if ( is_string( $value ) && strlen( $value ) === 32 ) {
                return $value;
            }
        }

        // No shared identity yet — establish one under the shared key.
        $site_url = get_site_url();
        $network  = is_multisite() ? (string) get_current_site()->id : 'single';
        $id       = md5( md5( $site_url . '|' . $network ) . wp_generate_password( 32, false ) . time() );
        update_option( 'beepbeepai_site_id', $id, true );
        return $id;
    }

    /**
     * Site fingerprint — reuse the alt-text plugin's shared fingerprint when
     * present so both plugins present a consistent identity; otherwise fall
     * back to our own stable value.
     */
    public function fingerprint(): string {
        $shared = get_option( 'beepbeepai_site_fingerprint', '' );
        if ( is_string( $shared ) && $shared !== '' ) {
            return $shared;
        }
        $fp = get_option( self::OPT_FINGERPRINT, '' );
        if ( ! is_string( $fp ) || $fp === '' ) {
            $fp = hash( 'sha256', get_site_url() . '|' . wp_salt( 'auth' ) );
            update_option( self::OPT_FINGERPRINT, $fp, false );
        }
        return $fp;
    }

    // ----------------------------------------------------------------
    // Request plumbing
    // ----------------------------------------------------------------

    private function headers(): array {
        global $wp_version;

        return [
            'Content-Type'       => 'application/json',
            'Accept'             => 'application/json',
            'X-License-Key'      => $this->get_license_key(),
            'X-Site-Hash'        => $this->site_hash(),
            'X-Site-Key'         => $this->site_hash(), // alias the backend's billing routes require
            'X-Site-URL'         => home_url(),
            'X-Install-Hash'     => $this->install_hash(),
            'X-Site-Fingerprint' => $this->fingerprint(),
            'X-Plugin-Version'   => BBT_VERSION,
            'X-WP-Version'       => (string) $wp_version,
            'X-PHP-Version'      => PHP_VERSION,
            'X-Plugin-Channel'   => BBT_PLUGIN_CHANNEL,
            'X-Environment'      => BBT_PLUGIN_ENV,
            'X-Request-Source'   => 'beepbeep_titles',
        ];
    }

    /**
     * Perform a request and normalise the result.
     *
     * @return array|\WP_Error Decoded body on 2xx; WP_Error otherwise with
     *                         error_data { status, code, entitlement_state, body }.
     */
    private function request( string $method, string $path, ?array $body, int $timeout ): array|\WP_Error {
        if ( ! $this->has_license() ) {
            return new \WP_Error(
                'bbt_no_license',
                __( 'No BeepBeep license key is configured.', 'beepbeep-titles' ),
                [ 'status' => 401, 'code' => 'INVALID_LICENSE' ]
            );
        }
        return $this->do_request( $method, $path, $body, $timeout );
    }

    /** Same plumbing as request() but without the license guard (auth routes). */
    private function do_request( string $method, string $path, ?array $body, int $timeout ): array|\WP_Error {
        $url  = BBT_API_BASE . '/' . ltrim( $path, '/' );
        $args = [
            'method'    => $method,
            'headers'   => $this->headers(),
            'timeout'   => $timeout,
            'sslverify' => true,
        ];

        if ( $body !== null && in_array( $method, [ 'POST', 'PUT', 'PATCH' ], true ) ) {
            $json = wp_json_encode( $body );
            if ( $json === false ) {
                return new \WP_Error( 'bbt_encode_error', __( 'Failed to encode request.', 'beepbeep-titles' ), [ 'status' => 500 ] );
            }
            $args['body'] = $json;
        }

        $response = wp_remote_request( $url, $args );

        // Transport-level failure (DNS, timeout, SSL, offline).
        if ( is_wp_error( $response ) ) {
            return new \WP_Error(
                'bbt_network_error',
                $response->get_error_message(),
                [ 'status' => 502, 'code' => 'NETWORK_ERROR' ]
            );
        }

        $status = (int) wp_remote_retrieve_response_code( $response );
        $raw    = wp_remote_retrieve_body( $response );
        $data   = json_decode( $raw, true );
        if ( ! is_array( $data ) ) {
            $data = [];
        }

        if ( $status >= 200 && $status < 300 ) {
            return $data;
        }

        return $this->error_from_response( $status, $data );
    }

    /**
     * Build a WP_Error from a non-2xx backend response, tolerating both
     * `{ error: { code, message } }` and `{ code, message, error }` shapes.
     */
    private function error_from_response( int $status, array $data ): \WP_Error {
        // entitlement_state may sit at the top level or inside `error`.
        $entitlement = $data['entitlement_state']
            ?? ( $data['error']['entitlement_state'] ?? null );

        // Resolve the canonical backend code.
        $code = null;
        if ( isset( $data['error']['code'] ) && is_string( $data['error']['code'] ) ) {
            $code = $data['error']['code'];
        } elseif ( isset( $data['code'] ) && is_string( $data['code'] ) ) {
            $code = $data['code'];
        } elseif ( isset( $data['error'] ) && is_string( $data['error'] ) ) {
            $code = $data['error'];
        }
        if ( $code === null ) {
            $code = $this->code_for_status( $status );
        }

        $message = $data['error']['message']
            ?? $data['message']
            ?? ( is_string( $data['error'] ?? null ) ? $data['error'] : '' );
        if ( $message === '' ) {
            $message = sprintf(
                /* translators: %d: HTTP status code */
                __( 'The generator returned an error (HTTP %d).', 'beepbeep-titles' ),
                $status
            );
        }

        $error_data = [
            'status' => $status,
            'code'   => $code,
            'body'   => $data,
        ];
        if ( is_array( $entitlement ) ) {
            $error_data['entitlement_state'] = $entitlement;
        }

        return new \WP_Error( 'bbt_api_error', $message, $error_data );
    }

    private function store_account_license_from_auth_result( array $result, string $email, string $action ): array|\WP_Error {
        // Backend wraps the payload as { success, data: { token, user } } but
        // older deployments return { token, user } at the top level.
        $user = $result['data']['user'] ?? $result['user'] ?? null;
        $key  = is_array( $user ) && isset( $user['license_key'] ) && is_string( $user['license_key'] )
            ? trim( $user['license_key'] )
            : '';

        if ( $key === '' ) {
            return new \WP_Error(
                'bbt_no_account_license',
                $action === 'register'
                    ? __( 'Account created, but no license key was returned. Visit your BeepBeep dashboard to claim one.', 'beepbeep-titles' )
                    : __( 'Signed in, but no license key is attached to this account yet. Visit your BeepBeep dashboard to claim one.', 'beepbeep-titles' ),
                [ 'status' => 422, 'code' => 'NO_ACCOUNT_LICENSE' ]
            );
        }

        $this->set_license_key( $key );

        $account_email = isset( $user['email'] ) && is_string( $user['email'] ) ? sanitize_email( $user['email'] ) : sanitize_email( $email );
        if ( $account_email !== '' ) {
            update_option( self::OPT_ACCOUNT_EMAIL, $account_email, false );
        }

        return is_array( $user ) ? $user : [];
    }

    private function code_for_status( int $status ): string {
        return match ( $status ) {
            400     => 'INVALID_REQUEST',
            401     => 'INVALID_LICENSE',
            402     => 'QUOTA_EXCEEDED',
            429     => 'RATE_LIMIT_EXCEEDED',
            502     => 'UPSTREAM_GENERATION_ERROR',
            default => 'API_ERROR',
        };
    }

    // ----------------------------------------------------------------
    // Encryption (AES-256-CBC, keyed on wp_salt) — ported from alt-text.
    // ----------------------------------------------------------------

    private function encrypt( string $value ): string {
        if ( $value === '' || ! function_exists( 'openssl_encrypt' ) ) {
            return $value;
        }
        $key = substr( hash( 'sha256', wp_salt( 'auth' ) ), 0, 32 );
        $iv  = function_exists( 'random_bytes' ) ? random_bytes( 16 ) : openssl_random_pseudo_bytes( 16 );
        if ( $iv === false ) {
            return $value;
        }
        $cipher = openssl_encrypt( $value, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv );
        if ( $cipher === false ) {
            return $value;
        }
        return self::ENC_PREFIX . base64_encode( $iv . $cipher );
    }

    private function maybe_decrypt( string $value ): string {
        if ( strpos( $value, self::ENC_PREFIX ) !== 0 ) {
            return $value; // Stored as plain text (no openssl at write time).
        }
        if ( ! function_exists( 'openssl_decrypt' ) ) {
            return '';
        }
        $payload = base64_decode( substr( $value, strlen( self::ENC_PREFIX ) ), true );
        if ( $payload === false || strlen( $payload ) < 17 ) {
            return '';
        }
        $iv     = substr( $payload, 0, 16 );
        $cipher = substr( $payload, 16 );
        $key    = substr( hash( 'sha256', wp_salt( 'auth' ) ), 0, 32 );
        $plain  = openssl_decrypt( $cipher, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv );
        return $plain !== false ? $plain : '';
    }
}
