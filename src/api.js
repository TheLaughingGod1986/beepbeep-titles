import { QUOTA_DEFAULTS } from './quota';

/**
 * OpptiAI Titles — WordPress REST client.
 *
 * Talks only to the plugin's own /wp-json/beepbeep-titles/v1 proxy, which
 * injects the license + identity headers server-side. The browser never sees
 * the license key; it authenticates with the WP REST nonce.
 *
 * Every call resolves to the response JSON, or throws an `ApiError` carrying
 * the backend `.code`, HTTP `.status`, and `.entitlement_state` so callers
 * can map errors to the right paywall / toast.
 */

const data  = window.beeptiAdminData ?? {};
const BASE  = data.apiBase ?? '/wp-json/beepbeep-titles/v1';
const NONCE = data.nonce   ?? '';

export class ApiError extends Error {
    constructor( message, { code, status, entitlement_state } = {} ) {
        super( message || 'Request failed' );
        this.name              = 'ApiError';
        this.code              = code || 'API_ERROR';
        this.status            = status || 0;
        this.entitlement_state = entitlement_state || null;
    }
}

async function request( method, path, body = null ) {
    let res;
    try {
        res = await fetch( BASE + path, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce':   NONCE,
            },
            credentials: 'same-origin',
            body: body !== null ? JSON.stringify( body ) : undefined,
        } );
    } catch ( e ) {
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
        throw new ApiError(
            offline ? 'You appear to be offline.' : 'Couldn\'t reach the generator.',
            { code: offline ? 'OFFLINE' : 'NETWORK_ERROR', status: 0 }
        );
    }

    const json = await res.json().catch( () => null );

    // Non-2xx is the error signal. The proxy returns 200 with
    // { connected: false } for the "no license yet" case, which is NOT an
    // error — callers read that flag directly.
    if ( ! res.ok ) {
        throw new ApiError( json?.message, {
            code:              json?.code,
            status:            res.status,
            entitlement_state: json?.entitlement_state,
        } );
    }

    return json;
}

// ── Pages ───────────────────────────────────────────────────────────
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

// ── Generation ──────────────────────────────────────────────────────

/**
 * Generate a single page. Pass `previous` ONLY for the Regenerate action.
 *
 * @param {{ postId:number, previous?:{title:string,meta:string} }} args
 */
export async function generateSingle( { postId, previous = null } ) {
    const body = { post_id: postId };
    if ( previous ) {
        body.previous = previous;
    }
    return request( 'POST', '/generate', body );
}

/** Submit a bulk job. Returns { jobId, total, ... }. */
export async function submitJob( postIds, { scope } = {} ) {
    const body = { post_ids: postIds };
    if ( scope ) {
        body.scope = scope;
    }
    return request( 'POST', '/jobs', body );
}

/** Poll a bulk job once. */
export async function pollJob( jobId ) {
    return request( 'GET', `/jobs/${ encodeURIComponent( jobId ) }` );
}

// ── Activity (recent improvements) ──────────────────────────────────
/** Recent optimisation events for the Dashboard strip. Resolves to { events }. */
export async function fetchActivity( { limit = 8 } = {} ) {
    return request( 'GET', `/activity?limit=${ encodeURIComponent( limit ) }` );
}

// ── Quota ───────────────────────────────────────────────────────────
export async function fetchQuota() {
    return normalizeQuota( await request( 'GET', '/quota' ) );
}

/**
 * Map the backend `entitlement_state` shape onto the flat quota object the
 * React screens read (daily_used / monthly_used / …). Tolerates the
 * not-connected response ({ connected: false }).
 */
export function normalizeQuota( ent ) {
    if ( ! ent || ent.connected === false || ent.success === false ) {
        return {
            plan: 'free', connected: false, daily_used: 0,
            daily_limit: QUOTA_DEFAULTS.daily_limit,
            daily_remaining: QUOTA_DEFAULTS.daily_remaining,
            monthly_used: 0,
            monthly_limit: QUOTA_DEFAULTS.monthly_limit,
            reset_date: null,
        };
    }
    // The shared wallet has no daily sub-cap — the backend signals that with
    // daily_* = null. Preserve the null (don't fabricate a 5/day allowance the
    // alt-text plugin doesn't see) so the UI shows monthly credits instead.
    const hasDaily       = ( ent.daily_limit ?? null ) !== null;
    const dailyLimit     = hasDaily ? ent.daily_limit : null;
    const dailyRemaining = hasDaily ? ( ent.daily_remaining ?? dailyLimit ) : null;
    const monthlyLimit   = ent.total_limit ?? ent.monthly_limit ?? QUOTA_DEFAULTS.monthly_limit;
    const monthlyUsed    = ent.credits_used ?? ( monthlyLimit - ( ent.credits_remaining ?? monthlyLimit ) );
    return {
        ...ent,
        connected:       true,
        plan:            ent.plan ?? 'free',
        daily_limit:     dailyLimit,
        daily_remaining: dailyRemaining,
        daily_used:      hasDaily ? Math.max( 0, dailyLimit - dailyRemaining ) : 0,
        monthly_limit:   monthlyLimit,
        monthly_used:    monthlyUsed,
        credits_remaining: ent.credits_remaining ?? Math.max( 0, monthlyLimit - monthlyUsed ),
        reset_date:      ent.reset_date ?? null,
    };
}

