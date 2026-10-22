/**
 * Client telemetry only ever sends the anonymous s_… session id. A Stripe
 * Checkout session id (cs_…) from the return URL (?session_id=cs_…), from
 * checkout state or from a caller never reaches an outgoing payload (body or URL).
 */
const fs = require( 'fs' );
const path = require( 'path' );

const STRIPE = 'https://checkout.stripe.com/c/pay/cs_test_x';

function load() {
	jest.resetModules();
	// Stripe return URL, as after a real checkout.
	window.history.replaceState( {}, '', '/wp-admin/admin.php?page=beepbeep-titles&beepti_billing=success&session_id=cs_test_x' );
	// A poisoned session store must not leak either.
	sessionStorage.setItem( 'beepti_telemetry_session', 'cs_test_x' );
	window.beeptiAdminData = { apiBase: '/wp-json/beepbeep-titles/v1', nonce: 'n', telemetry: { enabled: true, connected: true } };
	global.fetch = jest.fn( () => Promise.resolve( {} ) );
	const telemetry = require( '../../src/telemetry' );
	const { createCheckoutFlow } = require( '../../src/checkoutFlow' );
	return { telemetry, createCheckoutFlow };
}

function outgoing() {
	return global.fetch.mock.calls.map( ( [ url, init ] ) => ( { url: String( url ), body: String( init?.body || '' ) } ) );
}

describe( 'no Stripe cs_ id in any telemetry payload', () => {
	beforeEach( () => jest.useFakeTimers() );
	afterEach( () => jest.useRealTimers() );

	test( 'return URL ?session_id=cs_test_x + full checkout flow + every telemetry helper', async () => {
		const { telemetry: t, createCheckoutFlow } = load();
		expect( window.location.search ).toContain( 'session_id=cs_test_x' );

		t.trackPluginOpened();
		for ( const tab of [ 'dashboard', 'library', 'automation', 'settings', 'billing', 'dashboard' ] ) t.trackScreen( tab );
		for ( const trig of [ 'default', 'autopilot', 'daily-limit', 'monthly-limit', 'bulk', 'continuous-optimisation' ] ) t.trackPaywallShown( trig );

		// Checkout: success path (both id spellings, live and test), then a failure.
		const deps = ( createCheckout ) => ( {
			createCheckout,
			track: t.track,
			navigate: () => {},
			showPanel: () => {},
			onRouteError: () => false,
			setTimer: ( fn ) => { fn(); return 1; },
			clearTimer: () => {},
			isHidden: () => false,
		} );
		await createCheckoutFlow( deps( jest.fn().mockResolvedValue( { url: STRIPE, session_id: 'cs_test_x', reused: true, currency: 'gbp' } ) ) ).start( { plan: 'starter', priceId: 'price_1' } );
		await createCheckoutFlow( deps( jest.fn().mockResolvedValue( { url: STRIPE, sessionId: 'cs_live_x' } ) ) ).start( { plan: 'pro' } );
		await createCheckoutFlow( deps( jest.fn().mockRejectedValue( Object.assign( new Error( 'nope cs_test_x' ), { code: 'X', status: 400 } ) ) ) ).start( { plan: 'agency' } );

		// Return flow events App.jsx fires after ?beepti_billing=…
		t.track( 'checkout_completed', { plan: 'starter' } );
		t.track( 'checkout_cancelled' );
		t.track( 'billing_portal_opened' );
		// A caller trying to pass the Stripe id is overridden / dropped.
		t.track( 'checkout_redirected', { plan: 'pro', session_id: 'cs_test_x', source: 'cs_test_x' } );

		jest.runAllTimers();
		window.dispatchEvent( new Event( 'pagehide' ) );
		await Promise.resolve();

		const sent = outgoing();
		expect( sent.length ).toBeGreaterThan( 0 );
		const events = sent.flatMap( ( c ) => JSON.parse( c.body ).events );
		expect( events.map( ( e ) => e.event ) ).toEqual( expect.arrayContaining( [
			'plugin_opened', 'dashboard_viewed', 'paywall_shown', 'checkout_clicked', 'checkout_session_returned',
			'checkout_redirected', 'checkout_failed', 'checkout_completed', 'checkout_cancelled',
		] ) );
		for ( const c of sent ) {
			expect( c.url ).not.toContain( 'cs_' );
			expect( c.body ).not.toContain( 'cs_' );
		}
		for ( const e of events ) {
			expect( e.properties.session_id ).toMatch( /^s_[A-Za-z0-9]+(_[A-Za-z0-9]+)?$/ );
		}
	} );

	test( 'no source file reads session_id from the URL', () => {
		const dir = path.join( __dirname, '../../src' );
		const files = [];
		const walk = ( d ) => fs.readdirSync( d, { withFileTypes: true } ).forEach( ( f ) => {
			const p = path.join( d, f.name );
			if ( f.isDirectory() ) walk( p ); else if ( /\.(js|jsx)$/.test( f.name ) ) files.push( p );
		} );
		walk( dir );
		for ( const f of files ) {
			const src = fs.readFileSync( f, 'utf8' );
			expect( src ).not.toMatch( /\.get\(\s*['"]session_id['"]\s*\)/ );
		}
	} );
} );
