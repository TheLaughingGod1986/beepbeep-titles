import { useState, useEffect, useRef } from 'react';
import { Icon, Button, Progress, PageAvatar } from '../components';
import { generateSingle, submitJob, updatePage } from '../api';
import { pollUntilComplete } from '../jobs';
import { isPaywall, errorToast } from '../errors';
import { contentSubtitle } from '../contentType';

/* ── Generation drawer ─────────────────────────────────────────────── */
const ASSISTANT_PHRASES = [
    'Reading page content…',
    'Identifying core topic…',
    'Pulling keywords from H1 & body…',
    'Drafting title tag…',
    'Writing meta description…',
    'Trimming to character budget…',
];

const useRotatingPhrase = ( phrases, intervalMs = 1100, active = true ) => {
    const [i, setI] = useState( 0 );
    useEffect( () => {
        if ( !active ) return;
        const reduced = window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
        if ( reduced ) return;
        const t = setInterval( () => setI( x => ( x + 1 ) % phrases.length ), intervalMs );
        return () => clearInterval( t );
    }, [phrases, intervalMs, active] );
    return phrases[i];
};

/**
 * Build a drawer result row from a poll item, enriching display fields from
 * the originally-submitted page when the backend item omits them.
 */
const itemToResult = ( item, pageById ) => {
    const postId = item.wp_post_id ?? ( /^\d+$/.test( String( item.id ) ) ? Number( item.id ) : null );
    const page   = postId != null ? pageById.get( postId ) : null;
    return {
        key:       postId ?? item.id ?? Math.random().toString( 36 ).slice( 2 ),
        postId,
        url:       item.url ?? page?.url ?? '',
        section:   item.section ?? page?.section ?? '',
        type:      page?.type ?? item.type ?? 'page',
        hue:       page?.hue ?? ( ( ( postId || 0 ) * 47 ) % 360 ),
        status:    item.status === 'failed' ? 'failed' : 'completed',
        title:     item.title ?? '',
        meta:      item.meta ?? '',
        error:     item.error ?? '',
        errorCode: item.errorCode ?? '',
    };
};

