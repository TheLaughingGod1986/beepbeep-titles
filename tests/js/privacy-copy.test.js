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

	test( 'paywall has no timing claims', () => {
		expect( paywall ).toContain( "'Generate SEO titles and descriptions'," );
		expect( paywall ).not.toMatch( /in seconds/i );
		expect( paywall ).not.toMatch( /Save hours/i );
	} );

	test( 'paywall benefit list has no empty items', () => {
		const list = paywall.match( /: \[\s*('Generate SEO titles and descriptions'[\s\S]*?)\];/ );
		expect( list ).not.toBeNull();
		const items = list[ 1 ].split( '\n' ).map( ( l ) => l.trim() ).filter( Boolean );
		expect( items ).toEqual( [
			"'Generate SEO titles and descriptions',",
			"'Improve search visibility',",
			"'Use credits manually, in bulk, or with Autopilot',",
		] );
	} );

	test( 'readme 1.0.32 consent line', () => {
		const readme = read( 'readme.txt' );
		expect( readme ).toContain( '* New: a first-run card asks whether to share usage stats with OpptiAI. No usage stats are shared unless you choose to, and they never include your post content. You can change this any time in Settings, Privacy.' );
	} );

	test( 'Audit banner copy has no time-saving claim', () => {
		const audit = read( 'src/screens/Audit.jsx' );
		expect( audit ).toContain( '<Icon name="check" size={14}/> Fix titles and meta across your whole site' );
		expect( audit ).not.toMatch( /Save hours/i );
		expect( audit ).not.toMatch( /Up to 10x faster/ );
		// The banner keeps one line of copy and closes straight after it (no empty element).
		const at = audit.indexOf( 'Fix titles and meta across your whole site' );
		const after = audit.slice( at, audit.indexOf( '</div>', at ) );
		expect( after.replace( /\s+/g, '' ) ).toBe( 'Fixtitlesandmetaacrossyourwholesite</span>' );
	} );

	test( 'Library button stays "Optimise"', () => {
		expect( library ).toMatch( />\s*Optimise\s*</ );
	} );
} );
