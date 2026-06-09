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

/** Toast payload for a non-paywall error. */
export function errorToast( err ) {
    switch ( err?.code ) {
        case 'INVALID_LICENSE':
            return { message: 'License key needed', sub: 'Add your BeepBeep license in Settings.', icon: 'alert', tone: 'warn' };
        case 'RATE_LIMIT_EXCEEDED':
            return { message: 'Slow down a moment', sub: 'Too many requests — pausing briefly before retrying.', icon: 'info', tone: 'warn' };
        case 'OFFLINE':
            return { message: 'You appear to be offline', sub: 'Reconnect and try again.', icon: 'alert', tone: 'warn' };
        default:
            return { message: 'Couldn\'t reach the generator', sub: 'Please try again in a moment.', icon: 'alert', tone: 'warn' };
    }
}
