<?php
/**
 * Support / contact-form REST handler.
 *
 * Takes a short message from the Settings "Contact support" form, attaches a
 * diagnostics block gathered server-side (so it can't be spoofed by the
 * browser), emails the whole thing to the plugin's support inbox, and keeps a
 * bounded local record via {@see SupportLog}.
 *
 * @package BeepBeep_Titles
 */

namespace BeepBeep_Titles\Rest;

use BeepBeep_Titles\ActivityLog;
use BeepBeep_Titles\Api\Client;
use BeepBeep_Titles\Seo\MetaWriter;
use BeepBeep_Titles\SupportLog;
use BeepBeep_Titles\Telemetry;

defined( 'ABSPATH' ) || exit;

class SupportController {

    /** Where contact-form messages are delivered. */
    private const SUPPORT_INBOX = 'benoats86@gmail.com';

    public function __construct( private readonly Client $client ) {}

    public function contact( \WP_REST_Request $req ): \WP_REST_Response|\WP_Error {
        $message = trim( (string) $req->get_param( 'message' ) );
        if ( $message === '' ) {
            return new \WP_Error(
                'beepti_empty_message',
                __( 'Please enter a message before sending.', 'beepbeep-titles' ),
                [ 'status' => 400 ]
            );
        }

        $user = wp_get_current_user();

        // Sender identity: prefer what they typed, fall back to their WP account
        // so a reply always has somewhere to go.
        $name  = trim( (string) $req->get_param( 'name' ) );
        $name  = $name !== '' ? $name : (string) $user->display_name;
        $email = sanitize_email( (string) $req->get_param( 'email' ) );
        if ( ! is_email( $email ) ) {
            $email = (string) $user->user_email;
        }

        $diagnostics = $this->diagnostics( $email );
        $backend     = $this->send_backend_contact( $name, $email, $message, $diagnostics );
        if ( is_wp_error( $backend ) ) {
            $error_data = $backend->get_error_data();
            $error_data = is_array( $error_data ) ? $error_data : [];
            $status     = (int) ( $error_data['status'] ?? 500 );
            if ( $status < 500 ) {
                SupportLog::record( $name, $email, $message, false );
                return ErrorResponder::from_wp_error( $backend );
            }
        }

        $emailed = ! is_wp_error( $backend ) || $this->send_email( $name, $email, $message, $diagnostics );

        SupportLog::record( $name, $email, $message, $emailed );

        if ( ! $emailed ) {
            // We logged it locally, but couldn't hand it to the mail server.
            return new \WP_Error(
                'beepti_mail_failed',
                __( "We couldn't send your message right now. It's been saved — please try again shortly or email support directly.", 'beepbeep-titles' ),
                [ 'status' => 502 ]
            );
        }

        Telemetry::capture( 'support_submitted', [ 'via' => is_wp_error( $backend ) ? 'email_fallback' : 'backend' ] );

        return new \WP_REST_Response( [
            'sent'    => true,
            'message' => ! is_wp_error( $backend ) && isset( $backend['message'] )
                ? (string) $backend['message']
                : __( 'Thanks! Your message has been sent to support.', 'beepbeep-titles' ),
        ] );
    }

    /**
     * Gather a support-friendly snapshot of the site + plugin state, plus the
     * recent activity log. Values are read server-side so they're trustworthy.
     *
     * @return array<string,mixed>
     */
    private function diagnostics( string $reply_email ): array {
        global $wp_version;

        $key    = $this->client->get_license_key();
        $masked = $key !== '' ? '…' . substr( $key, -4 ) : '';

        return [
            'Plugin'        => 'OpptiAI Titles ' . BEEPTI_VERSION,
            'Site'          => get_bloginfo( 'name' ) . ' (' . get_site_url() . ')',
            'WordPress'     => (string) $wp_version,
            'PHP'           => PHP_VERSION,
            'Active theme'  => wp_get_theme()->get( 'Name' ),
            'SEO plugin'    => MetaWriter::active(),
            'License'       => $this->client->has_license() ? 'Connected (' . $masked . ')' : 'Not connected',
            'Account email' => $this->client->get_account_email() ?: '—',
            'Reply-to'      => $reply_email,
            'WP user'       => sprintf(
                '%s <%s> · roles: %s',
                wp_get_current_user()->display_name,
                wp_get_current_user()->user_email,
                implode( ', ', (array) wp_get_current_user()->roles )
            ),
            'Backend'       => BEEPTI_API_BASE,
            'Environment'   => BEEPTI_PLUGIN_ENV,
        ];
    }

