<?php
/**
 * Dev-only: "More from Oppti" panel data. Eligible only after the first applied
 * title/meta, hidden for good after dismiss, never lists installed plugins,
 * connected vs guest intro, installer vs tagged WordPress.org links, copy rules,
 * consent-gated events and the installed-plugin booleans on activation.
 * Runs without WordPress; wp_remote_post is a recorder, so no HTTP leaves the box.
 */
namespace BeepBeep_Titles\Api {
	class Client {
		public function get_account_email() { return ''; }
		public function install_hash() { return 'testhash'; }
		public function has_license() { return true; }
	}
}

namespace {
	define( 'ABSPATH', '/nonexistent-wp/' );
	define( 'BEEPTI_VERSION', '1.0.30' );
	$GLOBALS['o']    = [];
	$GLOBALS['meta'] = [];
	$GLOBALS['user'] = 7;
	$GLOBALS['caps'] = [ 'install_plugins' => true ];
	$GLOBALS['plugins'] = [];
	$GLOBALS['http'] = [];
	function get_option( $k, $d = false ) { return array_key_exists( $k, $GLOBALS['o'] ) ? $GLOBALS['o'][ $k ] : $d; }
	function update_option( $k, $v, $a = null ) { $GLOBALS['o'][ $k ] = $v; return true; }
	function add_option( $k, $v, $dep = '', $a = null ) { if ( array_key_exists( $k, $GLOBALS['o'] ) ) { return false; } $GLOBALS['o'][ $k ] = $v; return true; }
	function delete_option( $k ) { unset( $GLOBALS['o'][ $k ] ); return true; }
	function get_current_user_id() { return $GLOBALS['user']; }
	function get_user_meta( $u, $k, $s = false ) { return $GLOBALS['meta'][ $u ][ $k ] ?? ''; }
	function update_user_meta( $u, $k, $v ) { $GLOBALS['meta'][ $u ][ $k ] = $v; return true; }
	function current_user_can( $c ) { return ! empty( $GLOBALS['caps'][ $c ] ); }
	function get_plugins() { return $GLOBALS['plugins']; }
	function is_multisite() { return false; }
	function admin_url( $p = '' ) { return 'https://example.com/wp-admin/' . ltrim( $p, '/' ); }
	function __( $t, $d = null ) { return $t; }
	function apply_filters( $h, $v ) { return $v; }
	function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
	function sanitize_text_field( $s ) { return trim( (string) $s ); }
	function untrailingslashit( $s ) { return rtrim( $s, '/' ); }
	function wp_json_encode( $d ) { return json_encode( $d ); }
	function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
	function home_url() { return 'https://example.qa.oppti.dev'; }
	function wp_generate_uuid4() { return '00000000-0000-4000-8000-000000000000'; }
	function wp_remote_post( $url, $args ) { $GLOBALS['http'][] = json_decode( $args['body'], true ); return []; }
	class WP_REST_Request { private $p; function __construct( $p = [] ) { $this->p = $p; } function get_param( $k ) { return $this->p[ $k ] ?? null; } }
	class WP_REST_Response { public $data; function __construct( $d ) { $this->data = $d; } }

	$root = getenv( 'BEEPTI_ROOT' ) ?: dirname( __DIR__, 2 );
	require $root . '/includes/ReviewPrompt.php';
	require $root . '/includes/MoreFromOppti.php';
	require $root . '/includes/Telemetry.php';
	require $root . '/includes/Rest/TelemetryController.php';
	use BeepBeep_Titles\MoreFromOppti as MFO;
	use BeepBeep_Titles\ReviewPrompt;
	use BeepBeep_Titles\Telemetry;
	use BeepBeep_Titles\Rest\TelemetryController;

	$fail = 0;
	function check( $cond, $label ) { global $fail; if ( ! $cond ) { fwrite( STDERR, "FAIL: $label\n" ); $fail++; } }
	$self = [ 'opptiai-titles/beepbeep-titles.php' => [ 'TextDomain' => 'beepbeep-titles' ] ];

	// 1. Before any applied title/meta (empty state or a failed first run): not eligible.
	$GLOBALS['plugins'] = $self;
	$c = MFO::client_config( true );
	check( false === $c['eligible'], 'not eligible before first success' );
	check( [ 'alt', 'linking', 'auditor' ] === array_column( $c['items'], 'id' ), 'suggests every sibling, never itself, rows Alt Text, IL, Auditor' );

