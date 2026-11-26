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
		expect( readme ).toContain( '* New: a first-run card asks whether to share usage stats with OpptiAI. Usage stats never include your post content. No usage stats are shared unless you choose to, and you can change this any time in Settings, Privacy.' );
		expect( readme.split( 'first-run card asks' ).length ).toBe( 2 );
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

	test( '1.0.32 timing claims removed and replacements present', () => {
		const audit = read( 'src/screens/Audit.jsx' );
		const help = read( 'src/modals/HelpModal.jsx' );
		const readme = read( 'readme.txt' );
		// Paywall side-by-side comparison gone (both columns and their headings).
		for ( const s of [ '2–4 hours', 'under 2 minutes', 'Manual optimisation', 'Manual vs OpptiAI' ] ) {
			expect( paywall ).not.toContain( s );
		}
		expect( paywall ).toContain( 'Why upgrade?' );
		// Audit: time-saved metric, card copy and comparison bars gone; banner kept.
		for ( const s of [ 'Estimated time saved', 'timeSaved', 'Time saved', 'Reduce repetitive SEO work', 'minutes saved', '3–5 minutes per page', '30 seconds', 'CompareBar', 'TimeSavedCard' ] ) {
			expect( audit ).not.toContain( s );
		}
		expect( audit ).toContain( '<WholeSiteBanner/>' );
		expect( audit ).toContain( '<Icon name="check" size={14}/> Fix titles and meta across your whole site' );
		// Audit: "under 60 seconds" and "30 seconds" cut with no replacement.
		expect( audit ).not.toMatch( /60 seconds|30 seconds/ );
		expect( audit ).toContain( 'Find missing SEO titles and meta descriptions\n' );
		expect( audit ).toContain( 'No credit card required.\n' );
		expect( audit ).not.toContain( 'Setup in' );
		// Help modal.
		expect( help ).not.toMatch( /less than one minute|60 second tour/ );
		expect( help ).toContain( "'Connect your account to get started'," );
		expect( help ).toContain( '>Take the tour<' );
		// Auth screen.
		const auth = read( 'src/auth.jsx' );
		expect( auth ).not.toContain( 'under a minute' );
		expect( auth ).toContain( "{mode === 'signup'   && 'Start covering your pages. Free to try, no credit card.'}" );
		expect( auth ).not.toMatch( /Free, no credit card/ );
		expect( help ).not.toContain( 'Publish instantly' );
		expect( help ).toContain( "'Publish to your SEO plugin'," );
		// Readme FAQ.
		expect( readme ).toContain( 'It helps you find and fix SEO title and meta description issues.\n' );
		expect( readme ).not.toContain( 'description issues faster' );
	} );

	test( 'Library button stays "Optimise"', () => {
		expect( library ).toMatch( />\s*Optimise\s*</ );
	} );
} );
