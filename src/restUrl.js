/**
 * Join the REST base (from get_rest_url()) with a route path that may carry
 * its own query string. With plain permalinks the base already has a query
 * (".../index.php?rest_route=/beepbeep-titles/v1"), so the path's query must
 * be appended with "&", not a second "?".
 */
export function restUrl( base, path = '' ) {
    const qIndex = path.indexOf( '?' );
    const route  = qIndex === -1 ? path : path.slice( 0, qIndex );
    const query  = qIndex === -1 ? '' : path.slice( qIndex + 1 );
    const url    = base + route;
    if ( ! query ) {
        return url;
    }
    return url + ( url.includes( '?' ) ? '&' : '?' ) + query;
}
