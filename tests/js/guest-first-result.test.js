/**
 * 1.0.32 (b): guest first result. A signed-out user can click Optimise on one
 * Library page; if the backend has no guest allowance (or it is used up) the
 * drawer closes and asks for an account, keeping the picked page.
 */
import { createRoot } from 'react-dom/client';
import { act } from 'react';

jest.mock( '@wordpress/i18n', () => ( { __: ( s ) => s } ), { virtual: true } );
jest.mock( '../../src/api', () => {
	const actual = jest.requireActual( '../../src/api' );
	return { ...actual, generateSingle: jest.fn(), submitJob: jest.fn(), updatePage: jest.fn() };
} );

const api = require( '../../src/api' );
const { needsAccount, isPaywall } = require( '../../src/errors' );
const { GenerationDrawer } = require( '../../src/modals/GenerationDrawer' );

global.IS_REACT_ACT_ENVIRONMENT = true;

const page = { id: 7, title: 'About us', url: '/about' };

async function runDrawer( rejection ) {
	api.generateSingle.mockReset();
	api.generateSingle.mockRejectedValue( rejection );
	const host = document.createElement( 'div' );
	document.body.appendChild( host );
	const root = createRoot( host );
	const props = { onClose: jest.fn(), onComplete: jest.fn(), onPaywall: jest.fn(), onNeedsAccount: jest.fn(), onToast: jest.fn() };
	await act( async () => { root.render( <GenerationDrawer open pages={[ page ]} {...props}/> ); } );
	await act( async () => { await Promise.resolve(); } );
	act( () => root.unmount() );
	return props;
}

describe( 'guest first result', () => {
	test( 'GUEST_SIGNUP_REQUIRED is an account prompt, not a paywall', () => {
		const err = new api.ApiError( 'Create an account', { code: 'GUEST_SIGNUP_REQUIRED', status: 401 } );
		expect( needsAccount( err ) ).toBe( true );
		expect( isPaywall( err ) ).toBe( false );
		expect( needsAccount( new api.ApiError( 'x', { code: 'QUOTA_EXCEEDED' } ) ) ).toBe( false );
	} );

	test( 'drawer closes and hands the picked page to onNeedsAccount', async () => {
		const p = await runDrawer( new api.ApiError( 'Create an account', { code: 'GUEST_SIGNUP_REQUIRED', status: 401 } ) );
		expect( api.generateSingle ).toHaveBeenCalledWith( { postId: 7 } );
		expect( p.onClose ).toHaveBeenCalled();
		expect( p.onNeedsAccount ).toHaveBeenCalledWith( expect.objectContaining( { id: 7 } ) );
		expect( p.onPaywall ).not.toHaveBeenCalled();
		expect( p.onToast ).not.toHaveBeenCalled();
	} );

	test( 'other errors still toast and do not ask for an account', async () => {
		const p = await runDrawer( new api.ApiError( 'Down', { code: 'SERVICE_UNAVAILABLE', status: 503 } ) );
		expect( p.onNeedsAccount ).not.toHaveBeenCalled();
		expect( p.onToast ).toHaveBeenCalled();
	} );
} );
