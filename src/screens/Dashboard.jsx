import { useState, useEffect, useRef } from 'react';
import { Icon, Card, Pill, Button, Progress, Ring, PageAvatar } from '../components';
import { QUOTA_DEFAULTS } from '../quota';
import { PageShell } from '../ui';

const useCountUp = ( target, { duration = 900, decimals = 0 } = {} ) => {
    const [value, setValue] = useState( target );
    const startRef = useRef( { from: target, to: target, t0: 0 } );
    useEffect( () => {
        const reduced = window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
        if ( reduced ) { setValue( target ); return; }
        const from = startRef.current.to;
        if ( from === target ) return;
        startRef.current = { from, to: target, t0: performance.now() };
        let raf;
        const tick = ( now ) => {
            const t = Math.min( 1, ( now - startRef.current.t0 ) / duration );
            const eased = 1 - Math.pow( 1 - t, 3 );
            const v = startRef.current.from + ( startRef.current.to - startRef.current.from ) * eased;
            setValue( decimals ? +v.toFixed( decimals ) : Math.round( v ) );
            if ( t < 1 ) raf = requestAnimationFrame( tick );
        };
        raf = requestAnimationFrame( tick );
        return () => raf && cancelAnimationFrame( raf );
    }, [target, duration, decimals] );
    return value;
};

export const Dashboard = ({ quota, quotaReady, stats, activity, queuePages, autoOptimise, onAutoToggle, onGenerate, onUpgrade, onView, altTextCompanion }) => {
    const dailyUsed = quota?.daily_used || 0;
    const dailyLimit = quota?.daily_limit || QUOTA_DEFAULTS.daily_limit;
    const monthlyUsed = quota?.monthly_used || 0;
    const monthlyLimit = quota?.monthly_limit || QUOTA_DEFAULTS.monthly_limit;
    const hasDailyLimit  = ( quota?.daily_limit ?? null ) !== null; // backend has no daily cap on the shared wallet
    const monthlyRemaining = Math.max( 0, monthlyLimit - monthlyUsed );
    // Without a daily cap, what's "left today" is simply the monthly credits.
    const dailyRemaining = hasDailyLimit ? ( quota?.daily_remaining ?? ( dailyLimit - dailyUsed ) ) : monthlyRemaining;
    const streak = stats?.streak || 0;

    const total      = stats?.total      || 0;
    const optimised  = stats?.optimised  || 0;
    const coverage   = total > 0 ? Math.round( ( optimised / total ) * 100 ) : 0;
    const needsAttn  = stats?.needs_attention || 0;
    const newSince   = stats?.new_since_last_visit || 0;

    const coverageTone = coverage >= 90 ? 'ok' : coverage >= 50 ? 'warn' : 'primary';
    const totalGenerated = optimised;
    const minutesSaved = Math.round( ( totalGenerated * 55 ) / 60 );
    const hoursSaved = ( minutesSaved / 60 ).toFixed( 1 );
    const nextMilestone = Math.min( 100, Math.ceil( ( coverage + 1 ) / 15 ) * 15 );
    const projectionTarget = coverage >= 75 ? 95 : 75;
    const weeksToTarget = Math.max( 1, Math.round( ( projectionTarget - coverage ) / 8.4 ) );

    return (
        <PageShell style={{ paddingTop: 24, paddingBottom: 48 }}>
            <TodaysPassHero
                ready={quotaReady && stats != null}
                queuePages={queuePages}
                dailyUsed={dailyUsed}
                dailyLimit={dailyLimit}
                dailyRemaining={dailyRemaining}
                hasDailyLimit={hasDailyLimit}
                monthlyRemaining={monthlyRemaining}
                newSince={newSince}
                needsAttn={needsAttn}
                onGenerate={onGenerate}
                onUpgrade={onUpgrade}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 14, marginTop: 20, alignItems: 'stretch' }}>
                <LibraryHealthCard
                    coverage={coverage}
                    tone={coverageTone}
                    nextMilestone={nextMilestone}
                    hoursSaved={hoursSaved}
                    totalGenerated={totalGenerated}
                    projectionTarget={projectionTarget}
                    weeksToTarget={weeksToTarget}
                />
                <AutopilotActiveCard autoOptimise={autoOptimise} onToggle={onAutoToggle}/>
            </div>

            <LibraryCoverageCard total={total} optimised={optimised}/>
            <CompanionBanner companion={altTextCompanion}/>
            <ActivityStrip onView={onView} newSince={newSince} activity={activity}/>
            <FooterMetrics
                streak={streak}
                dailyUsed={dailyUsed}
                dailyLimit={dailyLimit}
                hasDailyLimit={hasDailyLimit}
                monthlyUsed={monthlyUsed}
                monthlyLimit={monthlyLimit}
                autoOptimise={autoOptimise}
            />
        </PageShell>
    );
};

