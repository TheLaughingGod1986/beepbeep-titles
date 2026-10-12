/**
 * Unit tests for quota defaults and paywall gate helpers (src/quota.js).
 */

const {
	QUOTA_DEFAULTS,
	CREDITS_PER_PAGE,
	isProPlan,
	isPaidPlan,
	dailyRemainingForGate,
	dailyRemainingForLibrary,
	creditsPerPage,
	isDailyExhausted,
	isInsufficientCredits,
	insufficientCreditsMessage,
	isBulkOverLimit,
	canGenerateOne,
	pagesAffordable,
	heroGenerationCap,
	isGenerationUnavailable,
} = require( '../../src/quota' );

describe( 'isProPlan', () => {
	test( 'Continuous Optimisation gate treats only Pro as entitled', () => {
		expect( isProPlan( 'pro' ) ).toBe( true );
		expect( isProPlan( 'PRO' ) ).toBe( true );
		expect( isProPlan( 'free' ) ).toBe( false );
		expect( isProPlan( 'starter' ) ).toBe( false );
		expect( isProPlan( null ) ).toBe( false );
		expect( isProPlan( undefined ) ).toBe( false );
	} );
} );

describe( 'isPaidPlan', () => {
	test( 'Autopilot screen unlocks for any paid plan (Starter or Pro)', () => {
		expect( isPaidPlan( 'starter' ) ).toBe( true );
		expect( isPaidPlan( 'STARTER' ) ).toBe( true );
		expect( isPaidPlan( 'pro' ) ).toBe( true );
		expect( isPaidPlan( 'agency' ) ).toBe( true );
		expect( isPaidPlan( 'growth' ) ).toBe( true );
		expect( isPaidPlan( 'free' ) ).toBe( false );
		expect( isPaidPlan( null ) ).toBe( false );
		expect( isPaidPlan( undefined ) ).toBe( false );
	} );
} );

describe( 'QUOTA_DEFAULTS', () => {
	test( 'exports stable free-plan defaults', () => {
		expect( QUOTA_DEFAULTS ).toEqual( {
			daily_limit: 5,
			monthly_limit: 15,
			daily_remaining: 0,
		} );
	} );

	test( 'each page costs 2 credits (title + meta) by default', () => {
		expect( CREDITS_PER_PAGE ).toBe( 2 );
		expect( creditsPerPage( {} ) ).toBe( 2 );
		expect( creditsPerPage( { credits_per_page: 2 } ) ).toBe( 2 );
		expect( creditsPerPage( { credits_per_page: 3 } ) ).toBe( 3 );
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
		// Empty quota defaults to the 15-credit monthly allowance.
		expect( dailyRemainingForLibrary( {} ) ).toBe( 15 );
	} );

	test( 'credit exhaustion is independent of the service plan label', () => {
		expect( isDailyExhausted( 0 ) ).toBe( true );
		expect( dailyRemainingForGate( { plan: 'pro', daily_limit: 5, daily_remaining: 0 } ) ).toBe( 0 );
	} );

	test( 'isBulkOverLimit and canGenerateOne account for credits per page', () => {
		// 1 credit left cannot cover a 2-credit page.
		expect( canGenerateOne( 1 ) ).toBe( false );
		expect( canGenerateOne( 2 ) ).toBe( true );
		expect( canGenerateOne( 0 ) ).toBe( false );
		// 3 pages × 2 credits = 6 > 5 remaining.
		expect( isBulkOverLimit( 3, 5 ) ).toBe( true );
		expect( isBulkOverLimit( 2, 5 ) ).toBe( false );
		expect( heroGenerationCap( 3 ) ).toBe( 1 );
		expect( pagesAffordable( 5 ) ).toBe( 2 );
	} );

	test( 'isInsufficientCredits distinguishes leftover balance from empty wallet', () => {
		expect( isInsufficientCredits( 1, 2 ) ).toBe( true );
		expect( isInsufficientCredits( 0, 2 ) ).toBe( false );
		expect( isInsufficientCredits( 2, 2 ) ).toBe( false );
		expect( insufficientCreditsMessage( 1, 2 ) ).toBe(
			'You have 1 credit left, but each page needs 2 credits (title + meta). Add credits to continue.'
		);
	} );

	test( 'isGenerationUnavailable reports a disconnected service', () => {
		expect( isGenerationUnavailable( false, 50 ) ).toBe( true );
		expect( isGenerationUnavailable( false, 5 ) ).toBe( true );
	} );

	test( 'isGenerationUnavailable reports exhausted or insufficient service credits', () => {
		expect( isGenerationUnavailable( true, 0 ) ).toBe( true );
		expect( isGenerationUnavailable( true, 1 ) ).toBe( true );
		expect( isGenerationUnavailable( true, 3 ) ).toBe( false );
	} );
} );
