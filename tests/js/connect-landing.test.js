/**
 * 1.0.32 (a): after Create account / Sign in, the register/login payload is
 * applied at once (no wait for a second /quota) and the user lands on the
 * Library with one Optimise action.
 */
import { createRoot } from 'react-dom/client';
import { act } from 'react';

jest.mock( '@wordpress/i18n', () => ( { __: ( s ) => s } ), { virtual: true } );
jest.mock( '../../src/api', () => {
	const actual = jest.requireActual( '../../src/api' );
	return {
		...actual,
		loginWithPassword: jest.fn(),
		registerAccount: jest.fn(),
	};
} );

const api = require( '../../src/api' );
const { quotaFromAuthResponse, firstActionPage, CONNECT_LANDING_TAB } = require( '../../src/connectLanding' );
const { FirstActionCard } = require( '../../src/components/FirstActionCard' );
const { ConnectModal } = require( '../../src/modals/ConnectModal' );
const { resolveAllowedTab } = require( '../../src/navigation' );

global.IS_REACT_ACT_ENVIRONMENT = true;

function mount( el ) {
	const host = document.createElement( 'div' );
	document.body.appendChild( host );
	const root = createRoot( host );
	act( () => root.render( el ) );
	return { host, root };
}

function typeInto( input, value ) {
	const setter = Object.getOwnPropertyDescriptor( window.HTMLInputElement.prototype, 'value' ).set;
	setter.call( input, value );
	input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
}

describe( 'register payload is applied straight away', () => {
	test( 'register response (BillingController::register shape) becomes a connected quota', () => {
		const q = quotaFromAuthResponse( {
			connected: true, created: true, plan: 'free',
			credits_total: 25, credits_used: 0, credits_remaining: 25, daily_limit: null,
		} );
		expect( q.connected ).toBe( true );
		expect( q.plan ).toBe( 'free' );
		expect( q.credits_remaining ).toBe( 25 );
		expect( q.daily_limit ).toBeNull();
	} );

	test( 'a payload without connected still counts as connected (login shape)', () => {
		expect( quotaFromAuthResponse( { plan: 'pro', credits_remaining: 3 } ).connected ).toBe( true );
	} );

	test.each( [ null, undefined, 'x', { success: false }, { connected: false } ] )( 'no connected state from %p', ( res ) => {
		expect( quotaFromAuthResponse( res ) ).toBeNull();
	} );

	test( 'lands on the Library, which is allowed once connected', () => {
		expect( CONNECT_LANDING_TAB ).toBe( 'library' );
		expect( resolveAllowedTab( CONNECT_LANDING_TAB, true, { isAdmin: false } ) ).toBe( 'library' );
	} );

	test( 'ConnectModal hands the payload to onSuccess before the success pause ends', async () => {
		jest.useFakeTimers();
		const payload = { connected: true, plan: 'free', credits_remaining: 25 };
		api.loginWithPassword.mockResolvedValue( payload );
		const onSuccess = jest.fn();
		const onClose = jest.fn();
		const { host, root } = mount( <ConnectModal open initialMode="password" onClose={onClose} onSuccess={onSuccess}/> );
		const doc = host.ownerDocument;
		const email = doc.querySelector( 'input[type="email"], input[autocomplete="username"]' );
		const pw = doc.querySelector( 'input[type="password"]' );
		act( () => { typeInto( email, 'qa@qa.oppti.dev' ); typeInto( pw, 'correct-horse-1' ); } );
		const submit = Array.from( doc.querySelectorAll( 'button' ) ).find( ( b ) => /Sign in & connect/.test( b.textContent ) );
		expect( submit ).toBeTruthy();
		await act( async () => { submit.click(); } );
		expect( onSuccess ).toHaveBeenCalledWith( payload );
		expect( onClose ).not.toHaveBeenCalled();
		act( () => { jest.advanceTimersByTime( 1000 ); } );
		expect( onClose ).toHaveBeenCalled();
		act( () => root.unmount() );
		jest.useRealTimers();
	} );
} );

describe( 'one Optimise action on the Library', () => {
	const pages = [
		{ id: 1, title: 'Done page', status: 'ok' },
		{ id: 2, title: 'About us', status: 'missing-title' },
		{ id: 3, title: 'Contact', status: 'needs' },
	];

	test( 'picks the page chosen before connect, else the first page that needs work', () => {
		expect( firstActionPage( { id: 9, title: 'Picked' }, pages ).id ).toBe( 9 );
		expect( firstActionPage( null, pages ).id ).toBe( 2 );
		expect( firstActionPage( null, [ pages[ 0 ] ] ) ).toBeNull();
		expect( firstActionPage( null, [] ) ).toBeNull();
	} );

	test( 'the card renders exactly one Optimise button and it fires once', () => {
		const onOptimise = jest.fn();
		const { host, root } = mount( <FirstActionCard page={pages[ 1 ]} onOptimise={onOptimise} onDismiss={() => {}}/> );
		const buttons = Array.from( host.querySelectorAll( 'button' ) ).filter( ( b ) => b.textContent.trim() === 'Optimise' );
		expect( buttons ).toHaveLength( 1 );
		expect( host.textContent ).toContain( 'About us' );
		expect( host.textContent ).not.toMatch( /Generate/ );
		act( () => buttons[ 0 ].click() );
		expect( onOptimise ).toHaveBeenCalledTimes( 1 );
		act( () => root.unmount() );
	} );

	test( 'no card without a page', () => {
		const { host, root } = mount( <FirstActionCard page={null} onOptimise={() => {}} onDismiss={() => {}}/> );
		expect( host.innerHTML ).toBe( '' );
		act( () => root.unmount() );
	} );
} );
