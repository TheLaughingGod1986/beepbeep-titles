jest.mock( '@wordpress/i18n', () => ( { __: ( text ) => text } ), { virtual: true } );

import { signupSourcePayload, SIGNUP_SOURCE_VALUES } from '../../src/signupSource';

describe( 'signupSourcePayload', () => {
    test( 'blank sends nothing', () => {
        expect( signupSourcePayload( '', 'x' ) ).toEqual( {} );
    } );
    test( 'unknown value sends nothing', () => {
        expect( signupSourcePayload( 'tiktok', '' ) ).toEqual( {} );
    } );
    test( 'valid value drops free text unless other', () => {
        expect( signupSourcePayload( 'oppti_site', 'x' ) ).toEqual( { signup_source: 'oppti_site' } );
        expect( SIGNUP_SOURCE_VALUES ).toEqual( [ 'wporg_search', 'google', 'ai_assistant', 'oppti_site', 'friend_colleague', 'social', 'other' ] );
    } );
    test( 'other keeps stripped, capped text', () => {
        const out = signupSourcePayload( 'other', '<b>Podcast</b> ' + 'a'.repeat( 300 ) );
        expect( out.signup_source ).toBe( 'other' );
        expect( out.signup_source_other.startsWith( 'Podcast' ) ).toBe( true );
        expect( out.signup_source_other.length ).toBeLessThanOrEqual( 200 );
    } );
} );
