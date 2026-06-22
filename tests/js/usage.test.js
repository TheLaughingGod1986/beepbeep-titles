const { creditUsageRows } = require( '../../src/usage' );

describe( 'creditUsageRows', () => {
	test( 'always lists the full plugin catalog, this plugin first', () => {
		const { rows, hasSplit } = creditUsageRows( { credits_used: 6 }, 6 );
		expect( hasSplit ).toBe( false );
		expect( rows.map( r => r.id ) ).toEqual( [ 'title_meta', 'alt_text', 'schema' ] );
		// No attribution → keep the catalog but leave per-row numbers off.
		expect( rows.every( r => r.used === null ) ).toBe( true );
		expect( rows[0] ).toEqual( expect.objectContaining( { id: 'title_meta', current: true, installed: true } ) );
	} );

	test( 'marks siblings as installed only when known or billed', () => {
		const { rows } = creditUsageRows( { credits_used: 6 }, 6, { alt_text: true } );
		const byId = Object.fromEntries( rows.map( r => [ r.id, r ] ) );
		expect( byId.alt_text.installed ).toBe( true );   // explicit install hint
		expect( byId.schema.installed ).toBe( false );    // no hint, no usage
	} );

	test( 'normalizes per-feature usage and marks Titles as this plugin', () => {
		const { rows, hasSplit } = creditUsageRows( {
			usage_by_feature: { alt_text: 4, title_meta: { credits_used: 2 } },
		}, 6 );
		expect( hasSplit ).toBe( true );
		const byId = Object.fromEntries( rows.map( r => [ r.id, r ] ) );
		expect( byId.title_meta ).toEqual( expect.objectContaining( { used: 2, current: true } ) );
		expect( byId.alt_text ).toEqual( expect.objectContaining( { used: 4, installed: true } ) );
		expect( byId.schema ).toEqual( expect.objectContaining( { used: 0 } ) );
	} );

	test( 'keeps unattributed shared credits visible as Other', () => {
		const { rows } = creditUsageRows( { plugin_usage: [ { plugin: 'titles', used: 2 } ] }, 6 );
		const other = rows.find( r => r.id === 'other' );
		expect( other ).toEqual( expect.objectContaining( { used: 4 } ) );
	} );
} );