const CompanionBanner = ({ companion }) => {
    const state = companion?.state || 'missing';
    const label = companion?.label || ( state === 'missing' ? 'Install ALT Text' : 'Add ALT Text' );
    const url = companion?.url || '';
    const icon = companion?.icon || ( state === 'active' ? 'external' : state === 'installed' ? 'play' : 'upload' );
    const openCompanion = () => {
        if ( url ) window.location.href = url;
    };

    return (
        <Card padding={0} style={{ marginTop: 20 }}>
            <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="image" size={19} strokeWidth={1.9}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Your credits also work on Image ALT Text</span>
                        <Pill tone="neutral" style={{ padding: '1px 8px', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>From OpptiAI</Pill>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        The same shared credit pool powers <strong style={{ color: 'var(--text)', fontWeight: 600 }}>OpptiAI Alt Text</strong> — generate accessible, SEO-friendly ALT text for your media library. No extra subscription.
                    </div>
                </div>
                <Button variant="secondary" size="md" icon={icon} onClick={openCompanion} disabled={!url}>{label}</Button>
            </div>
        </Card>
    );
};

const TodaysPassHero = ({ ready = true, queuePages, dailyUsed, dailyLimit, dailyRemaining, hasDailyLimit, monthlyRemaining, newSince, needsAttn, onGenerate, onUpgrade }) => {
    const creditsRemaining = hasDailyLimit ? dailyRemaining : monthlyRemaining;
    // Don't decide the pass state until quota + stats have loaded — otherwise the
    // optimistic placeholder quota shows a queue that vanishes once the real
    // (e.g. 0-credit) quota arrives, causing a flash.
    const queueCount = ready ? Math.min( creditsRemaining, Math.min( needsAttn, 5 ), queuePages?.length || 0 ) : 0;
    const showQueue = queueCount > 0;
    // "Out of credits with work still pending" is NOT the same as "caught up".
    const outOfCredits = ready && ! showQueue && needsAttn > 0 && creditsRemaining <= 0;
    const [hover, setHover] = useState( false );
    const [pressed, setPressed] = useState( false );

    const handleActivate = () => { if ( showQueue ) onGenerate(); };
    const handleKey = ( e ) => { if ( showQueue && ( e.key === 'Enter' || e.key === ' ' ) ) { e.preventDefault(); onGenerate(); } };

    const displayPages = ( queuePages || [] ).slice( 0, queueCount );

    return (
        <div
            role={showQueue ? 'button' : undefined}
            tabIndex={showQueue ? 0 : -1}
            aria-label={showQueue ? `Start today's pass — ${queueCount} pages ready` : undefined}
            onClick={showQueue ? handleActivate : undefined}
            onKeyDown={handleKey}
            onMouseEnter={() => setHover( true )}
            onMouseLeave={() => { setHover( false ); setPressed( false ); }}
            onMouseDown={() => showQueue && setPressed( true )}
            onMouseUp={() => setPressed( false )}
            style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                boxShadow: showQueue && hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                borderColor: showQueue && hover ? 'var(--border-strong)' : 'var(--border)',
                transform: pressed ? 'scale(0.998)' : 'scale(1)',
                transition: 'box-shadow .18s ease, border-color .18s ease, transform .08s ease',
                cursor: showQueue ? 'pointer' : 'default',
                overflow: 'hidden', outline: 'none',
            }}
        >
            <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Icon name="zap" size={13} style={{ color: 'var(--primary)' }}/>
                        <span style={{ fontSize: 11, color: 'var(--primary-ink)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Today's pass</span>
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.3 }}>
                        {! ready
                            ? <>Checking today's pass…</>
                            : showQueue
                                ? newSince > 0
                                    ? <><span className="mono tnum">{newSince}</span> new page{newSince === 1 ? '' : 's'} detected since your last scan</>
                                    : <><span className="mono tnum">{queueCount}</span> pages ready for today's pass</>
                                : outOfCredits
                                    ? <><span className="mono tnum">{needsAttn}</span> page{needsAttn === 1 ? '' : 's'} still need optimising</>
                                    : <>Today's pass complete</>}
                    </div>
                </div>
            </div>

            {showQueue ? (
                <div style={{ padding: '12px 20px 0', display: 'grid', gridTemplateColumns: `repeat(${Math.min( queueCount, 5 )}, minmax(0, 1fr))`, gap: 8 }}>
                    {displayPages.map( ( pg, i ) => (
                        <div key={pg.id || i} style={{ padding: 10, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <PageAvatar type={pg.type} section={pg.section} hue={pg.hue ?? 220} size={36} style={{ flexShrink: 0 }}/>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div className="mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pg.url}</div>
                                <div style={{ marginTop: 3 }}>
                                    <SignalChip tone={pg.status === 'missing-both' || pg.status === 'missing-title' ? 'danger' : 'warn'}>
                                        {pg.status === 'missing-both' ? 'Missing both' : pg.status === 'missing-title' ? 'Missing title' : 'Missing meta'}
                                    </SignalChip>
                                </div>
                            </div>
                        </div>
                    ) )}
                </div>
            ) : ! ready ? (
                <div style={{ padding: '10px 20px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)' }}>
                        <span className="pulse-dot" style={{ width: 8, height: 8, background: 'var(--text-3)' }}/>
                        <div style={{ flex: 1, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.45 }}>Checking your library and credits…</div>
                    </div>
                </div>
            ) : outOfCredits ? (
                <div style={{ padding: '10px 20px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 'var(--r-md)' }}>
                        <Icon name="alert" size={16} style={{ color: 'var(--warn-ink)' }}/>
                        <div style={{ flex: 1, fontSize: 13, color: 'var(--warn-ink)', lineHeight: 1.45 }}>
                            <strong>Out of credits.</strong> <span className="mono tnum">{needsAttn}</span> page{needsAttn === 1 ? '' : 's'} still need optimising — you've used all your credits this billing cycle.
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: '10px 20px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 'var(--r-md)' }}>
                        <Icon name="check" size={16} style={{ color: 'var(--ok-ink)' }}/>
                        <div style={{ flex: 1, fontSize: 13, color: 'var(--ok-ink)', lineHeight: 1.45 }}>
                            <><strong>All caught up.</strong> <span className="mono tnum">{monthlyRemaining}</span> credits left this billing cycle.</>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ padding: '12px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div className="tnum" style={{ fontSize: 12, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {! ready ? (
                        <span style={{ color: 'var(--text-3)' }}>Checking your credits…</span>
                    ) : showQueue ? (
                        <>
                            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>
                                {hasDailyLimit
                                    ? <><span className="mono tnum">{dailyUsed}</span> of <span className="mono tnum">{dailyLimit}</span> today's free generations</>
                                    : <><span className="mono tnum">{monthlyRemaining}</span> credits left this billing cycle</>}
                            </span>
                        </>
                    ) : outOfCredits ? (
                        <span style={{ color: 'var(--warn-ink)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Icon name="alert" size={12} strokeWidth={2.6}/>
                            <span><span className="mono tnum">{needsAttn}</span> page{needsAttn === 1 ? '' : 's'} waiting · 0 credits left</span>
                        </span>
                    ) : (
                        <>
                            <Icon name="check" size={12} style={{ color: 'var(--ok-ink)' }} strokeWidth={2.6}/>
                            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Library fully optimised</span>
                        </>
                    )}
                </div>
                <div onClick={e => e.stopPropagation()}>
                    {! ready ? null : showQueue ? (
                        <Button variant="primary" size="lg" icon="sparkles" onClick={onGenerate}>
                            Start today's pass
                        </Button>
                    ) : outOfCredits ? (
                        <Button variant="pro" size="sm" icon="crown" onClick={onUpgrade}>Get more credits</Button>
                    ) : (
                        <Button variant="secondary" size="md" disabled>All caught up</Button>
                    )}
                </div>
            </div>
        </div>
    );
};

const SignalChip = ({ tone = 'neutral', children }) => {
    const tones = {
        primary: { bg: 'var(--primary-soft)', fg: 'var(--primary-ink)', bd: 'var(--primary-border)', dot: null },
        warn:    { bg: 'var(--warn-soft)',    fg: 'var(--warn-ink)',    bd: 'var(--warn-border)',    dot: 'var(--warn)' },
        danger:  { bg: 'var(--danger-soft)',  fg: 'var(--danger-ink)',  bd: 'var(--danger-border)',  dot: 'var(--danger)' },
        neutral: { bg: 'var(--bg-sunken)',    fg: 'var(--text-3)',      bd: 'var(--hairline)',       dot: null },
    };
    const t = tones[tone] || tones.neutral;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, borderRadius: 999, padding: '1px 7px', fontSize: 10.5, fontWeight: tone === 'warn' || tone === 'danger' ? 600 : 500, lineHeight: 1.5, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t.dot && <span style={{ width: 5, height: 5, borderRadius: 999, background: t.dot, flexShrink: 0 }}/>}
            {children}
        </span>
    );
};

const LibraryHealthCard = ({ coverage, tone, nextMilestone, hoursSaved, totalGenerated, projectionTarget, weeksToTarget }) => {
    const distance = Math.max( 0, nextMilestone - coverage );
    const animCoverage = useCountUp( coverage );
    const animHours = useCountUp( parseFloat( hoursSaved ), { decimals: 1 } );
    const stageLabel = coverage >= 90 ? 'Healthy coverage' : coverage >= 50 ? 'Coverage building' : coverage >= 15 ? 'Early optimisation stage' : 'Getting started';

    return (
        <Card padding={0} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px 12px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <Ring value={animCoverage} size={56} stroke={5} tone={tone}>
                    <div className="mono tnum" style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>{animCoverage}</div>
                </Ring>
                <div style={{ flex: 1, minWidth: 0 }} aria-label={stageLabel}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Site SEO health</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span className="mono tnum" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{animCoverage}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>/ 100</span>
                        {coverage > 0 && <span style={{ fontSize: 12, color: 'var(--ok-ink)', fontWeight: 600, marginLeft: 2, whiteSpace: 'nowrap' }}>+12 this week</span>}
                    </div>
                    {distance > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                            Next milestone <span className="mono tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{nextMilestone}</span>
                        </div>
                    )}
                </div>
            </div>
            <div style={{ padding: '12px 18px 14px', borderTop: '1px solid var(--hairline)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span className="ambient-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--ok-ink)', flexShrink: 0 }}/>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.005em' }}>Steady improvement</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55, paddingLeft: 12 }}>
                    At your current pace, your site could reach{' '}
                    <span className="mono tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{projectionTarget}%</span>{' '}
                    coverage in around{' '}
                    <span className="mono tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{weeksToTarget}</span>{' '}
                    week{weeksToTarget === 1 ? '' : 's'}.
                </div>
            </div>
            <div style={{ borderTop: '1px solid var(--hairline)', padding: '9px 18px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Work saved</div>
                <div className="tnum" style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400, whiteSpace: 'nowrap' }}>
                    ~<span className="mono" style={{ fontWeight: 500, color: 'var(--text-2)' }}>{animHours.toFixed(1)}</span> hours saved
                    <span style={{ color: 'var(--text-3)', margin: '0 6px', opacity: 0.6 }}>·</span>
                    <span className="mono" style={{ fontWeight: 500, color: 'var(--text-2)' }}>{totalGenerated}</span> pages improved
                </div>
            </div>
        </Card>
    );
};

const LibraryCoverageCard = ({ total, optimised }) => {
    const pct = total > 0 ? Math.round( ( optimised / total ) * 100 ) : 0;
    const remaining = total - optimised;
    const tone = pct >= 90 ? 'ok' : 'primary';
    return (
        <Card padding={0} style={{ marginTop: 20 }}>
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
                        <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Site coverage</span>
                        <span className="mono tnum" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{pct}%</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>optimised</span>
                    </div>
                    <div className="tnum" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                        <span className="mono" style={{ color: 'var(--text-2)', fontWeight: 500 }}>{optimised}</span> improved
                        <span> · </span>
                        <span className="mono" style={{ color: 'var(--text-2)', fontWeight: 500 }}>{remaining}</span> remaining
                    </div>
                </div>
                <Progress value={optimised} max={Math.max( total, 1 )} tone={tone} height={6}/>
            </div>
        </Card>
    );
};

const AutopilotActiveCard = ({ autoOptimise, onToggle }) => (
    <Card padding={0}>
        <div style={{ padding: '18px 22px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Autopilot</div>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{autoOptimise ? 'Running in the background.' : 'Paused.'}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>
                    {autoOptimise ? 'New pages request title and meta generation from the OpptiAI service.' : 'Enable automatic generation for newly published pages.'}
                </div>
            </div>
            <SmallToggle on={autoOptimise} onChange={() => onToggle( !autoOptimise )}/>
        </div>
        <div style={{ padding: '10px 22px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
                { label: 'New pages covered instantly', on: autoOptimise },
                { label: 'Uses available AI service credits', on: true },
                { label: 'Pages, posts and WooCommerce support', on: true },
            ].map( ( r, i ) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: r.on ? 'var(--text)' : 'var(--text-3)' }}>
                    <Icon name="check" size={13} style={{ color: r.on ? 'var(--ok-ink)' : 'var(--text-3)', flexShrink: 0 }} strokeWidth={2.4}/>
                    <span>{r.label}</span>
                </div>
            ) )}
        </div>
    </Card>
);

const SmallToggle = ({ on, onChange, disabled }) => (
    <button onClick={onChange} disabled={disabled} style={{ width: 34, height: 20, borderRadius: 999, background: on ? 'var(--primary)' : 'var(--bg-sunken)', border: `1px solid ${on ? 'var(--primary)' : 'var(--border-strong)'}`, position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background .15s, border-color .15s', padding: 0, flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: 999, background: '#fff', transition: 'left .15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}/>
    </button>
);

const ACTIVITY_KINDS = {
    generated: { icon: 'sparkles', tone: 'primary', verb: 'Generated title & meta for' },
    auto:      { icon: 'zap',      tone: 'ok',      verb: 'Autopilot optimised' },
    edited:    { icon: 'edit',     tone: 'primary', verb: 'Edited' },
};

const ActivityStrip = ({ onView, newSince, activity }) => {
    const real = ( activity || [] ).map( ( e ) => {
        const kind  = ACTIVITY_KINDS[ e.kind ] || ACTIVITY_KINDS.edited;
        const title = e.title?.trim() || 'Untitled';
        return { time: e.ago || '', icon: kind.icon, tone: kind.tone, text: `${kind.verb} “${title}”`, action: null };
    } );
    const events = [
        ...(newSince > 0 ? [{ time: 'Just now', icon: 'upload', tone: 'warn', text: `${newSince} new page${newSince === 1 ? '' : 's'} detected`, action: 'Review', onAction: () => onView && onView( 'library' ) }] : []),
        ...real,
    ];
    return (
        <div style={{ marginTop: 22, borderTop: '1px solid var(--hairline)', paddingTop: 14 }}>
            <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Latest improvements</span>
            </div>
            <div>
                {events.length === 0 && (
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '4px 0' }}>No improvements yet — generate titles & meta to see activity here.</div>
                )}
                {events.map( ( e, i ) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 0', borderTop: i ? '1px solid var(--hairline)' : 'none' }}>
                        <div style={{ width: 16, height: 16, borderRadius: 999, background: e.tone === 'ok' ? 'var(--ok-soft)' : e.tone === 'warn' ? 'var(--warn-soft)' : 'var(--primary-soft)', color: e.tone === 'ok' ? 'var(--ok-ink)' : e.tone === 'warn' ? 'var(--warn-ink)' : 'var(--primary-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon name={e.icon} size={9} strokeWidth={2.4}/>
                        </div>
                        <span style={{ fontSize: 12.5, color: 'var(--text-2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.text}</span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{e.time}</span>
                        {e.action && (
                            <button onClick={e.onAction} style={{ background: 'transparent', border: 'none', padding: '2px 4px', fontSize: 12, color: 'var(--text-2)', fontWeight: 600, cursor: 'pointer', borderRadius: 4 }}
                                onMouseEnter={ev => ev.currentTarget.style.color = 'var(--text)'}
                                onMouseLeave={ev => ev.currentTarget.style.color = 'var(--text-2)'}>
                                {e.action}
                            </button>
                        )}
                    </div>
                ) )}
            </div>
        </div>
    );
};

const FooterMetrics = ({ streak, dailyUsed, dailyLimit, hasDailyLimit, monthlyUsed, monthlyLimit, autoOptimise }) => {
    const Item = ({ label, value }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{value}</div>
        </div>
    );
    const dailyExhausted = dailyUsed >= dailyLimit;
    const monthlyRemaining = Math.max( 0, monthlyLimit - monthlyUsed );

    return (
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 4px 4px', gap: 40, flexWrap: 'wrap', borderTop: '1px solid var(--hairline)', marginTop: 20 }}>
            <Item label="Editing streak" value={<><span className="mono tnum">{streak}</span>-day streak</>}/>
            {hasDailyLimit && (
                <Item label="Daily service allowance" value={
                    dailyExhausted
                        ? <><span className="mono tnum">{dailyLimit}</span> of <span className="mono tnum">{dailyLimit}</span> used today</>
                        : <><span className="mono tnum">{dailyUsed}</span> of <span className="mono tnum">{dailyLimit}</span> used today</>
                }/>
            )}
            <Item label="Monthly service usage" value={<><span className="mono tnum">{monthlyUsed}</span> of <span className="mono tnum">{monthlyLimit}</span> used</>}/>
            <Item label="Autopilot" value={autoOptimise ? 'Enabled' : 'Paused'}/>
            <Item label="Remaining" value={<><span className="mono tnum">{monthlyRemaining}</span> service credits</>}/>
        </div>
    );
};
