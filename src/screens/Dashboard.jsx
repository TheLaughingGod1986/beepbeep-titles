import { Icon, Card, Button, Progress } from '../components';
import { QUOTA_DEFAULTS } from '../quota';

const MINUTES_PER_PAGE = 3;
const MILESTONE_75 = 75;

const weeklyPagesImproved = ( activity, total ) => {
    if ( ! total ) return 0;
    const weekAgo = Math.floor( Date.now() / 1000 ) - 7 * 86400;
    const unique = new Set(
        ( activity || [] )
            .filter( e => ( e.time || 0 ) >= weekAgo && [ 'generated', 'edited', 'auto' ].includes( e.kind ) )
            .map( e => e.post_id )
    );
    return unique.size;
};

const pageLabel = ( pg ) => {
    const raw = pg.title?.trim() || pg.url?.replace( /^\//, '' ) || 'Page';
    return raw.length > 36 ? `${ raw.slice( 0, 36 ) }…` : raw;
};

const opportunityLabel = ( pg ) => {
    const name = pageLabel( pg );
    switch ( pg.status ) {
        case 'missing-title': return `${ name } missing title`;
        case 'missing-meta':  return `${ name } missing description`;
        case 'missing-both':  return `${ name } missing title and description`;
        default:              return `${ name } needs review`;
    }
};

const activitySummary = ( e ) => {
    const title = e.title?.trim() || 'Page';
    const short = title.length > 40 ? `${ title.slice( 0, 40 ) }…` : title;
    switch ( e.kind ) {
        case 'generated': return `${ short } metadata generated`;
        case 'auto':      return `${ short } — autopilot optimised`;
        case 'edited':    return `${ short } metadata updated`;
        default:          return `${ short } reviewed`;
    }
};

export const Dashboard = ({ quota, quotaReady, stats, activity, queuePages, autoOptimise, onAutoToggle, onUpgrade, onView }) => {
    const plan = quota?.plan || 'free';
    const monthlyUsed = quota?.monthly_used || 0;
    const monthlyLimit = quota?.monthly_limit || QUOTA_DEFAULTS.monthly_limit;
    const hasDailyLimit = ( quota?.daily_limit ?? null ) !== null;
    const monthlyRemaining = Math.max( 0, monthlyLimit - monthlyUsed );
    const dailyRemaining = hasDailyLimit ? ( quota?.daily_remaining ?? ( ( quota?.daily_limit || QUOTA_DEFAULTS.daily_limit ) - ( quota?.daily_used || 0 ) ) ) : monthlyRemaining;
    const creditsRemaining = hasDailyLimit ? dailyRemaining : monthlyRemaining;
    const creditsExhausted = quotaReady && creditsRemaining <= 0;
    const autopilotLocked = plan === 'free';

    const total     = stats?.total || 0;
    const optimised = stats?.optimised || 0;
    const coverage  = stats?.coverage ?? ( total > 0 ? Math.round( ( optimised / total ) * 100 ) : 0 );
    const needsAttn = stats?.needs_attention || 0;
    const remaining = Math.max( 0, total - optimised );
    const minutesSaved = optimised * MINUTES_PER_PAGE;
    const weekGain = weeklyPagesImproved( activity, total );
    const healthLabel = coverage >= 75 ? 'Good' : coverage > 0 ? 'Improving' : 'Getting started';
    const ready = quotaReady && stats != null;

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1080, margin: '0 auto' }}>
            <StatusBanner
                ready={ready}
                needsAttn={needsAttn}
                total={total}
                creditsRemaining={creditsRemaining}
                minutesSaved={minutesSaved}
                creditsExhausted={creditsExhausted}
                onView={onView}
                onUpgrade={onUpgrade}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginTop: 16 }}>
                <MetricCard
                    label="SEO health"
                    value={ready ? `${ coverage }%` : '—'}
                    foot={healthLabel}
                />
                <MetricCard
                    label="Pages improved"
                    value={ready ? String( optimised ) : '—'}
                    foot={weekGain > 0 ? `+${ weekGain } this week` : optimised > 0 ? 'All time' : 'None yet'}
                />
                <MetricCard
                    label="Credits remaining"
                    value={ready ? String( creditsRemaining ) : '—'}
                    foot={ready
                        ? creditsRemaining > 0
                            ? `${ monthlyRemaining } left this cycle`
                            : `Used ${ monthlyUsed } of ${ monthlyLimit }`
                        : 'Loading…'}
                    tone={creditsExhausted ? 'warn' : 'default'}
                />
            </div>

            <TopOpportunitiesCard
                queuePages={queuePages}
                needsAttn={needsAttn}
                ready={ready}
                onView={onView}
            />

            <CoverageCard total={total} optimised={optimised} remaining={remaining}/>

            <RecentActivity activity={activity}/>

            <UsageCard
                monthlyUsed={monthlyUsed}
                monthlyLimit={monthlyLimit}
                creditsExhausted={creditsExhausted}
                onUpgrade={onUpgrade}
            />

            <AutopilotCompactCard
                autoOptimise={autoOptimise}
                autopilotLocked={autopilotLocked}
                onToggle={onAutoToggle}
                onUpgrade={onUpgrade}
            />
        </div>
    );
};

