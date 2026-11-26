<?php
/**
 * Dev-only (1.0.32 d + e): first-run usage-stats card and the plugin_activated
 * backfill. Opt-in only: nothing reaches PostHog before "Share usage stats",
 * "No thanks" sends nothing, accept sends consent_granted (guest_card), and a
 * site that never sent plugin_activated sends it once on opt-in, including
 * upgrades from builds that saved no has_* flags. No WordPress, no network:
 * wp_remote_post is a recorder. PHP 7.4 syntax.
 */
namespace BeepBeep_Titles\Api {
	class Client {
		public function has_license() { return false; }
	}
}
namespace BeepBeep_Titles {
	class Plugin { public static function sync_scheduled_scan() {} }
	class MoreFromOppti {
		public static function installed_flags() { return [ 'has_alt_text' => true, 'has_titles' => true, 'has_il' => false, 'has_auditor' => false ]; }
	}
}
namespace {
	define( 'ABSPATH', '/tmp/' );
	define( 'BEEPTI_VERSION', '1.0.32' );
	$GLOBALS['o'] = []; $GLOBALS['http'] = []; $GLOBALS['caps'] = [ 'manage_options' ];
	function get_option( $k, $d = false ) { return array_key_exists( $k, $GLOBALS['o'] ) ? $GLOBALS['o'][ $k ] : $d; }
	function update_option( $k, $v, $a = null ) { $GLOBALS['o'][ $k ] = $v; return true; }
	function add_option( $k, $v, $dep = '', $a = null ) { if ( array_key_exists( $k, $GLOBALS['o'] ) ) { return false; } $GLOBALS['o'][ $k ] = $v; return true; }
	function delete_option( $k ) { unset( $GLOBALS['o'][ $k ] ); return true; }
	function apply_filters( $h, $v ) { return $v; }
	function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
	function sanitize_text_field( $s ) { return trim( strip_tags( (string) $s ) ); }
	function sanitize_textarea_field( $s ) { return trim( (string) $s ); }
	function untrailingslashit( $s ) { return rtrim( $s, '/' ); }
	function wp_json_encode( $d ) { return json_encode( $d ); }
	function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
	function home_url() { return 'https://customer-site.example'; }
	function wp_generate_uuid4() { return '00000000-0000-4000-a000-000000000001'; }
	function wp_remote_post( $url, $args ) { $GLOBALS['http'][] = json_decode( $args['body'], true ); return []; }
	function current_user_can( $c ) { return in_array( $c, $GLOBALS['caps'], true ); }
	class WP_REST_Request {
		private $j;
		public function __construct( array $j ) { $this->j = $j; }
		public function get_json_params() { return $this->j; }
		public function get_param( $k ) { return $this->j[ $k ] ?? null; }
	}
	class WP_REST_Response {
		public $data;
		public function __construct( $data = null, $status = 200 ) { $this->data = $data; }
	}

	$root = getenv( 'BEEPTI_ROOT' ) ?: dirname( __DIR__, 2 );
	foreach ( [ 'SettingsSanitizer', 'Telemetry', 'Rest/TelemetryController', 'Rest/PagesController' ] as $f ) { require_once $root . "/includes/$f.php"; }
	use BeepBeep_Titles\Telemetry;
	use BeepBeep_Titles\Rest\TelemetryController;
	use BeepBeep_Titles\Rest\PagesController;

	$fail = 0;
	function cc_check( $c, $l ) { global $fail; if ( ! $c ) { fwrite( STDERR, "FAIL: $l\n" ); $fail++; } else { echo "ok - $l\n"; } }
	function cc_events() { return array_map( function ( $p ) { return $p['event']; }, $GLOBALS['http'] ); }
	function cc_reset( array $opts ) { $GLOBALS['o'] = $opts; $GLOBALS['http'] = []; }
	$tc = new TelemetryController();

	// Card visibility.
	cc_reset( [] );
	cc_check( true === Telemetry::should_show_consent_card(), 'card shows for an admin with no saved answer' );
	cc_check( true === Telemetry::client_config()['showConsentCard'] && false === Telemetry::client_config()['enabled'], 'client config: card on, usage stats off' );
	$GLOBALS['caps'] = [ 'edit_posts' ];
	cc_check( false === Telemetry::should_show_consent_card(), 'card hidden for non-admins' );
	$GLOBALS['caps'] = [ 'manage_options' ];
	cc_reset( [ Telemetry::CONSENT_OPTION => 'no' ] );
	cc_check( false === Telemetry::should_show_consent_card(), 'card hidden once answered no' );
	cc_reset( [ Telemetry::CONSENT_OPTION => 'yes' ] );
	cc_check( false === Telemetry::should_show_consent_card(), 'card hidden once answered yes' );

