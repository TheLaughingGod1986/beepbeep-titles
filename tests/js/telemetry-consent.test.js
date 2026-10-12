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