const StatusBanner = ({ ready, needsAttn, total, creditsRemaining, minutesSaved, creditsExhausted, onView, onUpgrade }) => (
    <Card padding={0}>
        <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                    {! ready
                        ? 'Loading dashboard…'
                        : needsAttn > 0
                            ? <><span className="mono tnum">{needsAttn}</span> page{needsAttn === 1 ? '' : 's'} need attention</>
                            : 'No pages need attention'}
                </h1>
                <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {needsAttn > 0
                        ? <><span className="mono tnum">{needsAttn}</span> metadata opportunit{needsAttn === 1 ? 'y is' : 'ies are'} waiting for review.</>
                        : 'Your library metadata is up to date.'}
                </p>
                {ready && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', fontSize: 13, color: 'var(--text-2)' }}>
                        <StatInline label="Pages scanned" value={total}/>
                        <StatInline label="Credits remaining" value={creditsRemaining} tone={creditsExhausted ? 'warn' : undefined}/>
                        <StatInline label="Time saved" value={`${ minutesSaved } mins`}/>
                    </div>
                )}
                {creditsExhausted && needsAttn > 0 && (
                    <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--warn-ink)', lineHeight: 1.45 }}>
                        Out of credits. Upgrade to continue generating metadata.
                    </p>
                )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                <Button variant="primary" size="md" icon="library" onClick={() => onView?.( 'library' )}>Open Library</Button>
                {creditsExhausted && (
                    <Button variant="secondary" size="md" icon="crown" onClick={onUpgrade}>Upgrade Plan</Button>
                )}
            </div>
        </div>
    </Card>
);

const StatInline = ({ label, value, tone }) => (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ color: 'var(--text-3)' }}>{label}</span>
        <span className="mono tnum" style={{ fontWeight: 600, color: tone === 'warn' ? 'var(--warn-ink)' : 'var(--text)' }}>{value}</span>
    </span>
);

