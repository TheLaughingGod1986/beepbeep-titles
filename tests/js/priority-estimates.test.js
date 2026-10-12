const { capPriorityEstimates } = require( '../../src/priorityEstimates' );

describe( 'capPriorityEstimates', () => {
    test( 'scales the reported 92/100 over-headroom case proportionally to 8', () => {
        const capped = capPriorityEstimates(
            [
                { code: 'duplicate_title', estimated_gain: 10 },
                { code: 'title_truncated', estimated_gain: 4 },
                { code: 'desc_truncated', estimated_gain: 4 },
            ],
            92,
        );
        const gains = capped.map( ( p ) => p.estimated_gain );
        expect( gains.reduce( ( a, b ) => a + b, 0 ) ).toBe( 8 );
        expect( gains ).toEqual( [ 4, 2, 2 ] );
        expect( Math.max( ...gains ) ).toBeLessThanOrEqual( 8 );
    } );

    test( 'shows +0 when score is already 100', () => {
        const capped = capPriorityEstimates(
            [ { code: 'duplicate_title', estimated_gain: 10 } ],
            100,
        );
        expect( capped[ 0 ].estimated_gain ).toBe( 0 );
    } );

    test( 'clamps a single oversized action to remaining headroom', () => {
        const capped = capPriorityEstimates(
            [ { code: 'duplicate_title', estimated_gain: 10 } ],
            99,
        );
        expect( capped[ 0 ].estimated_gain ).toBe( 1 );
    } );

    test( 'leaves estimates unchanged when they fit under headroom', () => {
        const capped = capPriorityEstimates(
            [
                { code: 'a', estimated_gain: 3 },
                { code: 'b', estimated_gain: 2 },
            ],
            90,
        );
        expect( capped.map( ( p ) => p.estimated_gain ) ).toEqual( [ 3, 2 ] );
    } );
} );
