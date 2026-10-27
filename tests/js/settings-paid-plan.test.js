/**
 * Settings plan card + Plan & billing row: every paid plan (Starter, Growth,
 * Agency) gets Manage billing and its own plan name; only Free sees the Free
 * service card and "View Growth plan".
 */
// react-dom/server needs TextEncoder, which jsdom does not provide.
const { TextEncoder, TextDecoder } = require( 'util' );
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
const { renderToStaticMarkup } = require( 'react-dom/server' );
const { SettingsScreen } = require( '../../src/screens/Settings' );

jest.mock( '../../src/api', () => ( {
	saveSettings: jest.fn(), setLicense: jest.fn(), clearLicense: jest.fn(), submitSupport: jest.fn(),
} ) );
// @wordpress/i18n is a WordPress-provided external at runtime.
jest.mock( '@wordpress/i18n', () => ( { __: ( s ) => s } ), { virtual: true } );
jest.mock( '../../src/telemetry', () => ( { enabled: () => false, setTelemetryEnabled: jest.fn() } ) );

const render = ( plan ) => renderToStaticMarkup(
	<SettingsScreen
		plan={ plan }
		quota={ { monthly_limit: 100, monthly_used: 3 } }
		settings={ {} }
		connected
		accountEmail="owner@site.example"
		onUpgrade={ () => {} }
		onBuyCredits={ () => {} }
		onManageBilling={ () => {} }
	/>
);

describe( 'Settings treats every paid plan as paid', () => {
	test.each( [
		[ 'starter', 'Starter' ],
		[ 'agency', 'Agency' ],
		[ 'pro', 'Growth' ],
		[ 'growth', 'Growth' ],
	] )( '%p shows Manage billing and its plan name, not the Free card', ( plan, name ) => {
		const html = render( plan );
		expect( html ).toContain( 'Manage billing' );
		expect( html ).toContain( `OpptiAI ${ name } service` );
		expect( html ).not.toContain( 'OpptiAI Free service' );
		expect( html ).not.toContain( 'View Growth plan' );
		expect( html ).not.toMatch( />Free</ );
	} );

	test( 'free shows the Free card and the Growth upgrade', () => {
		const html = render( 'free' );
		expect( html ).toContain( 'OpptiAI Free service' );
		expect( html ).toContain( 'View Growth plan' );
	} );
} );
