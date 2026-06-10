/**
 * Unit tests for quota defaults and paywall gate helpers (src/quota.js).
 */

const {
	QUOTA_DEFAULTS,
	dailyRemainingForGate,
	dailyRemainingForLibrary,
	isDailyExhausted,
	isBulkOverLimit,
	canGenerateOne,
	heroGenerationCap,
} = require( '../../src/quota' );

describe( 'QUOTA_DEFAULTS', () => {
	test( 'exports stable free-plan defaults', () => {
		expect( QUOTA_DEFAULTS ).toEqual( {
			daily_limit: 5,
			monthly_limit: 50,
			daily_remaining: 0,
		} );
	} );
} );

describe( 'paywall gate helpers', () => {
	test( 'dailyRemainingForGate computes from limit minus used', () => {
		expect( dailyRemainingForGate( { daily_limit: 5, daily_used: 2 }, 'free' ) ).toBe( 3 );
	} );

	test( 'dailyRemainingForLibrary defaults missing remaining to daily limit', () => {
		expect( dailyRemainingForLibrary( {}, 'free' ) ).toBe( 5 );
	} );

	test( 'pro plan never exhausts daily quota', () => {
		expect( isDailyExhausted( 'pro', 0 ) ).toBe( false );
		expect( dailyRemainingForGate( {}, 'pro' ) ).toBe( Infinity );
	} );

	test( 'isBulkOverLimit and canGenerateOne mirror App/Library checks', () => {
		expect( isBulkOverLimit( 'free', 6, 5 ) ).toBe( true );
		expect( canGenerateOne( 'free', 0 ) ).toBe( false );
		expect( heroGenerationCap( 'free', 3 ) ).toBe( 3 );
		expect( heroGenerationCap( 'pro', 3 ) ).toBe( 10 );
	} );
} );
