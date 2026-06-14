import { useState, useEffect, useRef, useMemo } from 'react';
import { Icon, Card, Pill, Button, KBD, PageAvatar, SerpPreview } from '../components';
import { fetchPages, updatePage } from '../api';
import { dailyRemainingForLibrary, hasDailyCap, isBulkOverLimit, isGenerationLocked } from '../quota';

export const PagesLibrary = ({ plan, quota, connected = true, onConnect, onGenerate, onBulkGenerate, onUpgrade }) => {
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
    const [libStats, setLibStats] = useState( null );
    const [scanning, setScanning] = useState( false );
    const sentinelRef = useRef( null );

    const dailyRemaining = dailyRemainingForLibrary( quota, plan );

    // Locked-out state: generation CTAs render as locks but stay clickable —
    // they route to connect/upgrade. Review and manual editing stay available.
    const signedOut = !connected;
    const genLocked = isGenerationLocked( connected, plan, dailyRemaining );
    const onUnlock  = signedOut ? ( onConnect || onUpgrade ) : onUpgrade;

    useEffect( () => {
        loadPages();
    }, [filter, search, page] );

    const loadPages = async () => {
        setLoading( true );
        try {
            const res = await fetchPages( { filter: filter === 'all' ? '' : filter, search, page, perPage: 30 } );
            setPages( res.pages || res || [] );
            setTotal( res.total || ( res.pages || res || [] ).length );
            if ( res.stats ) setLibStats( res.stats );
        } catch ( e ) {
            setPages( [] );
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

    const needsAttention = ( p ) => p.status === 'missing-both' || p.status === 'missing-title' || p.status === 'missing-meta';

    const counts = useMemo( () => ( {
        needs:          pages.filter( needsAttention ).length,
        'missing-title': pages.filter( p => p.status === 'missing-title' || p.status === 'missing-both' ).length,
        'missing-meta':  pages.filter( p => p.status === 'missing-meta'  || p.status === 'missing-both' ).length,
        ok:             pages.filter( p => p.status === 'ok'  ).length,
        new:            pages.filter( p => p.is_new ).length,
        drafts:         libStats?.drafts ?? 0,
        all:            total,
    } ), [pages, total, libStats] );

    const toggle    = ( id ) => { const s = new Set( selected ); s.has( id ) ? s.delete( id ) : s.add( id ); setSelected( s ); };
    const toggleAll = () => selected.size === pages.length && pages.length > 0 ? setSelected( new Set() ) : setSelected( new Set( pages.map( p => p.id ) ) );

    const tryBulk = () => {
        if ( genLocked ) { onUnlock(); return; }
        const selectedPages = pages.filter( p => selected.has( p.id ) );
        if ( isBulkOverLimit( plan, selectedPages.length, dailyRemaining ) ) {
            if ( dailyRemaining > 0 ) onBulkGenerate( selectedPages.slice( 0, dailyRemaining ) );
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

    const overLimit = isBulkOverLimit( plan, selected.size, dailyRemaining );

    const filterTabs = [
        { id: 'needs',         label: 'Needs attention', count: counts.needs },
        { id: 'missing-title', label: 'Missing title',   count: counts['missing-title'] },
        { id: 'missing-meta',  label: 'Missing meta',    count: counts['missing-meta'] },
        { id: 'new',           label: 'New pages',       count: counts.new },
        { id: 'ok',            label: 'Optimised',       count: counts.ok },
        { id: 'drafts',        label: 'Drafts',          count: counts.drafts },
        { id: 'all',           label: 'All pages',       count: counts.all },
    ];

    return (
        <div style={{ padding: '28px 32px 64px', maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, gap: 24 }}>
                <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Library</div>
                    <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Every page, all in one view</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0' }}>Review titles and meta descriptions across every page on your site.</p>
                </div>
                <Button variant="secondary" size="md" icon="refresh" onClick={handleScan} disabled={scanning}>
                    {scanning ? 'Scanning…' : 'Re-crawl'}
                </Button>
            </div>

            {genLocked && <LockedNotice signedOut={signedOut} hasDaily={hasDailyCap( quota )} onUnlock={onUnlock}/>}

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

            <Card padding={0} style={{ marginTop: 14, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '32px 44px 1.5fr 1.4fr 130px 110px', padding: '10px 18px', gap: 14, alignItems: 'center', borderBottom: '1px solid var(--hairline)', fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    <Checkbox checked={selected.size === pages.length && pages.length > 0} indeterminate={selected.size > 0 && selected.size < pages.length} onChange={toggleAll}/>
                    <span/>
                    <span>Page</span>
                    <span>Title & meta</span>
                    <span>Status</span>
                    <span style={{ textAlign: 'right' }}/>
                </div>

                <div style={{ maxHeight: 620, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                            <span className="pulse-dot" style={{ display: 'inline-block', marginRight: 8 }}/>
                            Loading pages…
                        </div>
                    ) : pages.length === 0 ? (
                        <div style={{ padding: '72px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
                            <div style={{ width: 40, height: 40, margin: '0 auto 12px', background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="check" size={20} style={{ color: 'var(--ok-ink)' }}/>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>All caught up</div>
                            <div style={{ fontSize: 12.5, marginTop: 4 }}>No pages match this filter.</div>
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
                                locked={genLocked}
                                onUnlock={onUnlock}
                                last={i === pages.length - 1}/>
                        );
                    } )}
                </div>

                <div style={{ borderTop: '1px solid var(--hairline)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', fontSize: 11.5, color: 'var(--text-3)' }}>
                    <span>Showing <span className="mono tnum" style={{ color: 'var(--text-2)', fontWeight: 500 }}>{pages.length}</span> of <span className="mono tnum">{total}</span></span>
                    {plan === 'free' && <span><span className="mono tnum">{quota?.monthly_used ?? 0}</span> of <span className="mono tnum">{quota?.monthly_limit ?? 50}</span> credits used this cycle</span>}
                </div>
            </Card>

            {selected.size > 0 && (
                <BulkActionBar
                    count={selected.size}
                    allowed={Math.max( 0, dailyRemaining === Infinity ? selected.size : dailyRemaining )}
                    overLimit={overLimit}
                    locked={genLocked}
                    lockedLabel={signedOut ? 'Connect to generate' : 'Upgrade to generate'}
                    onClear={() => setSelected( new Set() )}
                    onOptimise={tryBulk}
                    onUpgrade={onUnlock}
                />
            )}

            {plan === 'free' && selected.size === 0 && (
                <div style={{ marginTop: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--text-3)' }}>
                    <Icon name="info" size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }}/>
                    <span style={{ flex: 1 }}>On Free, you get <span className="mono">{quota?.monthly_limit ?? 50}</span> AI generations per month (shared with your other BeepBeep plugins). Pro unlocks unlimited generation and bulk site optimisation.</span>
                    <button onClick={onUpgrade} style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--primary-ink)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        See Pro <Icon name="arrow-right" size={11}/>
                    </button>
                </div>
            )}

            <EditPageSEOModal page={editing} onClose={() => setEditing( null )} onSave={handleSave}/>
        </div>
    );
};

const PageRow = ({ pg, selected, onToggle, onGenerate, onEdit, justSaved, locked, onUnlock, last }) => {
    const [hover, setHover] = useState( false );
    const statusConfig = {
        'missing-both':  { tone: 'danger', label: 'Missing both' },
        'missing-title': { tone: 'danger', label: 'Missing title' },
        'missing-meta':  { tone: 'warn',   label: 'Missing meta' },
        'ok':            { tone: 'ok',     label: 'Optimised' },
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
            <Checkbox checked={selected} onChange={onToggle}/>

            <PageAvatar section={pg.section} hue={pg.hue ?? 220} size={36} style={{ flexShrink: 0 }}/>

            <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pg.url}</span>
                    {pg.post_status && pg.post_status !== 'publish' && (
                        <Pill tone="neutral" style={{ padding: '1px 7px', fontSize: 10 }}>{pg.post_status === 'future' ? 'SCHEDULED' : 'DRAFT'}</Pill>
                    )}
                    {pg.is_new && <Pill tone="primary" style={{ padding: '1px 7px', fontSize: 10 }}>NEW</Pill>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{pg.section}</span>
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
                    locked ? (
                        <span aria-disabled="true" title="Generation is locked — click to unlock">
                            <Button variant="secondary" size="sm" icon="lock" onClick={onUnlock} style={{ color: 'var(--text-3)' }}>
                                Generate
                            </Button>
                        </span>
                    ) : (
                        <Button variant={hover ? 'primary' : 'secondary'} size="sm" icon="sparkles" onClick={onGenerate}>
                            Generate
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
            <div onClick={e => e.stopPropagation()} style={{ width: 620, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)', animation: 'bbt-scale-in .2s cubic-bezier(0.16,1,0.3,1)' }}>
                <div style={{ padding: '18px 22px 12px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <PageAvatar section={page.section} hue={hue} fontSize={14} style={{ flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Edit page SEO</div>
                        <div className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.url}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{page.section}</div>
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

const LockedNotice = ({ signedOut, hasDaily = true, onUnlock }) => (
    <Card padding={0} style={{ marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="lock" size={14}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {signedOut ? 'License not connected' : hasDaily ? 'Daily allowance used' : 'Monthly credits used'}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--text-2)' }}>
                    {signedOut
                        ? 'You can still review and edit titles & meta descriptions. Connect your BeepBeep account to generate with AI.'
                        : hasDaily
                            ? "You can still review and edit titles & meta descriptions. Upgrade to keep generating today — your free allowance resets overnight."
                            : "You can still review and edit titles & meta descriptions. Upgrade to keep generating — your free credits reset next month."}
                </p>
            </div>
            <Button variant={signedOut ? 'primary' : 'pro'} size="sm" icon={signedOut ? 'arrow-right' : 'crown'} onClick={onUnlock}>
                {signedOut ? 'Connect account' : 'Upgrade'}
            </Button>
        </div>
    </Card>
);

const BulkActionBar = ({ count, allowed = 0, overLimit, locked, lockedLabel = 'Unlock', onClear, onOptimise, onUpgrade }) => (
    <div style={{ position: 'sticky', bottom: 16, zIndex: 6, marginTop: 16, background: 'var(--text)', color: '#fff', borderRadius: 'var(--r-md)', padding: '10px 12px 10px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-lg)', animation: 'bbt-slide-up .22s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <span className="mono tnum" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{count}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)' }}>{count === 1 ? 'page selected' : 'pages selected'}</span>
            {locked
                ? <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="lock" size={12}/>Generation locked</span>
                : overLimit && <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="alert" size={12}/>Over your free limit</span>}
        </div>
        <button onClick={onClear} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '6px 10px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Clear</button>
        {locked ? (
            <button onClick={onUpgrade} style={{ background: '#fff', color: 'var(--text)', border: 'none', padding: '7px 14px', borderRadius: 'var(--r-md)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="lock" size={13}/> {lockedLabel}
            </button>
        ) : overLimit ? (
            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <button onClick={onOptimise} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', padding: '7px 12px', borderRadius: 'var(--r-md)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="sparkles" size={13}/> Generate first {allowed}
                </button>
                <button onClick={onUpgrade} style={{ background: '#fff', color: 'var(--text)', border: 'none', padding: '7px 14px', borderRadius: 'var(--r-md)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="crown" size={13}/> Unlock bulk
                </button>
            </div>
        ) : (
            <button onClick={onOptimise} style={{ background: '#fff', color: 'var(--text)', border: 'none', padding: '7px 14px', borderRadius: 'var(--r-md)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="sparkles" size={13}/> Generate {count}
            </button>
        )}
    </div>
);

const Checkbox = ({ checked, indeterminate, onChange }) => (
    <button onClick={onChange} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked || indeterminate ? 'var(--primary)' : 'var(--border-strong)'}`, background: checked || indeterminate ? 'var(--primary)' : 'var(--surface)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all .12s ease' }}>
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
