import { useState, useEffect, useRef, useMemo } from 'react';
import { Icon, Card, Pill, Button, KBD, PageAvatar, SerpPreview } from '../components';
import { fetchPages, fetchHealthItems, updatePage } from '../api';
import { contentSubtitle } from '../contentType';
import { dailyRemainingForLibrary, hasDailyCap, isBulkOverLimit, isGenerationUnavailable, creditsPerPage, pagesAffordable, isInsufficientCredits, insufficientCreditsMessage, isDailyExhausted, QUOTA_DEFAULTS } from '../quota';
import { PageShell } from '../ui';

const EMPTY_COUNTS = {
    needs: 0,
    'missing-title': 0,
    'missing-meta': 0,
    ok: 0,
    new: 0,
    drafts: 0,
    all: 0,
};

export const PagesLibrary = ({ quota, connected = true, onConnect, onGenerate, onBulkGenerate, onUpgrade }) => {
    const [filter, setFilter]     = useState( 'needs' );
    const [selected, setSelected] = useState( new Set() );
    const [search, setSearch]     = useState( '' );
    const [stuck, setStuck]       = useState( false );
    const [editing, setEditing]   = useState( null );
    const [overrides, setOverrides] = useState( {} );
    const [savedFlash, setSavedFlash] = useState( null );
    const [pages, setPages]       = useState( [] );
    const [loading, setLoading]   = useState( true );
    const [page, setPage]         = useState( 1 );
    const [total, setTotal]       = useState( 0 );
    const [counts, setCounts]     = useState( EMPTY_COUNTS );
    const [scanning, setScanning] = useState( false );
    const sentinelRef = useRef( null );

    const dailyRemaining = dailyRemainingForLibrary( quota );
    const costPerPage = creditsPerPage( quota );
    const affordablePages = pagesAffordable( dailyRemaining, costPerPage );

    // Local review and editing stay available. Only the remote AI action
    // depends on a service connection and available service credits.
    const signedOut = !connected;
    const generationUnavailable = isGenerationUnavailable( connected, dailyRemaining, costPerPage );
    const onServiceAction = signedOut ? ( onConnect || onUpgrade ) : onUpgrade;

    useEffect( () => {
        loadPages();
    }, [filter, search, page] );

    const applyCounts = ( res ) => {
        const c = res?.counts;
        if ( ! c ) return;
        setCounts( {
            needs:          c.needs ?? 0,
            'missing-title': c.missing_title ?? 0,
            'missing-meta':  c.missing_meta ?? 0,
            ok:             c.ok ?? 0,
            new:            c.new ?? 0,
            drafts:         c.drafts ?? res?.stats?.drafts ?? 0,
            all:            c.all ?? 0,
        } );
    };

    const loadPages = async () => {
        setLoading( true );
        try {
            // Drafts are unpublished (not in the health scan table). Everything
            // else reads Scan_Repository so Library filters match Home priorities
            // (including duplicate titles that still have SEO title+meta set).
            if ( filter === 'drafts' ) {
                const res = await fetchPages( { filter: 'drafts', search, page, perPage: 30 } );
                setPages( res.pages || res || [] );
                setTotal( res.total || ( res.pages || res || [] ).length );
                // Keep other tab badges from the last health response; refresh drafts only.
                setCounts( prev => ( {
                    ...prev,
                    drafts: res.stats?.drafts ?? ( res.pages || [] ).length,
                } ) );
                // Also pull aggregate health counts so All/Needs stay correct
                // even if the user opens Drafts first.
                try {
                    const health = await fetchHealthItems( { filter: 'all', perPage: 1 } );
                    applyCounts( health );
                    setCounts( prev => ( {
                        ...prev,
                        drafts: res.stats?.drafts ?? prev.drafts,
                    } ) );
                } catch ( e ) { /* drafts list still usable */ }
            } else {
                const res = await fetchHealthItems( {
                    filter: filter === 'all' ? '' : filter,
                    search,
                    page,
                    perPage: 30,
                    sort: filter === 'needs' ? 'lowest-score' : 'newest',
                } );
                setPages( res.pages || res.items || [] );
                setTotal( res.total || 0 );
                applyCounts( res );
            }
        } catch ( e ) {
            setPages( [] );
            setTotal( 0 );
        } finally {
            setLoading( false );
        }
    };

    const handleScan = async () => {
        setScanning( true );
        try {
            const { runScan } = await import( '../api' );
            await runScan();
            await loadPages();
        } catch ( e ) {} finally {
            setScanning( false );
        }
    };

    useEffect( () => {
        if ( !sentinelRef.current ) return;
        const io = new IntersectionObserver( ( [entry] ) => setStuck( !entry.isIntersecting ), { threshold: 1 } );
        io.observe( sentinelRef.current );
        return () => io.disconnect();
    }, [] );

    const toggle    = ( id ) => { const s = new Set( selected ); s.has( id ) ? s.delete( id ) : s.add( id ); setSelected( s ); };
    const toggleAll = () => selected.size === pages.length && pages.length > 0 ? setSelected( new Set() ) : setSelected( new Set( pages.map( p => p.id ) ) );

    const tryBulk = () => {
        if ( generationUnavailable ) { onServiceAction(); return; }
        const selectedPages = pages.filter( p => selected.has( p.id ) );
        if ( isBulkOverLimit( selectedPages.length, dailyRemaining, costPerPage ) ) {
            if ( affordablePages > 0 ) onBulkGenerate( selectedPages.slice( 0, affordablePages ) );
            onUpgrade();
            return;
        }
        onBulkGenerate( selectedPages );
    };

    const handleSave = async ( id, vals ) => {
        try {
            await updatePage( id, { seoTitle: vals.title, metaDesc: vals.meta } );
        } catch ( e ) {}
        setOverrides( o => ( { ...o, [id]: vals } ) );
        setEditing( null );
        setSavedFlash( id );
        setTimeout( () => setSavedFlash( curr => curr === id ? null : curr ), 1800 );
    };

    const overLimit = isBulkOverLimit( selected.size, dailyRemaining, costPerPage );

    const filterTabs = useMemo( () => [
        { id: 'needs',         label: 'Needs attention', count: counts.needs },
        { id: 'missing-title', label: 'Missing title',   count: counts['missing-title'] },
        { id: 'missing-meta',  label: 'Missing meta',    count: counts['missing-meta'] },
        { id: 'new',           label: 'New',             count: counts.new },
        { id: 'ok',            label: 'Optimised',       count: counts.ok },
        { id: 'drafts',        label: 'Drafts',          count: counts.drafts },
        { id: 'all',           label: 'All',             count: counts.all },
    ], [counts] );

    return (
        <PageShell>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, gap: 24 }}>
                <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Advanced Library</div>
                    <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Every scanned page, in one table</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0' }}>Advanced filtering, bulk editing, and manual review — most day-to-day work happens on the Dashboard.</p>
                </div>
                <Button variant="secondary" size="md" icon="refresh" onClick={handleScan} disabled={scanning}>
                    {scanning ? 'Scanning…' : 'Re-crawl'}
                </Button>
            </div>

            {generationUnavailable && (
                <ServiceNotice
                    signedOut={signedOut}
                    hasDaily={hasDailyCap( quota )}
                    creditsRemaining={dailyRemaining}
                    costPerPage={costPerPage}
                    onAction={onServiceAction}
                />
            )}

            <div ref={sentinelRef} style={{ height: 1, marginBottom: -1 }}/>

            <div style={{
                position: 'sticky', top: 84, zIndex: 5,
                background: stuck ? 'rgba(246,248,251,0.82)' : 'transparent',
                backdropFilter: stuck ? 'blur(10px) saturate(140%)' : 'none',
                WebkitBackdropFilter: stuck ? 'blur(10px) saturate(140%)' : 'none',
                borderBottom: stuck ? '1px solid var(--hairline)' : '1px solid transparent',
                marginLeft: -32, marginRight: -32, paddingLeft: 32, paddingRight: 32,
                transition: 'background .2s ease, border-color .2s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: stuck ? '10px 0' : '0 0 14px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {filterTabs.map( f => {
                            const active = filter === f.id;
                            return (
                                <button key={f.id} onClick={() => { setFilter( f.id ); setPage( 1 ); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 11px', borderRadius: 'var(--r-pill)', background: active ? 'var(--text)' : 'var(--surface)', color: active ? '#fff' : 'var(--text-2)', border: `1px solid ${active ? 'var(--text)' : 'var(--hairline)'}`, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', transition: 'background .15s ease, color .15s ease' }}
                                    onMouseEnter={e => { if ( !active ) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                                    onMouseLeave={e => { if ( !active ) e.currentTarget.style.borderColor = 'var(--hairline)'; }}>
                                    {f.label}
                                    <span className="mono tnum" style={{ fontSize: 10.5, background: active ? 'rgba(255,255,255,0.16)' : 'var(--bg-sunken)', padding: '0 6px', borderRadius: 999, lineHeight: 1.5, color: active ? '#fff' : 'var(--text-3)' }}>{f.count}</span>
                                </button>
                            );
                        } )}
                    </div>
                    <div style={{ marginLeft: 'auto', position: 'relative' }}>
                        <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}/>
                        <input value={search} onChange={e => { setSearch( e.target.value ); setPage( 1 ); }} placeholder="Search URLs or titles" style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '6px 12px 6px 30px', fontSize: 12.5, fontFamily: 'var(--font-sans)', color: 'var(--text)', width: 240, outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = 'var(--border-strong)'}
                            onBlur={e => e.target.style.borderColor = 'var(--hairline)'}/>
                    </div>
                </div>
            </div>

            <Card padding={0} style={{ marginTop: 14, overflow: 'hidden', position: 'relative' }}>
                {loading && pages.length > 0 && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden', zIndex: 1 }}>
                        <div className="beepti-lib-refresh-bar" style={{ height: '100%', width: '40%', background: 'var(--primary)' }}/>
                    </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '32px 44px 1.5fr 1.4fr 130px 110px', padding: '10px 18px', gap: 14, alignItems: 'center', borderBottom: '1px solid var(--hairline)', fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    <Checkbox checked={selected.size === pages.length && pages.length > 0} indeterminate={selected.size > 0 && selected.size < pages.length} onChange={toggleAll} label="Select all"/>
                    <span/>
                    <span>Content</span>
                    <span>Title & meta</span>
                    <span>Status</span>
                    <span style={{ textAlign: 'right' }}/>
                </div>

                <div style={{ maxHeight: 620, overflowY: 'auto' }}>
                    {loading && pages.length === 0 ? (
                        <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                            <span className="pulse-dot" style={{ display: 'inline-block', marginRight: 8 }}/>
                            Loading…
                        </div>
                    ) : pages.length === 0 ? (
                        <div style={{ padding: '72px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
                            <div style={{ width: 40, height: 40, margin: '0 auto 12px', background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="check" size={20} style={{ color: 'var(--ok-ink)' }}/>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>All caught up</div>
                            <div style={{ fontSize: 12.5, marginTop: 4 }}>Nothing matches this filter.</div>
                        </div>
                    ) : pages.map( ( pg, i ) => {
                        const ov = overrides[pg.id] || {};
                        const merged = { ...pg, seo_title: ov.title ?? pg.seo_title, meta_desc: ov.meta ?? pg.meta_desc };
                        return (
                            <PageRow key={pg.id} pg={merged}
                                selected={selected.has( pg.id )}
                                onToggle={() => toggle( pg.id )}
                                onGenerate={() => onGenerate( pg )}
                                onEdit={() => setEditing( merged )}
                                justSaved={savedFlash === pg.id}
                                generationUnavailable={generationUnavailable}
                                onServiceAction={onServiceAction}
                                last={i === pages.length - 1}/>
                        );
                    } )}
                </div>

                <div style={{ borderTop: '1px solid var(--hairline)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', fontSize: 11.5, color: 'var(--text-3)' }}>
                    <span>Showing <span className="mono tnum" style={{ color: 'var(--text-2)', fontWeight: 500 }}>{pages.length}</span> of <span className="mono tnum">{total}</span></span>
                    <span><span className="mono tnum">{quota?.monthly_used ?? 0}</span> of <span className="mono tnum">{quota?.monthly_limit ?? QUOTA_DEFAULTS.monthly_limit}</span> service credits used this cycle</span>
                </div>
            </Card>

            {selected.size > 0 && (
                <BulkActionBar
                    count={selected.size}
                    allowed={Math.max( 0, dailyRemaining === Infinity ? selected.size : affordablePages )}
                    overLimit={overLimit}
                    generationUnavailable={generationUnavailable}
                    serviceLabel={signedOut ? 'Connect service' : 'Add service credits'}
                    onClear={() => setSelected( new Set() )}
                    onOptimise={tryBulk}
                    onUpgrade={onServiceAction}
                />
            )}

            {selected.size === 0 && (
                <div style={{ marginTop: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--text-3)' }}>
                    <Icon name="info" size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }}/>
                    <span style={{ flex: 1 }}>The OpptiAI service includes <span className="mono">{quota?.monthly_limit ?? QUOTA_DEFAULTS.monthly_limit}</span> generations per cycle on this service plan. Local scanning, bulk selection, review, and editing remain available.</span>
                    <button onClick={onUpgrade} style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--primary-ink)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        View service credits <Icon name="arrow-right" size={11}/>
                    </button>
                </div>
            )}

            <EditPageSEOModal page={editing} onClose={() => setEditing( null )} onSave={handleSave}/>
        </PageShell>
    );
};

const PageRow = ({ pg, selected, onToggle, onGenerate, onEdit, justSaved, generationUnavailable, onServiceAction, last }) => {
    const [hover, setHover] = useState( false );
    const statusConfig = {
        'missing-both':     { tone: 'danger', label: 'Missing both' },
        'missing-title':    { tone: 'danger', label: 'Missing title' },
        'missing-meta':     { tone: 'warn',   label: 'Missing meta' },
        'needs-attention':  { tone: 'warn',   label: 'Needs attention' },
        'ok':               { tone: 'ok',     label: 'Optimised' },
    };
    const cfg = statusConfig[pg.status] || { tone: 'neutral', label: pg.status || '—' };
    const isOk = pg.status === 'ok';

    return (
        <div
            onMouseEnter={() => setHover( true )}
            onMouseLeave={() => setHover( false )}
            style={{
                display: 'grid', gridTemplateColumns: '32px 44px 1.5fr 1.4fr 130px 110px',
                padding: '14px 18px', gap: 14, alignItems: 'center',
                borderBottom: last ? 'none' : '1px solid var(--hairline)',
                background: justSaved ? 'var(--ok-soft)' : selected ? 'var(--primary-soft)' : hover ? 'var(--surface-2)' : 'transparent',
                transition: 'background .35s cubic-bezier(0.16,1,0.3,1)',
            }}>
            <Checkbox checked={selected} onChange={onToggle} label={`Select ${pg.title || pg.url || 'item'}`}/>

            <PageAvatar type={pg.type} section={pg.section} hue={pg.hue ?? 220} size={36} style={{ flexShrink: 0 }}/>

            <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pg.url}</span>
                    {pg.post_status && pg.post_status !== 'publish' && (
                        <Pill tone="neutral" style={{ padding: '1px 7px', fontSize: 10 }}>{pg.post_status === 'future' ? 'SCHEDULED' : 'DRAFT'}</Pill>
                    )}
                    {pg.is_new && <Pill tone="primary" style={{ padding: '1px 7px', fontSize: 10 }}>NEW</Pill>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{contentSubtitle( { type: pg.type, section: pg.section } )}</span>
                    {pg.traffic && <><span style={{ opacity: 0.5 }}>·</span><span className="mono">{pg.traffic}/mo</span></>}
                </div>
            </div>

            <div style={{ minWidth: 0, fontSize: 12.5, lineHeight: 1.45 }}>
                {pg.seo_title
                    ? <div style={{ color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pg.seo_title}</div>
                    : <div style={{ color: 'var(--danger-ink)', fontStyle: 'italic' }}>— no title set —</div>}
                {pg.meta_desc
                    ? <div style={{ color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pg.meta_desc}</div>
                    : <div style={{ color: 'var(--warn-ink)', fontStyle: 'italic', marginTop: 2, fontSize: 11.5 }}>— no meta description —</div>}
            </div>

            <div><SoftStatus tone={cfg.tone}>{cfg.label}</SoftStatus></div>

            <div style={{ textAlign: 'right' }}>
                {!isOk ? (
                    generationUnavailable ? (
                        <span title="AI optimisation requires a connected OptiAI service account with available credits">
                            <Button variant="secondary" size="sm" icon="external" onClick={onServiceAction} style={{ color: 'var(--text-3)' }}>
                                Optimise
                            </Button>
                        </span>
                    ) : (
                        <Button variant={hover ? 'primary' : 'secondary'} size="sm" icon="sparkles" onClick={onGenerate}>
                            Optimise
                        </Button>
                    )
                ) : (
                    <Button variant="ghost" size="sm" icon="edit" onClick={onEdit}>Edit</Button>
                )}
            </div>
        </div>
    );
};

const EditPageSEOModal = ({ page, onClose, onSave }) => {
    const [title, setTitle] = useState( '' );
    const [meta, setMeta]   = useState( '' );
    const [saving, setSaving] = useState( false );
    const titleRef = useRef( null );

    useEffect( () => {
        if ( page ) {
            setTitle( page.seo_title || '' );
            setMeta( page.meta_desc || '' );
            setTimeout( () => titleRef.current && titleRef.current.focus(), 30 );
        }
    }, [page] );

    if ( !page ) return null;

    const handleSave = async () => {
        setSaving( true );
        await onSave( page.id, { title: title.trim(), meta: meta.trim() } );
        setSaving( false );
    };

    const titleColor = title.length > 60 ? 'var(--warn-ink)' : title.length > 0 ? 'var(--ok-ink)' : 'var(--text-3)';
    const metaColor  = meta.length  > 160 ? 'var(--warn-ink)' : meta.length  > 0 ? 'var(--ok-ink)' : 'var(--text-3)';
    const hue = page.hue ?? 220;

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ width: 620, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)', animation: 'beepti-scale-in .2s cubic-bezier(0.16,1,0.3,1)' }}>
                <div style={{ padding: '18px 22px 12px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <PageAvatar type={page.type} section={page.section} hue={hue} fontSize={14} style={{ flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Edit SEO</div>
                        <div className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.url}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{contentSubtitle( { type: page.type, section: page.section } )}</div>
                    </div>
                    <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 0, padding: 6, cursor: 'pointer', color: 'var(--text-3)', borderRadius: 6 }}>
                        <Icon name="x" size={16}/>
                    </button>
                </div>

                <div style={{ padding: '0 22px 4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Title tag</label>
                        <span className="mono" style={{ fontSize: 11, color: titleColor, fontWeight: 600 }}>{title.length}/60</span>
                    </div>
                    <input ref={titleRef} value={title} onChange={e => setTitle( e.target.value )}
                        onKeyDown={e => { if ( e.key === 'Escape' ) onClose(); if ( e.key === 'Enter' && ( e.metaKey || e.ctrlKey ) ) handleSave(); }}
                        placeholder="Page title shown in search results and browser tabs"
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13.5, color: 'var(--text)', fontFamily: 'var(--font-sans)', background: 'var(--surface)', outline: 0 }}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.18)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}/>
                </div>

                <div style={{ padding: '12px 22px 8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Meta description</label>
                        <span className="mono" style={{ fontSize: 11, color: metaColor, fontWeight: 600 }}>{meta.length}/160</span>
                    </div>
                    <textarea value={meta} onChange={e => setMeta( e.target.value )}
                        onKeyDown={e => { if ( e.key === 'Escape' ) onClose(); if ( e.key === 'Enter' && ( e.metaKey || e.ctrlKey ) ) handleSave(); }}
                        rows={3} placeholder="One-sentence summary shown under the title in search results."
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.55, fontFamily: 'var(--font-sans)', background: 'var(--surface)', resize: 'vertical', minHeight: 80, outline: 0 }}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.18)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}/>
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>Aim for ~150 characters. Google may truncate longer descriptions.</div>
                </div>

                <div style={{ padding: '10px 22px 18px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Search preview</div>
                    <SerpPreview
                        variant="compact"
                        faviconLetter="Y"
                        url={`yoursite.com${page.url}`}
                        title={title}
                        titleFallback={<em style={{ color: '#b00020', fontStyle: 'normal' }}>(no title set)</em>}
                        meta={meta}
                        metaFallback={<em style={{ color: '#5f6368' }}>(no meta description — Google will pick a snippet from the page)</em>}/>
                </div>

                <div style={{ padding: '12px 22px', background: 'var(--surface-2)', borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                        <KBD>⌘</KBD>{' '}<KBD>↵</KBD><span style={{ marginLeft: 4 }}>to save</span>
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" size="sm" icon="check" onClick={handleSave} disabled={( !title.trim() && !meta.trim() ) || saving}>
                            {saving ? 'Saving…' : 'Save changes'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ServiceNotice = ({ signedOut, hasDaily = true, creditsRemaining = 0, costPerPage = 2, onAction }) => {
    const insufficient = ! signedOut && isInsufficientCredits( creditsRemaining, costPerPage );
    const exhausted = ! signedOut && isDailyExhausted( creditsRemaining );
    const title = signedOut
        ? 'AI service not connected'
        : insufficient
            ? 'Not enough credits for this page'
            : hasDaily
                ? 'Daily service credits used'
                : 'Monthly service credits used';
    const body = signedOut
        ? 'You can still review and edit titles & meta descriptions. Connect your OpptiAI account to generate with AI.'
        : insufficient
            ? insufficientCreditsMessage( creditsRemaining, costPerPage )
            : 'Local scanning, review, and editing remain available. More AI generation requires OpptiAI service credits.';

    return (
    <Card padding={0} style={{ marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="external" size={14}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {title}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--text-2)' }}>
                    {body}
                </p>
            </div>
            <Button variant={signedOut ? 'primary' : 'pro'} size="sm" icon={signedOut ? 'arrow-right' : 'crown'} onClick={onAction}>
                {signedOut ? 'Connect service' : exhausted || insufficient ? 'Add credits' : 'View service plans'}
            </Button>
        </div>
    </Card>
    );
};

const BulkActionBar = ({ count, allowed = 0, overLimit, generationUnavailable, serviceLabel = 'Service options', onClear, onOptimise, onUpgrade }) => (
    <div style={{ position: 'sticky', bottom: 16, zIndex: 6, marginTop: 16, background: 'var(--text)', color: '#fff', borderRadius: 'var(--r-md)', padding: '10px 12px 10px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-lg)', animation: 'beepti-slide-up .22s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <span className="mono tnum" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{count}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)' }}>{count === 1 ? 'item selected' : 'items selected'}</span>
            {generationUnavailable
                ? <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="external" size={12}/>AI service unavailable</span>
                : overLimit && <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="alert" size={12}/>Selection exceeds available service credits</span>}
        </div>
        <button onClick={onClear} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '6px 10px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Clear</button>
        {generationUnavailable ? (
            <button onClick={onUpgrade} style={{ background: '#fff', color: 'var(--text)', border: 'none', padding: '7px 14px', borderRadius: 'var(--r-md)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="external" size={13}/> {serviceLabel}
            </button>
        ) : overLimit ? (
            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <button onClick={onOptimise} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', padding: '7px 12px', borderRadius: 'var(--r-md)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="sparkles" size={13}/> Optimise first {allowed}
                </button>
                <button onClick={onUpgrade} style={{ background: '#fff', color: 'var(--text)', border: 'none', padding: '7px 14px', borderRadius: 'var(--r-md)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="crown" size={13}/> Get service credits
                </button>
            </div>
        ) : (
            <button onClick={onOptimise} style={{ background: '#fff', color: 'var(--text)', border: 'none', padding: '7px 14px', borderRadius: 'var(--r-md)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="sparkles" size={13}/> Optimise Selected ({count})
            </button>
        )}
    </div>
);

const Checkbox = ({ checked, indeterminate, onChange, label = 'Select item' }) => (
    <button
        onClick={onChange}
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-label={label}
        style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked || indeterminate ? 'var(--primary)' : 'var(--border-strong)'}`, background: checked || indeterminate ? 'var(--primary)' : 'var(--surface)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all .12s ease' }}>
        {checked && <Icon name="check" size={11} style={{ color: '#fff' }} strokeWidth={3}/>}
        {indeterminate && !checked && <span style={{ width: 8, height: 2, background: '#fff', borderRadius: 1 }}/>}
    </button>
);

const SoftStatus = ({ tone = 'ok', children }) => {
    const tones = {
        ok:      { fg: 'var(--ok-ink)',      dot: 'var(--ok)' },
        warn:    { fg: 'var(--warn-ink)',    dot: 'var(--warn)' },
        danger:  { fg: 'var(--danger-ink)',  dot: 'var(--danger)' },
        primary: { fg: 'var(--primary-ink)', dot: 'var(--primary)' },
        neutral: { fg: 'var(--text-3)',      dot: 'var(--text-3)' },
    };
    const t = tones[tone] || tones.ok;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: t.fg, fontWeight: 500, letterSpacing: '-0.005em' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: t.dot, flexShrink: 0 }}/>
            {children}
        </span>
    );
};
