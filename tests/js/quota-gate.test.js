/**
 * Unit tests for quota defaults and paywall gate helpers (src/quota.js).
 */

const {
	QUOTA_DEFAULTS,
	CREDITS_PER_PAGE,
	dailyRemainingForGate,
	dailyRemainingForLibrary,
	isDailyExhausted,
	isBulkOverLimit,
	canGenerateOne,
	heroGenerationCap,
	isGenerationUnavailable,
	pagesAffordable,
} = require( '../../src/quota' );

describe( 'QUOTA_DEFAULTS', () => {
	test( 'exports stable free-plan defaults', () => {
		expect( QUOTA_DEFAULTS ).toEqual( {
			daily_limit: 5,
			monthly_limit: 25,
			daily_remaining: 0,
		} );
	} );
} );

describe( 'service credit gate helpers', () => {
	test( 'dailyRemainingForGate computes from limit minus used', () => {
		expect( dailyRemainingForGate( { daily_limit: 5, daily_used: 2 } ) ).toBe( 3 );
	} );

	test( 'dailyRemainingForLibrary uses the daily cap when one is present', () => {
		expect( dailyRemainingForLibrary( { daily_limit: 5 } ) ).toBe( 5 );
	} );

	test( 'dailyRemainingForLibrary falls back to monthly credits when no daily cap (shared wallet)', () => {
		// Shared wallet sends daily_limit: null — gate on monthly credits instead.
		expect( dailyRemainingForLibrary( { daily_limit: null, monthly_limit: 50, monthly_used: 10 } ) ).toBe( 40 );
		// Empty quota defaults to the Free monthly allowance.
		expect( dailyRemainingForLibrary( {} ) ).toBe( 25 );
	} );

	test( 'credit exhaustion is independent of the service plan label', () => {
		expect( isDailyExhausted( 0 ) ).toBe( true );
		expect( dailyRemainingForGate( { plan: 'pro', daily_limit: 5, daily_remaining: 0 } ) ).toBe( 0 );
	} );

	test( 'isBulkOverLimit and canGenerateOne account for credits-per-page', () => {
		expect( CREDITS_PER_PAGE ).toBe( 2 );
		expect( isBulkOverLimit( 3, 5 ) ).toBe( true ); // 3 pages × 2 credits = 6 > 5
		expect( isBulkOverLimit( 2, 5 ) ).toBe( false ); // 4 ≤ 5
		expect( canGenerateOne( 0 ) ).toBe( false );
		expect( canGenerateOne( 1 ) ).toBe( false );
		expect( canGenerateOne( 2 ) ).toBe( true );
		expect( heroGenerationCap( 3 ) ).toBe( pagesAffordable( 3 ) );
		expect( heroGenerationCap( 3 ) ).toBe( 1 );
	} );

	test( 'isGenerationUnavailable reports a disconnected service', () => {
		expect( isGenerationUnavailable( false, 50 ) ).toBe( true );
		expect( isGenerationUnavailable( false, 5 ) ).toBe( true );
	} );

	test( 'isGenerationUnavailable reports exhausted service credits', () => {
		expect( isGenerationUnavailable( true, 0 ) ).toBe( true );
		expect( isGenerationUnavailable( true, 1 ) ).toBe( true );
		expect( isGenerationUnavailable( true, 3 ) ).toBe( false );
	} );
} );
