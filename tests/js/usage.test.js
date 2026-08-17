const { creditUsageRows } = require( '../../src/usage' );

describe( 'creditUsageRows', () => {
	test( 'always lists the full plugin catalog, this plugin first', () => {
		const { rows, hasSplit, attributed } = creditUsageRows( { credits_used: 6 }, 6 );
		expect( hasSplit ).toBe( false );
		expect( attributed ).toBe( 0 );
		expect( rows.map( r => r.id ) ).toEqual( [ 'title_meta', 'alt_text', 'internal_linking', 'schema' ] );
		expect( rows.every( r => r.used === null ) ).toBe( true );
		expect( rows[0] ).toEqual( expect.objectContaining( { id: 'title_meta', current: true, installed: true } ) );
	} );

	test( 'marks siblings as installed only when known or billed', () => {
		const { rows } = creditUsageRows( { credits_used: 6 }, 6, { alt_text: true } );
		const byId = Object.fromEntries( rows.map( r => [ r.id, r ] ) );
		expect( byId.alt_text.installed ).toBe( true );   // explicit install hint
		expect( byId.schema.installed ).toBe( false );    // no hint, no usage
	} );

	test( 'attributes per-feature usage and reports the attributed total', () => {
		const { rows, hasSplit, attributed } = creditUsageRows( {
			usage_by_feature: { alt_text: 10, title_meta: { credits_used: 5 } },
		}, 15 );
		expect( hasSplit ).toBe( true );
		expect( attributed ).toBe( 15 ); // reconciles with the total → card shows the split
		const byId = Object.fromEntries( rows.map( r => [ r.id, r ] ) );
		expect( byId.title_meta ).toEqual( expect.objectContaining( { used: 5, current: true } ) );
		expect( byId.alt_text ).toEqual( expect.objectContaining( { used: 10, installed: true } ) );
		expect( byId.schema ).toEqual( expect.objectContaining( { used: 0 } ) );
	} );

	test( 'reports a shortfall when usage predates tracking (card falls back to shared bar)', () => {
		const { attributed, total } = creditUsageRows( { usage_by_feature: { title_meta: 0 } }, 16 );
		expect( attributed ).toBe( 0 );
		expect( total ).toBe( 16 );
		expect( attributed < total ).toBe( true );
	} );
} );
