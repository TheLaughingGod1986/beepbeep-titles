/**
 * Home/Audit must not treat "stats not loaded yet" as a real empty scan.
 */

window.beeptiAdminData = {};

const { auditStatusMessage } = require( '../../src/auditStatus' );
const { normalizeStats } = require( '../../src/api' );

describe( 'auditStatusMessage', () => {
	test( 'shows checking copy while stats are still null', () => {
		expect( auditStatusMessage( null ) ).toBe( 'Checking your local metadata audit…' );
		expect( auditStatusMessage( undefined ) ).toBe( 'Checking your local metadata audit…' );
	} );

	test( 'shows empty copy only after a loaded zero-total audit', () => {
		expect( auditStatusMessage( { total: 0 } ) ).toBe(
			'No published pages were found in the local metadata audit.'
		);
	} );

	test( 'shows scanned copy when totals are present', () => {
		expect( auditStatusMessage( { total: 12 } ) ).toBe(
			'We scanned 12 pages and found metadata opportunities.'
		);
	} );
} );

describe( 'normalizeStats', () => {
	test( 'returns null for missing payloads so Audit can stay in checking state', () => {
		expect( normalizeStats( null ) ).toBeNull();
		expect( normalizeStats( undefined ) ).toBeNull();
	} );

	test( 'seeds Home KPIs from PHP/transient coverage stats', () => {
		expect( normalizeStats( {
			total: 10,
			optimised: 4,
			remaining: 6,
			with_title: 7,
			with_meta: 5,
			coverage: 40,
		} ) ).toEqual( {
			total: 10,
			optimised: 4,
			needs_attention: 6,
			missing_title: 3,
			missing_meta: 5,
			coverage: 40,
			new_since_last_visit: 0,
			streak: 0,
		} );
	} );
} );
