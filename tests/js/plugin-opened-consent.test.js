/**
 * 1.0.32 (c): plugin_opened's once-per-session flag is not written before
 * consent, so opting in later in the same session still sends it once.
 */
function load( telemetry ) {
	jest.resetModules();
	window.beeptiAdminData = { telemetry };
	global.fetch = jest.fn( () => Promise.resolve( {} ) );
	return require( '../../src/telemetry' );
}

function sentEvents() {
	return global.fetch.mock.calls.flatMap( ( c ) => JSON.parse( c[ 1 ].body ).events.map( ( e ) => e.event ) );
}

describe( 'plugin_opened before consent', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		sessionStorage.clear();
	} );
	afterEach( () => jest.useRealTimers() );

	test( 'no consent: nothing sent and no session flag written', () => {
		const t = load( { enabled: false } );
		t.trackPluginOpened();
		jest.runAllTimers();
		expect( global.fetch ).not.toHaveBeenCalled();
		expect( sessionStorage.getItem( 'beepti_plugin_opened' ) ).toBeNull();
	} );

	test( 'opt in later in the same session: plugin_opened sent once', () => {
		const t = load( { enabled: false } );
		t.trackPluginOpened();
		t.setTelemetryEnabled( true );
		t.trackPluginOpened();
		t.trackPluginOpened();
		jest.runAllTimers();
		expect( sentEvents().filter( ( e ) => e === 'plugin_opened' ) ).toHaveLength( 1 );
		expect( sessionStorage.getItem( 'beepti_plugin_opened' ) ).toBe( '1' );
	} );

	test( 'already consented: once per session', () => {
		const t = load( { enabled: true } );
		t.trackPluginOpened();
		t.trackPluginOpened();
		jest.runAllTimers();
		expect( sentEvents().filter( ( e ) => e === 'plugin_opened' ) ).toHaveLength( 1 );
	} );
} );
