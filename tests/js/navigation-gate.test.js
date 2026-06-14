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

    test( 'shows only Home when signed out', () => {
        expect( getVisibleTabs( false ).map( tab => tab.id ) ).toEqual( [ 'dashboard' ] );
    } );

    test( 'redirects protected tabs to Home when signed out', () => {
        expect( resolveAllowedTab( 'library', false ) ).toBe( 'dashboard' );
        expect( resolveAllowedTab( 'automation', false ) ).toBe( 'dashboard' );
        expect( resolveAllowedTab( 'settings', false ) ).toBe( 'dashboard' );
    } );

    test( 'allows protected tabs when connected', () => {
        expect( resolveAllowedTab( 'library', true ) ).toBe( 'library' );
        expect( resolveAllowedTab( 'automation', true ) ).toBe( 'automation' );
        expect( resolveAllowedTab( 'settings', true ) ).toBe( 'settings' );
    } );
} );
