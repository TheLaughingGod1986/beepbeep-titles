import { normalizeQuota } from './api';

/**
 * After a successful Create account / Sign in, the register and login
 * responses already carry the connected quota (BillingController fetches it
 * once before replying). Apply that payload straight away so the screen does
 * not sit on the signed-out view until a second /quota call returns.
 *
 * @param {object|null} res Register / login / license response body.
 * @return {object|null} Normalised quota, or null when the payload is not a connected one.
 */
export function quotaFromAuthResponse( res ) {
    if ( ! res || typeof res !== 'object' ) return null;
    if ( res.success === false || res.connected === false ) return null;
    return normalizeQuota( { ...res, connected: true } );
}

/** Where a newly connected user lands: the Library page list. */
export const CONNECT_LANDING_TAB = 'library';

/**
 * The single page offered in the first-action card on the Library: the page a
 * guest tried to Optimise before connecting, otherwise the first page in the
 * list that still needs work.
 *
 * @param {object|null} pendingPage Page picked before connect, if any.
 * @param {Array}       pages       Library rows currently loaded.
 * @return {object|null}
 */
export function firstActionPage( pendingPage, pages = [] ) {
    if ( pendingPage && pendingPage.id ) return pendingPage;
    return ( pages || [] ).find( ( pg ) => pg && pg.id && pg.status !== 'ok' ) || null;
}