// ── License ─────────────────────────────────────────────────────────
export async function setLicense( key ) {
    return request( 'POST', '/license', { license_key: key } );
}

export async function loginWithPassword( email, password ) {
    return request( 'POST', '/auth/login', { email, password } );
}

export async function registerAccount( email, password ) {
    return request( 'POST', '/auth/register', { email, password } );
}

export async function clearLicense() {
    return request( 'DELETE', '/license' );
}

// ── Billing (shared account — Pro + credit packs) ──────────────────
export async function fetchPlans() {
    return request( 'GET', '/billing/plans' );
}

/** Start a Stripe Checkout. `plan` is 'starter' | 'pro' | 'agency' | 'credits'. Resolves to { url }. */
export async function createCheckout( { plan, priceId } = {} ) {
    const body = {};
    if ( plan ) body.plan = plan;
    if ( priceId ) body.price_id = priceId;
    return request( 'POST', '/billing/checkout', body );
}

/** Open the Stripe billing portal for managing an existing plan. Resolves to { url }. */
export async function createBillingPortal() {
    return request( 'POST', '/billing/portal', {} );
}

/** Current billing/subscription info for this account. */
export async function fetchBillingInfo() {
    return request( 'GET', '/billing/info' );
}

/** Admin-only "can checkout work right now?" probe. Resolves to { stripe, starter, pro, entitlements, timestamp }. */
export async function fetchBillingHealth() {
    return request( 'GET', '/billing/health' );
}

// ── Scan ────────────────────────────────────────────────────────────
export async function runScan() {
    return request( 'POST', '/scan' );
}

// ── Health (dashboard-first score, priorities, item drill-down) ────
// All free/local — nothing here touches AI credits.
export async function fetchHealth() {
    return request( 'GET', '/health' );
}

export async function fetchPriorities( { limit = 5 } = {} ) {
    return request( 'GET', `/health/priorities?limit=${ encodeURIComponent( limit ) }` );
}

export async function fetchHealthItems( { status = '', issue = '', sort = 'lowest-score', page = 1, perPage = 20 } = {} ) {
    const qs = new URLSearchParams( { status, issue, sort, page: String( page ), per_page: String( perPage ) } );
    return request( 'GET', `/health/items?${ qs }` );
}

/** Free, local rescan — recomputes every page's score without spending credits. */
export async function runHealthScan() {
    return request( 'POST', '/health/scan' );
}

/** Revert a page to whatever it was before its most recent optimise. Does not refund the credit spent. */
export async function undoPage( postId ) {
    return request( 'POST', '/undo', { post_id: postId } );
}

// ── Support (contact form) ──────────────────────────────────────────
/**
 * Send a support message. The backend auto-attaches diagnostics + the recent
 * activity log and emails it to support. Resolves to { sent, message }.
 */
export async function submitSupport( { name, email, message } = {} ) {
    return request( 'POST', '/support/contact', { name, email, message } );
}

// ── Settings ────────────────────────────────────────────────────────
export async function fetchSettings() {
    return request( 'GET', '/settings' );
}

export async function saveSettings( settings ) {
    return request( 'PATCH', '/settings', settings );
}

// ── Localised initial state (from PHP) ──────────────────────────────
export function getInitialData() {
    return {
        user:         data.user         ?? { id: 0, name: 'Admin', email: '' },
        accountEmail: data.accountEmail ?? '',
        connected: data.connected ?? false,
        licenseAdopted: data.licenseAdopted ?? false,
        seoPlugin: data.seoPlugin ?? 'fallback',
        settings:  data.settings  ?? {},
        isAdmin:   data.isAdmin   ?? false,
        backendUrl: data.backendUrl ?? '',
        wpVersion:  data.wpVersion  ?? '',
        phpVersion: data.phpVersion ?? '',
        version:    data.version    ?? '',
        siteUrl:    data.siteUrl    ?? ( typeof window !== 'undefined' ? window.location?.origin : '' ),
        altTextCompanion: data.altTextCompanion ?? { state: 'missing', label: 'Add ALT Text', url: '' },
        // Quota is fetched on mount; this is just a neutral placeholder so the
        // first render doesn't crash before /quota resolves.
        quota:     { plan: 'free', connected: data.connected ?? false },
    };
}
