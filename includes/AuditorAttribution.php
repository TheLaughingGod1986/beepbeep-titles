<?php
/**
 * Website Auditor sign-up attribution.
 *
 * The OpptiAI Website Auditor's Fix buttons open Titles with
 * `source=auditor&finding=<check id>` (Auditor v1 also sends
 * `auditor_source=<check id>`). The page load remembers the check for the
 * current user for a short window, and the sign-up request to the OpptiAI
 * backend (/auth/register) carries it as `auditor_source` + `finding`.
 *
 * This is account attribution sent with the user's own sign-up request; it is
 * never sent to PostHog and does not depend on usage-stats consent.
 *
 * Mirrors includes/helpers-auditor-attribution.php in OpptiAI Alt Text.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

defined( 'ABSPATH' ) || exit;

class AuditorAttribution {

	/** Per-user meta key holding the remembered deep-link. */
	public const META_KEY = 'beepti_auditor_attribution';

	/** How long a deep-link is remembered (30 minutes, same as Alt Text). */
	public const TTL = 1800;

	/** Longest raw check id accepted from a deep-link. */
	public const MAX_LEN = 64;

	/**
	 * Website Auditor check ids Titles recognises. Must match
	 * tests/fixtures/auditor-check-ids.json exactly (and the Alt Text,
	 * Auditor and backend copies); the PHPUnit drift test fails otherwise.
	 *
	 * @return string[]
	 */
	public static function known_findings(): array {
		return [
			'missing_alt',
			'needs_review',
			'missing_title',
			'duplicate_title',
			'missing_meta',
			'title_too_long',
			'orphan_pages',
			'thin_links',
			'search_engines_discouraged',
			'https_not_enforced',
			'robots_txt',
			'sitemap_missing',
			'llms_txt',
			'noindex_pages',
			'canonical_missing',
			'og_tags_missing',
			'schema',
			'performance',
			'accessibility',
		];
	}

	/**
	 * Auditor 0.8.x check ids renamed in Auditor v1 (old => new).
	 *
	 * @return array<string,string>
	 */
	public static function aliases(): array {
		return [
			'search_indexing' => 'search_engines_discouraged',
			'https'           => 'https_not_enforced',
			'sitemap'         => 'sitemap_missing',
			'canonical'       => 'canonical_missing',
			'open_graph'      => 'og_tags_missing',
		];
	}

	/**
	 * Clean a raw check id, map an old id to its new name, and return '' for
	 * anything not on the allow-list.
	 *
	 * @param mixed $raw Raw (already unslashed) request value.
	 */
	public static function normalize_finding( $raw ): string {
		if ( ! is_scalar( $raw ) ) {
			return '';
		}
		$raw = (string) $raw;
		// Length limit applies to the raw value, before sanitize_key(), so an
		// over-long value can't be accepted by being shortened.
		if ( '' === $raw || strlen( $raw ) > self::MAX_LEN ) {
			return '';
		}
		$id      = sanitize_key( $raw );
		$aliases = self::aliases();
		if ( isset( $aliases[ $id ] ) ) {
			$id = $aliases[ $id ];
		}
		return in_array( $id, self::known_findings(), true ) ? $id : '';
	}

	/**
	 * Valid check id from the current request's `finding` or
	 * `auditor_source` arg, or '' when neither holds one.
	 */
	public static function finding_from_request(): string {
		foreach ( [ 'finding', 'auditor_source' ] as $param ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only attribution tag from an admin link, no state change.
			if ( ! isset( $_GET[ $param ] ) || ! is_scalar( $_GET[ $param ] ) ) {
				continue;
			}
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- normalize_finding() length-checks the raw value, runs sanitize_key() and an allow-list.
			$finding = self::normalize_finding( wp_unslash( (string) $_GET[ $param ] ) );
			if ( '' !== $finding ) {
				return $finding;
			}
		}
		return '';
	}

	/**
	 * admin_init: when a Titles screen is opened from an Auditor deep-link,
	 * remember the check for this user. Unknown or junk ids store nothing.
	 */
	public static function remember(): void {
		if ( ! is_admin() || wp_doing_ajax() ) {
			return;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Admin page routing only.
		$page = isset( $_GET['page'] ) && is_scalar( $_GET['page'] ) ? sanitize_key( wp_unslash( (string) $_GET['page'] ) ) : '';
		if ( BEEPTI_SLUG !== $page ) {
			return;
		}
		$user_id = get_current_user_id();
		if ( $user_id <= 0 ) {
			return;
		}
		$finding = self::finding_from_request();
		if ( '' === $finding ) {
			return;
		}
		update_user_meta( $user_id, self::META_KEY, [
			'finding'    => $finding,
			'expires_at' => time() + self::TTL,
		] );
	}

	/**
	 * Remembered check id for the current user, or '' (expired entries are
	 * deleted).
	 */
	public static function stored_finding(): string {
		$user_id = get_current_user_id();
		if ( $user_id <= 0 ) {
			return '';
		}
		$stored = get_user_meta( $user_id, self::META_KEY, true );
		if ( ! is_array( $stored ) ) {
			return '';
		}
		if ( (int) ( $stored['expires_at'] ?? 0 ) < time() ) {
			delete_user_meta( $user_id, self::META_KEY );
			return '';
		}
		return self::normalize_finding( $stored['finding'] ?? '' );
	}

	/**
	 * Fields to add to the /auth/register body: `auditor_source=auditor` and
	 * `finding=<id>` while a valid deep-link is remembered, else nothing.
	 *
	 * @return array<string,string>
	 */
	public static function signup_fields(): array {
		$finding = self::stored_finding();
		if ( '' === $finding ) {
			return [];
		}
		return [
			'auditor_source' => 'auditor',
			'finding'        => $finding,
		];
	}
}