export const GenerationDrawer = ({ open, pages, plan, onClose, onComplete, onPaywall, onApiError, onEntitlement, onToast }) => {
    const [phase, setPhase]     = useState( 'idle' ); // idle | thinking | done
    const [results, setResults] = useState( [] );

    useEffect( () => {
        if ( !open ) { setPhase( 'idle' ); setResults( [] ); return; }
        if ( !pages || pages.length === 0 ) return;

        const controller = new AbortController();
        const pageById   = new Map( pages.map( p => [ p.id, p ] ) );
        const pushResult = ( r ) => setResults( prev => {
            if ( prev.some( x => x.key === r.key ) ) return prev;
            return [ ...prev, r ];
        } );

        const run = async () => {
            setPhase( 'thinking' );
            setResults( [] );

            try {
                if ( pages.length === 1 ) {
                    // ── Single page → /generate ──
                    const pg  = pages[0];
                    const res = await generateSingle( { postId: pg.id } );
                    if ( controller.signal.aborted ) return;
                    pushResult( {
                        key: pg.id, postId: pg.id, url: pg.url, section: pg.section, type: pg.type,
                        hue: pg.hue ?? 220, status: 'completed',
                        title: res.title ?? '', meta: res.meta ?? '',
                    } );
                    onEntitlement?.( res.entitlement_state );
                } else {
                    // ── Bulk → /jobs + poll ──
                    const job = await submitJob( pages.map( p => p.id ) );
                    if ( controller.signal.aborted ) return;
                    await pollUntilComplete( job.jobId, {
                        signal: controller.signal,
                        onItem: ( item ) => pushResult( itemToResult( item, pageById ) ),
                    } );
                }
                if ( !controller.signal.aborted ) setPhase( 'done' );
            } catch ( err ) {
                if ( controller.signal.aborted || err?.name === 'AbortError' ) return;
                if ( isPaywall( err ) ) {
                    onClose();
                    onPaywall?.( err.code === 'DAILY_QUOTA_EXCEEDED' ? 'daily-limit' : 'monthly-limit', err.entitlement_state );
                    return;
                }
                // Non-paywall failure: surface a toast, and if it was a single
                // page show a failed row the user can retry.
                onToast?.( errorToast( err ) );
                if ( pages.length === 1 ) {
                    const pg = pages[0];
                    pushResult( {
                        key: pg.id, postId: pg.id, url: pg.url, section: pg.section, type: pg.type,
                        hue: pg.hue ?? 220, status: 'failed',
                        errorCode: err?.code || 'ERROR', error: err?.message || '',
                    } );
                }
                setPhase( 'done' );
            }
        };

        run();
        return () => controller.abort();
    }, [open, pages] );

    useEffect( () => {
        if ( !open ) return;
        const onKey = ( e ) => { if ( e.key === 'Escape' ) onClose(); };
        window.addEventListener( 'keydown', onKey );
        return () => window.removeEventListener( 'keydown', onKey );
    }, [open, onClose] );

    if ( !open || !pages ) return null;

    const total      = pages.length;
    const done       = results.length;
    const allDone    = phase === 'done';
    const isPro      = plan === 'pro';
    const revealedIds = new Set( results.map( r => r.postId ) );
    const upcoming   = !allDone ? pages.find( p => !revealedIds.has( p.id ) ) : null;

    const headlinePrimary = allDone
        ? `${total} page${total === 1 ? '' : 's'} processed`
        : isPro
            ? `${done} page${done === 1 ? '' : 's'} improved`
            : `${done} of ${total} complete`;

    const remaining = total - done;
    const footerStatus = allDone
        ? ( isPro ? 'Optimisation complete · Autopilot active.' : 'Title & meta descriptions are live in your site.' )
        : remaining === 1 ? 'Wrapping up the last page…'
        : done === 0 ? ( isPro ? 'Optimising your latest pages…' : 'Working through today\'s pages…' )
        : `${remaining} page${remaining === 1 ? '' : 's'} to go`;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="BeepBeep Titles assistant"
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(15,23,42,0.22)',
                backdropFilter: 'blur(1.5px)',
                display: 'flex', justifyContent: 'flex-end',
                animation: 'bbt-fade-in .18s ease',
            }}
            onClick={onClose}
        >
            <div onClick={e => e.stopPropagation()} style={{
                width: 420, maxWidth: '100%', background: 'var(--surface)',
                boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
                animation: 'bbt-slide-right .25s cubic-bezier(.2,.8,.2,1)',
                height: '100%', overflow: 'hidden',
                borderLeft: '1px solid var(--border)',
            }}>
                <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Icon name={allDone ? 'check' : 'sparkles'} size={13} style={{ color: allDone ? 'var(--ok-ink)' : 'var(--primary)' }}/>
                            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                {allDone ? ( isPro ? 'Optimisation complete' : 'Pass complete' ) : ( isPro ? 'Optimisation' : 'Today\'s pass' )}
                            </span>
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{headlinePrimary}</div>
                    </div>
                    <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="x" size={18}/>
                    </button>
                </div>

                <div style={{ padding: '10px 22px', borderBottom: '1px solid var(--hairline)' }}>
                    <Progress value={done} max={total} tone={allDone ? 'ok' : 'primary'} height={6}/>
                </div>

                <div aria-live="polite" style={{ flex: 1, overflowY: 'auto', padding: '4px 22px 12px' }}>
                    {results.map( ( r, i ) => (
                        <GenResultRow key={r.key} result={r} index={i} last={i === results.length - 1 && phase !== 'thinking'}
                            onEntitlement={onEntitlement} onApiError={onApiError} onToast={onToast}/>
                    ) )}
                    {phase === 'thinking' && upcoming && (
                        <GenPlaceholderRow page={upcoming} index={done}/>
                    )}
                </div>

                <div style={{ padding: '12px 22px', borderTop: '1px solid var(--hairline)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    {allDone ? (
                        <>
                            <div style={{ fontSize: 12, color: 'var(--ok-ink)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Icon name="trend" size={13}/>
                                <span>Coverage <strong>+{results.filter( r => r.status === 'completed' ).length} page{results.filter( r => r.status === 'completed' ).length !== 1 ? 's' : ''}</strong> · streak extended</span>
                            </div>
                            <Button variant="primary" size="sm" iconRight="arrow-right" onClick={onComplete}>Done</Button>
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: 12, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <span className="pulse-dot" style={{ width: 6, height: 6, background: 'var(--primary)' }}/>
                                {footerStatus}
                            </span>
                            <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: '4px 6px', fontSize: 12, color: 'var(--text-3)', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const GenResultRow = ({ result, index, last, onEntitlement, onApiError, onToast }) => {
    const [title, setTitle]   = useState( result.title );
    const [meta, setMeta]     = useState( result.meta );
    const [status, setStatus] = useState( result.status );
    const [editing, setEditing] = useState( false );
    const [busy, setBusy]     = useState( 'idle' ); // idle | regen | save | retry
    const titleRef = useRef( null );

    useEffect( () => { setTitle( result.title ); setMeta( result.meta ); setStatus( result.status ); }, [result.title, result.meta, result.status] );
    useEffect( () => { if ( editing && titleRef.current ) titleRef.current.focus(); }, [editing] );

    const postId = result.postId ?? result.key;

    const handleRegenerate = async () => {
        if ( busy !== 'idle' || postId == null ) return;
        setBusy( 'regen' );
        try {
            const res = await generateSingle( { postId, previous: { title, meta } } );
            setTitle( res.title ?? '' );
            setMeta( res.meta ?? '' );
            onEntitlement?.( res.entitlement_state );
        } catch ( err ) {
            onApiError?.( err );
        } finally {
            setBusy( 'idle' );
        }
    };

    const handleSave = async () => {
        if ( postId == null ) { setEditing( false ); return; }
        setBusy( 'save' );
        try {
            await updatePage( postId, { seoTitle: title, metaDesc: meta } );
            setEditing( false );
            onToast?.( { message: 'Saved', icon: 'check', tone: 'ok' } );
        } catch ( err ) {
            onApiError?.( err );
        } finally {
            setBusy( 'idle' );
        }
    };

    const handleRetry = async () => {
        if ( busy !== 'idle' || postId == null ) return;
        setBusy( 'retry' );
        try {
            const res = await generateSingle( { postId } );
            setTitle( res.title ?? '' );
            setMeta( res.meta ?? '' );
            setStatus( 'completed' );
            onEntitlement?.( res.entitlement_state );
        } catch ( err ) {
            onApiError?.( err );
        } finally {
            setBusy( 'idle' );
        }
    };

    const hue = result.hue ?? ( index * 80 ) % 360;
    const failed = status === 'failed';

    return (
        <div className="gen-row-in" style={{ padding: '14px 0', borderBottom: last ? 'none' : '1px solid var(--hairline)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flexShrink: 0 }}>
                    <PageAvatar section={result.section} hue={hue} uppercase failed={failed}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{result.url}</span>
                        {!failed && (
                            <span className="gen-check" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: 999, background: 'var(--ok-soft)', color: 'var(--ok-ink)', border: '1px solid var(--ok-border)', flexShrink: 0 }}>
                                <Icon name="check" size={9} strokeWidth={3}/>
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{result.section}</div>

                    {failed ? (
                        <div style={{ marginTop: 6 }}>
                            <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--danger-ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Icon name="alert" size={13}/>
                                <span>Couldn't generate · <span className="mono">{result.errorCode || 'ERROR'}</span></span>
                            </div>
                            <div style={{ marginTop: 6 }}>
                                <Button variant="ghost" size="sm" icon="refresh" disabled={busy !== 'idle'} onClick={handleRetry}>
                                    {busy === 'retry' ? 'Retrying…' : 'Retry'}
                                </Button>
                            </div>
                        </div>
                    ) : editing ? (
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input
                                ref={titleRef}
                                value={title}
                                onChange={e => setTitle( e.target.value )}
                                onKeyDown={e => { if ( e.key === 'Escape' ) setEditing( false ); if ( e.key === 'Enter' && ( e.metaKey || e.ctrlKey ) ) handleSave(); }}
                                placeholder="Title tag"
                                style={{ padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--primary-border)', boxShadow: '0 0 0 3px rgba(37,99,235,0.12)', borderRadius: 'var(--r-sm)', fontSize: 12.5, color: 'var(--text)', fontFamily: 'var(--font-sans)', outline: 0 }}/>
                            <textarea
                                value={meta}
                                onChange={e => setMeta( e.target.value )}
                                onKeyDown={e => { if ( e.key === 'Escape' ) setEditing( false ); if ( e.key === 'Enter' && ( e.metaKey || e.ctrlKey ) ) handleSave(); }}
                                rows={3}
                                placeholder="Meta description"
                                style={{ padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5, fontFamily: 'var(--font-sans)', resize: 'vertical', minHeight: 60, outline: 0 }}/>
                        </div>
                    ) : (
                        <div style={{ marginTop: 6, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--hairline)', opacity: busy === 'regen' ? 0.55 : 1 }}>
                            {busy === 'regen' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-3)' }}>
                                    <span className="pulse-dot" style={{ width: 6, height: 6, background: 'var(--primary)' }}/>
                                    <span>Rewriting…</span>
                                </span>
                            ) : (
                                <>
                                    <div key={title} className="phrase-in" style={{ fontSize: 13, lineHeight: 1.35, color: '#1a0dab', fontFamily: 'arial, sans-serif', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {title || <em style={{ color: 'var(--text-3)', fontStyle: 'normal' }}>(no title generated)</em>}
                                    </div>
                                    <div key={meta} className="phrase-in" style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-2)' }}>
                                        {meta || <em style={{ color: 'var(--text-3)', fontStyle: 'normal' }}>(no meta generated)</em>}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {!failed && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 2 }}>
                            <Button variant="ghost" size="sm" icon={editing ? 'check' : 'edit'} disabled={busy === 'save'} onClick={() => editing ? handleSave() : setEditing( true )}>
                                {editing ? ( busy === 'save' ? 'Saving…' : 'Save' ) : 'Edit'}
                            </Button>
                            <Button variant="ghost" size="sm" icon="refresh" disabled={busy !== 'idle' || editing} onClick={handleRegenerate}>
                                {busy === 'regen' ? 'Rewriting' : 'Regenerate'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const GenPlaceholderRow = ({ page }) => {
    const phrase = useRotatingPhrase( ASSISTANT_PHRASES, 1100, true );
    const hue = page.hue ?? 220;
    return (
        <div style={{ padding: '14px 0' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                    <PageAvatar type={page.type} section={page.section} hue={hue} uppercase/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.url}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{contentSubtitle( { type: page.type, section: page.section } )}</div>
                    <div style={{ marginTop: 6, padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)' }}>
                        <span className="pulse-dot" style={{ width: 6, height: 6, background: 'var(--primary)' }}/>
                        <span key={phrase} className="phrase-in" style={{ lineHeight: 1.4 }}>{phrase}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
