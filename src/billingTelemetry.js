/**
 * Durable checkout telemetry for support diagnostics.
 *
 * Records the last checkout attempt / success / failure (with a sanitized
 * reason) in localStorage so the Billing diagnostics page and the support
 * report can show "what happened last time" without server logs. This is the
 * single telemetry path — it is stored only in the browser's localStorage and
 * reuses classifyCheckoutError() for failure reasons (no separate classifier).
 *
 * Stored shape (key `beepti_checkout_telemetry`):
 *   { last_attempt, last_success, last_failure }  // each: { plan, price_id, ... , ts }
 *
 * Contains no Stripe secrets — plan id, price id, error code/category and a
 * short sanitized message only.
 */

import { classifyCheckoutError } from './errors';

const KEY = 'beepti_checkout_telemetry';

function read() {
    try {
        const raw = localStorage.getItem( KEY );
        const v = raw ? JSON.parse( raw ) : null;
        return v && typeof v === 'object' ? v : {};
    } catch ( e ) {
        return {};
    }
}

function write( next ) {
    try { localStorage.setItem( KEY, JSON.stringify( next ) ); } catch ( e ) { /* storage may be unavailable */ }
}

/** The full telemetry record (safe defaults). */
export function readCheckoutTelemetry() {
    const v = read();
    return {
        last_attempt: v.last_attempt || null,
        last_success: v.last_success || null,
        last_failure: v.last_failure || null,
    };
}

/** Record a checkout attempt (a session/redirect was initiated). */
export function recordCheckoutAttempt( { plan, priceId } = {} ) {
    write( { ...read(), last_attempt: { plan: plan || null, price_id: priceId || null, ts: Date.now() } } );
}

/** Record a confirmed successful upgrade (entitlement refreshed). */
export function recordCheckoutSuccess( { plan, priceId } = {} ) {
    write( { ...read(), last_success: { plan: plan || null, price_id: priceId || null, ts: Date.now() } } );
}

/**
 * Record a checkout failure. `reason` is an ApiError or a non-error response
 * body; it's run through the shared classifier so the stored reason matches the
 * shape used elsewhere in billing diagnostics.
 */
export function recordCheckoutFailure( { plan, priceId, reason } = {} ) {
    const { error_code, error_category, error_message } = classifyCheckoutError( reason );
    write( {
        ...read(),
        last_failure: { plan: plan || null, price_id: priceId || null, error_code, error_category, error_message, ts: Date.now() },
    } );
}
