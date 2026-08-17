<?php
/**
 * Recent-activity log.
 *
 * A small, bounded record of the optimisation events the Dashboard's
 * "Latest improvements" strip renders. Stored in a single autoloaded option
 * (newest-first, capped at MAX) so it costs one row and never grows unbounded.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

defined( 'ABSPATH' ) || exit;

class ActivityLog {

    private const OPTION = 'beepti_activity';
    private const MAX    = 30;

    /**
     * Same post + kind within this window collapses into one row instead of
     * stacking Undo spam (overlapping bulk polls, remounted drawers, etc.).
     */
    private const COALESCE_SECONDS = 120;

    /** Valid event kinds the UI knows how to render. */
    private const KINDS = [ 'generated', 'edited', 'auto' ];

    /**
     * Append an event for a post. No-op if the post is gone or the kind is
     * unknown, so bad calls can never corrupt the log.
     *
     * Rapid duplicate writes for the same post + kind are coalesced: the
     * existing row is refreshed (title + time) and moved to the front rather
     * than stacking a second identical Undo entry.
     *
     * @param string $kind One of self::KINDS.
     */
    public static function record( int $post_id, string $kind ): void {
        if ( ! in_array( $kind, self::KINDS, true ) ) {
            return;
        }
        $post = get_post( $post_id );
        if ( ! $post ) {
            return;
        }

        $now    = time();
        $events = self::all();

        foreach ( $events as $i => $event ) {
            if ( (int) ( $event['post_id'] ?? 0 ) !== $post_id ) {
                continue;
            }
            if ( (string) ( $event['kind'] ?? '' ) !== $kind ) {
                continue;
            }
            $age = $now - (int) ( $event['time'] ?? 0 );
            if ( $age >= 0 && $age <= self::COALESCE_SECONDS ) {
                unset( $events[ $i ] );
                $events = array_values( $events );
                break;
            }
        }

        array_unshift( $events, [
            'post_id' => $post_id,
            'title'   => (string) $post->post_title,
            'kind'    => $kind,
            'time'    => $now,
        ] );

        update_option( self::OPTION, array_slice( $events, 0, self::MAX ), false );
    }

    /** @return array<int,array{post_id:int,title:string,kind:string,time:int}> newest-first */
    public static function all(): array {
        $events = get_option( self::OPTION, [] );
        return is_array( $events ) ? $events : [];
    }

    /**
     * Newest-first feed with one row per post (latest event wins). Collapses
     * historical duplicates already stored in the option.
     *
     * @param array<int,array{post_id?:int,title?:string,kind?:string,time?:int}> $events
     * @return array<int,array{post_id:int,title:string,kind:string,time:int}>
     */
    public static function unique_by_post( array $events ): array {
        $seen = [];
        $out  = [];
        foreach ( $events as $event ) {
            if ( ! is_array( $event ) ) {
                continue;
            }
            $post_id = (int) ( $event['post_id'] ?? 0 );
            if ( $post_id <= 0 || isset( $seen[ $post_id ] ) ) {
                continue;
            }
            $seen[ $post_id ] = true;
            $out[]            = $event;
        }
        return $out;
    }

    /** The most recent $limit events, newest-first, one row per post. */
    public static function recent( int $limit = 8 ): array {
        return array_slice( self::unique_by_post( self::all() ), 0, max( 1, $limit ) );
    }

    /**
     * Distinct posts optimised (generated or autopilot) since $since_unix.
     * Powers "Recent Progress → items improved this week" so it matches
     * the same event stream as "Latest Improvements".
     */
    public static function count_improved_since( int $since_unix ): int {
        $seen = [];
        foreach ( self::all() as $event ) {
            $kind = (string) ( $event['kind'] ?? '' );
            if ( $kind !== 'generated' && $kind !== 'auto' ) {
                continue;
            }
            $time = (int) ( $event['time'] ?? 0 );
            if ( $time < $since_unix ) {
                continue;
            }
            $post_id = (int) ( $event['post_id'] ?? 0 );
            if ( $post_id > 0 ) {
                $seen[ $post_id ] = true;
            }
        }
        return count( $seen );
    }

    /**
     * Distinct posts per optimisation kind since $since_unix.
     * Used by Recent Progress for the manual vs autopilot breakdown.
     *
     * @return array{generated:int,auto:int}
     */
    public static function count_by_kind_since( int $since_unix ): array {
        $seen = [
            'generated' => [],
            'auto'      => [],
        ];
        foreach ( self::all() as $event ) {
            $kind = (string) ( $event['kind'] ?? '' );
            if ( $kind !== 'generated' && $kind !== 'auto' ) {
                continue;
            }
            $time = (int) ( $event['time'] ?? 0 );
            if ( $time < $since_unix ) {
                continue;
            }
            $post_id = (int) ( $event['post_id'] ?? 0 );
            if ( $post_id > 0 ) {
                $seen[ $kind ][ $post_id ] = true;
            }
        }
        return [
            'generated' => count( $seen['generated'] ),
            'auto'      => count( $seen['auto'] ),
        ];
    }
}
