/**
 * Titles paywall billing catalog.
 *
 * Non-US clients keep live /billing/plans (GBP) with the hardcoded £ fallbacks
 * in Paywall.jsx. US clients (visitor country=US via shared CDN headers) use the USD Stripe price IDs and amounts
 * below for display + checkout.session — display currency must match charge.
 *
 * Do not replace existing GBP Stripe IDs. GBP Growth stays on whatever the
 * backend /plans payload already returns (likely price_1SMrxaJl9Rm418cMM4iikjlJ).
 */

/** USD Stripe prices — US clients only. */
export const USD_PLANS = {
    starter: {
        amount: 6.99,
        currency: 'usd',
        priceId: 'price_1UBBZlJl9Rm418cMyqCUYrxp',
    },
    /** Billing plan id stays `pro`; user-facing copy stays Growth. */
    pro: {
        amount: 17.99,
        currency: 'usd',
        priceId: 'price_1UBBOuJl9Rm418cMz5HG1Lnu',
    },
    agency: {
        amount: 67.99,
        currency: 'usd',
        priceId: 'price_1UBBSDJl9Rm418cMvzW2OxG9',
    },
    credits: {
        amount: 13.99,
        currency: 'usd',
        priceId: 'price_1UBBVeJl9Rm418cM1k7PC7wO',
    },
};

/** GBP display fallbacks only — price IDs stay backend-resolved for non-US. */
export const GBP_FALLBACK_AMOUNTS = {
    starter: 4.99,
    pro: 12.99,
    agency: 49.99,
    credits: 9.99,
};

/**
 * @param {string} planId starter | pro | growth | agency | credits
 * @returns {string}
 */
export function normalizePlanKey( planId ) {
    const id = String( planId || '' ).toLowerCase();
    if ( id === 'growth' ) {
        return 'pro';
    }
    return id;
}

/**
 * @param {string} planId
 * @returns {{ amount: number, currency: string, priceId: string } | null}
 */
export function getUsdPlan( planId ) {
    const key = normalizePlanKey( planId );
    return USD_PLANS[ key ] || null;
}

/**
 * @param {string} planId
 * @returns {string | null}
 */
export function getUsdPriceId( planId ) {
    return getUsdPlan( planId )?.priceId || null;
}
