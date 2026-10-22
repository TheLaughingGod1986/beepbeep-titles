/**
 * Autopilot settings: title length is not rendered (Autopilot does not apply
 * it). The stored value is kept and saved back unchanged.
 */
// react-dom/server needs TextEncoder, which jsdom does not provide.
const { TextEncoder, TextDecoder } = require( 'util' );
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
const { renderToStaticMarkup } = require( 'react-dom/server' );
const { AutopilotScreen, SHOW_TITLE_LENGTH } = require( '../../src/screens/Autopilot' );

jest.mock( '../../src/api', () => ( { saveSettings: jest.fn() } ) );

const render = ( settings, locked = false ) => renderToStaticMarkup(
	<AutopilotScreen settings={ settings } autoOptimise={ false } onAutoToggle={ () => {} } locked={ locked } onUpgrade={ () => {} }/>
);

test( 'no Title length control on the Autopilot screen (paid or locked)', () => {
	expect( SHOW_TITLE_LENGTH ).toBe( false );
	for ( const locked of [ false, true ] ) {
		const html = render( { tone: 'direct', title_length: 'rich', meta_length: 'brief' }, locked );
		expect( html ).not.toContain( 'Title length' );
		expect( html ).not.toContain( '40–50 chars' );
		expect( html ).toContain( 'Meta description length' );
	}
} );
