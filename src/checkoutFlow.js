/**
 * Upgrade checkout flow: one click = one checkout, same-tab navigation, visible
 * recovery. UI wiring lives in App.jsx; this module is pure so it is testable.
 *
 * - Same tab via `navigate(url)` (window.location.assign), never window.open:
 *   window.open after an async round trip is popup-blocked in some browsers,
 *   and a blocked/blank tab invited a second click → a second Stripe session.
 * - A synchronous in-flight lock refuses re-entry until the attempt resolves.
 * - If the tab has not navigated `graceMs` after the session returned, or on
 *   any error, `showPanel` is called with the URL and/or the real error text.
 * - Telemetry: checkout_clicked, checkout_session_returned, checkout_redirected,
 *   checkout_failed (real error code) through the opt-in-gated `track`.
 */
import { classifyCheckoutError, checkoutErrorToast } from './errors';

export const CHECKOUT_REDIRECT_GRACE_MS = 2000;
const STRIPE_URL = /^https:\/\/(checkout|buy)\.stripe\.com\//i;

export function createCheckoutFlow( deps ) {
    const {
        createCheckout,
        track,
        navigate,
        showPanel,
        onRouteError,      // (err) => bool : true when the error was routed (connect modal / paywall)
        onAttempt = () => {},
        onFailure = () => {},
        closePaywall = () => {},
        setTimer = ( fn, ms ) => setTimeout( fn, ms ),
        clearTimer = ( id ) => clearTimeout( id ),
        isHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden',
        graceMs = CHECKOUT_REDIRECT_GRACE_MS,
    } = deps;

    let inFlight = false;
    let timer = null;

    const start = async ( args = {} ) => {
        if ( inFlight ) return 'locked';
        inFlight = true;
        if ( timer ) { clearTimer( timer ); timer = null; }
        showPanel( null );
        const plan = args.plan || 'pro';
        track( 'checkout_clicked', { plan, price_id: args.priceId || '' } );

        const fail = ( reason ) => {
            inFlight = false;
            onFailure( { plan: args.plan, priceId: args.priceId, reason } );
            const { error_code, error_message } = classifyCheckoutError( reason );
            track( 'checkout_failed', { plan, error_code, error_message, status: reason?.status || 0 } );
        };

        let res;
        try {
            res = await createCheckout( args );
        } catch ( e ) {
            if ( e?.name === 'AbortError' ) { inFlight = false; return 'aborted'; }
            fail( e );
            if ( onRouteError && onRouteError( e ) ) return 'routed';
            closePaywall();
            const t = checkoutErrorToast( e );
            showPanel( { message: t.sub || t.message, plan } );
            return 'failed';
        }

        const url = typeof res?.url === 'string' ? res.url : ( typeof res?.checkout_url === 'string' ? res.checkout_url : '' );
        if ( ! url || ! STRIPE_URL.test( url ) ) {
            fail( { ...( res || {} ), code: res?.code || 'MISSING_CHECKOUT_URL' } );
            closePaywall();
            const t = checkoutErrorToast( res );
            showPanel( { message: t.sub || t.message, plan } );
            return 'failed';
        }

        const sessionId = res.sessionId || res.session_id || '';
        onAttempt( { plan: args.plan, priceId: args.priceId } );
        // Never send the Stripe Checkout session id (cs_…) to telemetry: it would
        // tie an anonymous install to a Stripe customer. It stays local, for the
        // Continue panel and the email-link fallback only.
        track( 'checkout_session_returned', {
            plan,
            reused: res.reused === true,
            currency: typeof res.currency === 'string' ? res.currency : '',
        } );
        track( 'checkout_redirected', { plan, redirect_kind: 'checkout_session' } );

        timer = setTimer( () => {
            timer = null;
            if ( ! isHidden() ) {
                inFlight = false;
                showPanel( { url, sessionId, plan } );
            }
        }, graceMs );
        navigate( url );
        return 'redirecting';
    };

    return { start, isInFlight: () => inFlight };
}
