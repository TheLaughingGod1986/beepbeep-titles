/** Human-readable post-type label (page, post, product, custom CPT, …). */
export function formatPostType( type ) {
    const known = {
        page: 'Page',
        post: 'Post',
        product: 'Product',
    };
    if ( known[ type ] ) return known[ type ];
    if ( ! type ) return 'Content';
    return type.charAt( 0 ).toUpperCase() + type.slice( 1 ).replace( /_/g, ' ' );
}

function isRedundantSection( type, section ) {
    if ( type === 'page' && section === 'Pages' ) return true;
    if ( type === 'product' && section === 'Shop' ) return true;
    if ( type === 'post' && section === 'Blog' ) return true;
    return false;
}

/** Subtitle under a URL: "Post · News" or "Page" when section adds nothing. */
export function contentSubtitle( { type, section } ) {
    const label = formatPostType( type );
    if ( ! section || isRedundantSection( type, section ) ) return label;
    return `${ label } · ${ section }`;
}

/** Avatar monogram — distinct letters for common types. */
export function contentAvatarLetter( { type, section } ) {
    const letters = { page: 'P', post: 'B', product: 'S' };
    if ( type && letters[ type ] ) return letters[ type ];
    return ( section || 'C' )[ 0 ].toUpperCase();
}
