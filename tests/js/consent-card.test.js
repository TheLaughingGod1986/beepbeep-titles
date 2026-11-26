/**
 * 1.0.32 (d): first-run usage-stats card. Opt-in only: nothing reaches the
 * telemetry endpoint before "Share usage stats"; "No thanks" saves the answer
 * on the site and sends nothing.
 */
jest.mock( '@wordpress/i18n', () => ( { __: ( s ) => s } ), { virtual: true } );

function loadTelemetry( telemetry ) {
	jest.resetModules();
	window.beeptiAdminData = { telemetry };
	global.fetch = jest.fn( () => Promise.resolve( {} ) );
	sessionStorage.clear();
	return require( '../../src/telemetry' );
}

function telemetryCalls() {
	return global.fetch.mock.calls.filter( ( c ) => String( c[ 0 ] ).includes( '/telemetry' ) );
}

describe( 'consent card copy and visibility', () => {
	const { CONSENT_COPY, shouldShowConsentCard, CONSENT_CARD_SOURCE } = require( '../../src/consent' );

	test( 'exact copy', () => {
		expect( CONSENT_COPY ).toEqual( {
			title: 'Help improve OpptiAI Titles',
			body: 'Share usage stats with OpptiAI, like which features you use and when a request fails. You can change this any time in Settings, Privacy.',
			accept: 'Share usage stats',
			decline: 'No thanks',
		} );
		expect( Object.values( CONSENT_COPY ).join( ' ' ) ).not.toMatch( /\u2014/ );
		expect( CONSENT_CARD_SOURCE ).toBe( 'guest_card' );
	} );

	test( 'shown only when PHP says so', () => {
		expect( shouldShowConsentCard( { showConsentCard: true } ) ).toBe( true );
		expect( shouldShowConsentCard( { showConsentCard: '1' } ) ).toBe( false );
		expect( shouldShowConsentCard( {} ) ).toBe( false );
		expect( shouldShowConsentCard( undefined ) ).toBe( false );
	} );
} );

describe( 'answering the card', () => {
	beforeEach( () => jest.useFakeTimers() );
	afterEach( () => jest.useRealTimers() );

	test( 'before answering, nothing is sent', () => {
		const t = loadTelemetry( { enabled: false, showConsentCard: true } );
		t.trackPluginOpened();
		t.trackScreen( 'dashboard' );
		jest.runAllTimers();
		expect( telemetryCalls() ).toHaveLength( 0 );
	} );

	test( 'No thanks: saves no, sends nothing', async () => {
		const t = loadTelemetry( { enabled: false, showConsentCard: true } );
		const { answerConsent } = require( '../../src/consent' );
		const save = jest.fn( async () => ( { usage_stats_opt_in: false } ) );
		const on = await answerConsent( false, { save, setTelemetryEnabled: t.setTelemetryEnabled, trackPluginOpened: t.trackPluginOpened } );
		t.trackScreen( 'library' );
		jest.runAllTimers();
		expect( on ).toBe( false );
		expect( save ).toHaveBeenCalledWith( false );
		expect( t.enabled() ).toBe( false );
		expect( telemetryCalls() ).toHaveLength( 0 );
	} );

	test( 'Share usage stats: saves yes, then plugin_opened is sent', async () => {
		const t = loadTelemetry( { enabled: false, showConsentCard: true } );
		const { answerConsent } = require( '../../src/consent' );
		t.trackPluginOpened(); // app mount before the answer: dropped, no flag
		const save = jest.fn( async () => ( { usage_stats_opt_in: true } ) );
		const on = await answerConsent( true, { save, setTelemetryEnabled: t.setTelemetryEnabled, trackPluginOpened: t.trackPluginOpened } );
		jest.runAllTimers();
		expect( on ).toBe( true );
		expect( save ).toHaveBeenCalledWith( true );
		const events = telemetryCalls().flatMap( ( c ) => JSON.parse( c[ 1 ].body ).events.map( ( e ) => e.event ) );
		expect( events ).toEqual( [ 'plugin_opened' ] );
	} );

	test( 'accept that the server did not store stays off', async () => {
		const t = loadTelemetry( { enabled: false } );
		const { answerConsent } = require( '../../src/consent' );
		const on = await answerConsent( true, { save: async () => ( { usage_stats_opt_in: false } ), setTelemetryEnabled: t.setTelemetryEnabled, trackPluginOpened: t.trackPluginOpened } );
		jest.runAllTimers();
		expect( on ).toBe( false );
		expect( telemetryCalls() ).toHaveLength( 0 );
	} );

	test( 'saveConsent posts the card answer to /consent', async () => {
		jest.resetModules();
		window.beeptiAdminData = { apiBase: '/wp-json/beepbeep-titles/v1', nonce: 'n' };
		global.fetch = jest.fn( async () => ( { ok: true, status: 200, json: async () => ( { usage_stats_opt_in: true } ), text: async () => '{"usage_stats_opt_in":true}' } ) );
		const { saveConsent } = require( '../../src/api' );
		await saveConsent( true );
		const [ url, init ] = global.fetch.mock.calls[ 0 ];
		expect( String( url ) ).toContain( '/consent' );
		expect( init.method ).toBe( 'POST' );
		expect( JSON.parse( init.body ) ).toEqual( { opt_in: true, source: 'guest_card' } );
	} );
} );
