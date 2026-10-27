/**
 * Continuous Optimisation gate (src/quota.js isProPlan).
 * Growth (billing id `pro`, alias `growth`) and Agency are allowed;
 * Free, guest/unknown and Starter are gated.
 */
const { isProPlan, isPaidPlan } = require( '../../src/quota' );

describe( 'isProPlan (Continuous Optimisation)', () => {
	test.each( [ 'pro', 'growth', 'agency', 'PRO', 'Agency', ' Growth ' ] )( 'allows %p', ( plan ) => {
		expect( isProPlan( plan ) ).toBe( true );
	} );

	test.each( [ 'free', 'starter', 'Starter', 'guest', 'enterprise', '', null, undefined, 0 ] )( 'gates %p', ( plan ) => {
		expect( isProPlan( plan ) ).toBe( false );
	} );
} );

describe( 'isPaidPlan (Autopilot, incl. auto-generate on publish)', () => {
	test.each( [ 'starter', 'pro', 'growth', 'agency' ] )( 'allows %p', ( plan ) => {
		expect( isPaidPlan( plan ) ).toBe( true );
	} );
	test.each( [ 'free', '', null, 'guest' ] )( 'gates %p', ( plan ) => {
		expect( isPaidPlan( plan ) ).toBe( false );
	} );
} );
