/** Default limits when quota is unknown or disconnected. */
export const QUOTA_DEFAULTS = {
    daily_limit:     5,
    monthly_limit:   15,
    daily_remaining: 0,
};

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

export function isBulkOverLimit( count, dailyRemaining ) {
    return count > dailyRemaining;
}

export function canGenerateOne( dailyRemaining ) {
    return dailyRemaining > 0;
}

/** AI generation is unavailable without a service connection or credits. */
export function isGenerationUnavailable( connected, dailyRemaining ) {
    return ! connected || ! canGenerateOne( dailyRemaining );
}

export function heroGenerationCap( dailyRemaining ) {
    return Math.min( dailyRemaining, 5 );
}
