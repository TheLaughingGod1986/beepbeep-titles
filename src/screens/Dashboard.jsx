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

/** Score band -> Ring/Pill tone shared across every card on this screen. */
const toneForStatus = ( status ) => {
    switch ( status ) {
        case 'excellent': return 'ok';
        case 'good': return 'ok';
        case 'fair': return 'warn';
        case 'needs-improvement': return 'warn';
        case 'critical': return 'danger';
        default: return 'primary';
    }
};

const SEVERITY_DOT = {
    critical: '\u{1F534}',    // red circle
    warning: '\u{1F7E0}',     // orange circle
    review: '\u{1F7E1}',      // yellow circle
    information: '\u26AA',    // white circle
};

/** Turn a machine issue code + count into the action-driven copy the spec asks for. */
const actionCopy = ( issue ) => {
    const count = issue.count;
    const plural = count === 1 ? '' : 's';
    switch ( issue.code ) {
        case 'missing_title':
            return `Fix ${count} missing title${plural}`;
        case 'missing_description':
            return `Fix ${count} missing description${plural}`;
        case 'duplicate_title':
            return `Improve ${count} duplicate title${plural}`;
        case 'duplicate_description':
            return `Improve ${count} duplicate description${plural}`;
        case 'title_too_short':
        case 'title_too_long':
            return `Improve ${count} title${plural} that may be truncated`;
        case 'description_too_short':
        case 'description_too_long':
            return `Improve ${count} description${plural} that may be truncated`;
        case 'generic_title':
            return `Improve ${count} generic title${plural}`;
        case 'generic_description':
            return `Improve ${count} generic description${plural}`;
        case 'excessive_punctuation':
            return `Review ${count} title${plural} with heavy punctuation`;
        case 'repeated_words':
        case 'description_repetition':
            return `Review ${count} item${plural} with repeated words`;
        case 'unresolved_placeholder':
            return `Fix ${count} broken placeholder${plural}`;
        default:
            return `Improve ${count} item${plural}`;
    }
};

const ISSUE_TITLES = {
    missing_title: 'Missing SEO title',
    missing_description: 'Missing meta description',
    duplicate_title: 'Duplicate titles',
    duplicate_description: 'Duplicate meta descriptions',
    title_too_short: 'Titles too short',
    title_too_long: 'Titles may be truncated',
    description_too_short: 'Descriptions too short',
    description_too_long: 'Descriptions may be truncated',
    generic_title: 'Generic titles',
    generic_description: 'Generic descriptions',
    excessive_punctuation: 'Heavy punctuation in titles',
    repeated_words: 'Repeated words in titles',
    description_repetition: 'Repeated words in descriptions',
    unresolved_placeholder: 'Unresolved placeholders',
};

export const Dashboard = ({
    quota, quotaReady, stats, activity, queuePages, autoOptimise, onAutoToggle, onGenerate, onUpgrade, onView, altTextCompanion,
    health, healthReady, previousScore, priorities,
    onQuickScan, onFullScan, onOptimiseCritical, onOptimiseIssue, onLoadIssueItems, onOptimiseSingleItem, onUndo,
}) => {
    const dailyUsed = quota?.daily_used || 0;
    const dailyLimit = quota?.daily_limit || QUOTA_DEFAULTS.daily_limit;
    const monthlyUsed = quota?.monthly_used || 0;
    const monthlyLimit = quota?.monthly_limit || QUOTA_DEFAULTS.monthly_limit;
    const hasDailyLimit  = ( quota?.daily_limit ?? null ) !== null; // backend has no daily cap on the shared wallet
    const monthlyRemaining = Math.max( 0, monthlyLimit - monthlyUsed );
    const dailyRemaining = hasDailyLimit ? ( quota?.daily_remaining ?? ( dailyLimit - dailyUsed ) ) : monthlyRemaining;
    const creditsRemaining = hasDailyLimit ? dailyRemaining : monthlyRemaining;
    const streak = stats?.streak || 0;

    const total      = stats?.total      || 0;
    const optimised  = stats?.optimised  || 0;
    const newSince   = stats?.new_since_last_visit || 0;

    const topPriorities = ( priorities || [] ).slice( 0, 5 );

    return (
        <PageShell style={{ paddingTop: 24, paddingBottom: 48 }}>
            <TodaysPriorities
                ready={healthReady}
                priorities={topPriorities.slice( 0, 3 )}
                estimatedGain={health?.score != null ? Math.min( 100 - health.score, topPriorities.slice( 0, 3 ).reduce( ( sum, p ) => sum + p.estimated_gain, 0 ) ) : 0}
                onReview={() => onView && onView( 'library' )}
            />

            <HeroScoreCard
                ready={healthReady}
                health={health}
                previousScore={previousScore}
                creditsRemaining={creditsRemaining}
                onQuickScan={onQuickScan}
                onFullScan={onFullScan}
                onOptimiseCritical={onOptimiseCritical}
            />

            <SummaryCardsRow ready={healthReady} health={health} priorities={priorities || []}/>

            <PriorityActionCentre
                ready={healthReady}
                priorities={topPriorities}
                onOptimiseIssue={onOptimiseIssue}
                onLoadIssueItems={onLoadIssueItems}
                onOptimiseSingleItem={onOptimiseSingleItem}
                onViewAll={() => onView && onView( 'library' )}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 14, marginTop: 20, alignItems: 'stretch' }}>
                <RecentProgressCard
                    health={health}
                    previousScore={previousScore}
                    optimisedThisWeek={health?.optimised_this_week || 0}
                />
                <AutopilotActiveCard autoOptimise={autoOptimise} onToggle={onAutoToggle}/>
            </div>

            <CompanionBanner companion={altTextCompanion}/>
            <ActivityStrip onView={onView} newSince={newSince} activity={activity} onUndo={onUndo}/>
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

