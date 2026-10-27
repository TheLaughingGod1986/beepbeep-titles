<?php
/**
 * WordPress.org review ask, shown once inside the plugin's own screen after
 * the first title or meta description is applied.
 *
 * No outbound calls and no tracking: it only stores a site option (first
 * success) and a per-user meta flag (answered).
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles;

defined( 'ABSPATH' ) || exit;

class ReviewPrompt {

    /** Site option: Unix time the first title/meta was applied. */
    public const FIRST_SUCCESS_OPTION = 'beepti_first_success_at';

    /** User meta: set once the user clicked "Leave a review" or dismissed. */
    public const DONE_META = 'beepti_review_prompt_done';

    /** WordPress.org review form for this plugin. */
    public const REVIEW_URL = 'https://wordpress.org/support/plugin/opptiai-titles/reviews/#new-post';

    /**
     * Record the first applied title/meta (idempotent; never overwrites).
     */
    public static function mark_first_success(): void {
        if ( get_option( self::FIRST_SUCCESS_OPTION ) ) {
            return;
        }
        add_option( self::FIRST_SUCCESS_OPTION, time(), '', false );
    }

    /**
     * Whether the current user has already answered the prompt.
     */
    public static function is_done( int $user_id = 0 ): bool {
        $user_id = $user_id > 0 ? $user_id : get_current_user_id();
        return $user_id <= 0 || (bool) get_user_meta( $user_id, self::DONE_META, true );
    }

    /**
     * Seed for the admin app (window.beeptiAdminData.reviewPrompt).
     *
     * `eligible` is true when a title/meta has already been applied on this
     * site; the app also shows the prompt straight after the first success in
     * the current session. `done` hides it for good.
     *
     * @return array{eligible:bool, done:bool, url:string}
     */
    public static function client_config(): array {
        return [
            'eligible' => (bool) get_option( self::FIRST_SUCCESS_OPTION ),
            'done'     => self::is_done(),
            'url'      => self::REVIEW_URL,
        ];
    }

    /**
     * POST /review-prompt { choice: review|dismiss } — never shown again.
     */
    public static function rest_record( \WP_REST_Request $req ): \WP_REST_Response {
        $choice = sanitize_key( (string) $req->get_param( 'choice' ) );
        update_user_meta( get_current_user_id(), self::DONE_META, 1 );
        return new \WP_REST_Response( [ 'done' => true, 'choice' => $choice ] );
    }
}
