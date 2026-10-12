<?php
/**
 * PostHog product analytics for OpptiAI Titles.
 *
 * Mirrors the Alt Text plugin's server-bridge pattern: consent-gated,
 * enriched with site identity, and captured via non-blocking wp_remote_post
 * to the shared OpptiAI PostHog project. Browser events arrive through the
 * REST /telemetry endpoint and are forwarded here.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

use BeepBeep_Titles\Api\Client;

defined( 'ABSPATH' ) || exit;

class Telemetry {

	public const CONSENT_OPTION          = 'beepti_telemetry_consent';
	public const LIFECYCLE_QUEUE_OPTION  = 'beepti_telemetry_lifecycle_queue';
	public const ACTIVATION_MARKER       = 'beepti_telemetry_plugin_activated';
	public const CURRENT_VERSION_OPTION  = 'beepti_telemetry_current_plugin_version';
	public const PREVIOUS_VERSION_OPTION = 'beepti_telemetry_previous_plugin_version';

	private const POSTHOG_API_KEY  = 'phc_6L7JzpjYRC8Gk4Br3YevTmjZnJsJPvoy9GK7RFdo72s';
	private const POSTHOG_API_HOST = 'https://us.i.posthog.com';

	/** WordPress.org directory slug (public listing folder). */
	public const PLUGIN_SLUG = 'opptiai-titles';

	/** Shared wallet feature key used across OpptiAI plugins. */
	public const PRODUCT = 'title_meta';

	/**
	 * Client + server events the REST bridge and PHP callers may emit.
	 *
	 * @var list<string>
	 */
	public const ALLOWED_EVENTS = [
		'plugin_activated',
		'plugin_deactivated',
		'plugin_updated',
		'plugin_opened',
		'dashboard_viewed',
		'library_viewed',
		'autopilot_viewed',
		'settings_viewed',
		'billing_viewed',
		'feature_used',
		'generation_started',
		'generation_completed',
		'generation_failed',
		'generation_failed_no_credits',
		'generation_failed_unknown',
		'generation_blocked_no_credits',
		'batch_generation_started',
		'batch_generation_completed',
		'batch_generation_failed',
		'title_meta_generated',
		'title_meta_saved',
		'manual_meta_edit',
		'page_undone',
		'generated_reset',
		'scan_started',
		'scan_completed',
		'scheduled_scan_completed',
		'autopilot_toggled',
		'autopilot_generated',
		'autopilot_failed',
		'onboarding_opened',
		'onboarding_completed',
		'onboarding_scan_started',
		'paywall_shown',
		'quota_exhausted_state_shown',
		'upgrade_cta_clicked',
		'checkout_started',
		'checkout_completed',
		'checkout_cancelled',
		'billing_portal_opened',
		'signup_cta_clicked',
		'login_cta_clicked',
		'login_modal_opened',
		'signup_started',
		'signup_succeeded',
		'login_started',
		'login_succeeded',
		'login_failed',
		'license_connected',
		'license_disconnected',
		'license_adopted',
		'settings_saved',
		'support_submitted',
		'help_opened',
		'documentation_opened',
	];

	/**
	 * Read source/finding from the current request. Only source=auditor is
	 * accepted; finding is a sanitized key (e.g. missing_title).
	 *
	 * @return array{source:string,finding?:string}|null
	 */
	private static function auditor_attribution_from_request(): ?array {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only attribution tag, no state change.
		$source = isset( $_REQUEST['source'] ) ? sanitize_key( wp_unslash( $_REQUEST['source'] ) ) : '';
		if ( 'auditor' !== $source ) {
			return null;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only attribution tag, no state change.
		$finding = isset( $_REQUEST['finding'] ) ? sanitize_key( wp_unslash( $_REQUEST['finding'] ) ) : '';
		$out     = [ 'source' => 'auditor' ];
		if ( '' !== $finding ) {
			$out['finding'] = substr( $finding, 0, 64 );
		}
		return $out;
	}

	/**
	 * admin_init: when the Titles admin page is opened from the Website
	 * Auditor, keep the attribution for the current user for 30 minutes.
	 */
	public static function remember_auditor_attribution(): void {
		if ( wp_doing_ajax() ) {
			return;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Admin page routing only.
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		if ( 'beepbeep-titles' !== $page && ( ! defined( 'BEEPTI_SLUG' ) || BEEPTI_SLUG !== $page ) ) {
			return;
		}
		$attr    = self::auditor_attribution_from_request();
		$user_id = get_current_user_id();
		if ( null === $attr || $user_id <= 0 ) {
			return;
		}
		set_transient( 'beepti_auditor_attr_' . $user_id, $attr, 30 * MINUTE_IN_SECONDS );
	}

	/**
	 * Properties to merge into generate events: the request's own
	 * source/finding first, then a remembered Auditor deep-link.
	 *
	 * @return array<string,string> Empty when the Auditor wasn't involved.
	 */
	public static function auditor_attribution(): array {
		$attr = self::auditor_attribution_from_request();
		if ( null === $attr ) {
			$user_id = get_current_user_id();
			$stored  = $user_id > 0 ? get_transient( 'beepti_auditor_attr_' . $user_id ) : false;
			if ( is_array( $stored ) && 'auditor' === ( $stored['source'] ?? '' ) ) {
				$attr = $stored;
			}
		}
		return is_array( $attr ) ? $attr : [];
	}

	/**
	 * Whether external PostHog capture is allowed.
	 * Default: granted when the option is unset (same as Alt Text).
	 */
	public static function has_consent(): bool {
		if ( defined( 'BEEPTI_TELEMETRY_CONSENT' ) ) {
			return (bool) BEEPTI_TELEMETRY_CONSENT;
		}

		$stored = get_option( self::CONSENT_OPTION, false );
		if ( false === $stored ) {
			$granted = true;
		} else {
			$granted = in_array( $stored, [ 'yes', '1', 1, true ], true );
		}

		return (bool) apply_filters( 'beepti_telemetry_consent_granted', $granted );
	}

	public static function get_api_key(): string {
		return (string) apply_filters( 'beepti_posthog_api_key', self::POSTHOG_API_KEY );
	}

	public static function get_api_host(): string {
		$host = (string) apply_filters( 'beepti_posthog_api_host', self::POSTHOG_API_HOST );
		return untrailingslashit( $host );
	}

	/**
	 * Emit a product event to PostHog (server-side).
	 *
	 * @param array<string,mixed> $properties Extra properties (sanitized).
	 */
	public static function capture( string $event_name, array $properties = [] ): void {
		$event_name = sanitize_key( $event_name );
		if ( '' === $event_name || ! in_array( $event_name, self::ALLOWED_EVENTS, true ) ) {
			return;
		}
		if ( ! self::has_consent() ) {
			return;
		}
		if ( ! apply_filters( 'beepti_posthog_server_capture_enabled', true, $event_name, $properties ) ) {
			return;
		}

		$api_key  = self::get_api_key();
		$api_host = self::get_api_host();
		if ( '' === $api_key || '' === $api_host ) {
			return;
		}

		$distinct_id = self::distinct_id();
		$properties  = self::enrich( self::sanitize_properties( $properties ), $event_name );

		$payload = wp_json_encode(
			[
				'api_key'     => $api_key,
				'event'       => $event_name,
				'distinct_id' => $distinct_id,
				'properties'  => $properties,
				'timestamp'   => gmdate( 'c' ),
			]
		);

		if ( ! is_string( $payload ) || '' === $payload ) {
			return;
		}

		$blocking = (bool) apply_filters( 'beepti_posthog_capture_blocking', false, $event_name );

		wp_remote_post(
			$api_host . '/capture/',
			[
				'timeout'     => $blocking ? 8 : 1,
				'blocking'    => $blocking,
				'headers'     => [ 'Content-Type' => 'application/json' ],
				'body'        => $payload,
				'data_format' => 'body',
			]
		);
	}

	/**
	 * Queue a lifecycle event for the next admin request (activation happens
	 * before JS / admin bootstrap is available).
	 *
	 * @param array<string,mixed> $properties Extra properties.
	 */
	public static function queue_lifecycle( string $event_name, array $properties = [] ): void {
		$event_name = sanitize_key( $event_name );
		if ( ! in_array( $event_name, [ 'plugin_activated', 'plugin_deactivated', 'plugin_updated' ], true ) ) {
			return;
		}

		$queue   = get_option( self::LIFECYCLE_QUEUE_OPTION, [] );
		$queue   = is_array( $queue ) ? $queue : [];
		$queue[] = [
			'event'       => $event_name,
			'distinct_id' => self::distinct_id(),
			'properties'  => $properties,
			'queued_at'   => time(),
		];
		update_option( self::LIFECYCLE_QUEUE_OPTION, array_slice( $queue, -20 ), false );
	}

	/** Flush queued lifecycle events to PostHog. */
	public static function flush_lifecycle_queue(): void {
		if ( ! self::has_consent() ) {
			return;
		}

		$queue = get_option( self::LIFECYCLE_QUEUE_OPTION, [] );
		if ( ! is_array( $queue ) || empty( $queue ) ) {
			return;
		}

		delete_option( self::LIFECYCLE_QUEUE_OPTION );
		foreach ( $queue as $entry ) {
			if ( ! is_array( $entry ) ) {
				continue;
			}
			$event = isset( $entry['event'] ) ? sanitize_key( (string) $entry['event'] ) : '';
			$props = isset( $entry['properties'] ) && is_array( $entry['properties'] ) ? $entry['properties'] : [];
			$props['transport']          = 'wp_lifecycle_server_bridge';
			$props['lifecycle_delivery'] = 'queued_flush';
			if ( $event ) {
				self::capture( $event, $props );
			}
		}
	}

	/**
	 * Record activation once per install and queue the PostHog event.
	 */
	public static function on_activate(): void {
		if ( ! get_option( self::ACTIVATION_MARKER ) ) {
			update_option( self::ACTIVATION_MARKER, time(), false );
			self::queue_lifecycle( 'plugin_activated', [ 'source' => 'activation_hook' ] );
		}
		self::maybe_record_update();
		update_option( self::CURRENT_VERSION_OPTION, BEEPTI_VERSION, false );
	}

	/** Queue deactivation (flushed next time the plugin runs, if reactivated soon enough — otherwise capture now). */
	public static function on_deactivate(): void {
		self::capture(
			'plugin_deactivated',
			[
				'source'    => 'deactivation_hook',
				'transport' => 'wp_lifecycle_server_bridge',
			]
		);
	}

	/**
	 * Detect version bumps on admin_init and queue plugin_updated.
	 */
	public static function maybe_record_update(): void {
		$current  = BEEPTI_VERSION;
		$previous = (string) get_option( self::CURRENT_VERSION_OPTION, '' );
		if ( '' === $previous ) {
			update_option( self::CURRENT_VERSION_OPTION, $current, false );
			return;
		}
		if ( $previous === $current ) {
			return;
		}
		update_option( self::PREVIOUS_VERSION_OPTION, $previous, false );
		update_option( self::CURRENT_VERSION_OPTION, $current, false );
		self::queue_lifecycle(
			'plugin_updated',
			[
				'previous_version' => $previous,
				'plugin_version'   => $current,
			]
		);
	}

	/**
	 * Config blob localised into the React app.
	 *
	 * When consent is granted, includes the project API key so the admin SPA can
	 * init posthog-js (session replay + exception autocapture) for self-driving.
	 * The key is write-only (same pattern as Alt Text); never localise when consent
	 * is off.
	 *
	 * @return array<string,mixed>
	 */
	public static function client_config(): array {
		$client  = new Client();
		$consent = self::has_consent();
		$config  = [
			'enabled'                 => $consent,
			'pluginSlug'              => self::PLUGIN_SLUG,
			'pluginId'                => defined( 'BEEPTI_PLUGIN_ID' ) ? BEEPTI_PLUGIN_ID : 'titles',
			'product'                 => self::PRODUCT,
			'pluginVersion'           => BEEPTI_VERSION,
			'siteInstallId'           => $client->install_hash(),
			'connected'               => $client->has_license(),
			'environment'             => defined( 'BEEPTI_PLUGIN_ENV' ) ? BEEPTI_PLUGIN_ENV : 'production',
			'distinctId'              => self::distinct_id(),
			'apiKey'                  => '',
			'apiHost'                 => '',
			'sessionRecordingEnabled' => false,
			'captureExceptions'       => false,
		];

		if ( $consent ) {
			$config['apiKey']                  = self::get_api_key();
			$config['apiHost']                 = self::get_api_host();
			$config['sessionRecordingEnabled'] = (bool) apply_filters( 'beepti_posthog_session_recording_enabled', true );
			$config['captureExceptions']       = (bool) apply_filters( 'beepti_posthog_capture_exceptions_enabled', true );
		}

		return $config;
	}

	/**
	 * Stable PostHog distinct id — prefer account email hash when connected,
	 * otherwise the install hash.
	 */
	public static function distinct_id(): string {
		$client = new Client();
		$email  = $client->get_account_email();
		if ( is_string( $email ) && $email !== '' ) {
			return 'acct_' . substr( hash( 'sha256', strtolower( trim( $email ) ) ), 0, 32 );
		}
		return 'site_' . $client->install_hash();
	}

	/**
	 * @param array<string,mixed> $props Sanitized caller props.
	 * @return array<string,mixed>
	 */
	private static function enrich( array $props, string $event_name ): array {
		global $wp_version;
		$client = new Client();

		$base = [
			'plugin_slug'       => self::PLUGIN_SLUG,
			'plugin_id'         => defined( 'BEEPTI_PLUGIN_ID' ) ? BEEPTI_PLUGIN_ID : 'titles',
			'product'           => self::PRODUCT,
			'plugin_version'    => BEEPTI_VERSION,
			'wp_version'        => (string) $wp_version,
			'wordpress_version' => (string) $wp_version,
			'php_version'       => PHP_VERSION,
			'site_install_id'   => $client->install_hash(),
			'site_id'           => $client->install_hash(),
			'site_hash'         => hash( 'sha256', $client->install_hash() ),
			'is_logged_in'      => $client->has_license(),
			'user_state'        => $client->has_license() ? 'connected' : 'guest',
			'environment'       => defined( 'BEEPTI_PLUGIN_ENV' ) ? BEEPTI_PLUGIN_ENV : 'production',
			'transport'         => $props['transport'] ?? 'wp_admin_server_bridge',
			'$lib'              => 'opptiai-titles-php',
			'$lib_version'      => BEEPTI_VERSION,
		];

		$host = wp_parse_url( home_url(), PHP_URL_HOST );
		if ( is_string( $host ) && $host !== '' ) {
			$base['site_host'] = $host;
			$base['host']      = $host;
		}

		$merged = array_merge( $base, $props );
		if ( empty( $merged['$insert_id'] ) ) {
			$merged['$insert_id'] = substr(
				sanitize_key( $event_name ) . ':' . $client->install_hash() . ':' . wp_generate_uuid4(),
				0,
				180
			);
		}

		return $merged;
	}

	/**
	 * @param array<string,mixed> $props Raw properties.
	 * @return array<string,mixed>
	 */
	private static function sanitize_properties( array $props ): array {
		$deny = [
			'email',
			'license_key',
			'password',
			'token',
			'jwt',
			'api_key',
			'secret',
			'title',
			'meta',
			'meta_desc',
			'seo_title',
			'prompt',
			'raw_response',
			'message',
		];
		$out = [];
		foreach ( $props as $k => $v ) {
			$key = is_string( $k ) ? sanitize_key( $k ) : '';
			if ( is_string( $k ) && in_array( $k, [ '$insert_id', '$set', '$set_once' ], true ) ) {
				$key = $k;
			}
			if ( '' === $key || strlen( $key ) > 48 ) {
				continue;
			}
			if ( in_array( $key, $deny, true ) ) {
				continue;
			}
			if ( is_bool( $v ) || is_int( $v ) || is_float( $v ) ) {
				$out[ $key ] = $v;
				continue;
			}
			if ( is_string( $v ) ) {
				$out[ $key ] = substr( sanitize_text_field( $v ), 0, 200 );
				continue;
			}
			if ( is_array( $v ) ) {
				// Flatten one level of scalars only.
				$flat = [];
				foreach ( $v as $sk => $sv ) {
					if ( is_string( $sk ) && ( is_scalar( $sv ) || null === $sv ) ) {
						$flat[ sanitize_key( $sk ) ] = is_string( $sv )
							? substr( sanitize_text_field( $sv ), 0, 120 )
							: $sv;
					}
				}
				if ( $flat ) {
					$out[ $key ] = $flat;
				}
			}
		}
		return $out;
	}
}
