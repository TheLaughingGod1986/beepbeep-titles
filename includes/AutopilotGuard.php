<?php
/**
 * Autopilot credit guard.
 *
 * Auto-generate on publish (the `auto_generate` setting) is available on any
 * paid plan; the backend owns plan and credit enforcement. When the shared
 * wallet runs out, the backend answers QUOTA_EXCEEDED. Without a guard every
 * later publish would make another doomed request and queue another warning.
 * This pauses Autopilot after the first credit error, shows one notice, and
 * resumes as soon as a quota read shows credits again (or after a cool-down).
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

defined( 'ABSPATH' ) || exit;

class AutopilotGuard {

    public const PAUSE_TRANSIENT = 'beepti_autopilot_credit_pause';

    /** Re-check at most hourly so a renewal or top-up is picked up without a visit. */
    public const PAUSE_TTL = 3600;

    /** True while Autopilot is paused because the wallet had no credits. */
    public static function is_paused(): bool {
        return (bool) get_transient( self::PAUSE_TRANSIENT );
    }

    /** Credit errors: QUOTA_EXCEEDED code or HTTP 402 from the backend. */
    public static function is_credit_error( $error ): bool {
        if ( ! ( $error instanceof \WP_Error ) ) {
            return false;
        }
        $data   = $error->get_error_data();
        $data   = is_array( $data ) ? $data : [];
        $code   = strtoupper( (string) ( $data['code'] ?? '' ) );
        $status = (int) ( $data['status'] ?? 0 );
        return $code === 'QUOTA_EXCEEDED' || $code === 'INSUFFICIENT_CREDITS' || $status === 402;
    }

    /** Pause Autopilot; returns true only the first time (so callers notify once). */
    public static function pause_for_credits(): bool {
        if ( self::is_paused() ) {
            return false;
        }
        set_transient( self::PAUSE_TRANSIENT, time(), self::PAUSE_TTL );
        return true;
    }

    public static function resume(): void {
        delete_transient( self::PAUSE_TRANSIENT );
    }

    /**
     * Resume when a fresh quota read shows credits remaining. Unknown or zero
     * leaves the pause in place.
     */
    public static function resume_if_credits( $quota ): void {
        if ( ! is_array( $quota ) ) {
            return;
        }
        $remaining = $quota['credits_remaining']
            ?? ( is_array( $quota['entitlement_state'] ?? null ) ? ( $quota['entitlement_state']['credits_remaining'] ?? null ) : null );
        if ( is_numeric( $remaining ) && (float) $remaining > 0 ) {
            self::resume();
        }
    }

    /** User-facing notice shown once when Autopilot pauses. */
    public static function paused_notice(): string {
        return __( 'OpptiAI Titles Autopilot is paused because your account has no credits left. New pages will be optimised again once credits are available.', 'beepbeep-titles' );
    }
}
