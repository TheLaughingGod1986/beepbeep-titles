/**
 * Unit tests for the error-code → UI mapping helpers (src/errors.js).
 */

const { paywallTrigger, isPaywall, errorToast, checkoutErrorToast, classifyCheckoutError } = require( '../../src/errors' );

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

	test( 'rest_post_invalid_id asks to refresh the scan', () => {
		const toast = errorToast( { code: 'rest_post_invalid_id', message: 'Page not found.' } );
		expect( toast.message ).toBe( 'Page not found' );
		expect( toast.tone ).toBe( 'warn' );
	} );

	test( 'rest_forbidden is not mislabelled as a network error', () => {
		const toast = errorToast( { code: 'rest_forbidden' } );
		expect( toast.message ).toBe( 'Permission denied' );
		expect( toast.message ).not.toBe( "Couldn't reach the generator" );
	} );

	test( 'unknown codes fall back to a generic toast', () => {
		const toast = errorToast( { code: 'WHO_KNOWS' } );
		expect( toast.message ).toBe( "Couldn't reach the generator" );
		expect( errorToast( null ).message ).toBe( "Couldn't reach the generator" );
	} );
} );

describe( 'checkoutErrorToast', () => {
	test( 'SITE_LIMIT_EXCEEDED explains the Pro dead-end clearly', () => {
		const toast = checkoutErrorToast( { code: 'SITE_LIMIT_EXCEEDED' } );
		expect( toast.message ).toBe( "Couldn't start Pro checkout" );
		expect( toast.tone ).toBe( 'warn' );
		expect( toast.sub ).toMatch( /subscription/i );
	} );

	test( 'surfaces backend Stripe messages for other failures', () => {
		const toast = checkoutErrorToast( { code: 'STRIPE_ERROR', message: 'No such price: price_x' } );
		expect( toast.message ).toBe( "Couldn't start checkout" );
		expect( toast.sub ).toBe( 'No such price: price_x' );
	} );

	test( 'does not echo the opaque checkout catch-all as the toast detail', () => {
		const toast = checkoutErrorToast( { code: 'STRIPE_ERROR', message: 'Failed to create checkout session' } );
		expect( toast.message ).toBe( "Couldn't start checkout" );
		expect( toast.sub ).toBe( "We couldn't reach Stripe. Please try again in a moment." );
	} );
} );

describe( 'classifyCheckoutError', () => {
	test( 'buckets SITE_LIMIT_EXCEEDED under plan_availability', () => {
		expect( classifyCheckoutError( { code: 'SITE_LIMIT_EXCEEDED' } ).error_category ).toBe( 'plan_availability' );
	} );
} );
