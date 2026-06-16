<?php
/**
 * Billing + license REST handlers.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Rest;

use BeepBeep_Titles\Api\Client;

defined( 'ABSPATH' ) || exit;

class BillingController {

    public function __construct( private readonly Client $client ) {}

    public function get_quota( \WP_REST_Request $req ): \WP_REST_Response {
        if ( ! $this->client->has_license() ) {
            return new \WP_REST_Response( [ 'success' => false, 'code' => 'INVALID_LICENSE', 'connected' => false ], 200 );
        }
        $result = $this->client->quota();
        if ( is_wp_error( $result ) ) {
            return ErrorResponder::from_wp_error( $result );
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
            return ErrorResponder::from_wp_error( $result );
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

    /**
     * Sign in with a BeepBeep account (email + password). The backend returns
     * the account's license key, which we store and then validate via /quota —
     * the response shape matches set_license so the JS can treat them alike.
     */
    public function login( \WP_REST_Request $req ): \WP_REST_Response {
        $email    = sanitize_email( (string) $req->get_param( 'email' ) );
        $password = (string) $req->get_param( 'password' );

        if ( $email === '' || ! is_email( $email ) || $password === '' ) {
            return new \WP_REST_Response( [ 'success' => false, 'code' => 'INVALID_REQUEST', 'message' => __( 'Enter your account email and password.', 'beepbeep-titles' ) ], 400 );
        }

        $user = $this->client->login( $email, $password );
        if ( is_wp_error( $user ) ) {
            return ErrorResponder::from_wp_error( $user );
        }

        $result = $this->client->quota();
        if ( is_wp_error( $result ) ) {
            $this->client->clear_license_key();
            return ErrorResponder::from_wp_error( $result );
        }

        $result['connected']     = true;
        $result['account_email'] = $this->client->get_account_email();
        return new \WP_REST_Response( $result, 200 );
    }

    /**
     * Create a BeepBeep account, store the returned license key, and return
     * the same connected quota shape as login/set_license.
     */
    public function register( \WP_REST_Request $req ): \WP_REST_Response {
        $email    = sanitize_email( (string) $req->get_param( 'email' ) );
        $password = (string) $req->get_param( 'password' );

        if ( $email === '' || ! is_email( $email ) || $password === '' ) {
            return new \WP_REST_Response( [ 'success' => false, 'code' => 'INVALID_REQUEST', 'message' => __( 'Enter an email and password to create your account.', 'beepbeep-titles' ) ], 400 );
        }

        if ( strlen( $password ) < 8 ) {
            return new \WP_REST_Response( [ 'success' => false, 'code' => 'WEAK_PASSWORD', 'message' => __( 'Use at least 8 characters for your password.', 'beepbeep-titles' ) ], 400 );
        }

        $user = $this->client->register( $email, $password );
        if ( is_wp_error( $user ) ) {
            return ErrorResponder::from_wp_error( $user );
        }

        $result = $this->client->quota();
        if ( is_wp_error( $result ) ) {
            $this->client->clear_license_key();
            return ErrorResponder::from_wp_error( $result );
        }

        $result['connected']     = true;
        $result['account_email'] = $this->client->get_account_email();
        $result['created']       = true;
        return new \WP_REST_Response( $result, 200 );
    }

    public function billing_plans( \WP_REST_Request $req ): \WP_REST_Response {
        $result = $this->client->billing_plans();
        if ( is_wp_error( $result ) ) {
            return ErrorResponder::from_wp_error( $result );
        }
        return new \WP_REST_Response( $result, 200 );
    }

    public function billing_info( \WP_REST_Request $req ): \WP_REST_Response {
        $result = $this->client->billing_info();
        if ( is_wp_error( $result ) ) {
            return ErrorResponder::from_wp_error( $result );
        }
        return new \WP_REST_Response( $result, 200 );
    }

    /** Proxy the backend billing-health probe for the admin diagnostics page. */
    public function billing_health( \WP_REST_Request $req ): \WP_REST_Response {
        $result = $this->client->billing_health();
        if ( is_wp_error( $result ) ) {
            return ErrorResponder::from_wp_error( $result );
        }
        return new \WP_REST_Response( $result, 200 );
    }

    public function billing_checkout( \WP_REST_Request $req ): \WP_REST_Response {
        $price_id = (string) $req->get_param( 'price_id' );
        $plan     = (string) $req->get_param( 'plan' );

        // Resolve a plan key ('starter' | 'pro' | 'agency' | 'credits') to its Stripe price.
        if ( $price_id === '' && $plan !== '' ) {
            $plans = $this->client->billing_plans();
            if ( is_wp_error( $plans ) ) {
                return ErrorResponder::from_wp_error( $plans );
            }
            $price_id = $this->resolve_price_id( $plans, $plan );
        }

        if ( $price_id === '' ) {
            return new \WP_REST_Response( [ 'success' => false, 'code' => 'INVALID_REQUEST', 'message' => __( 'No plan or price selected.', 'beepbeep-titles' ) ], 400 );
        }

        $base    = admin_url( 'admin.php?page=' . BBT_SLUG );
        $success = add_query_arg( 'bbt_billing', 'success', $base );
        $cancel  = add_query_arg( 'bbt_billing', 'cancelled', $base );

        $result = $this->client->create_checkout( $price_id, $success, $cancel, $plan );
        if ( is_wp_error( $result ) ) {
            return ErrorResponder::from_wp_error( $result );
        }
        return new \WP_REST_Response( $result, 200 );
    }

    public function billing_portal( \WP_REST_Request $req ): \WP_REST_Response {
        $return = admin_url( 'admin.php?page=' . BBT_SLUG );
        $result = $this->client->billing_portal( $return );
        if ( is_wp_error( $result ) ) {
            return ErrorResponder::from_wp_error( $result );
        }
        return new \WP_REST_Response( $result, 200 );
    }

    /** Map a plan key to its Stripe price id from the backend /plans payload. */
    private function resolve_price_id( array $plans, string $plan ): string {
        $plan = strtolower( trim( $plan ) );
        $aliases = [
            'growth'          => 'pro',
            'starter_monthly' => 'starter',
            'pro_monthly'     => 'pro',
            'credit_pack'     => 'credits',
        ];
        $plan = $aliases[ $plan ] ?? $plan;
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
}
