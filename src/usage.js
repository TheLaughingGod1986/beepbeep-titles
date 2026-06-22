const FEATURE_META = {
    title_meta: { label: 'Titles & Meta Descriptions', icon: 'edit', color: '#2563EB', soft: '#EFF6FF', border: '#BFDBFE' },
    alt_text:   { label: 'Image ALT Text', icon: 'image', color: '#059669', soft: '#ECFDF5', border: '#A7F3D0' },
    schema:     { label: 'Schema & Rich Snippets', icon: 'trend', color: '#D97706', soft: '#FFFBEB', border: '#FDE68A' },
};

/* The fixed catalog of BeepBeep AI plugins that draw from the shared pool,
   newest-relevant first: this plugin, then its siblings. Always rendered in
   full so the card reads as a roster, not just "what happened to bill". */
const CATALOG = [
    { id: 'title_meta', current: true },
    { id: 'alt_text' },
    { id: 'schema' },
];

const FEATURE_ALIASES = {
    alt: 'alt_text',
    alttext: 'alt_text',
    image_alt: 'alt_text',
    image_alt_text: 'alt_text',
    titles: 'title_meta',
    title: 'title_meta',
    titles_meta: 'title_meta',
    titles_and_meta: 'title_meta',
    schema_markup: 'schema',
    rich_snippets: 'schema',
};

const canonicalFeature = value => {
    const key = String( value || '' ).trim().toLowerCase().replace( /[^a-z0-9]+/g, '_' ).replace( /^_|_$/g, '' );
    return FEATURE_ALIASES[key] || key || 'other';
};

const numericUsage = value => {
    const candidate = typeof value === 'object' && value !== null
        ? value.credits_used ?? value.used ?? value.credits ?? value.count
        : value;
    const parsed = Number( candidate );
    return Number.isFinite( parsed ) ? Math.max( 0, parsed ) : 0;
};

/** Pull the optional per-plugin attribution map out of a quota payload. */
function splitFromQuota( quota ) {
    const source = quota?.usage_by_feature
        ?? quota?.feature_usage
        ?? quota?.usage_by_plugin
        ?? quota?.plugin_usage
        ?? quota?.usage_breakdown
        ?? quota?.credit_usage;

    const entries = [];
    if ( Array.isArray( source ) ) {
        source.forEach( item => {
            if ( ! item || typeof item !== 'object' ) return;
            entries.push( [ item.feature_type ?? item.feature ?? item.plugin_id ?? item.plugin ?? item.id ?? item.name, item ] );
        } );
    } else if ( source && typeof source === 'object' ) {
        Object.entries( source ).forEach( entry => entries.push( entry ) );
    }

    const split = new Map();
    entries.forEach( ( [rawId, value] ) => {
        const id = canonicalFeature( rawId );
        split.set( id, ( split.get( id ) || 0 ) + numericUsage( value ) );
    } );
    return split;
}

/**
 * Build the shared-credit breakdown for the Settings card.
 *
 * Always returns the full plugin catalog (this plugin + siblings) so the card
 * reads as a roster, with `current` / `installed` flags driving the
 * "This plugin" and "Not installed" badges. Per-plugin credit counts are only
 * filled when the backend actually attributes them (`hasSplit`); when the
 * service reports a single combined total we keep the catalog visible but leave
 * the numbers off rather than inventing a split.
 *
 * @param {Object} quota     Normalized quota payload.
 * @param {number} totalUsed Combined credits used this cycle (header figure).
 * @param {Object} [installed] Optional install hints, e.g. { alt_text: true, schema: false }.
 * @returns {{ rows: Array, hasSplit: boolean, total: number }}
 */
export function creditUsageRows( quota, totalUsed = 0, installed = {} ) {
    const split   = splitFromQuota( quota );
    const hasSplit = split.size > 0;
    const total   = Math.max( 0, Number( totalUsed ) || 0 );

    const rows = CATALOG.map( ( { id, current } ) => {
        const meta = FEATURE_META[id];
        const used = split.get( id ) || 0;
        // A plugin counts as installed if the caller says so, or if it has
        // billed against the shared pool (it can't bill without being present).
        const isInstalled = !! current || installed[id] === true || used > 0;
        return {
            id,
            label: meta.label,
            icon: meta.icon,
            color: meta.color,
            soft: meta.soft,
            border: meta.border,
            current: !! current,
            installed: isInstalled,
            // Only surface a number when the backend attributed it.
            used: hasSplit ? used : null,
        };
    } );

    // When the backend attributes usage, keep any credits spent by plugins
    // outside the known catalog visible so the rows still reconcile to the total.
    if ( hasSplit ) {
        const known = new Set( CATALOG.map( c => c.id ) );
        let extra = 0;
        split.forEach( ( value, id ) => { if ( ! known.has( id ) ) extra += value; } );
        const attributed = rows.reduce( ( sum, row ) => sum + ( row.used || 0 ), 0 ) + extra;
        const unallocated = Math.max( 0, total - attributed ) + extra;
        if ( unallocated > 0 ) {
            rows.push( {
                id: 'other', label: 'Other BeepBeep AI services', icon: 'sparkles',
                color: '#64748B', soft: '#F8FAFC', border: '#E2E8F0',
                current: false, installed: true, used: unallocated,
            } );
        }
    }

    return { rows, hasSplit, total };
}
