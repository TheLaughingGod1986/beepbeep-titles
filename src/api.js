/**
 * BeepBeep Titles — WordPress REST API client.
 *
 * All functions return the response JSON on success and throw an Error
 * with a human-readable message on failure. The nonce and base URL come
 * from window.bbtData, which is localised by Admin.php before this
 * script runs.
 */

const data = window.bbtData ?? {};
const BASE  = data.apiBase ?? '/wp-json/beepbeep-titles/v1';
const NONCE = data.nonce   ?? '';

async function request( method, path, body = null ) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce':   NONCE,
        },
        credentials: 'same-origin',
    };
    if ( body !== null ) {
        opts.body = JSON.stringify( body );
    }

    const res = await fetch( BASE + path, opts );
    const json = await res.json().catch( () => null );

    if ( ! res.ok ) {
        throw new Error( json?.message ?? `HTTP ${ res.status }` );
    }

    return json;
}

// ----------------------------------------------------------------
// Pages
// ----------------------------------------------------------------

export async function fetchPages( { filter = 'needs', search = '', page = 1, perPage = 30 } = {} ) {
    const qs = new URLSearchParams( {
        filter,
        search,
        page:     String( page ),
        per_page: String( perPage ),
    } );
    return request( 'GET', `/pages?${ qs }` );
}

export async function updatePage( id, { seoTitle, metaDesc } ) {
    return request( 'PATCH', `/pages/${ id }`, {
        seo_title: seoTitle,
        meta_desc: metaDesc,
    } );
}

// ----------------------------------------------------------------
// Generation
// ----------------------------------------------------------------

export async function generatePages( pageIds ) {
    return request( 'POST', '/generate', { page_ids: pageIds } );
}

// ----------------------------------------------------------------
// Quota
// ----------------------------------------------------------------

export async function fetchQuota() {
    return request( 'GET', '/quota' );
}

// ----------------------------------------------------------------
// Scan
// ----------------------------------------------------------------

export async function runScan() {
    return request( 'POST', '/scan' );
}

// ----------------------------------------------------------------
// Settings
// ----------------------------------------------------------------

export async function fetchSettings() {
    return request( 'GET', '/settings' );
}

export async function saveSettings( settings ) {
    return request( 'PATCH', '/settings', settings );
}

// ----------------------------------------------------------------
// Localised initial state (from PHP)
// ----------------------------------------------------------------

export function getInitialData() {
    return {
        user:     data.user     ?? { id: 0, name: 'Admin', email: '' },
        quota:    data.quota    ?? { plan: 'free', daily_used: 0, daily_limit: 5, monthly_used: 0, monthly_limit: 50, daily_remaining: 5 },
        settings: data.settings ?? {},
    };
}
