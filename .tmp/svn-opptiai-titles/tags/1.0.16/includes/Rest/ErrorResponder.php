<?php
/**
 * Maps Client WP_Error objects to flat JSON REST responses.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Rest;

defined( 'ABSPATH' ) || exit;

class ErrorResponder {

    /**
     * Translate a Client WP_Error into a flat JSON response the JS can read
     * uniformly: { success:false, code, message, entitlement_state? }.
     */
    public static function from_wp_error( \WP_Error $error ): \WP_REST_Response {
        $data   = $error->get_error_data();
        $data   = is_array( $data ) ? $data : [];
        $status = (int) ( $data['status'] ?? 500 );
        $code   = (string) ( $data['code'] ?? 'API_ERROR' );

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
