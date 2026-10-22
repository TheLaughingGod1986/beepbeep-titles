<?php
/**
 * REST bridge: browser activity → PostHog (server-side capture).
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Rest;

use BeepBeep_Titles\Telemetry;

defined( 'ABSPATH' ) || exit;

class TelemetryController {

	/**
	 * Browser properties that may reach PostHog. Anything else is dropped.
	 * String values must be short tokens (no spaces, slashes, '?', '@'),
	 * so URLs, paths, titles, search terms and error messages cannot pass.
	 */
	public const CLIENT_PROPERTY_ALLOWLIST = [
		'session_id', 'journey_id', 'plugin_slug', 'plugin_id', 'product', 'plugin_version',
		'environment', 'user_state', 'is_logged_in', 'is_returning_user', 'inactivity_hours',
		'tab', 'feature_name', 'mode', 'source', 'plan', 'generation_mode', 'page_count',
		'trigger', 'is_first_open', 'lifecycle_state', 'error_code', 'signup_source',
	];

	/**
	 * @param array<string,mixed> $props Raw browser properties.
	 * @return array<string,mixed>
	 */
	public static function filter_client_properties( array $props ): array {
		$out = [];
		foreach ( self::CLIENT_PROPERTY_ALLOWLIST as $key ) {
			if ( ! array_key_exists( $key, $props ) ) {
				continue;
			}
			$v = $props[ $key ];
			if ( is_bool( $v ) ) {
				$out[ $key ] = $v;
			} elseif ( is_int( $v ) || ( is_float( $v ) && is_finite( $v ) ) ) {
				$out[ $key ] = max( 0, min( 1000000, (int) $v ) );
			} elseif ( is_string( $v ) && self::is_safe_client_string( $v ) && self::is_allowed_value( $key, $v ) ) {
				$out[ $key ] = $v;
			}
		}
		return $out;
	}

	/**
	 * Short token check for browser string values. The 64-char cap applies to
	 * the raw value before anything else; only [A-Za-z0-9_.-] is allowed; and
	 * a dot is only allowed in a version-like number (1.0.29), so host names,
	 * IPv4 addresses and email domains are dropped.
	 */
	/**
	 * Per-key value rules. session_id is only the browser's own analytics
	 * session (s_…); a Stripe Checkout session id (cs_…) or any other Stripe
	 * object id never reaches PostHog under any key.
	 */
	public static function is_allowed_value( string $key, string $v ): bool {
		if ( self::looks_like_stripe_id( $v ) ) {
			return false;
		}
		if ( 'session_id' === $key ) {
			return 1 === preg_match( '/^s_[A-Za-z0-9]+(_[A-Za-z0-9]+)?$/', $v );
		}
		return true;
	}

	/** cs_live_…, cs_test_…, cus_…, sub_…, pi_… and similar Stripe ids. */
	public static function looks_like_stripe_id( string $v ): bool {
		return 1 === preg_match( '/^(cs|cus|sub|pi|seti|pm|in|ch|price|prod|bps)_[A-Za-z0-9_]+$/', $v )
			|| 1 === preg_match( '/_(live|test)_/', $v );
	}

	public static function is_safe_client_string( string $v ): bool {
		if ( '' === $v || strlen( $v ) > 64 ) {
			return false;
		}
		if ( 1 !== preg_match( '/^[A-Za-z0-9_.\-]+$/', $v ) ) {
			return false;
		}
		if ( false === strpos( $v, '.' ) ) {
			return true;
		}
		return 1 === preg_match( '/^\d+\.\d+(\.\d+)?(-[A-Za-z0-9]+)?$/', $v );
	}

	/**
	 * Accept a batch of allowlisted client events and forward each to PostHog.
	 */
	public function ingest( \WP_REST_Request $req ): \WP_REST_Response {
		if ( ! Telemetry::has_consent() ) {
			return new \WP_REST_Response( [ 'success' => true, 'accepted' => 0, 'rejected' => 0, 'consent' => false ], 200 );
		}

		$events = $req->get_param( 'events' );
		if ( ! is_array( $events ) ) {
			$single = $req->get_param( 'event' );
			$events = $single ? [ [ 'event' => $single, 'properties' => (array) $req->get_param( 'properties' ) ] ] : [];
		}

		$accepted = 0;
		$rejected = 0;
		foreach ( array_slice( $events, 0, 40 ) as $entry ) {
			if ( ! is_array( $entry ) ) {
				++$rejected;
				continue;
			}
			$name = isset( $entry['event'] ) ? sanitize_key( (string) $entry['event'] ) : '';
			if ( '' === $name || ! in_array( $name, Telemetry::ALLOWED_EVENTS, true ) ) {
				++$rejected;
				continue;
			}
			$props = isset( $entry['properties'] ) && is_array( $entry['properties'] ) ? self::filter_client_properties( $entry['properties'] ) : [];
			$props['transport']     = 'wp_admin_server_bridge';
			$props['client_origin'] = 'react_admin';
			Telemetry::capture( $name, $props );
			++$accepted;
		}

		return new \WP_REST_Response(
			[
				'success'  => true,
				'accepted' => $accepted,
				'rejected' => $rejected,
			],
			200
		);
	}
}