	// Nothing before the answer: capture is a no-op with no saved answer.
	cc_reset( [] );
	Telemetry::capture( 'plugin_opened' );
	Telemetry::record_opt_in_activation();
	cc_check( [] === $GLOBALS['http'], 'nothing sent before the card is answered' );

	// "No thanks": answer saved, nothing sent, queue dropped.
	cc_reset( [ Telemetry::LIFECYCLE_QUEUE_OPTION => [ [ 'event' => 'plugin_updated' ] ] ] );
	$r = $tc->set_consent( new WP_REST_Request( [ 'opt_in' => false, 'source' => 'guest_card' ] ) );
	cc_check( 'no' === get_option( Telemetry::CONSENT_OPTION ) && false === $r->data['usage_stats_opt_in'], 'No thanks saves no' );
	cc_check( 'guest_card' === get_option( Telemetry::CONSENT_SOURCE_OPTION ), 'No thanks records the card as the source' );
	cc_check( [] === $GLOBALS['http'], 'No thanks sends nothing' );
	cc_check( false === get_option( Telemetry::LIFECYCLE_QUEUE_OPTION ), 'No thanks drops anything queued' );

	// Accept from the card on a fresh install (activation flags saved, never sent).
	cc_reset( [ Telemetry::ACTIVATION_MARKER => 1700000000, 'beepti_activation_oppti_plugins' => [ 'has_alt_text' => false, 'has_titles' => true, 'has_il' => true, 'has_auditor' => false ] ] );
	$r = $tc->set_consent( new WP_REST_Request( [ 'opt_in' => true, 'source' => 'guest_card' ] ) );
	cc_check( 'yes' === get_option( Telemetry::CONSENT_OPTION ) && true === $r->data['usage_stats_opt_in'], 'Share usage stats saves yes' );
	cc_check( [ 'consent_granted', 'plugin_activated' ] === cc_events(), 'accept sends consent_granted then the plugin_activated backfill' );
	cc_check( 'guest_card' === $GLOBALS['http'][0]['properties']['consent_source'], 'consent_granted carries consent_source guest_card' );
	$act = $GLOBALS['http'][1]['properties'];
	cc_check( 'opt_in_snapshot' === $act['lifecycle_delivery'] && 'guest_card' === $act['consent_source'], 'backfill is marked opt_in_snapshot from the card' );
	cc_check( false === $act['has_alt_text'] && true === $act['has_il'], 'backfill uses the flags saved at activation' );
	cc_check( true === ( $act['backfill'] ?? null ), 'backfilled plugin_activated carries backfill: true' );

	// Accept again (already yes): nothing new.
	$GLOBALS['http'] = [];
	$tc->set_consent( new WP_REST_Request( [ 'opt_in' => true, 'source' => 'guest_card' ] ) );
	cc_check( [] === $GLOBALS['http'], 'saving yes again sends nothing' );

	// Off then on again: consent_granted again, plugin_activated never twice.
	Telemetry::set_consent( false, 'settings' );
	Telemetry::set_consent( true, 'settings' );
	cc_check( [ 'consent_granted' ] === cc_events(), 'turning back on sends consent_granted only' );
	cc_check( 'settings' === $GLOBALS['http'][0]['properties']['consent_source'], 'Settings toggle source is settings' );

	// (e) Upgrade from 1.0.30: activation marker but no saved flags.
	cc_reset( [ Telemetry::ACTIVATION_MARKER => 1690000000, Telemetry::CONSENT_OPTION => 'no' ] );
	Telemetry::set_consent( true, 'settings' );
	cc_check( [ 'consent_granted', 'plugin_activated' ] === cc_events(), '1.0.30 upgrade shape sends the backfill once' );
	cc_check( true === $GLOBALS['http'][1]['properties']['has_alt_text'] && false === $GLOBALS['http'][1]['properties']['has_auditor'], 'missing flags are taken from the plugins installed now' );
	cc_check( true === ( $GLOBALS['http'][1]['properties']['backfill'] ?? null ), '1.0.30 upgrade backfill carries backfill: true' );

