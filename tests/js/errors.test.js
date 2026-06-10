/**
 * Unit tests for the error-code → UI mapping helpers (src/errors.js).
 */

const { paywallTrigger, isPaywall, errorToast } = require( '../../src/errors' );

describe( 'paywallTrigger', () => {
	test( 'DAILY_QUOTA_EXCEEDED maps to the daily-limit paywall', () => {
		expect( paywallTrigger( { code: 'DAILY_QUOTA_EXCEEDED' } ) ).toBe( 'daily-limit' );
	} );

	test( 'QUOTA_EXCEEDED maps to the monthly-limit paywall', () => {
		expect( paywallTrigger( { code: 'QUOTA_EXCEEDED' } ) ).toBe( 'monthly-limit' );
	} );

	test( 'other codes and null are not paywalls', () => {
		expect( paywallTrigger( { code: 'INVALID_LICENSE' } ) ).toBeNull();
		expect( paywallTrigger( { code: 'SOMETHING_ELSE' } ) ).toBeNull();
		expect( paywallTrigger( null ) ).toBeNull();
		expect( paywallTrigger( undefined ) ).toBeNull();
	} );
} );

describe( 'isPaywall', () => {
	test( 'true for quota errors', () => {
		expect( isPaywall( { code: 'DAILY_QUOTA_EXCEEDED' } ) ).toBe( true );
		expect( isPaywall( { code: 'QUOTA_EXCEEDED' } ) ).toBe( true );
	} );

	test( 'false for everything else', () => {
		expect( isPaywall( { code: 'RATE_LIMIT_EXCEEDED' } ) ).toBe( false );
		expect( isPaywall( null ) ).toBe( false );
	} );
} );

describe( 'errorToast', () => {
	test( 'INVALID_LICENSE asks for a license key', () => {
		const toast = errorToast( { code: 'INVALID_LICENSE' } );
		expect( toast.message ).toBe( 'License key needed' );
		expect( toast.tone ).toBe( 'warn' );
	} );

	test( 'RATE_LIMIT_EXCEEDED asks to slow down', () => {
		const toast = errorToast( { code: 'RATE_LIMIT_EXCEEDED' } );
		expect( toast.message ).toBe( 'Slow down a moment' );
		expect( toast.icon ).toBe( 'info' );
	} );

	test( 'OFFLINE reports the offline state', () => {
		const toast = errorToast( { code: 'OFFLINE' } );
		expect( toast.message ).toBe( 'You appear to be offline' );
	} );

	test( 'unknown codes fall back to a generic toast', () => {
		const toast = errorToast( { code: 'WHO_KNOWS' } );
		expect( toast.message ).toBe( "Couldn't reach the generator" );
		expect( errorToast( null ).message ).toBe( "Couldn't reach the generator" );
	} );
} );
