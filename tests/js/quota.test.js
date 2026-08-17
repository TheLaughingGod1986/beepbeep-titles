/**
 * Unit tests for normalizeQuota (src/api.js).
 *
 * src/api.js reads window.beeptiAdminData at module load, so it is defined before the
 * module is required (jsdom provides `window`).
 */

window.beeptiAdminData = {};

const { normalizeQuota } = require( '../../src/api' );

const DISCONNECTED = {
	plan: 'free',
	connected: false,
	daily_used: 0,
	daily_limit: 5,
	daily_remaining: 0,
	monthly_used: 0,
	monthly_limit: 25,
	reset_date: null,
};

describe( 'normalizeQuota', () => {
	test( 'null input returns the disconnected default shape', () => {
		expect( normalizeQuota( null ) ).toEqual( DISCONNECTED );
	} );

	test( '{ connected: false } returns the disconnected default shape', () => {
		expect( normalizeQuota( { connected: false } ) ).toEqual( DISCONNECTED );
	} );

	test( '{ success: false } returns the disconnected default shape', () => {
		expect( normalizeQuota( { success: false } ) ).toEqual( DISCONNECTED );
	} );

	test( 'normalizes a full entitlement shape', () => {
		const out = normalizeQuota( {
			plan: 'pro',
			daily_limit: 10,
			daily_remaining: 4,
			total_limit: 100,
			credits_used: 20,
			reset_date: '2026-07-01',
		} );

		expect( out ).toMatchObject( {
			connected: true,
			plan: 'pro',
			daily_limit: 10,
			daily_remaining: 4,
			daily_used: 6, // limit - remaining
			monthly_limit: 100, // total_limit wins
			monthly_used: 20, // credits_used wins
			reset_date: '2026-07-01',
		} );
	} );

	test( 'daily_used is clamped at 0 when remaining exceeds the limit', () => {
		const out = normalizeQuota( { daily_limit: 5, daily_remaining: 10 } );
		expect( out.daily_used ).toBe( 0 );
	} );

	test( 'daily_remaining defaults to the daily limit (zero used)', () => {
		const out = normalizeQuota( { daily_limit: 8 } );
		expect( out.daily_remaining ).toBe( 8 );
		expect( out.daily_used ).toBe( 0 );
	} );

	test( 'monthly limit falls back total_limit -> monthly_limit -> 25', () => {
		expect( normalizeQuota( { total_limit: 100, monthly_limit: 200 } ).monthly_limit ).toBe( 100 );
		expect( normalizeQuota( { monthly_limit: 200 } ).monthly_limit ).toBe( 200 );
		expect( normalizeQuota( {} ).monthly_limit ).toBe( 25 );
	} );

	test( 'monthly_used derives from credits_remaining when credits_used is absent', () => {
		const out = normalizeQuota( { total_limit: 100, credits_remaining: 30 } );
		expect( out.monthly_used ).toBe( 70 );
	} );

	test( 'monthly_used is 0 when neither credits_used nor credits_remaining are present', () => {
		const out = normalizeQuota( { total_limit: 100 } );
		expect( out.monthly_used ).toBe( 0 );
	} );

	test( 'plan defaults to free and reset_date to null when connected', () => {
		const out = normalizeQuota( {} );
		expect( out.connected ).toBe( true );
		expect( out.plan ).toBe( 'free' );
		expect( out.reset_date ).toBeNull();
	} );
} );
