/**
 * Cap per-action estimated_gain so Priority Action Centre rows never imply
 * a Metadata Health score above 100. Shares remaining headroom
 * (100 - currentScore) proportionally across the shown actions using
 * largest-remainder rounding so integers sum to at most headroom.
 *
 * @param {Array<{estimated_gain?: number}>} priorities
 * @param {number|null|undefined} currentScore
 * @returns {Array}
 */
export function capPriorityEstimates( priorities, currentScore ) {
    if ( ! priorities?.length ) return [];
    const headroom = Math.max( 0, 100 - ( currentScore ?? 0 ) );
    if ( headroom === 0 ) {
        return priorities.map( ( p ) => ( { ...p, estimated_gain: 0 } ) );
    }

    const rawGains = priorities.map( ( p ) => Math.max( 0, p.estimated_gain || 0 ) );
    const rawTotal = rawGains.reduce( ( sum, g ) => sum + g, 0 );

    if ( rawTotal <= headroom ) {
        return priorities.map( ( p, i ) => ( {
            ...p,
            estimated_gain: Math.min( headroom, rawGains[ i ] ),
        } ) );
    }

    const exacts = rawGains.map( ( g ) => ( g / rawTotal ) * headroom );
    const floors = exacts.map( ( e ) => Math.floor( e ) );
    let remainder = headroom - floors.reduce( ( a, b ) => a + b, 0 );
    const order = exacts
        .map( ( e, i ) => ( { i, frac: e - floors[ i ] } ) )
        .sort( ( a, b ) => b.frac - a.frac );
    const gains = [ ...floors ];
    for ( const { i } of order ) {
        if ( remainder <= 0 ) break;
        gains[ i ] += 1;
        remainder -= 1;
    }

    return priorities.map( ( p, i ) => ( { ...p, estimated_gain: gains[ i ] } ) );
}
