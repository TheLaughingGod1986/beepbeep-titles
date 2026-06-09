import { useState, useEffect, useRef } from 'react';
import { Icon, Card, Pill, Button, Progress, KBD } from '../components';
import { generateSingle, submitJob, updatePage } from '../api';
import { pollUntilComplete } from '../jobs';
import { isPaywall, errorToast } from '../errors';

/* ── Modal shell ───────────────────────────────────────────────────── */
export const Modal = ({ open, onClose, children, width = 560, dismissable = true }) => {
    if ( !open ) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }} onClick={() => dismissable && onClose()}>
            <div onClick={e => e.stopPropagation()} style={{
                width, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto',
                background: 'var(--surface)', borderRadius: 'var(--r-xl)',
                boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
                animation: 'bbt-scale-in .2s cubic-bezier(.2,.8,.2,1)',
            }}>{children}</div>
        </div>
    );
};

/* ── Onboarding wizard ─────────────────────────────────────────────── */
export const Onboarding = ({ open, onClose, onComplete, onScan }) => {
    const [step, setStep] = useState( 0 );
    const [scanning, setScanning] = useState( false );
    const [scanProgress, setScanProgress] = useState( 0 );
    const [scanned, setScanned] = useState( false );
    const [scanStats, setScanStats] = useState( { total: 0, missingTitle: 0, missingMeta: 0 } );
    const [showFasterOptions, setShowFasterOptions] = useState( false );

    useEffect( () => {
        if ( step === 1 && !scanned ) {
            setScanning( true );
            setScanProgress( 0 );
            const doScan = async () => {
                const iv = setInterval( () => {
                    setScanProgress( p => Math.min( p + 3, 85 ) );
                }, 60 );
                try {
                    const result = onScan ? await onScan() : null;
                    clearInterval( iv );
                    setScanProgress( 100 );
                    setScanning( false );
                    setScanned( true );
                    if ( result ) {
                        setScanStats( { total: result.total || 0, missingTitle: result.missing_title || 0, missingMeta: result.missing_meta || 0 } );
                    }
                } catch ( e ) {
                    clearInterval( iv );
                    setScanProgress( 100 );
                    setScanning( false );
                    setScanned( true );
                }
            };
            doScan();
        }
    }, [step, scanned] );

    const steps = ['Welcome', 'Scan site', 'Ready'];
    const totalNeeds = scanStats.missingTitle + scanStats.missingMeta;

    return (
        <Modal open={open} onClose={onClose} width={620} dismissable={false}>
            <div style={{ display: 'flex', padding: '20px 28px 0', gap: 8 }}>
                {steps.map( ( s, i ) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? 'var(--text)' : 'var(--bg-sunken)', transition: 'background .3s' }}/>
                ) )}
            </div>
            <div style={{ padding: '8px 28px 4px', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Step {step + 1} of 3 · {steps[step]}
            </div>

            {step === 0 && (
                <div style={{ padding: '16px 28px 28px' }}>
                    <Icon name="logo" size={44} style={{ color: 'var(--primary-strong)', marginBottom: 14 }}/>
                    <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Welcome to BeepBeep Titles.</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
                        Page SEO that runs continuously in the background. BeepBeep Titles crawls your published pages, writes title tags and meta descriptions, and keeps your coverage climbing.
                    </p>
                    <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-sunken)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { icon: 'shield', text: 'Daily crawl to catch pages with missing title & meta' },
                            { icon: 'zap',    text: 'Generate 5 pages per day on Free — no rush' },
                            { icon: 'flame',  text: 'Build a streak — your site stays healthy over time' },
                        ].map( ( f, i ) => (
                            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--text)' }}>
                                <Icon name={f.icon} size={15} style={{ color: 'var(--primary)' }}/>
                                {f.text}
                            </div>
                        ) )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                        <Button variant="primary" size="md" iconRight="arrow-right" onClick={() => setStep( 1 )}>Let's go</Button>
                    </div>
                </div>
            )}

            {step === 1 && (
                <div style={{ padding: '16px 28px 28px' }}>
                    <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Scanning your site</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 20px' }}>
                        We'll look at every page and tell you what's missing. This won't use any credits.
                    </p>
                    <div style={{ padding: 24, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{scanning ? 'Crawling pages & posts…' : scanned ? 'Crawl complete' : 'Ready'}</span>
                            <span className="mono tnum" style={{ fontSize: 13, fontWeight: 600 }}>{scanProgress}%</span>
                        </div>
                        <Progress value={scanProgress} max={100} tone={scanned ? 'ok' : 'primary'} height={6}/>
                        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                            <ScanStat label="Total pages"   value={scanned ? scanStats.total : scanning ? Math.floor( scanStats.total * scanProgress / 100 ) : 0}/>
                            <ScanStat label="Missing title" value={scanned ? scanStats.missingTitle : 0} tone="danger"/>
                            <ScanStat label="Missing meta"  value={scanned ? scanStats.missingMeta : 0} tone="warn"/>
                        </div>
                    </div>
                    {scanned && (
                        <div style={{ marginTop: 14, padding: 14, background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ok-ink)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon name="check" size={16}/>
                            <span>
                                {totalNeeds > 0
                                    ? <><strong>{totalNeeds} pages</strong> need attention. You'll work through them gradually.</>
                                    : <><strong>Great news!</strong> Your site is already looking healthy.</>}
                            </span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                        <Button variant="ghost" size="md" onClick={() => setStep( 0 )}>Back</Button>
                        <Button variant="primary" size="md" iconRight="arrow-right" disabled={!scanned} onClick={() => setStep( 2 )}>Continue</Button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div style={{ padding: '12px 28px 28px' }}>
                    <div className="onboarding-success" style={{
                        width: 44, height: 44, borderRadius: 999,
                        background: 'var(--ok-soft)', border: '1px solid var(--ok-border)',
                        color: 'var(--ok-ink)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 14,
                    }}>
                        <Icon name="check" size={22} strokeWidth={2.4}/>
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Your site is ready</h2>
                    {totalNeeds > 0 && (
                        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 6px', lineHeight: 1.55 }}>
                            We found <span className="mono tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{totalNeeds}</span> pages needing attention.
                        </p>
                    )}
                    <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 18px', lineHeight: 1.55 }}>
                        We'll guide you through them gradually — no rush.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                        {['5 pages per day included free', 'Builds steady SEO coverage', 'You can change settings anytime'].map( ( t, i ) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text)' }}>
                                <Icon name="check" size={13} strokeWidth={2.4} style={{ color: 'var(--ok-ink)', flexShrink: 0 }}/>
                                <span>{t}</span>
                            </div>
                        ) )}
                    </div>
                    <div style={{ marginBottom: 4 }}>
                        <button
                            onClick={() => setShowFasterOptions( v => !v )}
                            aria-expanded={showFasterOptions}
                            style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {showFasterOptions ? 'Hide faster options' : 'See faster options'}
                            <Icon name={showFasterOptions ? 'chevron-down' : 'chevron-right'} size={12}/>
                        </button>
                        {showFasterOptions && (
                            <div className="fade-in" style={{ marginTop: 10, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Bulk catch-up</div>
                                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>Optimise your entire site in one pass with Pro, then let Autopilot handle new pages.</div>
                                </div>
                                <div style={{ height: 1, background: 'var(--hairline)' }}/>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Monitor only</div>
                                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>Just track SEO health and generate manually when you want to.</div>
                                </div>
                                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>You can switch to either of these later from Settings.</div>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                        <Button variant="ghost" size="md" onClick={() => setStep( 1 )}>Back</Button>
                        <Button variant="primary" size="md" iconRight="arrow-right" onClick={onComplete}>Open dashboard</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const ScanStat = ({ label, value, tone = 'neutral' }) => {
    const colors = { neutral: 'var(--text)', danger: 'var(--danger-ink)', warn: 'var(--warn-ink)' };
    return (
        <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
            <div className="mono tnum" style={{ fontSize: 22, fontWeight: 600, marginTop: 4, color: colors[tone] }}>{value}</div>
        </div>
    );
};

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
        section:   item.section ?? page?.section ?? 'Page',
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
                        key: pg.id, postId: pg.id, url: pg.url, section: pg.section,
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
                        key: pg.id, postId: pg.id, url: pg.url, section: pg.section,
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

    const sectionLetter = ( result.section || 'P' )[0].toUpperCase();
    const hue = result.hue ?? ( index * 80 ) % 360;
    const failed = status === 'failed';

    return (
        <div className="gen-row-in" style={{ padding: '14px 0', borderBottom: last ? 'none' : '1px solid var(--hairline)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flexShrink: 0 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: failed ? 'var(--danger-soft)' : `hsl(${hue}, 32%, 94%)`,
                        color: failed ? 'var(--danger-ink)' : `hsl(${hue}, 38%, 32%)`,
                        border: '1px solid var(--border)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700,
                    }}>{failed ? <Icon name="alert" size={16}/> : sectionLetter}</div>
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
    const sectionLetter = ( page.section || 'P' )[0].toUpperCase();
    const hue = page.hue ?? 220;
    return (
        <div style={{ padding: '14px 0' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: `hsl(${hue}, 32%, 94%)`, color: `hsl(${hue}, 38%, 32%)`, border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{sectionLetter}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.url}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{page.section}</div>
                    <div style={{ marginTop: 6, padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)' }}>
                        <span className="pulse-dot" style={{ width: 6, height: 6, background: 'var(--primary)' }}/>
                        <span key={phrase} className="phrase-in" style={{ lineHeight: 1.4 }}>{phrase}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Paywall ───────────────────────────────────────────────────────── */
const countdownToReset = ( entitlement, trigger ) => {
    if ( trigger === 'monthly-limit' && entitlement?.reset_date ) {
        const resetMs = new Date( entitlement.reset_date ).getTime();
        const days    = Math.max( 1, Math.ceil( ( resetMs - Date.now() ) / 86400000 ) );
        return `Free credits reset in ${days} day${days === 1 ? '' : 's'}.`;
    }
    if ( trigger === 'daily-limit' ) {
        // Daily quota resets at the next UTC midnight.
        const now  = new Date();
        const next = Date.UTC( now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0 );
        const mins = Math.max( 1, Math.round( ( next - now.getTime() ) / 60000 ) );
        const h    = Math.floor( mins / 60 );
        const m    = mins % 60;
        const span = h > 0 ? `${h}h ${m}m` : `${m}m`;
        const n    = entitlement?.daily_limit;
        return n ? `Your next ${n} unlock in ${span}.` : `Your free generations reset in ${span}.`;
    }
    return null;
};

export const Paywall = ({ open, onClose, trigger, entitlement, onUpgrade, onBuyCredits }) => {
    if ( !open ) return null;
    const dynamicUrgency = countdownToReset( entitlement, trigger );
    const triggers = {
        'daily-limit':   { icon: 'clock',   title: "You've used today's free generations",     subtitle: "Pro lifts the daily allowance so you never have to wait — keep optimising every day.",     urgency: dynamicUrgency || 'Your free generations reset overnight.' },
        'monthly-limit': { icon: 'alert',   title: "You've reached this month's free limit",   subtitle: "Pro keeps your site improving without limits.",                                              urgency: dynamicUrgency || 'Free credits reset at the start of next month.' },
        'auto-feature':  { icon: 'zap',     title: 'Let BeepBeep Titles handle title & meta',  subtitle: 'Every new page you publish gets title & meta automatically.',                               urgency: 'Set it once. Never think about it again.' },
        'bulk':          { icon: 'library', title: 'Optimise your entire site in minutes',     subtitle: 'Catch up on every page with missing title & meta in one pass.',                             urgency: null },
        'default':       { icon: 'crown',   title: 'Never worry about missing meta again',    subtitle: 'Continuous, automated page SEO for your WordPress site.',                                    urgency: null },
    };
    const t = triggers[trigger] || triggers.default;

    return (
        <Modal open={open} onClose={onClose} width={680}>
            <div style={{ position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 999, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', zIndex: 2 }}>
                    <Icon name="x" size={14}/>
                </button>

                <div style={{ padding: '28px 32px 22px', background: 'linear-gradient(135deg,#F3F7FE 0%,#EEF0FE 100%)', borderBottom: '1px solid var(--primary-border)', borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: 'linear-gradient(180deg,#2563EB 0%,#1D4ED8 100%)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.28)' }}>
                            <Icon name={t.icon} size={22}/>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Pill tone="primary" icon="crown">BeepBeep Titles Pro</Pill>
                            <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '8px 0 6px' }}>{t.title}</h2>
                            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>{t.subtitle}</p>
                            {t.urgency && (
                                <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--warn-ink)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <Icon name="clock" size={13}/>{t.urgency}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '24px 32px 8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <PlanColumn title="Free" subtitle="What you have today" features={[
                            { ok: true,  text: '5 AI generations per day' },
                            { ok: true,  text: 'Up to 50 AI generations per month' },
                            { ok: true,  text: 'Site crawling' },
                            { ok: false, text: 'Auto-generate on publish' },
                            { ok: false, text: 'Bulk site optimisation' },
                            { ok: false, text: 'Background monitoring' },
                        ]}/>
                        <PlanColumn title="Pro" subtitle="$14.99 / month" features={[
                            { ok: true, text: 'Unlimited AI generations',         strong: true },
                            { ok: true, text: 'Never worry about missing meta',   strong: true },
                            { ok: true, text: 'Optimise your entire site',        strong: true },
                            { ok: true, text: 'Automatic monitoring',             strong: true },
                            { ok: true, text: 'See your site improving weekly' },
                            { ok: true, text: 'Works across multiple sites' },
                        ]} highlight/>
                    </div>
                </div>

                <div style={{ padding: '16px 32px 28px' }}>
                    <Button variant="pro" size="lg" full icon="crown" onClick={onUpgrade}>Upgrade to Pro · $14.99/mo</Button>
                    {onBuyCredits && (
                        <button onClick={onBuyCredits} style={{ width: '100%', marginTop: 10, background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                            <Icon name="zap" size={14}/> Or buy a one-time credit pack · $11.99 for 100 credits
                        </button>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--text-3)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11}/> Secure Stripe checkout</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11}/> Cancel anytime</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11}/> Shared across your BeepBeep plugins</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const PlanColumn = ({ title, subtitle, features, highlight }) => (
    <div style={{ padding: '16px 18px', border: `1px solid ${highlight ? 'var(--primary)' : 'var(--border)'}`, background: highlight ? 'var(--surface)' : 'var(--surface-2)', borderRadius: 'var(--r-md)', boxShadow: highlight ? '0 4px 12px rgba(37,99,235,0.14)' : 'none', position: 'relative' }}>
        {highlight && <div style={{ position: 'absolute', top: -10, right: 12, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.04em' }}>RECOMMENDED</div>}
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, marginBottom: 12 }}>{subtitle}</div>
        {features.map( ( f, i ) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', alignItems: 'center' }}>
                <Icon name={f.ok ? 'check' : 'x'} size={13} strokeWidth={2.5} style={{ color: f.ok ? 'var(--ok-ink)' : 'var(--text-3)', opacity: f.ok ? 1 : 0.5 }}/>
                <span style={{ fontSize: 12.5, color: f.ok ? 'var(--text)' : 'var(--text-3)', opacity: f.ok ? 1 : 0.7, fontWeight: f.strong ? 600 : 400 }}>{f.text}</span>
            </div>
        ) )}
    </div>
);

/* ── Toast ─────────────────────────────────────────────────────────── */
export const Toast = ({ message, sub, onDismiss, action, icon = 'check', tone = 'ok' }) => {
    useEffect( () => { const t = setTimeout( onDismiss, 6000 ); return () => clearTimeout( t ); }, [] );
    const tones = {
        ok:   { bg: 'var(--text)', fg: '#fff', ic: 'var(--ok)' },
        warn: { bg: 'var(--warn-soft)', fg: 'var(--warn-ink)', ic: 'var(--warn-ink)' },
    };
    const tc = tones[tone] || tones.ok;
    return (
        <div style={{
            position: 'fixed', bottom: 20, left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1500,
            background: tc.bg, color: tc.fg,
            padding: '12px 14px 12px 16px',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 13, fontWeight: 500,
            animation: 'bbt-slide-up .25s cubic-bezier(.2,.8,.2,1)',
            maxWidth: 480,
        }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: tc.ic }}>
                <Icon name={icon} size={15}/>
            </div>
            <div style={{ flex: 1 }}>
                <div>{message}</div>
                {sub && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{sub}</div>}
            </div>
            {action && (
                <button onClick={action.onClick} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{action.label}</button>
            )}
            <button onClick={onDismiss} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}>
                <Icon name="x" size={14}/>
            </button>
        </div>
    );
};

/* ── Help modal ────────────────────────────────────────────────────── */
export const HelpModal = ({ open, onClose }) => {
    const [query, setQuery] = useState( '' );
    const topics = [
        { icon: 'sparkles', title: 'Getting started',           desc: 'Connect your site, run your first pass, and turn on Autopilot.' },
        { icon: 'zap',      title: 'How Autopilot works',       desc: 'What BeepBeep Titles does in the background and how to control it.' },
        { icon: 'shield',   title: 'Writing better title & meta', desc: 'Tone presets, length controls, and SEO best practice.' },
        { icon: 'crown',    title: 'Plans & billing',           desc: 'Free vs Pro, switching plans, invoices and refunds.' },
        { icon: 'settings', title: 'Troubleshooting',           desc: 'Connection issues, missing pages, regenerating title & meta.' },
        { icon: 'mail',     title: 'Contact support',           desc: 'Get a human within one business day.' },
    ];
    const q = query.trim().toLowerCase();
    const filtered = q ? topics.filter( t => ( t.title + ' ' + t.desc ).toLowerCase().includes( q ) ) : topics;

    return (
        <Modal open={open} onClose={onClose} width={620}>
            <div style={{ position: 'relative' }}>
                <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 999, width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', zIndex: 2 }}>
                    <Icon name="x" size={13}/>
                </button>
                <div style={{ padding: '20px 24px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Help & docs</div>
                    <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>How can we help?</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0', lineHeight: 1.5 }}>Search documentation, browse guides, or reach our support team directly.</p>
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                        <Icon name="search" size={14} style={{ color: 'var(--text-3)' }}/>
                        <input autoFocus value={query} onChange={e => setQuery( e.target.value )} placeholder="Search help articles…" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}/>
                    </div>
                </div>
                <div style={{ padding: '0 12px 8px', maxHeight: '50vh', overflowY: 'auto' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>No articles matched. Try contacting support.</div>
                    ) : filtered.map( ( t, i ) => (
                        <button key={i} onClick={onClose} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: '10px 12px', background: 'transparent', border: 0, borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-soft)', color: 'var(--primary-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon name={t.icon} size={14}/>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{t.title}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1, lineHeight: 1.45 }}>{t.desc}</div>
                            </div>
                            <Icon name="chevron-right" size={14} style={{ color: 'var(--text-3)', marginTop: 7, flexShrink: 0 }}/>
                        </button>
                    ) )}
                </div>
                <div style={{ borderTop: '1px solid var(--hairline)', background: 'var(--surface-2)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', borderBottomLeftRadius: 'var(--r-xl)', borderBottomRightRadius: 'var(--r-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                        {[
                            { keys: ['G'],       label: "Start today's pass" },
                            { keys: ['⌘', 'K'],  label: 'Open command bar' },
                            { keys: ['⌘', '/'],  label: 'Open help' },
                            { keys: ['Esc'],     label: 'Close' },
                        ].map( ( s, i, arr ) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                {s.keys.map( ( k, j ) => <KBD key={j}>{k}</KBD> )}
                                <span style={{ color: 'var(--text-3)' }}>{s.label}</span>
                                {i < arr.length - 1 && <span style={{ opacity: 0.5, marginLeft: 4 }}>·</span>}
                            </span>
                        ) )}
                    </div>
                    <Button variant="secondary" size="sm" icon="external" onClick={onClose}>Open docs site</Button>
                </div>
            </div>
        </Modal>
    );
};
