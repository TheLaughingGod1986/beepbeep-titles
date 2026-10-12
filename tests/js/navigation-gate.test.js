const {
    getVisibleTabs,
    resolveAllowedTab,
} = require( '../../src/navigation' );

describe( 'navigation gate', () => {
    test( 'shows every admin tab when connected', () => {
        expect( getVisibleTabs( true ).map( tab => tab.id ) ).toEqual( [
            'dashboard',
            'library',
            'automation',
            'settings',
        ] );
    } );

	test( 'keeps local plugin screens available when signed out', () => {
		// Autopilot requires an account; signed-out users keep Home + Library (local scan/edit)
		// and Settings, so they can see and change the usage-stats opt-in.
		expect( getVisibleTabs( false ).map( tab => tab.id ) ).toEqual( [ 'dashboard', 'library', 'settings' ] );
	} );

	test( 'allows local plugin tabs when signed out', () => {
		expect( resolveAllowedTab( 'library', false ) ).toBe( 'library' );
		expect( resolveAllowedTab( 'automation', false ) ).toBe( 'dashboard' );
		expect( resolveAllowedTab( 'settings', false ) ).toBe( 'settings' );
    } );

    test( 'allows protected tabs when connected', () => {
        expect( resolveAllowedTab( 'library', true ) ).toBe( 'library' );
        expect( resolveAllowedTab( 'automation', true ) ).toBe( 'automation' );
        expect( resolveAllowedTab( 'settings', true ) ).toBe( 'settings' );
    } );
} );
