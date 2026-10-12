/**
 * OpptiAI Titles — client telemetry helper.
 *
 * Batches allowlisted activity events to POST /telemetry, which the PHP
 * Telemetry class forwards to PostHog. Never sends titles, emails, or keys.
 */

const data = window.beeptiAdminData ?? {};
const BASE = data.apiBase ?? '/wp-json/beepbeep-titles/v1';
const NONCE = data.nonce ?? '';
const cfg = data.telemetry ?? {};

const SESSION_KEY = 'beepti_telemetry_session';
const OPENED_KEY = 'beepti_plugin_opened';

const SCREEN_EVENTS = {
	dashboard: 'dashboard_viewed',
	library: 'library_viewed',
	automation: 'autopilot_viewed',
	settings: 'settings_viewed',
	billing: 'billing_viewed',
};

const FEATURE_NAMES = {
	dashboard: 'dashboard',
	library: 'library',
	automation: 'bulk_generation',
	settings: 'settings',
	billing: 'billing',
};

let queue = [];
let flushTimer = null;
let lastScreen = '';

function sessionId() {
	try {
		let id = sessionStorage.getItem( SESSION_KEY );
		if ( ! id ) {
			id = `s_${ Date.now().toString( 36 ) }_${ Math.random().toString( 36 ).slice( 2, 10 ) }`;
			sessionStorage.setItem( SESSION_KEY, id );
		}
		return id;
	} catch ( e ) {
		return `s_${ Date.now() }`;
	}
}

function enabled() {
	return cfg.enabled !== false;
}

function baseProps() {
	return {
		session_id: sessionId(),
		plugin_slug: cfg.pluginSlug || 'opptiai-titles',
		plugin_id: cfg.pluginId || 'titles',
		product: cfg.product || 'title_meta',
		plugin_version: cfg.pluginVersion || data.version || '',
		site_install_id: cfg.siteInstallId || '',
		environment: cfg.environment || 'production',
		user_state: cfg.connected ? 'connected' : 'guest',
		is_logged_in: !! cfg.connected,
	};
}

async function flush() {
	if ( ! queue.length || ! enabled() ) {
		queue = [];
		return;
	}
	const batch = queue.splice( 0, 40 );
	try {
		await fetch( `${ BASE }/telemetry`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': NONCE,
			},
			credentials: 'same-origin',
			body: JSON.stringify( { events: batch } ),
			keepalive: true,
		} );
	} catch ( e ) {
		// Drop on failure — analytics must never block the UI.
	}
}

function scheduleFlush() {
	if ( flushTimer ) return;
	flushTimer = setTimeout( () => {
		flushTimer = null;
		flush();
	}, 400 );
}

/**
 * Track a product event. Unknown names are ignored server-side.
 *
 * @param {string} event
 * @param {Record<string, unknown>} [properties]
 */
export function track( event, properties = {} ) {
	if ( ! enabled() || ! event ) return;
	queue.push( {
		event: String( event ),
		properties: { ...baseProps(), ...properties },
	} );
	scheduleFlush();
}

/** Once per browser session. */
export function trackPluginOpened() {
	try {
		if ( sessionStorage.getItem( OPENED_KEY ) ) return;
		sessionStorage.setItem( OPENED_KEY, '1' );
	} catch ( e ) { /* ignore */ }
	track( 'plugin_opened', { is_first_open: ! cfg.connected } );
}

/** Screen / tab view + feature_used. */
export function trackScreen( tab ) {
	const event = SCREEN_EVENTS[ tab ];
	if ( ! event || tab === lastScreen ) return;
	lastScreen = tab;
	track( event, { tab } );
	const feature = FEATURE_NAMES[ tab ];
	if ( feature ) {
		track( 'feature_used', { feature_name: feature, tab } );
	}
}

export function trackPaywallShown( trigger ) {
	track( 'paywall_shown', { trigger: String( trigger || 'default' ) } );
	if ( [ 'daily-limit', 'monthly-limit', 'bulk' ].includes( trigger ) ) {
		track( 'quota_exhausted_state_shown', { trigger: String( trigger ) } );
		track( 'generation_blocked_no_credits', { trigger: String( trigger ), feature_name: 'quota' } );
	}
}

// Flush on page hide so short visits still land.
if ( typeof document !== 'undefined' ) {
	document.addEventListener( 'visibilitychange', () => {
		if ( document.visibilityState === 'hidden' ) flush();
	} );
	window.addEventListener( 'pagehide', () => flush() );
}
