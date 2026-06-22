<?php
/**
 * Per-plugin credit attribution for the shared BeepBeep AI wallet.
 *
 * The backend reports a single combined credit total for the whole site, so it
 * can't tell the Settings card "which plugin spent what". We reconstruct that
 * locally, from the database:
 *
 *  - This plugin counts its own successful generations into a small per-period
 *    option ({@see self::record()}), reset when the billing month rolls over.
 *  - Sibling BeepBeep plugins keep their own logs; the ALT Text generator
 *    writes one row per generation into `{prefix}bbai_credit_usage`, which we
 *    read directly to attribute its share.
 *
 * Nothing here is authoritative for billing — the backend total still rules the
 * header — but it lets the breakdown show real, DB-backed per-plugin usage
 * instead of a single opaque bar.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

defined( 'ABSPATH' ) || exit;

class UsageMeter {

    private const OPTION = 'beepti_usage_meter';

    /** The ALT Text generator's per-generation usage table (without prefix). */
    private const ALT_TEXT_TABLE = 'bbai_credit_usage';

    /** Record this plugin's own credit spend. Called on each successful generation. */
    public static function record( int $credits = 1 ): void {
        if ( $credits < 1 ) {
            return;
        }
        $meter  = self::current();
        $period = self::period();

        $count = $meter['period'] === $period ? (int) $meter['count'] : 0;
        update_option( self::OPTION, [ 'period' => $period, 'count' => $count + $credits ], false );
    }

    /** This plugin's own credit usage for the current billing month. */
    public static function own_count(): int {
        $meter = self::current();
        return $meter['period'] === self::period() ? (int) $meter['count'] : 0;
    }

    /**
     * Per-plugin attribution map for the current billing month, e.g.
     * `[ 'title_meta' => 4, 'alt_text' => 2 ]`. Only plugins with a readable
     * local source appear; the card fills the rest of the catalog itself.
     *
     * @return array<string,int>
     */
    public static function breakdown(): array {
        $rows = [ 'title_meta' => self::own_count() ];

        $alt = self::alt_text_count();
        if ( null !== $alt ) {
            $rows['alt_text'] = $alt;
        }

        return $rows;
    }

    /**
     * Credits the ALT Text generator spent this billing month, read from its own
     * table. Returns null when the table isn't present (plugin never installed),
     * so the card can show "Not installed" rather than a misleading zero.
     */
    private static function alt_text_count(): ?int {
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
                self::period_start()
            )
        );
        return max( 0, (int) $sum );
    }

    /** @return array{period:string,count:int} */
    private static function current(): array {
        $meter = get_option( self::OPTION, [] );
        return [
            'period' => is_array( $meter ) && isset( $meter['period'] ) ? (string) $meter['period'] : '',
            'count'  => is_array( $meter ) && isset( $meter['count'] ) ? (int) $meter['count'] : 0,
        ];
    }

    /** Current billing period key, e.g. "2026-06" (site timezone). */
    private static function period(): string {
        return current_time( 'Y-m' );
    }

    /** First instant of the current billing month, in site time, as MySQL DATETIME. */
    private static function period_start(): string {
        return current_time( 'Y-m' ) . '-01 00:00:00';
    }
}