	// (e) No marker and no flags at all.
	cc_reset( [] );
	Telemetry::set_consent( true, 'guest_card' );
	cc_check( [ 'consent_granted', 'plugin_activated' ] === cc_events(), 'no-marker shape sends the backfill once' );
	cc_check( true === ( $GLOBALS['http'][1]['properties']['backfill'] ?? null ), 'no-marker backfill carries backfill: true' );
	cc_check( ! array_key_exists( 'backfill', $GLOBALS['http'][0]['properties'] ), 'consent_granted has no backfill key' );
	$GLOBALS['http'] = [];
	Telemetry::record_opt_in_activation();
	cc_check( [] === $GLOBALS['http'], 'backfill never sent twice' );

	// (e) Activation already sent with consent: no backfill.
	cc_reset( [ Telemetry::ACTIVATION_SENT_OPTION => 1700000000, Telemetry::CONSENT_OPTION => 'no' ] );
	Telemetry::set_consent( true, 'settings' );
	cc_check( [ 'consent_granted' ] === cc_events(), 'no backfill when plugin_activated was already sent' );

	// Genuine fresh install with consent: plugin_activated has no backfill key.
	cc_reset( [ Telemetry::CONSENT_OPTION => 'yes' ] );
	Telemetry::on_activate();
	Telemetry::flush_lifecycle_queue();
	$fresh = array_values( array_filter( $GLOBALS['http'], function ( $p ) { return 'plugin_activated' === $p['event']; } ) );
	cc_check( 1 === count( $fresh ) && 'queued_flush' === $fresh[0]['properties']['lifecycle_delivery'], 'fresh install sends one plugin_activated' );
	cc_check( ! array_key_exists( 'backfill', $fresh[0]['properties'] ), 'fresh-install plugin_activated omits backfill' );
	$GLOBALS['http'] = [];
	Telemetry::record_opt_in_activation();
	cc_check( [] === $GLOBALS['http'], 'fresh install with consent: no later backfill' );

	// QA P2: fresh vs upgraded install. Plugin::activate writes these before
	// Telemetry::on_activate on every activation, fresh or not.
	$activate_defaults = [ 'beepti_settings' => [ 'tone' => 'direct' ], 'beepti_install_hash' => 'h', 'beepti_site_fingerprint' => 'f', 'beepti_seo_plugin' => 'yoast' ];

	// (1) Fresh 1.0.32 install, no consent at activation, opts in on the first-run card.
	cc_reset( $activate_defaults );
	Telemetry::on_activate();
	cc_check( BEEPTI_VERSION === get_option( Telemetry::FIRST_VERSION_OPTION ), 'fresh install records the first version' );
	cc_check( [] === $GLOBALS['http'], 'fresh install without consent sends nothing at activation' );
	( new TelemetryController() )->set_consent( new WP_REST_Request( [ 'opt_in' => true, 'source' => 'guest_card' ] ) );
	cc_check( [ 'consent_granted', 'plugin_activated' ] === cc_events(), 'fresh install card opt-in sends consent_granted and plugin_activated' );
	cc_check( ! array_key_exists( 'backfill', $GLOBALS['http'][1]['properties'] ), 'fresh install card opt-in: plugin_activated has no backfill key' );

	// (3) Fresh 1.0.32 install, opts in later through Settings.
	cc_reset( $activate_defaults );
	Telemetry::on_activate();
	$GLOBALS['http'] = [];
	( new PagesController( new BeepBeep_Titles\Api\Client() ) )->update_settings( new WP_REST_Request( [ 'usage_stats_opt_in' => true ] ) );
	$act = array_values( array_filter( $GLOBALS['http'], function ( $p ) { return 'plugin_activated' === $p['event']; } ) );
	cc_check( 1 === count( $act ) && ! array_key_exists( 'backfill', $act[0]['properties'] ), 'fresh install Settings opt-in: plugin_activated has no backfill key' );

