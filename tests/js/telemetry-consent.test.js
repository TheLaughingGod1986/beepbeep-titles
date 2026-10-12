/**
 * PostHog bridge must be opt-in: no fetch unless PHP says enabled === true.
 */
function load( telemetry ) {
	jest.resetModules();
	window.beeptiAdminData = telemetry === undefined ? {} : { telemetry };
	global.fetch = jest.fn( () => Promise.resolve( {} ) );
	return require( '../../src/telemetry' );
}

describe( 'telemetry consent gate', () => {
	beforeEach( () => jest.useFakeTimers() );
	afterEach( () => jest.useRealTimers() );

	test.each( [
		[ 'no config (upgrade from 1.0.28)', undefined ],
		[ 'enabled missing', {} ],
		[ 'enabled false', { enabled: false } ],
		[ 'enabled truthy string', { enabled: '1' } ],
	] )( 'sends nothing with %s', ( _l, cfg ) => {
		const t = load( cfg );
		expect( t.enabled() ).toBe( false );
		t.trackPluginOpened();
		t.trackScreen( 'dashboard' );
		t.track( 'generation_started' );
		jest.runAllTimers();
		window.dispatchEvent( new Event( 'pagehide' ) );
		expect( global.fetch ).not.toHaveBeenCalled();
	} );

	test( 'sends after explicit opt-in', () => {
		const t = load( { enabled: true } );
		t.track( 'generation_started' );
		jest.runAllTimers();
		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'opt-in without reload', () => {
	beforeEach( () => jest.useFakeTimers() );
	afterEach( () => jest.useRealTimers() );

	test( 'setTelemetryEnabled(true) starts sending; false stops and drops queue', () => {
		const t = load( { enabled: false, siteInstallId: 'old-id' } );
		t.track( 'generation_started' );
		t.setTelemetryEnabled( true );
		t.track( 'generation_started' );
		jest.runAllTimers();
		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
		const body = JSON.parse( global.fetch.mock.calls[ 0 ][ 1 ].body );
		expect( body.events ).toHaveLength( 1 );
		expect( body.events[ 0 ].properties ).not.toHaveProperty( 'site_install_id' );
		t.setTelemetryEnabled( false );
		t.track( 'generation_started' );
		jest.runAllTimers();
		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
