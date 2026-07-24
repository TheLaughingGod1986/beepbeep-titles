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

    /** Valid event kinds the UI knows how to render. */
    private const KINDS = [ 'generated', 'edited', 'auto' ];

    /**
     * Append an event for a post. No-op if the post is gone or the kind is
     * unknown, so bad calls can never corrupt the log.
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

        $events = self::all();
        array_unshift( $events, [
            'post_id' => $post_id,
            'title'   => (string) $post->post_title,
            'kind'    => $kind,
            'time'    => time(),
        ] );

        update_option( self::OPTION, array_slice( $events, 0, self::MAX ), false );
    }

    /** @return array<int,array{post_id:int,title:string,kind:string,time:int}> newest-first */
    public static function all(): array {
        $events = get_option( self::OPTION, [] );
        return is_array( $events ) ? $events : [];
    }

    /** The most recent $limit events, newest-first. */
    public static function recent( int $limit = 8 ): array {
        return array_slice( self::all(), 0, max( 1, $limit ) );
    }
}
