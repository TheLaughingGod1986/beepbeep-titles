<?php
/**
 * Per-plugin credit attribution for the shared BeepBeep AI wallet.
 *
 * The backend reports a single combined credit total for the whole site, so it
 * can't tell the Settings card "which plugin spent what". We reconstruct that
 * locally, aligned to the backend's billing cycle:
 *
 *  - This plugin counts its own successful generations into a small option
 *    ({@see self::record()}), keyed by the current cycle so it resets when the
 *    wallet resets.
 *  - Sibling BeepBeep plugins keep their own logs; the ALT Text generator
 *    writes one row per generation into `{prefix}bbai_credit_usage`, which we
 *    sum over the same cycle window.
 *
 * The numbers only mean anything when they reconcile with the backend total —
 * credits spent before this tracking existed can't be recovered, so the card
 * shows the per-plugin split only once the attributed credits add up to the
 * total, and otherwise falls back to a single shared-usage bar.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

defined( 'ABSPATH' ) || exit;

class UsageMeter {

    private const OPTION       = 'beepti_usage_meter';
    private const CYCLE_OPTION = 'beepti_billing_cycle';

    /** The ALT Text generator's per-generation usage table (without prefix). */
    private const ALT_TEXT_TABLE = 'bbai_credit_usage';

    /** Record this plugin's own credit spend. Called on each successful generation. */
    public static function record( int $credits = 1 ): void {
        if ( $credits < 1 ) {
            return;
        }
        $cycle = self::current_cycle();
        $meter = self::current();

        $count = $meter['cycle'] === $cycle ? (int) $meter['count'] : 0;
        update_option( self::OPTION, [ 'cycle' => $cycle, 'count' => $count + $credits ], false );
    }

    /**
     * Remember the active billing cycle (the backend's reset date) so usage
     * recorded between quota fetches lands in the right window. Cheap no-op when
     * the cycle hasn't changed.
     */
    public static function remember_cycle( string $reset_date ): void {
        $cycle = self::cycle_id( $reset_date );
        if ( $cycle !== '' && $cycle !== self::current_cycle() ) {
            update_option( self::CYCLE_OPTION, $cycle, false );
        }
    }

    /** This plugin's own credit usage for the current billing cycle. */
    public static function own_count(): int {
        $meter = self::current();
        return $meter['cycle'] === self::current_cycle() ? (int) $meter['count'] : 0;
    }

    /**
     * Per-plugin attribution map for the current cycle, e.g.
     * `[ 'title_meta' => 5, 'alt_text' => 10 ]`. Only plugins with a readable
     * local source appear; the card fills the rest of the catalog itself.
     *
     * @param string $reset_date Backend cycle reset date (ISO/MySQL); '' falls
     *                           back to the current calendar month.
     * @return array<string,int>
     */
    public static function breakdown( string $reset_date = '' ): array {
        $rows = [ 'title_meta' => self::own_count() ];

        $alt = self::alt_text_count( $reset_date );
        if ( null !== $alt ) {
            $rows['alt_text'] = $alt;
        }

        return $rows;
    }

    /**
     * Credits the ALT Text generator spent in the current cycle, read from its
     * own table. Returns null when the table isn't present so the card can show
     * "Not installed" rather than a misleading zero.
     */
    private static function alt_text_count( string $reset_date ): ?int {
        global $wpdb;
        $table = $wpdb->prefix . self::ALT_TEXT_TABLE;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
        $exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );
        if ( $exists !== $table ) {
            return null;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
        $sum = $wpdb->get_var(
            $wpdb->prepare(
                // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
                "SELECT COALESCE(SUM(credits_used),0) FROM `{$table}` WHERE generated_at >= %s",
                self::cycle_start( $reset_date )
            )
        );
        return max( 0, (int) $sum );
    }

    /** @return array{cycle:string,count:int} */
    private static function current(): array {
        $meter = get_option( self::OPTION, [] );
        return [
            'cycle' => is_array( $meter ) && isset( $meter['cycle'] ) ? (string) $meter['cycle'] : '',
            'count' => is_array( $meter ) && isset( $meter['count'] ) ? (int) $meter['count'] : 0,
        ];
    }

    /** Identifier for the cycle currently in effect (the remembered reset date). */
    private static function current_cycle(): string {
        $cycle = get_option( self::CYCLE_OPTION, '' );
        return is_string( $cycle ) && $cycle !== '' ? $cycle : current_time( 'Y-m' );
    }

    /** Normalize a reset date into a stable cycle id, e.g. "2026-07-01". */
    private static function cycle_id( string $reset_date ): string {
        $ts = $reset_date !== '' ? strtotime( $reset_date ) : false;
        return $ts ? gmdate( 'Y-m-d', $ts ) : '';
    }

    /**
     * First instant of the current cycle as a MySQL DATETIME — one month before
     * the reset date (monthly wallet). Falls back to the start of the calendar
     * month when no reset date is known.
     */
    private static function cycle_start( string $reset_date ): string {
        $ts = $reset_date !== '' ? strtotime( $reset_date ) : false;
        if ( ! $ts ) {
            return current_time( 'Y-m' ) . '-01 00:00:00';
        }
        return gmdate( 'Y-m-d 00:00:00', strtotime( '-1 month', $ts ) );
    }
}
