/**
 * Bulk-job polling loop.
 *
 * Polls /jobs/:id every ~1.7s and fires `onItem` the first time each item
 * reaches a terminal state (completed/failed), so the drawer can reveal rows
 * as real results arrive — not on a timer. Resolves with the final job
 * envelope when the job itself completes or fails.
 */

import { pollJob, ApiError } from './api';

const DEFAULT_INTERVAL = 1700;
const RATE_LIMIT_BACKOFF = 5000;
const MAX_TRANSIENT_RETRIES = 3;

function delay( ms, signal ) {
    return new Promise( ( resolve, reject ) => {
        const t = setTimeout( resolve, ms );
        if ( signal ) {
            signal.addEventListener( 'abort', () => {
                clearTimeout( t );
                reject( new DOMException( 'Aborted', 'AbortError' ) );
            }, { once: true } );
        }
    } );
}

/**
 * @param {string} jobId
 * @param {{
 *   onItem?: (item:object, index:number) => void,
 *   onProgress?: (job:object) => void,
 *   signal?: AbortSignal,
 *   intervalMs?: number,
 * }} opts
 * @returns {Promise<object>} the terminal job envelope
 */
export async function pollUntilComplete( jobId, { onItem, onProgress, signal, intervalMs = DEFAULT_INTERVAL } = {} ) {
    const seen = new Map(); // item key → last terminal status fired
    let transientRetries = 0;

    while ( true ) {
        if ( signal?.aborted ) {
            throw new DOMException( 'Aborted', 'AbortError' );
        }

        let job;
        try {
            job = await pollJob( jobId );
            transientRetries = 0;
        } catch ( err ) {
            // Rate limited — back off without counting it as a failure.
            if ( err instanceof ApiError && err.code === 'RATE_LIMIT_EXCEEDED' ) {
                await delay( RATE_LIMIT_BACKOFF, signal );
                continue;
            }
            // Transient network / upstream blips: retry a few times before giving up.
            const transient = err instanceof ApiError && [ 'NETWORK_ERROR', 'OFFLINE', 'UPSTREAM_GENERATION_ERROR' ].includes( err.code );
            if ( transient && transientRetries < MAX_TRANSIENT_RETRIES ) {
                transientRetries++;
                await delay( intervalMs, signal );
                continue;
            }
            throw err;
        }

        const items = Array.isArray( job.items ) ? job.items : [];
        items.forEach( ( item, idx ) => {
            const key    = item.wp_post_id ?? item.id ?? idx;
            const status = item.status || 'pending';
            if ( ( status === 'completed' || status === 'failed' ) && seen.get( key ) !== status ) {
                seen.set( key, status );
                onItem?.( item, idx );
            }
        } );

        onProgress?.( job );

        if ( job.status === 'completed' || job.status === 'failed' ) {
            return job;
        }

        await delay( intervalMs, signal );
    }
}
