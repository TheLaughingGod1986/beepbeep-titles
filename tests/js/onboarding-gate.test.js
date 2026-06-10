/**
 * Onboarding open gate: existing installs without the flag should not be interrupted.
 */

function shouldOpenOnboarding( connected, onboardingComplete ) {
	return connected && ! ( onboardingComplete ?? true );
}

describe( 'shouldOpenOnboarding', () => {
	test( 'opens for connected users who have not completed onboarding', () => {
		expect( shouldOpenOnboarding( true, false ) ).toBe( true );
	} );

	test( 'does not open when disconnected', () => {
		expect( shouldOpenOnboarding( false, false ) ).toBe( false );
	} );

	test( 'does not open after onboarding_complete is true', () => {
		expect( shouldOpenOnboarding( true, true ) ).toBe( false );
	} );

	test( 'treats missing flag as complete for existing installs', () => {
		expect( shouldOpenOnboarding( true, undefined ) ).toBe( false );
		expect( shouldOpenOnboarding( true, null ) ).toBe( false );
	} );
} );
