/**
 * Onboarding open gate: existing installs without the flag should not be interrupted.
 * Fresh installs (onboarding_complete: false) open for both connected and signed-out users.
 */

function shouldOpenOnboarding( onboardingComplete ) {
	return ! ( onboardingComplete ?? true );
}

describe( 'shouldOpenOnboarding', () => {
	test( 'opens when onboarding_complete is false (connected or signed-out)', () => {
		expect( shouldOpenOnboarding( false ) ).toBe( true );
	} );

	test( 'does not open after onboarding_complete is true', () => {
		expect( shouldOpenOnboarding( true ) ).toBe( false );
	} );

	test( 'treats missing flag as complete for existing installs', () => {
		expect( shouldOpenOnboarding( undefined ) ).toBe( false );
		expect( shouldOpenOnboarding( null ) ).toBe( false );
	} );
} );