	// 2. After the first applied title/meta: eligible.
	ReviewPrompt::mark_first_success();
	check( true === MFO::client_config( true )['eligible'], 'eligible after first success' );

	// 3. Installed siblings are hidden (folder or text domain), all installed = no rows.
	$GLOBALS['plugins'] = $self + [
		'beepbeep-ai-alt-text-generator/beepbeep-ai-alt-text-generator.php' => [ 'TextDomain' => 'beepbeep-ai-alt-text-generator' ],
		'auditor-renamed/opptiai-website-auditor.php'                       => [ 'TextDomain' => 'opptiai-website-auditor' ],
	];
	$c = MFO::client_config( true );
	check( [ 'linking' ] === array_column( $c['items'], 'id' ), 'installed siblings hidden' );
	check( '' === $c['intro'], 'connected, only IL left: no intro' );
	$GLOBALS['plugins']['opptiai-internal-linking/opptiai-internal-linking.php'] = [ 'TextDomain' => 'opptiai-internal-linking' ];
	check( [] === MFO::client_config( true )['items'], 'everything installed: no rows (no panel)' );
	$GLOBALS['o']['active_plugins'] = [];
	check( [ 'alt', 'linking', 'auditor' ] === MFO::candidate_ids( [], [] ), 'candidate ids (IL before Auditor)' );
	check( [ 'linking', 'auditor' ] === MFO::candidate_ids( [], [ 'alt' ] ), 'active-only sibling hidden too' );

	// 4. Intro cases.
	check( 'Your same Oppti login also works with Alt Text.' === MFO::intro_line( true, [ 'alt', 'linking', 'auditor' ] ), 'connected names only Alt Text' );
	check( 'Your same Oppti login also works with Alt Text.' === MFO::intro_line( true, [ 'alt' ] ), 'connected, Alt Text only' );
	check( '' === MFO::intro_line( true, [ 'linking', 'auditor' ] ), 'connected, IL + Auditor: no intro' );
	check( '' === MFO::intro_line( true, [ 'auditor' ] ), 'connected, Auditor only: no intro' );
	check( '' === MFO::intro_line( true, [ 'linking' ] ), 'connected, IL only: no intro' );
	foreach ( [ [ 'alt', 'linking', 'auditor' ], [ 'alt' ], [ 'auditor' ], [ 'linking' ] ] as $ids ) {
		check( 'More from OpptiAI, for the rest of the job.' === MFO::intro_line( false, $ids ), 'guest plain intro: ' . implode( ',', $ids ) );
	}
	check( 'Alt Text and Titles' === MFO::join_names( [ 'Alt Text', 'Titles' ] ), 'join two' );
	check( 'A, B and C' === MFO::join_names( [ 'A', 'B', 'C' ] ), 'join three' );

	// 5. Links: installer search when allowed, else tagged WordPress.org.
	check( 'https://example.com/wp-admin/plugin-install.php?s=opptiai-website-auditor&tab=search&type=term' === MFO::link_for( 'auditor', true )['url'], 'installer link' );
	check( 'https://wordpress.org/plugins/beepbeep-ai-alt-text-generator/?utm_source=plugin&utm_medium=crosssell&utm_campaign=push-nov26&utm_content=xs-titles-to-alt' === MFO::link_for( 'alt', false )['url'], 'wporg fallback link' );
	$GLOBALS['plugins'] = $self;
	$GLOBALS['caps']    = [];
	$c = MFO::client_config( false );
	check( [ 'wporg', 'wporg', 'wporg' ] === array_column( $c['items'], 'target' ), 'no install_plugins: wporg links' );
	check( 'guest' === $c['accountState'], 'guest state' );
	$GLOBALS['caps'] = [ 'install_plugins' => true ];

	// 6. Rows and copy rules.
	$rows = array_column( MFO::client_config( true )['items'], null, 'id' );
	check( 'Free to try.' === $rows['alt']['helper'] && 'Install Alt Text' === $rows['alt']['cta'], 'alt row' );
	check( 'A free plugin. No account needed.' === $rows['auditor']['helper'], 'auditor helper' );
	check( '' === $rows['linking']['helper'], 'IL has no free line' );
	foreach ( MFO::copy() as $k => $line ) {
		check( false === strpos( $line, "\u{2014}" ), "no em dash: $k" );
		check( ! preg_match( '/\d\s*free|free\s*\d/i', $line ), "no number next to free: $k" );
		check( ! preg_match( '/complian|ADA|WCAG|guarantee/i', $line ), "no compliance claim: $k" );
	}

