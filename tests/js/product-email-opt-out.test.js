jest.mock( '@wordpress/i18n', () => ( { __: ( text ) => text } ), { virtual: true } );

import { readFileSync } from 'fs';
import { join } from 'path';
import { ProductEmailOptOutField, productEmailOptOutPayload } from '../../src/productEmailOptOut';

describe( 'product email opt-out at sign-up', () => {
    test( 'payload is false unless the box is ticked', () => {
        expect( productEmailOptOutPayload( false ) ).toEqual( { product_emails_opt_out: false } );
        expect( productEmailOptOutPayload( undefined ) ).toEqual( { product_emails_opt_out: false } );
        expect( productEmailOptOutPayload( 'yes' ) ).toEqual( { product_emails_opt_out: false } );
        expect( productEmailOptOutPayload( true ) ).toEqual( { product_emails_opt_out: true } );
    } );

    test( 'checkbox renders unticked with the agreed label', () => {
        // react-dom/server needs TextEncoder, which jsdom does not provide.
        const util = require( 'util' );
        global.TextEncoder = global.TextEncoder || util.TextEncoder;
        const { renderToStaticMarkup } = require( 'react-dom/server' );
        const html = renderToStaticMarkup( <ProductEmailOptOutField checked={ false } onChange={ () => {} }/> );
        expect( html ).toContain( 'type="checkbox"' );
        expect( html ).toContain( 'name="product_emails_opt_out"' );
        expect( html ).not.toMatch( /checked=/ );
        expect( html ).toContain( 'Don&#x27;t send me product tips and plan emails' );
    } );

    test( 'both sign-up forms render the field and send it to /auth/register', () => {
        for ( const file of [ 'src/auth.jsx', 'src/modals/ConnectModal.jsx' ] ) {
            const src = readFileSync( join( __dirname, '../..', file ), 'utf8' );
            expect( src ).toContain( '<ProductEmailOptOutField checked={productEmailsOptOut}' );
            expect( src ).toContain( 'useState( false )' );
            expect( src ).toContain( '...productEmailOptOutPayload( productEmailsOptOut )' );
        }
    } );
} );
