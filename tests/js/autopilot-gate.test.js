/**
 * Autopilot gate (src/quota.js canUseAutopilot / autopilotToggleGate).
 * Automatic titles on new posts (the `auto_generate` toggle) are included on
 * Starter, Growth (billing id `pro`, alias `growth`) and Agency. Free and
 * unknown plans open the Autopilot paywall. Continuous Optimisation stays
 * Growth/Agency only (isProPlan).
 */
const { canUseAutopilot, autopilotToggleGate, isProPlan } = require( '../../src/quota' );

describe( 'canUseAutopilot', () => {
	test.each( [ 'starter', 'Starter', ' starter ', 'pro', 'growth', 'agency', 'AGENCY' ] )( 'allows %p', ( plan ) => {
		expect( canUseAutopilot( plan ) ).toBe( true );
	} );
	test.each( [ 'free', 'guest', 'enterprise', '', null, undefined, 0 ] )( 'gates %p', ( plan ) => {
		expect( canUseAutopilot( plan ) ).toBe( false );
	} );
} );

describe( 'autopilotToggleGate (auto-generate on publish)', () => {
	test( 'Starter can switch Autopilot on without a paywall', () => {
		expect( autopilotToggleGate( true, 'starter' ) ).toBeNull();
	} );
	test.each( [ 'pro', 'growth', 'agency' ] )( '%p can switch Autopilot on', ( plan ) => {
		expect( autopilotToggleGate( true, plan ) ).toBeNull();
	} );
	test.each( [ 'free', '', null, 'guest' ] )( '%p opens the autopilot paywall, not continuous-optimisation', ( plan ) => {
		expect( autopilotToggleGate( true, plan ) ).toBe( 'autopilot' );
	} );
	test.each( [ 'free', 'starter', 'pro', '' ] )( 'switching off is always allowed (%p)', ( plan ) => {
		expect( autopilotToggleGate( false, plan ) ).toBeNull();
	} );
} );

describe( 'Continuous Optimisation stays Growth/Agency only', () => {
	test( 'Starter has Autopilot but not Continuous Optimisation', () => {
		expect( canUseAutopilot( 'starter' ) ).toBe( true );
		expect( isProPlan( 'starter' ) ).toBe( false );
	} );
	test.each( [ 'pro', 'growth', 'agency' ] )( '%p has both', ( plan ) => {
		expect( canUseAutopilot( plan ) ).toBe( true );
		expect( isProPlan( plan ) ).toBe( true );
	} );
} );
