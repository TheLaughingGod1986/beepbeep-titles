<?php
/**
 * Autopilot gap filling.
 *
 * Autopilot runs when a post is published with its SEO title or meta
 * description missing. It must only fill the empty fields: an SEO title the
 * site already has survives when only the meta description is missing, and
 * vice versa.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

defined( 'ABSPATH' ) || exit;

class AutopilotFill {

	/**
	 * Values Autopilot may write. A field that already has copy comes back as
	 * '' (MetaWriter::write() skips empty values), so it is never touched.
	 *
	 * @param array{title?:string, meta?:string} $current Existing SEO copy.
	 * @param array<string,mixed>                $result  Generated copy.
	 * @return array{title:string, meta:string}
	 */
	public static function writes( array $current, array $result ): array {
		return [
			'title' => self::is_empty( $current['title'] ?? '' ) ? trim( (string) ( $result['title'] ?? '' ) ) : '',
			'meta'  => self::is_empty( $current['meta'] ?? '' ) ? trim( (string) ( $result['meta'] ?? '' ) ) : '',
		];
	}

	/**
	 * The copy the post ends up with after writes(): existing values kept,
	 * gaps filled.
	 *
	 * @param array{title?:string, meta?:string} $current Existing SEO copy.
	 * @param array<string,mixed>                $result  Generated copy.
	 * @return array{title:string, meta:string}
	 */
	public static function after( array $current, array $result ): array {
		$writes = self::writes( $current, $result );
		return [
			'title' => $writes['title'] !== '' ? $writes['title'] : (string) ( $current['title'] ?? '' ),
			'meta'  => $writes['meta'] !== '' ? $writes['meta'] : (string) ( $current['meta'] ?? '' ),
		];
	}

	/** True when a field has no copy (whitespace counts as none). */
	public static function is_empty( mixed $value ): bool {
		return trim( (string) $value ) === '';
	}
}