const MetricCard = ({ label, value, foot, tone = 'default' }) => (
    <Card padding={0} style={{ padding: '16px 18px 14px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
        <div className="mono tnum" style={{
            fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1,
            color: tone === 'warn' ? 'var(--warn-ink)' : 'var(--text)',
        }}>{value}</div>
        <div style={{ fontSize: 12.5, color: tone === 'warn' ? 'var(--warn-ink)' : 'var(--text-3)', marginTop: 6 }}>{foot}</div>
    </Card>
);

const TopOpportunitiesCard = ({ queuePages, needsAttn, ready, onView }) => {
    const items = ( queuePages || [] ).slice( 0, 3 );
    const extra = Math.max( 0, needsAttn - items.length );

    return (
        <Card padding={0} style={{ marginTop: 16 }}>
            <div style={{ padding: '18px 20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>Top opportunities</h2>
                    <Button variant="secondary" size="sm" icon="library" onClick={() => onView?.( 'library' )}>Open Library</Button>
                </div>
                {! ready ? (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>Loading opportunities…</p>
                ) : needsAttn > 0 && items.length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {items.map( ( pg, i ) => (
                            <li key={pg.id || i} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 0',
                                borderTop: i ? '1px solid var(--hairline)' : 'none',
                                fontSize: 13.5, color: 'var(--text)',
                            }}>
                                <Icon name="alert" size={14} style={{ color: 'var(--warn-ink)', flexShrink: 0 }}/>
                                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opportunityLabel( pg )}</span>
                            </li>
                        ) )}
                        {extra > 0 && (
                            <li style={{ padding: '10px 0', borderTop: '1px solid var(--hairline)', fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>
                                +{extra} more page{extra === 1 ? '' : 's'}
                            </li>
                        )}
                    </ul>
                ) : (
                    <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        No pages need attention right now. Open the Library to review or generate metadata.
                    </p>
                )}
            </div>
        </Card>
    );
};

const CoverageCard = ({ total, optimised, remaining }) => {
    const pct = total > 0 ? Math.round( ( optimised / total ) * 100 ) : 0;
    const tone = pct >= 90 ? 'ok' : 'primary';

    return (
        <Card padding={0} style={{ marginTop: 16 }}>
            <div style={{ padding: '16px 20px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span className="mono tnum" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>{pct}%</span>
                        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>optimised</span>
                    </div>
                    <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                        <span className="mono tnum" style={{ color: 'var(--text-2)', fontWeight: 500 }}>{optimised}</span> pages completed
                        <span> · </span>
                        <span className="mono tnum" style={{ color: 'var(--text-2)', fontWeight: 500 }}>{remaining}</span> pages remaining
                    </span>
                </div>
                <div style={{ position: 'relative', paddingBottom: 18 }}>
                    <Progress value={optimised} max={Math.max( total, 1 )} tone={tone} height={6}/>
                    {total > 0 && (
                        <div style={{
                            position: 'absolute', top: 0, bottom: 18,
                            left: `${ Math.min( 100, MILESTONE_75 ) }%`,
                            transform: 'translateX(-50%)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            pointerEvents: 'none',
                        }}>
                            <div style={{ width: 2, height: 10, background: 'var(--border-strong)', borderRadius: 1, marginTop: -1 }}/>
                            <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginTop: 4, whiteSpace: 'nowrap' }}>{MILESTONE_75}% Goal</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

const RecentActivity = ({ activity, onView }) => {
    const events = ( activity || [] ).map( e => ( {
        time: e.ago || '',
        icon: e.kind === 'auto' ? 'zap' : e.kind === 'generated' ? 'sparkles' : 'edit',
        tone: e.kind === 'auto' ? 'ok' : 'primary',
        text: activitySummary( e ),
    } ) );

    return (
        <Card padding={0} style={{ marginTop: 16 }}>
            <div style={{ padding: '16px 20px' }}>
                <h2 style={{ margin: '0 0 12px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>Recent activity</h2>
                {events.length === 0 ? (
                    <div>
                        <p style={{ margin: '0 0 4px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
                            Your optimisation history will appear here.
                        </p>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.45 }}>
                            Generate metadata to start tracking activity.
                        </p>
                    </div>
                ) : (
                    <div>
                        {events.map( ( e, i ) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 9,
                                padding: '8px 0',
                                borderTop: i ? '1px solid var(--hairline)' : 'none',
                            }}>
                                <div style={{
                                    width: 16, height: 16, borderRadius: 999, flexShrink: 0,
                                    background: e.tone === 'ok' ? 'var(--ok-soft)' : 'var(--primary-soft)',
                                    color: e.tone === 'ok' ? 'var(--ok-ink)' : 'var(--primary-ink)',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon name={e.icon} size={9} strokeWidth={2.4}/>
                                </div>
                                <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.text}</span>
                                <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{e.time}</span>
                            </div>
                        ) )}
                    </div>
                )}
            </div>
        </Card>
    );
};

const UsageCard = ({ monthlyUsed, monthlyLimit, creditsExhausted, onUpgrade }) => {
    const tone = creditsExhausted ? 'warn' : monthlyUsed / Math.max( monthlyLimit, 1 ) >= 0.8 ? 'warn' : 'primary';

    return (
        <Card padding={0} style={{ marginTop: 16 }}>
            <div style={{ padding: '14px 20px 16px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Credits used</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                        <span className="mono tnum">{monthlyUsed}</span>
                        {' / '}
                        <span className="mono tnum">{monthlyLimit}</span>
                    </div>
                    <Progress value={Math.min( monthlyUsed, monthlyLimit )} max={monthlyLimit} tone={tone} height={6}/>
                    {creditsExhausted && (
                        <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--warn-ink)', lineHeight: 1.45 }}>
                            You&apos;ve used all available credits this cycle.
                        </p>
                    )}
                </div>
                {creditsExhausted && (
                    <Button variant="secondary" size="sm" icon="crown" onClick={onUpgrade}>Upgrade Plan</Button>
                )}
            </div>
        </Card>
    );
};

const AutopilotCompactCard = ({ autoOptimise, autopilotLocked, onToggle, onUpgrade }) => {
    const enabled = ! autopilotLocked && autoOptimise;

    return (
        <Card padding={0} style={{ marginTop: 16 }}>
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Autopilot</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {enabled ? 'Enabled' : 'Disabled'}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.45 }}>
                        Automatically generate metadata for new pages.
                    </p>
                </div>
                {autopilotLocked ? (
                    <Button variant="secondary" size="sm" icon="zap" onClick={onUpgrade}>Enable Autopilot</Button>
                ) : (
                    <SmallToggle on={autoOptimise} onChange={() => onToggle( ! autoOptimise )}/>
                )}
            </div>
        </Card>
    );
};

const SmallToggle = ({ on, onChange, disabled }) => (
    <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        aria-pressed={on}
        style={{
            width: 34, height: 20, borderRadius: 999,
            background: on ? 'var(--primary)' : 'var(--bg-sunken)',
            border: `1px solid ${ on ? 'var(--primary)' : 'var(--border-strong)' }`,
            position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background .15s, border-color .15s', padding: 0, flexShrink: 0,
        }}
    >
        <span style={{
            position: 'absolute', top: 2, left: on ? 16 : 2,
            width: 14, height: 14, borderRadius: 999, background: '#fff',
            transition: 'left .15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}/>
    </button>
);
