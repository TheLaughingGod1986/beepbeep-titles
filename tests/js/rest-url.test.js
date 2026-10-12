import { restUrl } from '../../src/restUrl';

describe( 'restUrl', () => {
    const pretty = 'http://example.test/wp-json/beepbeep-titles/v1';
    const plain  = 'http://example.test/index.php?rest_route=/beepbeep-titles/v1';

    test( 'pretty permalinks: path without query', () => {
        expect( restUrl( pretty, '/quota' ) ).toBe( `${ pretty }/quota` );
    } );
    test( 'pretty permalinks: path query uses ?', () => {
        expect( restUrl( pretty, '/activity?limit=30' ) ).toBe( `${ pretty }/activity?limit=30` );
    } );
    test( 'plain permalinks: path without query', () => {
        expect( restUrl( plain, '/quota' ) ).toBe( `${ plain }/quota` );
    } );
    test( 'plain permalinks: path query uses &, never a second ?', () => {
        const url = restUrl( plain, '/pages?filter=needs&search=&page=1&per_page=5' );
        expect( url ).toBe( `${ plain }/pages&filter=needs&search=&page=1&per_page=5` );
        expect( url.split( '?' ) ).toHaveLength( 2 );
        const params = new URL( url ).searchParams;
        expect( params.get( 'rest_route' ) ).toBe( '/beepbeep-titles/v1/pages' );
        expect( params.get( 'per_page' ) ).toBe( '5' );
    } );
    test( 'all five query routes work on both styles', () => {
        [ '/activity?limit=30', '/health/priorities?limit=10', '/health/items?status=&page=1', '/pages?page=1&per_page=1', '/pages?page=1&per_page=5' ]
            .forEach( ( path ) => {
                [ pretty, plain ].forEach( ( base ) => {
                    expect( restUrl( base, path ).split( '?' ) ).toHaveLength( 2 );
                } );
            } );
    } );
} );
