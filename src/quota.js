/** Default limits when quota is unknown or disconnected. */
export const QUOTA_DEFAULTS = {
    daily_limit:     5,
    monthly_limit:   15,
    daily_remaining: 0,
};

export function isFreePlan( plan ) {
    return plan !== 'pro';
}

/** Shared wallet has no daily sub-cap when the backend sends daily_limit: null. */
export function hasDailyCap( quota ) {
    return ( quota?.daily_limit ?? null ) !== null;
}

/** Remaining monthly credits on the shared wallet. */
export function monthlyRemaining( quota ) {
    const limit = quota?.monthly_limit ?? QUOTA_DEFAULTS.monthly_limit;
    return quota?.credits_remaining ?? Math.max( 0, limit - ( quota?.monthly_used || 0 ) );
}

/** App.jsx: remaining credits for gating single/bulk generation. */
export function dailyRemainingForGate( quota, plan = quota?.plan || 'free' ) {
    if ( plan === 'pro' ) {
        return Infinity;
    }
    if ( quota && ! hasDailyCap( quota ) ) {
        // No daily allowance on the shared wallet — gate on monthly credits.
        return monthlyRemaining( quota );
    }
    return quota?.daily_remaining ?? ( ( quota?.daily_limit || QUOTA_DEFAULTS.daily_limit ) - ( quota?.daily_used || 0 ) );
}

/** Library.jsx: remaining credits shown per row (defaults to full daily limit). */
export function dailyRemainingForLibrary( quota, plan = quota?.plan || 'free' ) {
    if ( plan === 'pro' ) {
        return Infinity;
    }
    if ( quota && ! hasDailyCap( quota ) ) {
        return monthlyRemaining( quota );
    }
    return quota?.daily_remaining ?? QUOTA_DEFAULTS.daily_limit;
}

export function isDailyExhausted( plan, dailyRemaining ) {
    return isFreePlan( plan ) && dailyRemaining <= 0;
}

export function isBulkOverLimit( plan, count, dailyRemaining ) {
    return isFreePlan( plan ) && count > dailyRemaining;
}

export function canGenerateOne( plan, dailyRemaining ) {
    return plan === 'pro' || dailyRemaining > 0;
}

/**
 * Library.jsx lock-out (mirrors the ALT plugin's locked Library): generation
 * CTAs render as locks when no license is connected or the allowance is
 * exhausted. Locked CTAs stay clickable and route to connect/upgrade.
 */
export function isGenerationLocked( connected, plan, dailyRemaining ) {
    return ! connected || ! canGenerateOne( plan, dailyRemaining );
}

export function heroGenerationCap( plan, dailyRemaining ) {
    return plan === 'pro' ? 10 : Math.min( dailyRemaining, 5 );
}
