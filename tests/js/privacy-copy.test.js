/**
 * 1.0.32 (f): Settings Privacy copy and the paywall line without a timing claim.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const read = ( f ) => fs.readFileSync( path.join( __dirname, '../../', f ), 'utf8' );

describe( 'privacy and paywall copy', () => {
	const settings = read( 'src/screens/Settings.jsx' );
	const paywall = read( 'src/modals/Paywall.jsx' );
	const library = read( 'src/screens/Library.jsx' );

	test( 'Settings Privacy toggle label and description', () => {
		expect( settings ).toContain( "__( 'Share usage stats with OpptiAI', 'beepbeep-titles' )" );
		expect( settings ).toContain( "__( 'Sends which features you use and when a request fails, so we can fix problems. Off until you turn it on.', 'beepbeep-titles' )" );
		expect( settings ).not.toMatch( /anonymous usage stats|Sends anonymous feature usage/ );
	} );

	test( 'paywall has no "in seconds" claim', () => {
		expect( paywall ).toContain( "'Generate SEO titles and descriptions'," );
		expect( paywall ).not.toMatch( /in seconds/i );
	} );

	test( 'Library button stays "Optimise"', () => {
		expect( library ).toMatch( />\s*Optimise\s*</ );
	} );
} );
