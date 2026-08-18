/**
 * Maps backend error codes (carried on ApiError) to UI reactions — shared by
 * the App and the generation drawer so both react consistently.
 */

/** Returns the Paywall trigger for a quota error, or null if not a paywall. */
export function paywallTrigger( err ) {
    switch ( err?.code ) {
        case 'DAILY_QUOTA_EXCEEDED': return 'daily-limit';
        case 'QUOTA_EXCEEDED':       return 'monthly-limit';
        default:                     return null;
    }
}

export function isPaywall( err ) {
    return paywallTrigger( err ) !== null;
}

/**
 * Map a backend/transport error code to a coarse category, so the long tail of
 * codes collapses into a handful of buckets for the local Billing diagnostics
 * card. Unknown/absent codes fall through to 'unknown' — never suppressed.
 */
const CHECKOUT_ERROR_CATEGORIES = {
    INVALID_LICENSE:             'user_configuration',
    QUOTA_EXCEEDED:              'quota',
    DAILY_QUOTA_EXCEEDED:        'quota',
    PLAN_UNAVAILABLE:            'plan_availability',
    SITE_LIMIT_EXCEEDED:         'plan_availability',
    ACTIVE_SUBSCRIPTION_EXISTS:  'plan_availability',
    CHECKOUT_RATE_LIMIT_EXCEEDED:'system',
    NETWORK_ERROR:               'network',
    OFFLINE:                     'network',
    FETCH_FAILED:                'network',
    STRIPE_ERROR:                'stripe',
    INTERNAL_ERROR:              'system',
    RATE_LIMIT_EXCEEDED:         'system',
    API_ERROR:                   'system',
    UNKNOWN_ERROR:               'unknown',
};

/**
 * Structured classification for a failed checkout, recorded in the local
 * billing telemetry. Accepts an ApiError (thrown) or a non-error response body
 * (a 200 with no usable url). Returns a code, a category, and a short sanitized
 * message — never the raw object, never PII-laden detail.
 *
 * @param {{code?:string, message?:string, error?:string}|string} [reason]
 * @returns {{ error_code:string, error_category:string, error_message:string }}
 */
export function classifyCheckoutError( reason ) {
    const error_code = ( reason && ( reason.code || reason.error_code ) ) || 'UNKNOWN_ERROR';
    const error_category = CHECKOUT_ERROR_CATEGORIES[ error_code ] || 'unknown';
    const raw = typeof reason === 'string'
        ? reason
        : ( reason?.message || reason?.error || '' );
    const error_message = String( raw ).replace( /\s+/g, ' ' ).trim().slice( 0, 300 );
    return { error_code, error_category, error_message };
}

/**
 * Toast payload for a failed Stripe checkout / billing-portal launch.
 *
 * Unlike the generic errorToast, this surfaces the backend's actual message
 * (e.g. a Stripe "No such price" / wrong-mode error) so a misconfigured plan
 * is diagnosable instead of hiding behind a generic "try again". Falls back to
 * a friendly line when the backend gave no message.
 *
 * @param {{code?:string, message?:string}} [err] ApiError, or a non-error
 *        response body ({ message } with no url).
 */
export function checkoutErrorToast( err ) {
    if ( err?.code === 'OFFLINE' ) {
        return { message: 'You appear to be offline', sub: 'Reconnect and try again.', icon: 'alert', tone: 'warn' };
    }
    if ( err?.code === 'RATE_LIMIT_EXCEEDED' || err?.code === 'CHECKOUT_RATE_LIMIT_EXCEEDED' ) {
        return { message: 'Slow down a moment', sub: 'Too many checkout attempts — wait a minute and try again.', icon: 'info', tone: 'warn' };
    }
    if ( err?.code === 'SITE_LIMIT_EXCEEDED' || err?.code === 'ACTIVE_SUBSCRIPTION_EXISTS' ) {
        return {
            message: 'Couldn\'t start Growth checkout',
            sub: 'This account already has an active subscription record. Open Billing to manage it, or try Starter.',
            icon: 'alert',
            tone: 'warn',
        };
    }
    const detail = typeof err?.message === 'string' ? err.message.trim() : '';
    // Prefer a real Stripe/backend detail; skip the opaque catch-all the API
    // used to return before it started forwarding Stripe's own message.
    const useful = detail && detail !== 'Failed to create checkout session'
        ? detail
        : '';
    return {
        message: 'Couldn\'t start checkout',
        sub: useful || 'We couldn\'t reach Stripe. Please try again in a moment.',
        icon: 'alert',
        tone: 'warn',
    };
}

/** Toast payload for a non-paywall error. */
export function errorToast( err ) {
    switch ( err?.code ) {
        case 'INVALID_LICENSE':
            return { message: 'License key needed', sub: 'Add your OpptiAI license in Settings.', icon: 'alert', tone: 'warn' };
        case 'RATE_LIMIT_EXCEEDED':
            return { message: 'Slow down a moment', sub: 'Too many requests — pausing briefly before retrying.', icon: 'info', tone: 'warn' };
        case 'OFFLINE':
            return { message: 'You appear to be offline', sub: 'Reconnect and try again.', icon: 'alert', tone: 'warn' };
        case 'rest_post_invalid_id':
            return {
                message: 'Page not found',
                sub: err?.message || 'It may have been deleted. Run Quick Scan to refresh, then try again.',
                icon: 'alert',
                tone: 'warn',
            };
        case 'rest_forbidden':
            return {
                message: 'Permission denied',
                sub: 'You don\'t have permission to edit that page, or it no longer exists. Try Quick Scan and retry.',
                icon: 'alert',
                tone: 'warn',
            };
        default:
            return { message: 'Couldn\'t reach the generator', sub: 'Please try again in a moment.', icon: 'alert', tone: 'warn' };
    }
}
