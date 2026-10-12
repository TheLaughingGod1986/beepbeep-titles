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
	 * Accept a batch of allowlisted client events and forward each to PostHog.
	 */
	public function ingest( \WP_REST_Request $req ): \WP_REST_Response {
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
			$props = isset( $entry['properties'] ) && is_array( $entry['properties'] ) ? $entry['properties'] : [];
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
