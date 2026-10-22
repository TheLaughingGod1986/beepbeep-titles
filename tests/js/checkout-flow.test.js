/**
 * Upgrade checkout: one click = one checkout, same tab, visible recovery panel.
 */
import { createCheckoutFlow } from '../../src/checkoutFlow';

const STRIPE = 'https://checkout.stripe.com/c/pay/cs_test_abc';

function setup( createCheckout, overrides = {} ) {
	const events = [];
	const panels = [];
	const navigated = [];
	let timerFn = null;
	const flow = createCheckoutFlow( {
		createCheckout,
		track: ( name, props ) => events.push( [ name, props ] ),
		navigate: ( url ) => navigated.push( url ),
		showPanel: ( p ) => panels.push( p ),
		onRouteError: () => false,
		setTimer: ( fn ) => { timerFn = fn; return 1; },
		clearTimer: () => {},
		isHidden: () => false,
		...overrides,
	} );
	return { flow, events, panels, navigated, fireTimer: () => timerFn && timerFn() };
}

test( 'rapid clicks create exactly one checkout for the chosen plan and navigate the same tab', async () => {
	const createCheckout = jest.fn().mockResolvedValue( { url: STRIPE, session_id: 'cs_test_abc' } );
	const { flow, events, navigated } = setup( createCheckout );
	const first = flow.start( { plan: 'starter' } );
	expect( await flow.start( { plan: 'starter' } ) ).toBe( 'locked' );
	expect( await flow.start( { plan: 'pro' } ) ).toBe( 'locked' );
	await first;
	expect( createCheckout ).toHaveBeenCalledTimes( 1 );
	expect( createCheckout ).toHaveBeenCalledWith( { plan: 'starter' } );
	expect( navigated ).toEqual( [ STRIPE ] );
	expect( events.map( ( e ) => e[ 0 ] ) ).toEqual( [ 'checkout_clicked', 'checkout_session_returned', 'checkout_redirected' ] );
	expect( events[ 1 ][ 1 ] ).toMatchObject( { plan: 'starter', session_id: 'cs_test_abc' } );
} );

test( 'no navigation within the grace period shows Continue panel with url + session and unlocks', async () => {
	const { flow, panels, fireTimer } = setup( jest.fn().mockResolvedValue( { url: STRIPE, sessionId: 'cs_test_abc' } ) );
	await flow.start( { plan: 'pro' } );
	expect( flow.isInFlight() ).toBe( true );
	fireTimer();
	expect( panels[ panels.length - 1 ] ).toEqual( { url: STRIPE, sessionId: 'cs_test_abc', plan: 'pro' } );
	expect( flow.isInFlight() ).toBe( false );
} );

test( 'backend error: checkout_failed carries the real code and the panel shows the real text', async () => {
	const err = Object.assign( new Error( 'This price is only available in the United States.' ), { code: 'USD_PRICE_REQUIRES_US_COUNTRY', status: 400 } );
	const { flow, events, panels, navigated } = setup( jest.fn().mockRejectedValue( err ) );
	expect( await flow.start( { plan: 'starter' } ) ).toBe( 'failed' );
	expect( navigated ).toEqual( [] );
	const failed = events.find( ( e ) => e[ 0 ] === 'checkout_failed' );
	expect( failed[ 1 ] ).toMatchObject( { plan: 'starter', error_code: 'USD_PRICE_REQUIRES_US_COUNTRY', status: 400 } );
	expect( panels[ panels.length - 1 ].message ).toBe( 'This price is only available in the United States.' );
	expect( flow.isInFlight() ).toBe( false );
} );

test( '200 without a Stripe url is a failure, never a navigation', async () => {
	const { flow, events, navigated } = setup( jest.fn().mockResolvedValue( { url: 'https://evil.example/x' } ) );
	expect( await flow.start( { plan: 'pro' } ) ).toBe( 'failed' );
	expect( navigated ).toEqual( [] );
	expect( events.find( ( e ) => e[ 0 ] === 'checkout_failed' )[ 1 ].error_code ).toBe( 'MISSING_CHECKOUT_URL' );
} );

test( 'license / quota errors are routed and no panel is shown', async () => {
	const err = Object.assign( new Error( 'x' ), { code: 'INVALID_LICENSE', status: 401 } );
	const panels = [];
	const { flow } = setup( jest.fn().mockRejectedValue( err ), { onRouteError: () => true, showPanel: ( p ) => panels.push( p ) } );
	expect( await flow.start( { plan: 'pro' } ) ).toBe( 'routed' );
	expect( panels.filter( Boolean ) ).toEqual( [] );
} );
