<?php
/**
 * Sanitises beepti_settings patches before they are stored.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

defined( 'ABSPATH' ) || exit;

class SettingsSanitizer {

    private const ALLOWED = [
        'tone',
        'title_length',
        'meta_length',
        'auto_generate',
        'custom_instructions',
        'brand_name_override',
        'notifications',
        'scan_daily',
        'weekly_digest',
        'notify_new_pages',
        'notify_quota_warning',
        'delete_on_uninstall',
        'onboarding_complete',
        'scan_post_types',
    ];

    private const TONES = [ 'direct', 'benefit', 'authoritative', 'conversational' ];
    private const TITLE_LENGTHS = [ 'compact', 'standard', 'rich' ];
    private const META_LENGTHS  = [ 'brief', 'standard', 'detailed' ];

    /**
     * Canonicalise stored settings: map legacy notifications.* to flat keys.
     *
     * @return array<string, mixed>
     */
    public static function normalize_settings( array $settings ): array {
        if ( ! isset( $settings['notifications'] ) || ! is_array( $settings['notifications'] ) ) {
            return $settings;
        }

        $legacy_map = [
            'new_page'   => 'notify_new_pages',
            'digest'     => 'weekly_digest',
            'limit_warn' => 'notify_quota_warning',
        ];

        foreach ( $legacy_map as $legacy_key => $flat_key ) {
            if ( ! array_key_exists( $flat_key, $settings ) && array_key_exists( $legacy_key, $settings['notifications'] ) ) {
                $settings[ $flat_key ] = self::to_bool( $settings['notifications'][ $legacy_key ] );
            }
        }

        unset( $settings['notifications'] );

        return $settings;
    }

    /**
     * @return array<string, mixed> Sanitised key => value pairs to merge.
     */
    public static function sanitize_patch( array $incoming ): array {
        $patch = [];
        foreach ( self::ALLOWED as $key ) {
            if ( ! array_key_exists( $key, $incoming ) ) {
                continue;
            }
            $value = self::sanitize_value( $key, $incoming[ $key ] );
            if ( null !== $value ) {
                $patch[ $key ] = $value;
            }
        }
        return $patch;
    }

    /** @return mixed|null Null means skip this key. */
    public static function sanitize_value( string $key, $value ) {
        if ( 'tone' === $key ) {
            return in_array( $value, self::TONES, true ) ? $value : null;
        }
        if ( 'title_length' === $key ) {
            return in_array( $value, self::TITLE_LENGTHS, true ) ? $value : null;
        }
        if ( 'meta_length' === $key ) {
            return in_array( $value, self::META_LENGTHS, true ) ? $value : null;
        }
        if ( in_array( $key, [ 'auto_generate', 'scan_daily', 'weekly_digest', 'notify_new_pages', 'notify_quota_warning', 'delete_on_uninstall', 'onboarding_complete' ], true ) ) {
            return self::to_bool( $value );
        }
        if ( 'custom_instructions' === $key ) {
            return self::truncate_textarea( $value, 2000 );
        }
        if ( 'brand_name_override' === $key ) {
            return self::truncate_text( $value, 120 );
        }
        if ( 'notifications' === $key ) {
            return self::sanitize_notifications( $value );
        }
        if ( 'scan_post_types' === $key ) {
            return self::sanitize_post_types( $value );
        }
        return null;
    }

    /**
     * @return string[]|null Empty array means "scan every public post type"
     *                        (the default) — never null-out to "scan nothing".
     */
    private static function sanitize_post_types( $value ): ?array {
        if ( ! is_array( $value ) ) {
            return null;
        }
        $valid = array_intersect(
            array_map( 'sanitize_key', $value ),
            Scanner::all_public_post_types()
        );
        return array_values( $valid );
    }

    private static function to_bool( $value ): bool {
        return filter_var( $value, FILTER_VALIDATE_BOOLEAN );
    }

    private static function truncate_text( $value, int $max ): string {
        return substr( sanitize_text_field( (string) $value ), 0, $max );
    }

    private static function truncate_textarea( $value, int $max ): string {
        return substr( sanitize_textarea_field( (string) $value ), 0, $max );
    }

    /** @return array<string, bool>|null */
    private static function sanitize_notifications( $value ): ?array {
        if ( ! is_array( $value ) ) {
            return null;
        }
        $out = [];
        foreach ( [ 'new_page', 'digest', 'limit_warn' ] as $sub ) {
            if ( array_key_exists( $sub, $value ) ) {
                $out[ $sub ] = self::to_bool( $value[ $sub ] );
            }
        }
        return $out;
    }
}