	// (2) Upgraded from 1.0.31 (marker + version recorded, no first version): update does not run
	// the activation hook, and a later deactivate/reactivate must not mark it fresh either.
	cc_reset( $activate_defaults + [ Telemetry::ACTIVATION_MARKER => 1700000000, Telemetry::CURRENT_VERSION_OPTION => '1.0.31', 'beepti_activation_oppti_plugins' => [ 'has_titles' => true ] ] );
	Telemetry::maybe_record_update();
	Telemetry::on_activate();
	cc_check( false === get_option( Telemetry::FIRST_VERSION_OPTION ), 'upgraded install never gets a first version' );
	( new TelemetryController() )->set_consent( new WP_REST_Request( [ 'opt_in' => true, 'source' => 'guest_card' ] ) );
	$act = array_values( array_filter( $GLOBALS['http'], function ( $p ) { return 'plugin_activated' === $p['event']; } ) );
	cc_check( 1 === count( $act ) && true === ( $act[0]['properties']['backfill'] ?? null ), 'upgraded install card opt-in: backfill true' );

	// (2b) Upgraded through Settings: same flag.
	cc_reset( $activate_defaults + [ Telemetry::ACTIVATION_MARKER => 1700000000, Telemetry::CURRENT_VERSION_OPTION => '1.0.31' ] );
	( new PagesController( new BeepBeep_Titles\Api\Client() ) )->update_settings( new WP_REST_Request( [ 'usage_stats_opt_in' => true ] ) );
	$act = array_values( array_filter( $GLOBALS['http'], function ( $p ) { return 'plugin_activated' === $p['event']; } ) );
	cc_check( 1 === count( $act ) && true === ( $act[0]['properties']['backfill'] ?? null ), 'upgraded install Settings opt-in: backfill true' );

	// (2c) Very old install from before the activation marker, reactivated after upgrading:
	// earlier state (last scan, activity) means it is not treated as fresh.
	cc_reset( $activate_defaults + [ 'beepti_last_scan' => '2026-01-01 00:00:00', 'beepti_activity' => [ [ 'id' => 1 ] ] ] );
	Telemetry::on_activate();
	cc_check( false === get_option( Telemetry::FIRST_VERSION_OPTION ), 'pre-marker install reactivated: no first version' );

	// First version is never overwritten.
	cc_reset( [ Telemetry::FIRST_VERSION_OPTION => '1.0.32' ] );
	Telemetry::on_activate();
	cc_check( '1.0.32' === get_option( Telemetry::FIRST_VERSION_OPTION ), 'first version is not overwritten' );
	cc_check( false === strpos( (string) file_get_contents( $root . '/uninstall.php' ), 'FIRST_VERSION' ) && 0 === strpos( Telemetry::FIRST_VERSION_OPTION, 'beepti_' ), 'first version option is covered by the uninstall beepti_ sweep' );

	// Settings toggle goes through the same path.
	cc_reset( [] );
	( new PagesController( new BeepBeep_Titles\Api\Client() ) )->update_settings( new WP_REST_Request( [ 'usage_stats_opt_in' => true ] ) );
	cc_check( 'consent_granted' === $GLOBALS['http'][0]['event'] && 'settings' === $GLOBALS['http'][0]['properties']['consent_source'], 'Settings toggle on sends consent_granted (settings)' );
	cc_check( 'settings' === get_option( Telemetry::CONSENT_SOURCE_OPTION ), 'Settings toggle records settings as the source' );

	// Unknown sources are normalised.
	cc_check( 'settings' === Telemetry::normalize_consent_source( 'evil source' ) && 'guest_card' === Telemetry::normalize_consent_source( 'guest_card' ), 'consent source is normalised' );

	// Route is admin only.
	$src = file_get_contents( $root . '/includes/Rest/Routes.php' );
	cc_check( 1 === preg_match( "#'/consent',\s*\[\s*'methods'\s*=>\s*'POST',\s*'callback'\s*=>\s*\[\s*\\\$t,\s*'set_consent'\s*\],\s*'permission_callback'\s*=>\s*\[\s*\\\$this,\s*'require_admin'\s*\]#", $src ), 'POST /consent uses require_admin' );
	cc_check( in_array( 'consent_granted', Telemetry::ALLOWED_EVENTS, true ), 'consent_granted is an allowed event' );

	// wp-config forced choice: no card.
	define( 'BEEPTI_TELEMETRY_CONSENT', false );
	cc_reset( [] );
	cc_check( false === Telemetry::should_show_consent_card(), 'card hidden when wp-config forces the choice' );

	if ( $fail ) { exit( 1 ); }
	echo "OK: first-run consent card and plugin_activated backfill\n";
}
