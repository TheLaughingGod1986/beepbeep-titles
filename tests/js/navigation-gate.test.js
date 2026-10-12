const {
    getVisibleTabs,
    resolveAllowedTab,
} = require( '../../src/navigation' );

describe( 'navigation gate', () => {
    test( 'shows every admin tab when connected', () => {
        expect( getVisibleTabs( true, { isAdmin: true } ).map( tab => tab.id ) ).toEqual( [
            'dashboard',
            'library',
            'automation',
            'settings',
            'billing',
        ] );
    } );

    test( 'hides billing for non-admins when connected', () => {
        expect( getVisibleTabs( true ).map( tab => tab.id ) ).toEqual( [
            'dashboard',
            'library',
            'automation',
            'settings',
        ] );
    } );

    test( 'shows only Home and Library when signed out', () => {
        expect( getVisibleTabs( false ).map( tab => tab.id ) ).toEqual( [ 'dashboard', 'library' ] );
        expect( getVisibleTabs( false, { isAdmin: true } ).map( tab => tab.id ) ).toEqual( [ 'dashboard', 'library' ] );
    } );

    test( 'redirects auth-gated tabs to Home when signed out', () => {
        expect( resolveAllowedTab( 'library', false ) ).toBe( 'library' );
        expect( resolveAllowedTab( 'automation', false ) ).toBe( 'dashboard' );
        expect( resolveAllowedTab( 'settings', false ) ).toBe( 'dashboard' );
        expect( resolveAllowedTab( 'billing', false, { isAdmin: true } ) ).toBe( 'dashboard' );
    } );

    test( 'allows protected tabs when connected', () => {
        expect( resolveAllowedTab( 'library', true ) ).toBe( 'library' );
        expect( resolveAllowedTab( 'automation', true ) ).toBe( 'automation' );
        expect( resolveAllowedTab( 'settings', true ) ).toBe( 'settings' );
        expect( resolveAllowedTab( 'billing', true, { isAdmin: true } ) ).toBe( 'billing' );
    } );
} );
