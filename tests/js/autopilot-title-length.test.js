/**
 * Autopilot settings: the Title length control is shown, with help text that
 * says it applies to manual and bulk generation (Autopilot ignores it).
 */
// react-dom/server needs TextEncoder, which jsdom does not provide.
const { TextEncoder, TextDecoder } = require( 'util' );
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
const { renderToStaticMarkup } = require( 'react-dom/server' );
const { AutopilotScreen, TITLE_LENGTH_HELP } = require( '../../src/screens/Autopilot' );

jest.mock( '../../src/api', () => ( { saveSettings: jest.fn() } ) );

const render = ( settings, locked = false ) => renderToStaticMarkup(
	<AutopilotScreen settings={ settings } autoOptimise={ false } onAutoToggle={ () => {} } locked={ locked } onUpgrade={ () => {} }/>
);

test( 'Title length control is present with the manual/bulk help text (paid or locked)', () => {
	expect( TITLE_LENGTH_HELP ).toBe( 'Used for manual and bulk generation. Autopilot uses its own length.' );
	for ( const locked of [ false, true ] ) {
		const html = render( { tone: 'direct', title_length: 'rich', meta_length: 'brief' }, locked );
		expect( html ).toContain( 'Title length' );
		expect( html ).toContain( TITLE_LENGTH_HELP );
		expect( html ).toContain( '40–50 chars' );
		expect( html ).toContain( 'Meta description length' );
	}
} );

test( 'subtitle states what applies where, with no em dash', () => {
	const html = render( {} );
	expect( html ).toContain( 'Tone and brand name apply to Autopilot and manual generation. Title length applies to manual and bulk generation.' );
	expect( html ).not.toContain( 'apply to every page' );
} );