    /**
     * Compose and send the support email. Plain text, with a diagnostics block
     * and the last few activity-log events appended automatically.
     */
    private function send_email( string $name, string $email, string $message, array $diagnostics ): bool {
        $site    = get_bloginfo( 'name' );
        $subject = sprintf(
            /* translators: %s: site name. */
            __( '[OpptiAI Titles] Support request from %s', 'beepbeep-titles' ),
            $site
        );

        $lines   = [];
        $lines[] = sprintf( 'From: %s <%s>', $name, $email );
        $lines[] = '';
        $lines[] = '─── Message ───';
        $lines[] = $message;
        $lines[] = '';
        $lines[] = '─── Diagnostics ───';
        foreach ( $diagnostics as $label => $value ) {
            $lines[] = sprintf( '%-14s %s', $label . ':', $value );
        }

        $events = $this->recent_visible_activity( 10 );
        if ( $events ) {
            $now     = time();
            $lines[] = '';
            $lines[] = '─── Recent activity ───';
            foreach ( $events as $event ) {
                $when = isset( $event['time'] ) && (int) $event['time'] > 0
                    ? human_time_diff( (int) $event['time'], $now ) . ' ago'
                    : '';
                $lines[] = sprintf(
                    '· [%s] %s%s',
                    (string) ( $event['kind'] ?? '' ),
                    (string) ( $event['title'] ?? '' ),
                    $when !== '' ? ' (' . $when . ')' : ''
                );
            }
        }

        $body = implode( "\n", $lines );

        // Reply-To the user so a response goes straight back to them; let WP's
        // default From handle the envelope sender (avoids SPF/DMARC spoofing).
        $headers = [ sprintf( 'Reply-To: %s <%s>', $name, $email ) ];

        return (bool) wp_mail( self::SUPPORT_INBOX, $subject, $body, $headers );
    }

    private function send_backend_contact( string $name, string $email, string $message, array $diagnostics ): array|\WP_Error {
        global $wp_version;

        $body_message = $message;
        if ( strlen( trim( $body_message ) ) < 10 ) {
            $body_message .= "\n\n(Short support message.)";
        }

        return $this->client->support_contact( [
            'name'              => $name,
            'email'             => $email,
            'subject'           => '[OpptiAI Titles] Support request',
            'message'           => $body_message,
            'wp_version'        => (string) $wp_version,
            'plugin_version'    => BEEPTI_VERSION,
            'support_recipient' => self::SUPPORT_INBOX,
            'include_logs'      => '1',
            'diagnostic_bundle' => $this->diagnostic_bundle( $diagnostics ),
        ] );
    }

    private function diagnostic_bundle( array $diagnostics ): string {
        $lines = [ 'Diagnostics' ];
        foreach ( $diagnostics as $label => $value ) {
            $lines[] = sprintf( '%s: %s', $label, $value );
        }

        $events = $this->recent_visible_activity( 10 );
        if ( $events ) {
            $lines[] = '';
            $lines[] = 'Recent activity';
            $now     = time();
            foreach ( $events as $event ) {
                $when = isset( $event['time'] ) && (int) $event['time'] > 0
                    ? human_time_diff( (int) $event['time'], $now ) . ' ago'
                    : '';
                $lines[] = sprintf(
                    '[%s] %s%s',
                    (string) ( $event['kind'] ?? '' ),
                    (string) ( $event['title'] ?? '' ),
                    $when !== '' ? ' (' . $when . ')' : ''
                );
            }
        }

        return substr( implode( "\n", $lines ), 0, 20000 );
    }

    /**
     * Recent activity entries the current administrator is allowed to inspect.
     *
     * @return array<int,array<string,mixed>>
     */
    private function recent_visible_activity( int $limit ): array {
        $visible = [];

        foreach ( ActivityLog::all() as $event ) {
            $post_id = absint( $event['post_id'] ?? 0 );
            if ( $post_id <= 0 || ! current_user_can( 'edit_post', $post_id ) ) {
                continue;
            }

            $visible[] = $event;
            if ( count( $visible ) >= $limit ) {
                break;
            }
        }

        return $visible;
    }
}
