import { Icon, Card, Button, Progress, Ring } from '../components';

/* BeepBeep Titles — signed-out "Title & Meta Description Audit".
   A conversion surface shown in place of the dashboard when no license is
   connected: it previews the value of the product (audit KPIs, SERP +
   CTR findings, time saved, before/after, Autopilot) and drives the user
   to connect their license in Settings.

   Ported from the BeepBeep AI (ALT text) audit signed-out screen in the
   Claude Design handoff, adapted to titles & meta descriptions and the
   titles plugin's license-key auth model. */

const EST_GAIN = '12–18%';

export const AuditSignedOutScreen = ({ stats, onConnect, onHelp }) => {
    const total        = Math.max( 0, stats?.total ?? 0 );
    const optimised    = Math.max( 0, stats?.optimised ?? 0 );
    const missingTitle = Math.max( 0, stats?.missing_title ?? 0 );
    const missingMeta  = Math.max( 0, stats?.missing_meta ?? 0 );
    const fixCount     = Math.max( 0, stats?.needs_attention ?? 0 );
    const coverage     = Math.max( 0, Math.min( 100, stats?.coverage ?? ( total > 0 ? Math.round( ( optimised / total ) * 100 ) : 0 ) ) );

    const ctrRisk  = coverage >= 95 ? 'Low' : ( coverage >= 50 ? 'Medium' : 'High' );
    const ringTone = coverage >= 95 ? 'ok' : ( coverage >= 50 ? 'warn' : 'danger' );

    // Manual effort estimate: ~2 minutes to research + write a title/meta pair.
    const manualMinutes = Math.ceil( fixCount * 2 );
    const savedMinutes  = Math.max( 0, manualMinutes - 1 );

    return (
        <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 32px - 52px)' }}>
            <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 32px 72px' }}>

                {/* Header row — brand + signed-out badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon name="logo" size={24} style={{ color: 'var(--primary-strong)' }}/>
                        <span style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.015em' }}>BeepBeep Titles</span>
                        <span aria-hidden="true" style={{ width: 1, height: 12, background: 'var(--border-strong)', opacity: 0.7 }}/>
                        <span style={{ fontSize: 11.5, color: 'var(--text-3)', letterSpacing: '0.04em', fontWeight: 500 }}>Titles & Meta</span>
                    </div>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '4px 11px',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 999, fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600,
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--text-3)', opacity: 0.55 }}/>
                        Signed Out
                    </span>
                </div>

                {/* HERO — headline + CTAs, paired with the headline circular progress */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1.35fr 0.9fr', gap: 20, alignItems: 'stretch',
                    marginBottom: 16,
                }}>
                    <Card padding={0} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ padding: '32px 32px 30px' }}>
                            {fixCount > 0 ? (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 7,
                                    padding: '4px 11px', marginBottom: 16,
                                    background: 'var(--warn-soft)', border: '1px solid var(--warn-border)',
                                    borderRadius: 999, fontSize: 11.5, color: 'var(--warn-ink)', fontWeight: 600,
                                }}>
                                    <Icon name="alert" size={12}/> Audit complete · action needed
                                </span>
                            ) : (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 7,
                                    padding: '4px 11px', marginBottom: 16,
                                    background: 'var(--ok-soft)', border: '1px solid var(--ok-border)',
                                    borderRadius: 999, fontSize: 11.5, color: 'var(--ok-ink)', fontWeight: 600,
                                }}>
                                    <Icon name="check" size={12} strokeWidth={2.6}/> Audit complete
                                </span>
                            )}
                            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 10px' }}>
                                {fixCount > 0
                                    ? 'Your website has pages that need attention'
                                    : 'See your full title & meta description report'}
                            </h1>
                            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 22px', maxWidth: 460 }}>
                                {fixCount > 0 ? (
                                    <>
                                        Connect your license to see your full title & meta description report — and fix{' '}
                                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{fixCount} page{fixCount === 1 ? '' : 's'}</span> in minutes.
                                    </>
                                ) : (
                                    'Connect your license to see your full title & meta description report.'
                                )}
                            </p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <Button variant="primary" size="lg" icon="arrow-right" onClick={onConnect}>Connect license</Button>
                                <Button variant="secondary" size="lg" onClick={onHelp}>How it works</Button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
                                {['No credit card', 'Works with Yoast, Rank Math & AIOSEO', 'Set up in 1 minute'].map( ( t, i ) => (
                                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
                                        <Icon name="check" size={12} strokeWidth={2.6} style={{ color: 'var(--ok-ink)' }}/> {t}
                                    </span>
                                ) )}
                            </div>
                        </div>
                    </Card>

                    {/* Headline circular progress */}
                    <Card padding={0} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '26px 24px' }}>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>SEO coverage</div>
                        <Ring value={coverage} size={148} stroke={12} tone={ringTone}>
                            <span className="mono tnum" style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
                                {coverage}<span style={{ fontSize: 18, color: 'var(--text-3)' }}>%</span>
                            </span>
                        </Ring>
                        <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.45 }}>
                            {fixCount > 0 ? (
                                <>
                                    <span className="mono tnum" style={{ color: 'var(--danger-ink)', fontWeight: 600 }}>{fixCount} page{fixCount === 1 ? '' : 's'}</span> need{fixCount === 1 ? 's' : ''} attention
                                </>
                            ) : 'All pages covered'}
                        </div>
                    </Card>
                </div>

                {/* KPI ROW */}
                <SectionLabel>Website health overview</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
                    <KPICard label="SEO coverage" value={`${ coverage }%`} tone="warn" icon="shield" foot="Goal: 95%+"/>
                    <KPICard label="Pages optimised" value={String( optimised )} tone="ok" icon="check" foot={`of ${ total } total`}/>
                    <KPICard label="Missing meta descriptions" value={String( missingMeta )} tone="danger" icon="alert" foot="Google improvises a snippet"/>
                    <KPICard label="Missing SEO titles" value={String( missingTitle )} tone="primary" icon="trend" foot={`+${ EST_GAIN } CTR potential`}/>
                </div>

                {/* AUDIT CARDS — search appearance + CTR */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
                    <AuditCard
                        eyebrow="Search appearance"
                        title="SERP Overview"
                        icon="shield"
                        tone="danger"
                        callout={`${ missingMeta } page${ missingMeta === 1 ? '' : 's' } can't control how they appear in Google search results.`}
                        metrics={[
                            { label: 'Pages missing meta description', value: String( missingMeta ), tone: 'danger' },
                            { label: 'Pages missing SEO title', value: String( missingTitle ), tone: 'warn' },
                            { label: 'SEO coverage score', value: `${ coverage }%`, tone: 'warn' },
                            { label: 'CTR risk level', value: ctrRisk, tone: 'warn' },
                        ]}
                    />
                    <AuditCard
                        eyebrow="Organic traffic"
                        title="Click-Through Opportunity"
                        icon="trend"
                        tone="primary"
                        callout="AI-written titles and meta descriptions could improve click-through rates and how search engines understand your pages."
                        metrics={[
                            { label: 'Missing meta descriptions', value: String( missingMeta ), tone: 'danger' },
                            { label: 'Pages not optimised', value: String( fixCount ), tone: 'warn' },
                            { label: 'SERP readiness score', value: `${ coverage }%`, tone: 'primary' },
                            { label: 'Estimated improvement', value: EST_GAIN, tone: 'ok' },
                        ]}
                    />
                </div>

                {/* TIME SAVED + BEFORE/AFTER */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 14, marginBottom: 28 }}>
                    <TimeSavedCard fixCount={fixCount} manualMinutes={manualMinutes} savedMinutes={savedMinutes}/>
                    <BeforeAfterCard/>
                </div>

                {/* AUTOPILOT */}
                <Card padding={0} style={{ marginBottom: 28, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr' }}>
                        <div style={{ padding: '26px 28px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: 8,
                                    background: 'var(--primary-soft)', color: 'var(--primary-ink)',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}><Icon name="zap" size={16}/></div>
                                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Autopilot</span>
                            </div>
                            <h2 style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 16px', lineHeight: 1.2 }}>
                                Never write a title tag manually again
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 18px' }}>
                                {[
                                    'Write titles & meta automatically',
                                    'Improve click-through rates',
                                    'Match your brand voice',
                                    'Works on publish',
                                    'Review and approve changes',
                                    'Bulk generate existing pages',
                                ].map( ( t, i ) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--text)' }}>
                                        <span style={{
                                            width: 18, height: 18, borderRadius: 999, flexShrink: 0,
                                            background: 'var(--ok-soft)', border: '1px solid var(--ok-border)',
                                            color: 'var(--ok-ink)',
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        }}><Icon name="check" size={11} strokeWidth={3}/></span>
                                        {t}
                                    </div>
                                ) )}
                            </div>
                        </div>
                        {/* Progress visualization */}
                        <div style={{
                            borderLeft: '1px solid var(--hairline)',
                            background: 'var(--surface-2)',
                            padding: '26px 28px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                        }}>
                            <Ring value={coverage} size={120} stroke={10} tone={ringTone}>
                                <span className="mono tnum" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{coverage}%</span>
                            </Ring>
                            <div style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>SEO coverage</div>
                            <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{fixCount} page{fixCount === 1 ? '' : 's'} need{fixCount === 1 ? 's' : ''} attention</div>
                            <div style={{ width: '100%', marginTop: 16 }}>
                                <Progress value={optimised} max={Math.max( 1, total )} tone="ok" height={8}/>
                                <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{optimised} optimised</span>
                                    <span>{fixCount} remaining</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* FINAL CTA */}
                <Card padding={0} style={{
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #F3F7FE 0%, #EEF0FE 100%)',
                    borderColor: 'var(--primary-border)',
                }}>
                    <div style={{ padding: '34px 32px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', margin: '0 0 8px' }}>
                            {fixCount > 0
                                ? <>Fix <span className="tnum">{fixCount}</span> page{fixCount === 1 ? '' : 's'} in minutes</>
                                : 'Put your titles & meta on Autopilot'}
                        </h2>
                        <p style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 auto 22px', maxWidth: 520 }}>
                            Connect your license to generate titles & meta descriptions and unlock higher click-through rates.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button variant="primary" size="lg" icon="arrow-right" onClick={onConnect}>Connect license</Button>
                            <Button variant="secondary" size="lg" onClick={onHelp}>How it works</Button>
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
};

/* ── Section label ────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>{children}</div>
);

/* ── KPI card ─────────────────────────────────────────────────────── */
const KPICard = ({ label, value, tone, icon, foot }) => {
    const tones = {
        ok:      { soft: 'var(--ok-soft)',      ink: 'var(--ok-ink)',      bd: 'var(--ok-border)' },
        warn:    { soft: 'var(--warn-soft)',    ink: 'var(--warn-ink)',    bd: 'var(--warn-border)' },
        danger:  { soft: 'var(--danger-soft)',  ink: 'var(--danger-ink)',  bd: 'var(--danger-border)' },
        primary: { soft: 'var(--primary-soft)', ink: 'var(--primary-ink)', bd: 'var(--primary-border)' },
    };
    const t = tones[tone] || tones.primary;
    return (
        <Card padding={0} style={{ padding: '16px 16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, lineHeight: 1.3 }}>{label}</span>
                <span style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: t.soft, color: t.ink, border: `1px solid ${ t.bd }`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}><Icon name={icon} size={13}/></span>
            </div>
            <div className="mono tnum" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>{foot}</div>
        </Card>
    );
};

/* ── Audit card (SERP / CTR) ──────────────────────────────────────── */
const AuditCard = ({ eyebrow, title, icon, tone, callout, metrics }) => {
    const tones = {
        danger:  { soft: 'var(--danger-soft)',  ink: 'var(--danger-ink)',  bd: 'var(--danger-border)' },
        primary: { soft: 'var(--primary-soft)', ink: 'var(--primary-ink)', bd: 'var(--primary-border)' },
    };
    const t = tones[tone] || tones.primary;
    return (
        <Card padding={0} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: t.soft, color: t.ink, border: `1px solid ${ t.bd }`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}><Icon name={icon} size={17}/></span>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{eyebrow}</div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em', margin: 0, lineHeight: 1.25 }}>{title}</h3>
                </div>
            </div>

            {/* Callout */}
            <div style={{
                margin: '0 20px 14px',
                padding: '10px 12px',
                background: t.soft, border: `1px solid ${ t.bd }`, borderRadius: 'var(--r-md)',
                display: 'flex', gap: 9, alignItems: 'flex-start',
                fontSize: 12.5, color: t.ink, lineHeight: 1.45,
            }}>
                <Icon name={tone === 'danger' ? 'alert' : 'info'} size={14} style={{ flexShrink: 0, marginTop: 1 }}/>
                <span>{callout}</span>
            </div>

            {/* Metrics */}
            <div style={{ padding: '0 20px 16px', marginTop: 'auto' }}>
                {metrics.map( ( m, i ) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 0',
                        borderTop: '1px solid var(--hairline)',
                    }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{m.label}</span>
                        <MetricValue value={m.value} tone={m.tone}/>
                    </div>
                ) )}
            </div>
        </Card>
    );
};

