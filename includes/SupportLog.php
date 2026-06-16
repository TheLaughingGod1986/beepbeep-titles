<?php
/**
 * Support-request log.
 *
 * A small, bounded record of the contact-form messages users send from the
 * Settings screen. Stored in a single option (newest-first, capped at MAX) so
 * it costs one row and never grows unbounded — and so the site owner can see a
 * local history even if an outgoing email is lost.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

defined( 'ABSPATH' ) || exit;

class SupportLog {

    private const OPTION = 'bbt_support_log';
    private const MAX    = 50;

    /**
     * Append a submitted support request. Returns the stored record (with its
     * timestamp) so the caller can echo it back to the UI.
     *
     * @return array{name:string,email:string,message:string,emailed:bool,time:int}
     */
    public static function record( string $name, string $email, string $message, bool $emailed ): array {
        $entry = [
            'name'    => $name,
            'email'   => $email,
            'message' => $message,
            'emailed' => $emailed,
            'time'    => time(),
        ];

        $entries = self::all();
        array_unshift( $entries, $entry );
        update_option( self::OPTION, array_slice( $entries, 0, self::MAX ), false );

        return $entry;
    }

    /** @return array<int,array> newest-first */
    public static function all(): array {
        $entries = get_option( self::OPTION, [] );
        return is_array( $entries ) ? $entries : [];
    }

    /** The most recent $limit requests, newest-first. */
    public static function recent( int $limit = 10 ): array {
        return array_slice( self::all(), 0, max( 1, $limit ) );
    }
}
