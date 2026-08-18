/** Default limits when quota is unknown or disconnected. */
export const QUOTA_DEFAULTS = {
    daily_limit:     5,
    monthly_limit:   25,
    daily_remaining: 0,
};

/**
 * Continuous Optimisation enable is Growth-plan-only (billing id `pro`).
 * Matches Settings billing UI (`plan === 'pro'`); Free and Starter are gated.
 */
export function isProPlan( plan ) {
    return String( plan || '' ).toLowerCase() === 'pro';
}

/**
 * Autopilot screen (preferences + auto-generate UI) requires any paid plan.
 * Free / unpaid users are gated; Starter and Growth get full access to the page.
 */
export function isPaidPlan( plan ) {
    const p = String( plan || '' ).toLowerCase();
    return p === 'starter' || p === 'pro' || p === 'agency' || p === 'growth';
}

/**
 * User-facing plan label. Billing id `pro` is the Growth plan; do not rename ids.
 */
export function planDisplayName( plan ) {
    const p = String( plan || '' ).toLowerCase();
    if ( p === 'pro' || p === 'growth' ) return 'Growth';
    if ( p === 'starter' ) return 'Starter';
    if ( p === 'agency' ) return 'Agency';
    if ( p === 'free' || ! p ) return 'Free';
    return p.charAt( 0 ).toUpperCase() + p.slice( 1 );
}

/**
 * Each Optimise generates a title (1) + meta description (1). Prefer a live
 * `credits_per_page` from entitlement/quota when present; otherwise this.
 */
export const CREDITS_PER_PAGE = 2;

/** Shared wallet has no daily sub-cap when the backend sends daily_limit: null. */
export function hasDailyCap( quota ) {
    return ( quota?.daily_limit ?? null ) !== null;
}

/** Remaining monthly credits on the shared wallet. */
export function monthlyRemaining( quota ) {
    const limit = quota?.monthly_limit ?? QUOTA_DEFAULTS.monthly_limit;
    return quota?.credits_remaining ?? Math.max( 0, limit - ( quota?.monthly_used || 0 ) );
}

/** Credits charged for one page (title + meta). */
export function creditsPerPage( quotaOrEntitlement ) {
    const n = Number( quotaOrEntitlement?.credits_per_page );
    return Number.isFinite( n ) && n > 0 ? n : CREDITS_PER_PAGE;
}

/** App.jsx: remaining credits for gating single/bulk generation. */
export function dailyRemainingForGate( quota ) {
    if ( quota && ! hasDailyCap( quota ) ) {
        // No daily allowance on the shared wallet — gate on monthly credits.
        return monthlyRemaining( quota );
    }
    return quota?.daily_remaining ?? ( ( quota?.daily_limit || QUOTA_DEFAULTS.daily_limit ) - ( quota?.daily_used || 0 ) );
}

/** Library.jsx: remaining credits shown per row (defaults to full daily limit). */
export function dailyRemainingForLibrary( quota ) {
    if ( quota && ! hasDailyCap( quota ) ) {
        return monthlyRemaining( quota );
    }
    return quota?.daily_remaining ?? QUOTA_DEFAULTS.daily_limit;
}

export function isDailyExhausted( dailyRemaining ) {
    return dailyRemaining <= 0;
}

/** True when some credits remain but not enough for one (or N) page(s). */
export function isInsufficientCredits( remaining, needed = CREDITS_PER_PAGE ) {
    const left = Number( remaining );
    const need = Number( needed );
    return Number.isFinite( left ) && Number.isFinite( need ) && left > 0 && left < need;
}

/**
 * Clear copy when remaining > 0 but below the action cost.
 * Uses live numbers — never invents a wallet total.
 */
export function insufficientCreditsMessage( remaining, needed = CREDITS_PER_PAGE ) {
    const left = Number( remaining );
    const need = Number( needed );
    const leftLabel = left === 1 ? '1 credit' : `${ left } credits`;
    const needLabel = need === 1 ? '1 credit' : `${ need } credits`;
    return `You have ${ leftLabel } left, but each page needs ${ needLabel } (title + meta). Add credits to continue.`;
}

/** How many full pages the remaining balance can cover. */
export function pagesAffordable( remaining, costPerPage = CREDITS_PER_PAGE ) {
    const left = Number( remaining );
    const cost = Number( costPerPage );
    if ( ! Number.isFinite( left ) || ! Number.isFinite( cost ) || cost <= 0 ) return 0;
    return Math.max( 0, Math.floor( left / cost ) );
}

export function isBulkOverLimit( count, dailyRemaining, costPerPage = CREDITS_PER_PAGE ) {
    const cost = Number( costPerPage ) > 0 ? Number( costPerPage ) : CREDITS_PER_PAGE;
    return ( count * cost ) > dailyRemaining;
}

export function canGenerateOne( dailyRemaining, costPerPage = CREDITS_PER_PAGE ) {
    const cost = Number( costPerPage ) > 0 ? Number( costPerPage ) : CREDITS_PER_PAGE;
    return dailyRemaining >= cost;
}

/** AI generation is unavailable without a service connection or enough credits. */
export function isGenerationUnavailable( connected, dailyRemaining, costPerPage = CREDITS_PER_PAGE ) {
    return ! connected || ! canGenerateOne( dailyRemaining, costPerPage );
}

export function heroGenerationCap( dailyRemaining, costPerPage = CREDITS_PER_PAGE ) {
    return Math.min( pagesAffordable( dailyRemaining, costPerPage ), 5 );
}