const MetricValue = ({ value, tone }) => {
    const colors = {
        ok: 'var(--ok-ink)', warn: 'var(--warn-ink)', danger: 'var(--danger-ink)', primary: 'var(--primary-ink)',
    };
    return (
        <span className="mono tnum" style={{
            fontSize: 13, fontWeight: 600, color: colors[tone] || 'var(--text)',
            whiteSpace: 'nowrap',
        }}>{value}</span>
    );
};

/* ── Time saved comparison ────────────────────────────────────────── */
const TimeSavedCard = ({ fixCount, manualMinutes, savedMinutes }) => (
    <Card padding={0} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 6px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Time saved</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>
                <span className="mono tnum">{fixCount}</span> page{fixCount === 1 ? '' : 's'}, handled for you
            </h3>
        </div>
        <div style={{ padding: '12px 20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <CompareBar label="Manual process" value={`${ manualMinutes } minute${ manualMinutes === 1 ? '' : 's' }`} pct={100} tone="danger"/>
            <CompareBar label="With BeepBeep Titles" value="30 seconds" pct={6} tone="ok"/>
            <div style={{
                marginTop: 4, padding: '12px 14px',
                background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 'var(--r-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <span style={{ fontSize: 12.5, color: 'var(--ok-ink)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <Icon name="clock" size={14}/> Time saved
                </span>
                <span className="mono tnum" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ok-ink)' }}>{savedMinutes} min</span>
            </div>
        </div>
    </Card>
);

const CompareBar = ({ label, value, pct, tone }) => {
    const colors = { ok: 'var(--ok)', danger: 'var(--danger)' };
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
                <span className="mono tnum" style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 600 }}>{value}</span>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: 'var(--bg-sunken)', border: '1px solid var(--hairline)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ pct }%`, background: colors[tone], borderRadius: 999, transition: 'width .5s cubic-bezier(0.16,1,0.3,1)' }}/>
            </div>
        </div>
    );
};

/* ── Before / After example ───────────────────────────────────────── */
const BeforeAfterCard = () => (
    <Card padding={0} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 14px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>AI generated title & meta example</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>Before / After</h3>
        </div>
        <div style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Before */}
            <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon name="x" size={12} strokeWidth={2.6} style={{ color: 'var(--danger-ink)' }}/>
                    <span style={{ fontSize: 10.5, color: 'var(--danger-ink)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Before</span>
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>Sample Page – mysite.com</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.5 }}>meta description: (empty)</div>
            </div>
            {/* After */}
            <div style={{ padding: '10px 12px', background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon name="check" size={12} strokeWidth={2.6} style={{ color: 'var(--ok-ink)' }}/>
                    <span style={{ fontSize: 10.5, color: 'var(--ok-ink)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>After</span>
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>Handcrafted Oak Furniture, Made to Order | MySite</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>"Browse made-to-order oak tables, benches and shelving. Free UK delivery and a 10-year guarantee on every piece."</div>
            </div>
        </div>
    </Card>
);