	// 7. Dismiss is per user and for good.
	MFO::rest_dismiss( new WP_REST_Request() );
	$c = MFO::client_config( true );
	check( true === $c['dismissed'] && [] === $c['items'], 'dismissed for this user' );
	$GLOBALS['user'] = 8;
	check( false === MFO::client_config( true )['dismissed'], 'another user still sees it' );
	$GLOBALS['user'] = 0;
	check( true === MFO::client_config( true )['dismissed'], 'no user: never shown' );
	$GLOBALS['user'] = 7;

	// 8. Events: allowlisted, props filtered, and nothing leaves without consent.
	foreach ( MFO::EVENTS as $e ) {
		check( in_array( $e, Telemetry::ALLOWED_EVENTS, true ), "allowlisted: $e" );
	}
	$props = TelemetryController::filter_client_properties( [ 'from_plugin' => 'titles', 'to_plugin' => 'alt', 'link_target' => 'wporg', 'account_state' => 'connected', 'suggested' => 'alt-auditor', 'url' => 'https://wordpress.org/plugins/x/' ] );
	check( [ 'from_plugin' => 'titles', 'to_plugin' => 'alt', 'link_target' => 'wporg', 'account_state' => 'connected', 'suggested' => 'alt-auditor' ] === $props, 'client props kept, url dropped' );
	$GLOBALS['http'] = [];
	Telemetry::capture( 'crosssell_clicked', $props );
	check( [] === $GLOBALS['http'], 'no consent: crosssell_clicked not sent' );
	$GLOBALS['o'][ Telemetry::CONSENT_OPTION ] = 'yes';
	Telemetry::capture( 'crosssell_clicked', $props );
	check( 1 === count( $GLOBALS['http'] ) && 'crosssell_clicked' === $GLOBALS['http'][0]['event'] && 'alt' === $GLOBALS['http'][0]['properties']['to_plugin'], 'consent: crosssell_clicked sent with to_plugin' );

	// 9. plugin_activated: four installed booleans, stored locally, sent only with consent.
	//    Alt Text installed but inactive (renamed folder, matched by text domain), Auditor active, IL absent.
	$GLOBALS['plugins'] = $self + [
		'alt-renamed/beepbeep-ai-alt-text-generator.php' => [ 'TextDomain' => 'beepbeep-ai-alt-text-generator' ],
	];
	$GLOBALS['o']    = [ 'active_plugins' => [ 'opptiai-website-auditor/opptiai-website-auditor.php', 'akismet/akismet.php', 'opptiai-titles/beepbeep-titles.php' ] ];
	$GLOBALS['http'] = [];
	$flags           = [ 'has_alt_text' => true, 'has_titles' => true, 'has_il' => false, 'has_auditor' => true ];
	check( $flags === MFO::installed_flags(), 'installed flags' );
	Telemetry::on_activate();
	Telemetry::flush_lifecycle_queue();
	check( $flags === get_option( MFO::ACTIVATION_PLUGINS_OPTION ), 'flags stored' );
	check( [] === $GLOBALS['http'], 'no consent: activation not sent' );
	$GLOBALS['o'] = [ 'active_plugins' => $GLOBALS['o']['active_plugins'], Telemetry::CONSENT_OPTION => 'yes' ];
	Telemetry::on_activate();
	Telemetry::flush_lifecycle_queue();
	$sent = $GLOBALS['http'][0]['properties'] ?? [];
	check( 1 === count( $GLOBALS['http'] ) && 'plugin_activated' === $GLOBALS['http'][0]['event'], 'consent: plugin_activated sent once' );
	check( ! array_key_exists( 'siblings', $sent ), 'no joined siblings string' );
	foreach ( $flags as $k => $v ) {
		check( array_key_exists( $k, $sent ) && $v === $sent[ $k ], "consent: plugin_activated carries $k" );
	}
	$GLOBALS['plugins'] = $self;
	$GLOBALS['o']       = [];
	check( [ 'has_alt_text' => false, 'has_titles' => true, 'has_il' => false, 'has_auditor' => false ] === MFO::installed_flags(), 'only Titles installed' );

	if ( $fail ) { exit( 1 ); }
	echo "OK: More from Oppti panel data\n";
}