// ── Today's Priorities — the very first thing a returning user sees ────
const TodaysPriorities = ({ ready, priorities, estimatedGain, onReview }) => {
    if ( ! ready ) {
        return (
            <Card padding={0} style={{ marginBottom: 14 }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="pulse-dot" style={{ width: 8, height: 8, background: 'var(--text-3)' }}/>
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Checking today's priorities…</span>
                </div>
            </Card>
        );
    }

    if ( ! priorities.length ) {
        return (
            <Card padding={0} style={{ marginBottom: 14 }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name="check" size={16} style={{ color: 'var(--ok-ink)' }}/>
                    <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                        <strong style={{ color: 'var(--text)' }}>No priorities today.</strong> Everything OptiAI has scanned looks healthy.
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card padding={0} style={{ marginBottom: 14, borderColor: 'var(--border-strong)' }}>
            <div style={{ padding: '14px 18px 12px' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Today's Priorities
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {priorities.map( ( p ) => (
                        <div key={p.code} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text)' }}>
                            <span aria-hidden="true">{SEVERITY_DOT[ p.severity ] || SEVERITY_DOT.information}</span>
                            <span>{actionCopy( p )}</span>
                        </div>
                    ) )}
                </div>
                {estimatedGain > 0 && (
                    <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-2)' }}>
                        Estimated Health Improvement: <strong style={{ color: 'var(--ok-ink)' }}>+{estimatedGain} points</strong>
                    </div>
                )}
            </div>
            <div style={{ borderTop: '1px solid var(--hairline)', padding: '9px 18px', background: 'var(--surface-2)' }}>
                <button onClick={onReview} style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                    See what OptiAI found today &rarr;
                </button>
            </div>
        </Card>
    );
};

// ── Hero Score — the single largest element on the page ────────────────
const HeroScoreCard = ({ ready, health, previousScore, creditsRemaining, onQuickScan, onFullScan, onOptimiseCritical }) => {
    const [scanning, setScanning] = useState( null ); // 'quick' | 'full' | 'critical' | null
    const score = health?.score ?? 0;
    const animScore = useCountUp( ready ? score : 0 );
    const tone = toneForStatus( health?.status );
    const trend = health?.trend ?? ( previousScore != null && health ? health.score - previousScore : null );
    const lastScanned = health?.last_scanned_at
        ? new Date( health.last_scanned_at.replace( ' ', 'T' ) ).toLocaleDateString( undefined, { month: 'short', day: 'numeric' } )
        : 'Never';

    const run = ( kind, fn ) => async () => {
        setScanning( kind );
        try { await fn?.(); } finally { setScanning( null ); }
    };

    return (
        <Card padding={0}>
            <div style={{ padding: '22px 24px 18px', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <Ring value={ready ? animScore : 0} size={104} stroke={9} tone={tone}>
                    <div style={{ textAlign: 'center' }}>
                        <div className="mono tnum" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
                            {ready ? animScore : '\u2013'}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>/ 100</div>
                    </div>
                </Ring>
                <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                        Metadata Health
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                        <Pill tone={tone}>{ready ? ( health?.label || '\u2013' ) : 'Checking\u2026'}</Pill>
                        {ready && trend != null && trend !== 0 && (
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: trend > 0 ? 'var(--ok-ink)' : 'var(--danger-ink)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Icon name={trend > 0 ? 'trend' : 'chevron-down'} size={12}/>
                                {trend > 0 ? '+' : ''}{trend} since last scan
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-2)' }}>
                        <span><strong className="mono tnum" style={{ color: 'var(--text)' }}>{ready ? ( health?.items_scanned ?? 0 ) : '\u2013'}</strong> items scanned</span>
                        <span><strong className="mono tnum" style={{ color: 'var(--danger-ink)' }}>{ready ? ( health?.critical_issues ?? 0 ) : '\u2013'}</strong> critical issues</span>
                        <span><strong className="mono tnum" style={{ color: 'var(--text)' }}>{creditsRemaining}</strong> credits remaining</span>
                        <span>Last scan <strong style={{ color: 'var(--text)' }}>{ready ? lastScanned : '\u2013'}</strong></span>
                    </div>
                </div>
            </div>
            <div style={{ borderTop: '1px solid var(--hairline)', padding: '12px 24px', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'var(--surface-2)' }}>
                <Button variant="secondary" size="md" icon="refresh" onClick={run( 'quick', onQuickScan )} disabled={scanning !== null}>
                    {scanning === 'quick' ? 'Scanning\u2026' : 'Quick Scan'}
                </Button>
                <Button variant="primary" size="md" icon="zap" onClick={run( 'critical', onOptimiseCritical )} disabled={scanning !== null || ! ( health?.critical_issues > 0 )}>
                    Optimise Critical Issues
                </Button>
                <Button variant="secondary" size="md" icon="search" onClick={run( 'full', onFullScan )} disabled={scanning !== null}>
                    {scanning === 'full' ? 'Scanning\u2026' : 'Run Full Scan'}
                </Button>
            </div>
        </Card>
    );
};

// ── Summary Cards ────────────────────────────────────────────────────
const findIssue = ( priorities, code ) => priorities.find( p => p.code === code );

const SummaryCardsRow = ({ ready, health, priorities }) => {
    const byStatus = health?.by_status || {};
    const missingTitles = findIssue( priorities, 'missing_title' )?.count || 0;
    const missingDescriptions = findIssue( priorities, 'missing_description' )?.count || 0;
    const duplicateMetadata = ( findIssue( priorities, 'duplicate_title' )?.count || 0 ) + ( findIssue( priorities, 'duplicate_description' )?.count || 0 );
    const weakMetadataCodes = [ 'title_too_short', 'title_too_long', 'description_too_short', 'description_too_long', 'generic_title', 'generic_description' ];
    const weakMetadata = weakMetadataCodes.reduce( ( sum, code ) => sum + ( findIssue( priorities, code )?.count || 0 ), 0 );

    const cards = [
        { label: 'Pages Scanned', value: health?.items_scanned ?? 0, tone: 'neutral' },
        { label: 'Missing Titles', value: missingTitles, tone: missingTitles > 0 ? 'danger' : 'ok' },
        { label: 'Missing Descriptions', value: missingDescriptions, tone: missingDescriptions > 0 ? 'danger' : 'ok' },
        { label: 'Duplicate Metadata', value: duplicateMetadata, tone: duplicateMetadata > 0 ? 'warn' : 'ok' },
        { label: 'Weak Metadata', value: weakMetadata, tone: weakMetadata > 0 ? 'warn' : 'ok' },
        { label: 'Excellent Pages', value: byStatus.excellent || 0, tone: 'ok' },
        { label: 'AI Search Readiness', value: 'Coming soon', tone: 'neutral', muted: true },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 14 }}>
            {cards.map( ( c ) => (
                <Card key={c.label} padding={0}>
                    <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
                        <div
                            className={typeof c.value === 'number' ? 'mono tnum' : ''}
                            style={{
                                fontSize: typeof c.value === 'number' ? 22 : 13,
                                fontWeight: typeof c.value === 'number' ? 700 : 500,
                                letterSpacing: '-0.02em',
                                color: c.muted ? 'var(--text-3)' : c.tone === 'danger' ? 'var(--danger-ink)' : c.tone === 'warn' ? 'var(--warn-ink)' : c.tone === 'ok' ? 'var(--ok-ink)' : 'var(--text)',
                            }}
                        >
                            {! ready && typeof c.value === 'number' ? '\u2013' : c.value}
                        </div>
                    </div>
                </Card>
            ) )}
        </div>
    );
};

// ── Priority Action Centre — the heart of the dashboard ─────────────
const SEVERITY_LABEL = { critical: 'Critical', warning: 'High', review: 'Medium', information: 'Low' };
const SEVERITY_TONE  = { critical: 'danger', warning: 'warn', review: 'warn', information: 'neutral' };

const PriorityActionCentre = ({ ready, priorities, onOptimiseIssue, onLoadIssueItems, onOptimiseSingleItem, onViewAll }) => {
    const [expanded, setExpanded] = useState( null );
    const [items, setItems] = useState( [] );
    const [loadingItems, setLoadingItems] = useState( false );
    const [optimising, setOptimising] = useState( null );

    const toggleExpand = async ( code ) => {
        if ( expanded === code ) { setExpanded( null ); return; }
        setExpanded( code );
        setLoadingItems( true );
        const rows = await onLoadIssueItems?.( code, { limit: 20 } ) ?? [];
        setItems( rows );
        setLoadingItems( false );
    };

    const handleOptimiseAll = async ( code ) => {
        setOptimising( code );
        try { await onOptimiseIssue?.( code ); } finally { setOptimising( null ); }
    };

    return (
        <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Priority Action Centre
                </div>
                <button onClick={onViewAll} style={{ background: 'transparent', border: 'none', fontSize: 12, color: 'var(--text-2)', fontWeight: 600, cursor: 'pointer' }}>
                    Advanced Library &rarr;
                </button>
            </div>

            {! ready ? (
                <Card padding={16}><div style={{ fontSize: 13, color: 'var(--text-3)' }}>{'Checking for issues\u2026'}</div></Card>
            ) : ! priorities.length ? (
                <Card padding={16}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon name="check" size={18} style={{ color: 'var(--ok-ink)' }}/>
                        <div style={{ fontSize: 13.5, color: 'var(--text-2)' }}><strong style={{ color: 'var(--text)' }}>Nothing needs attention.</strong> Every scanned page looks healthy.</div>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {priorities.map( ( p ) => {
                        const isOpen = expanded === p.code;
                        return (
                            <Card key={p.code} padding={0}>
                                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                                    <Pill tone={SEVERITY_TONE[ p.severity ] || 'neutral'} style={{ flexShrink: 0 }}>
                                        {SEVERITY_LABEL[ p.severity ] || 'Info'}
                                    </Pill>
                                    <div style={{ flex: 1, minWidth: 220 }}>
                                        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                                            {actionCopy( p )}
                                        </div>
                                        <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{p.message}</div>
                                        {p.estimated_gain > 0 && (
                                            <div style={{ fontSize: 12, color: 'var(--ok-ink)', fontWeight: 600, marginTop: 4 }}>
                                                Estimated improvement: +{p.estimated_gain} score
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                        <Button variant="secondary" size="sm" onClick={() => toggleExpand( p.code )}>
                                            {isOpen ? 'Hide' : 'Review'}
                                        </Button>
                                        <Button variant="primary" size="sm" icon="zap" onClick={() => handleOptimiseAll( p.code )} disabled={optimising !== null}>
                                            {optimising === p.code ? 'Queuing\u2026' : 'Optimise All'}
                                        </Button>
                                    </div>
                                </div>
                                {isOpen && (
                                    <div style={{ borderTop: '1px solid var(--hairline)', background: 'var(--surface-2)', padding: '10px 16px' }}>
                                        {loadingItems ? (
                                            <div style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '8px 0' }}>{'Loading affected items\u2026'}</div>
                                        ) : ! items.length ? (
                                            <div style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '8px 0' }}>No items found for this issue.</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {items.map( ( item ) => (
                                                    <div key={item.site_item_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', borderRadius: 'var(--r-md)' }}>
                                                        <PageAvatar type={item.item_type} section="" hue={( Number( item.site_item_id ) * 47 ) % 360} size={28}/>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {item.post_title || `#${item.site_item_id}`}
                                                            </div>
                                                        </div>
                                                        <span className="mono tnum" style={{ fontSize: 11.5, color: 'var(--text-3)', flexShrink: 0 }}>Score {item.score}</span>
                                                        <Button variant="secondary" size="sm" onClick={() => onOptimiseSingleItem?.( item )}>Optimise</Button>
                                                    </div>
                                                ) )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    } )}
                </div>
            )}
        </div>
    );
};

// ── Recent Progress — celebrate improvement, not just show numbers ──
const RecentProgressCard = ({ health, previousScore, optimisedThisWeek }) => {
    const hasDelta = previousScore != null && health?.score != null && previousScore !== health.score;
    return (
        <Card padding={0} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hairline)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recent Progress</div>
            </div>
            <div style={{ padding: '16px 18px', flex: 1 }}>
                {hasDelta ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span className="mono tnum" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-3)', textDecoration: 'line-through', opacity: 0.6 }}>{previousScore}</span>
                        <Icon name="arrow-right" size={16} style={{ color: 'var(--ok-ink)' }}/>
                        <span className="mono tnum" style={{ fontSize: 24, fontWeight: 700, color: 'var(--ok-ink)' }}>{health.score}</span>
                        <span style={{ fontSize: 12.5, color: 'var(--ok-ink)', fontWeight: 600 }}>Health Score improved</span>
                    </div>
                ) : (
                    <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>Keep optimising to see your score climb here.</div>
                )}
                <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                    <strong className="mono tnum" style={{ color: 'var(--text)' }}>{optimisedThisWeek}</strong> item{optimisedThisWeek === 1 ? '' : 's'} improved this week
                </div>
            </div>
        </Card>
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
                        <Pill tone="neutral" style={{ padding: '1px 8px', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>From OptiAI</Pill>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        The same shared credit pool powers <strong style={{ color: 'var(--text)', fontWeight: 600 }}>OptiAI Alt Text</strong> — continuously health-check and improve your media library. No extra subscription.
                    </div>
                </div>
                <Button variant="secondary" size="md" icon={icon} onClick={openCompanion} disabled={!url}>{label}</Button>
            </div>
        </Card>
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

const AutopilotActiveCard = ({ autoOptimise, onToggle }) => (
    <Card padding={0}>
        <div style={{ padding: '18px 22px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Continuous Optimisation</div>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{autoOptimise ? 'Running in the background.' : 'Paused.'}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>
                    {autoOptimise ? 'New pages are scanned, scored, and optimised automatically as they publish.' : 'Enable continuous optimisation for newly published pages.'}
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
    generated: { icon: 'sparkles', tone: 'primary', verb: 'Optimised title & meta for' },
    auto:      { icon: 'zap',      tone: 'ok',      verb: 'Continuous optimisation improved' },
    edited:    { icon: 'edit',     tone: 'primary', verb: 'Edited' },
};

const ActivityStrip = ({ onView, newSince, activity, onUndo }) => {
    const [undoing, setUndoing] = useState( null );
    const real = ( activity || [] ).map( ( e ) => {
        const kind  = ACTIVITY_KINDS[ e.kind ] || ACTIVITY_KINDS.edited;
        const title = e.title?.trim() || 'Untitled';
        const canUndo = onUndo && e.post_id && ( e.kind === 'generated' || e.kind === 'auto' );
        return {
            time: e.ago || '', icon: kind.icon, tone: kind.tone, text: `${kind.verb} “${title}”`,
            action: canUndo ? ( undoing === e.post_id ? 'Undoing…' : 'Undo' ) : null,
            onAction: canUndo ? () => { setUndoing( e.post_id ); Promise.resolve( onUndo( e.post_id ) ).finally( () => setUndoing( null ) ); } : null,
        };
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
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '4px 0' }}>No improvements yet — optimise titles & meta to see activity here.</div>
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
            <Item label="Continuous Optimisation" value={autoOptimise ? 'Enabled' : 'Paused'}/>
            <Item label="Remaining" value={<><span className="mono tnum">{monthlyRemaining}</span> service credits</>}/>
        </div>
    );
};
