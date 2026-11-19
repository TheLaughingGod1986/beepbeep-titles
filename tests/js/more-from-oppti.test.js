/**
 * "More from Oppti" panel: visibility rule, Dashboard placement, dismissal,
 * and crosssell events only with telemetry consent.
 */
jest.mock( '@wordpress/i18n', () => ( { __: ( text ) => text } ), { virtual: true } );

global.IS_REACT_ACT_ENVIRONMENT = true;

const ITEMS = [
	{ id: 'alt', desc: 'Write alt text for images that have none.', helper: 'Free to try.', url: '/wp-admin/plugin-install.php?s=beepbeep-ai-alt-text-generator&tab=search&type=term', target: 'installer', cta: 'Install Alt Text', suffix: '' },
	{ id: 'auditor', desc: 'See what to fix on your site first.', helper: 'A free plugin. No account needed.', url: 'https://wordpress.org/plugins/opptiai-website-auditor/?utm_source=plugin&utm_medium=crosssell&utm_campaign=push-nov26&utm_content=xs-titles-to-auditor', target: 'wporg', cta: 'Install Website Auditor', suffix: '(opens WordPress.org)' },
];

function panelState( over = {} ) {
	return {
		eligible: true,
		dismissed: false,
		from: 'titles',
		accountState: 'connected',
		heading: 'More from Oppti',
		intro: 'Your same Oppti login also works with Alt Text.',
		dismiss: 'Dismiss',
		dismissLabel: 'Dismiss this More from Oppti panel',
		items: ITEMS,
		...over,
	};
}

function load( consent ) {
	jest.resetModules();
	window.beeptiAdminData = { telemetry: { enabled: consent } };
	global.fetch = jest.fn( () => Promise.resolve( {} ) );
	// Same module registry for React, the renderer and the component.
	const React = require( 'react' );
	const { createRoot } = require( 'react-dom/client' );
	const mod = require( '../../src/moreFromOppti' );
	return { ...mod, React, createRoot, act: React.act };
}

function sentEvents() {
	return global.fetch.mock.calls
		.filter( ( c ) => String( c[ 0 ] ).includes( '/telemetry' ) )
		.flatMap( ( c ) => JSON.parse( c[ 1 ].body ).events );
}

let act = null;
function mount( lib, Component, props ) {
	act = lib.act;
	const host = document.createElement( 'div' );
	document.body.appendChild( host );
	const root = lib.createRoot( host );
	act( () => root.render( lib.React.createElement( Component, props ) ) );
	return { host, root };
}

describe( 'shouldShowMoreFromOppti', () => {
	const { shouldShowMoreFromOppti, moreFromOpptiIds } = load( false );
	test( 'hidden before any success (empty state, first-run error)', () => {
		expect( shouldShowMoreFromOppti( panelState( { eligible: false } ) ) ).toBe( false );
	} );
	test( 'hidden after dismiss', () => {
		expect( shouldShowMoreFromOppti( panelState( { dismissed: true } ) ) ).toBe( false );
	} );
	test( 'hidden when every sibling is installed (no rows)', () => {
		expect( shouldShowMoreFromOppti( panelState( { items: [] } ) ) ).toBe( false );
	} );
	test( 'hidden with no config (older PHP)', () => {
		expect( shouldShowMoreFromOppti( undefined ) ).toBe( false );
		expect( shouldShowMoreFromOppti( { eligible: false, dismissed: true, items: [] } ) ).toBe( false );
	} );
	test( 'shown after success with rows', () => {
		expect( shouldShowMoreFromOppti( panelState() ) ).toBe( true );
		expect( moreFromOpptiIds( panelState() ) ).toEqual( [ 'alt', 'auditor' ] );
	} );
} );

describe( 'MoreFromOpptiCard', () => {
	beforeEach( () => jest.useFakeTimers() );
	afterEach( () => {
		jest.useRealTimers();
		document.body.innerHTML = '';
	} );

	test( 'connected: login intro, rows, installer and tagged WordPress.org links', () => {
		const lib = load( false );
		const { host } = mount( lib, lib.MoreFromOpptiCard, { state: panelState(), onDismiss: () => {} } );
		expect( host.textContent ).toContain( 'Your same Oppti login also works with Alt Text.' );
		expect( host.textContent ).toContain( 'A free plugin. No account needed.' );
		const links = host.querySelectorAll( 'a' );
		expect( links[ 0 ].getAttribute( 'href' ) ).toContain( 'plugin-install.php?s=beepbeep-ai-alt-text-generator&tab=search&type=term' );
		expect( links[ 0 ].getAttribute( 'target' ) ).toBeNull();
		expect( links[ 1 ].getAttribute( 'target' ) ).toBe( '_blank' );
		expect( host.querySelector( 'button' ).getAttribute( 'aria-label' ) ).toBe( 'Dismiss this More from Oppti panel' );
	} );

	test( 'no intro paragraph when PHP sends none (only IL/Auditor left)', () => {
		const lib = load( false );
		const { host } = mount( lib, lib.MoreFromOpptiCard, { state: panelState( { intro: '', items: [ ITEMS[ 1 ] ] } ), onDismiss: () => {} } );
		expect( host.querySelector( '.beepti-more-from-oppti__intro' ) ).toBeNull();
		expect( host.textContent.toLowerCase() ).not.toContain( 'login' );
	} );

	test( 'no events without consent; dismiss still calls back', () => {
		const lib = load( false );
		const onDismiss = jest.fn();
		const { host } = mount( lib, lib.MoreFromOpptiCard, { state: panelState(), onDismiss } );
		act( () => host.querySelectorAll( 'a' )[ 1 ].dispatchEvent( new MouseEvent( 'click', { bubbles: true, cancelable: true } ) ) );
		act( () => host.querySelector( 'button' ).click() );
		jest.runAllTimers();
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
		expect( global.fetch ).not.toHaveBeenCalled();
	} );

	test( 'with consent: shown, clicked (from/to), dismissed; no URLs in props', () => {
		const lib = load( true );
		const { host } = mount( lib, lib.MoreFromOpptiCard, { state: panelState(), onDismiss: () => {} } );
		act( () => host.querySelectorAll( 'a' )[ 0 ].dispatchEvent( new MouseEvent( 'click', { bubbles: true, cancelable: true } ) ) );
		act( () => host.querySelector( 'button' ).click() );
		jest.runAllTimers();
		const events = sentEvents();
		expect( events.map( ( e ) => e.event ) ).toEqual( [ 'crosssell_panel_shown', 'crosssell_clicked', 'crosssell_panel_dismissed' ] );
		expect( events[ 0 ].properties.suggested ).toBe( 'alt-auditor' );
		expect( events[ 1 ].properties ).toMatchObject( { from_plugin: 'titles', to_plugin: 'alt', link_target: 'installer', account_state: 'connected' } );
		events.forEach( ( e ) => expect( JSON.stringify( e.properties ) ).not.toMatch( /https?:|wordpress\.org|plugin-install/ ) );
	} );
} );
