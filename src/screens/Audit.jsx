import { useEffect, useState } from 'react';
import { Icon, Card, Button, SerpPreview } from '../components';
import { track, fetchPlans } from '../api';
import { QUOTA_DEFAULTS } from '../quota';

/* Format a plan amount in its own currency (e.g. gbp 12.99 -> "£12.99"). */
const fmtPrice = ( amount, currency = 'gbp' ) => {
    if ( typeof amount !== 'number' ) return null;
    try {
        return new Intl.NumberFormat( undefined, {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        } ).format( amount );
    } catch ( e ) {
        return `${ amount } ${ currency.toUpperCase() }`;
    }
};

const EST_GAIN = '12–18%';
const OPPORTUNITY = 'Opportunity detected';
const REVEAL_FOOT = 'Connect account to reveal opportunities';
const BLURRED_OPPS = '•• opportunities found';
const MINUTES_PER_PAGE = 3;

const formatAuditTime = ( raw ) => {
    if ( ! raw ) return null;
    const d = new Date( String( raw ).replace( ' ', 'T' ) );
    if ( Number.isNaN( d.getTime() ) ) return null;
    const now = new Date();
    const time = d.toLocaleTimeString( undefined, { hour: '2-digit', minute: '2-digit', hour12: false } );
    if ( d.toDateString() === now.toDateString() ) {
        return `Last audit completed today at ${ time }`;
    }
    return `Last audit: ${ d.toLocaleDateString( undefined, { day: 'numeric', month: 'short' } ) } at ${ time }`;
};

const kpiDisplay = ( value, hasData, suffix = '' ) => {
    if ( ! hasData ) return OPPORTUNITY;
    if ( value === 0 && suffix === ' minutes' ) return '0 minutes';
    return `${ value.toLocaleString() }${ suffix }`;
};

const trackingProps = ( stats = {} ) => ( {
    site_url: window.bbtData?.siteUrl || window.location.origin,
    pages_scanned: Math.max( 0, stats?.total ?? 0 ),
    plugin_version: window.bbtData?.version || '',
    authenticated_state: 'signed_out',
} );

export const AuditSignedOutScreen = ({ stats, onConnect, onHelp }) => {
    const total        = Math.max( 0, stats?.total ?? 0 );
    const fixCount     = Math.max( 0, stats?.needs_attention ?? 0 );
    const hasScan      = total > 0;
    const minutesSaved = fixCount > 0 ? fixCount * MINUTES_PER_PAGE : 0;
    const lastAudit    = formatAuditTime( stats?.last_scan || window.bbtData?.lastScan || '' );
    const eventProps   = trackingProps( stats );

    useEffect( () => {
        track( 'logged_out_dashboard_viewed', eventProps );
        track( 'before_after_viewed', eventProps );
    }, [] );

    const connectFromHero = ( source ) => {
        track( source || 'hero_connect_clicked', eventProps );
        onConnect?.();
    };

    const openQuickSetup = () => {
        track( 'quick_setup_clicked', eventProps );
        onHelp?.();
    };

    return (
        <div className="bbt-audit" style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 32px - 52px)', overflowX: 'hidden' }}>
            <div style={{ maxWidth: 1080, width: '100%', margin: '0 auto', padding: '32px 32px 72px' }}>

                <div style={{
                    display: 'grid', gridTemplateColumns: '1.35fr 0.9fr', gap: 20, alignItems: 'stretch',
                    marginBottom: 16,
                }}>
                    <Card padding={0} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ padding: '32px 32px 30px' }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 7,
                                padding: '4px 11px', marginBottom: 16,
                                background: 'var(--primary-soft)', border: '1px solid var(--primary-border)',
                                borderRadius: 999, fontSize: 11.5, color: 'var(--primary-ink)', fontWeight: 600,
                            }}>
                                <Icon name="search" size={12}/> AI Metadata Audit
                            </span>
                            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 10px' }}>
                                Find missing SEO titles and meta descriptions in under 60 seconds
                            </h1>
                            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 16px', maxWidth: 460 }}>
                                Discover metadata issues, improve search appearance and generate optimised SEO titles and descriptions automatically.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
                                <HeroKPI
                                    label="Pages Scanned"
                                    value={kpiDisplay( total, hasScan )}
                                    icon="search"
                                />
                                <HeroKPI
                                    label="Pages Need Review"
                                    value={kpiDisplay( fixCount, hasScan )}
                                    icon="alert"
                                    tone="warn"
                                />
                                <HeroKPI
                                    label="Minutes Saved"
                                    value={hasScan && fixCount > 0 ? kpiDisplay( minutesSaved, true, ' minutes' ) : hasScan ? '0 minutes' : OPPORTUNITY}
                                    icon="clock"
                                    tone="ok"
                                />
                            </div>

                            {lastAudit ? (
                                <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.45, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Icon name="clock" size={13} style={{ color: 'var(--ok-ink)', flexShrink: 0 }}/>
                                    {lastAudit}
                                </p>
                            ) : hasScan ? (
                                <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.45, margin: '0 0 18px' }}>Recent audit completed</p>
                            ) : (
                                <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.45, margin: '0 0 18px' }}>Connect your account to run your first metadata audit.</p>
                            )}

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <Button variant="primary" size="lg" icon="arrow-right" onClick={() => connectFromHero( 'hero_connect_clicked' )}>Connect Account</Button>
                                <Button variant="secondary" size="lg" onClick={openQuickSetup}>Quick Setup Guide</Button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px 24px', marginTop: 22, flexWrap: 'wrap' }}>
                                {['No credit card required', 'Setup in under 60 seconds', 'Works with Yoast, Rank Math & AIOSEO', 'Built specifically for WordPress SEO workflows'].map( ( t, i ) => (
                                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text)', fontWeight: 600 }}>
                                        <span style={{ width: 20, height: 20, borderRadius: 999, flexShrink: 0, background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', color: 'var(--ok-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon name="check" size={12} strokeWidth={3}/>
                                        </span>
                                        {t}
                                    </span>
                                ) )}
                            </div>
                        </div>
                    </Card>

                    <CoveragePreviewCard total={total} fixCount={fixCount} onConnect={() => connectFromHero( 'coverage_preview_connect_clicked' )}/>
                </div>

                <MetadataOpportunitiesCard
                    total={total}
                    fixCount={fixCount}
                    onConnect={() => connectFromHero( 'metadata_opportunities_connect_clicked' )}
                />

                <SearchOpportunityCard/>

                <SectionLabel>SEO coverage &amp; website health</SectionLabel>
                <WebsiteHealthCards total={total} fixCount={fixCount}/>

                <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 14, marginBottom: 28 }}>
                    <TimeSavedCard fixCount={fixCount}/>
                    <SerpOverviewCard fixCount={fixCount}/>
                </div>

                <AutopilotCard onUnlock={() => {
                    track( 'autopilot_cta_clicked', eventProps );
                    onConnect?.();
                }}/>

                <PricingTeaserCard onPlanSelect={( plan ) => {
                    track( 'pricing_plan_cta_clicked', { ...eventProps, plan } );
                    onConnect?.();
                }}/>

                <SocialProofCard/>

                <Card padding={0} style={{
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 100%)',
                    borderColor: 'var(--primary-border)',
                }}>
                    <div style={{ padding: '28px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                        <div>
                            <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Unlock your full SEO metadata report</h2>
                            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, margin: '0 0 8px', maxWidth: 560 }}>
                                Unlock every metadata opportunity discovered during your site audit and start generating optimised SEO titles and descriptions in seconds.
                            </p>
                            <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
                                No credit card required.<br/>Setup takes under 60 seconds.
                            </p>
                        </div>
                        <Button variant="primary" size="lg" icon="arrow-right" onClick={() => connectFromHero( 'footer_connect_clicked' )}>Connect Account</Button>
                    </div>
                </Card>

            </div>
        </div>
    );
};

const HeroKPI = ({ label, value, icon, tone = 'primary' }) => {
    const tones = {
        ok:      { soft: 'var(--ok-soft)',      ink: 'var(--ok-ink)',      bd: 'var(--ok-border)' },
        warn:    { soft: 'var(--warn-soft)',    ink: 'var(--warn-ink)',    bd: 'var(--warn-border)' },
        primary: { soft: 'var(--primary-soft)', ink: 'var(--primary-ink)', bd: 'var(--primary-border)' },
    };
    const t = tones[tone] || tones.primary;
    const isLocked = value === OPPORTUNITY;

    return (
        <div style={{
            padding: '14px 14px 12px', borderRadius: 'var(--r-md)',
            background: 'var(--surface)', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, lineHeight: 1.3 }}>{label}</span>
                <span style={{
                    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                    background: t.soft, color: t.ink, border: `1px solid ${ t.bd }`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}><Icon name={icon} size={12}/></span>
            </div>
            <div className="mono tnum" style={{
                fontSize: isLocked ? 13 : 26, fontWeight: 600, letterSpacing: '-0.03em',
                color: 'var(--text)', lineHeight: 1.15,
            }}>{value}</div>
        </div>
    );
};

const CoveragePreviewCard = ({ total, fixCount, onConnect }) => {
    const hasScan = total > 0;
    const lockedValue = hasScan ? BLURRED_OPPS : 'Reveal affected pages';

    return (
        <Card padding={0} className="bbt-card--locked" style={{ display: 'flex', flexDirection: 'column', padding: '22px 22px 20px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>SEO Coverage Preview</div>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={60} cy={60} r={50} fill="none" stroke="var(--bg-sunken)" strokeWidth={10}/>
                    <circle cx={60} cy={60} r={50} fill="none" stroke="var(--border-strong)" strokeWidth={10} strokeLinecap="round" strokeDasharray="200 314" opacity="0.55"/>
                </svg>
                <span style={{
                    position: 'absolute', width: 48, height: 48, borderRadius: 999,
                    background: 'rgba(255,255,255,0.72)', border: '1px solid var(--border)',
                    color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                    backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                }}>
                    <Icon name="search" size={22}/>
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 14 }}>
                <PreviewMetric label="Pages scanned" value={hasScan ? String( total ) : OPPORTUNITY} revealed={hasScan}/>
                <PreviewMetric label="Pages needing review" value={hasScan ? String( fixCount ) : OPPORTUNITY} revealed={hasScan}/>
                <PreviewMetric label="Missing SEO titles" value={lockedValue} revealed={false} blurred={hasScan}/>
                <PreviewMetric label="Missing meta descriptions" value={lockedValue} revealed={false} blurred={hasScan}/>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.45, textAlign: 'center' }}>
                Connect your account to reveal every page that needs metadata improvements.
            </p>
            <Button variant="secondary" size="sm" icon="arrow-right" onClick={onConnect} style={{ alignSelf: 'center' }}>Unlock Full Report</Button>
        </Card>
    );
};

const PreviewMetric = ({ label, value, revealed, blurred = false }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', borderTop: '1px solid var(--hairline)',
    }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{label}</span>
        <span className="mono tnum" style={{
            fontSize: blurred ? 11.5 : 12.5, fontWeight: 600,
            color: revealed ? 'var(--text)' : 'var(--text-3)',
            filter: revealed ? 'none' : blurred ? 'blur(4px)' : 'blur(3px)',
            userSelect: revealed ? 'auto' : 'none',
            letterSpacing: blurred ? '0.06em' : 'normal',
        }}>{value}</span>
    </div>
);

const MetadataOpportunitiesCard = ({ total, fixCount, onConnect }) => {
    const hasScan = total > 0;
    const metaOpps = hasScan && fixCount > 0 ? String( fixCount ) : hasScan ? '0' : OPPORTUNITY;

    return (
        <Card padding={0} style={{ marginBottom: 28, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px 0' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Site audit</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: '0 0 14px' }}>Metadata Opportunities Found</h3>
            </div>
            <div style={{ padding: '0 20px 16px' }}>
                <PreviewMetric label="Pages scanned" value={hasScan ? String( total ) : OPPORTUNITY} revealed={hasScan}/>
                <PreviewMetric label="Pages needing review" value={hasScan ? String( fixCount ) : OPPORTUNITY} revealed={hasScan}/>
                <PreviewMetric label="Metadata opportunities detected" value={metaOpps} revealed={hasScan}/>
            </div>
            <div style={{ padding: '0 20px 18px', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" icon="arrow-right" onClick={onConnect}>Unlock Full Report</Button>
            </div>
        </Card>
    );
};

const SearchOpportunityCard = () => {
    const siteUrl = window.bbtData?.siteUrl || 'https://example.com';
    let host = 'example.com';
    try { host = new URL( siteUrl ).hostname; } catch ( e ) { /* keep default */ }

    return (
        <Card padding={0} style={{ marginBottom: 28, overflow: 'hidden', borderColor: 'var(--primary-border)' }}>
            <div style={{ padding: '22px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'start', gap: 20, background: 'linear-gradient(135deg,#F8FAFF 0%,#EEF4FF 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <span style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'var(--primary-soft)', color: 'var(--primary-ink)', border: '1px solid var(--primary-border)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}><Icon name="trend" size={19}/></span>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Search opportunity</div>
                        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: '-0.018em' }}>Search Opportunity</h2>
                        <p style={{ margin: '7px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-2)', maxWidth: 560 }}>
                            Pages missing metadata often receive fewer clicks even when ranking. Well-written titles and descriptions help searchers understand your content before they visit.
                        </p>
                        <p style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.45, color: 'var(--text-3)', maxWidth: 560 }}>
                            Actual results vary depending on ranking position, search intent and existing metadata quality.
                        </p>
                        <div style={{ marginTop: 16, maxWidth: 420 }}>
                            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Example search appearance</div>
                            <SerpPreview
                                variant="compact"
                                faviconLetter={host.charAt( 0 ).toUpperCase()}
                                url={`${ host } › example-page`}
                                title="Your optimised SEO title appears here"
                                meta="A clear meta description helps searchers understand what your page offers before they click through."
                            />
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>Typical uplift</div>
                    <div className="mono tnum" style={{ fontSize: 34, fontWeight: 700, color: 'var(--primary-ink)', letterSpacing: '-0.035em', whiteSpace: 'nowrap' }}>+{EST_GAIN}</div>
                </div>
            </div>
        </Card>
    );
};

const WebsiteHealthCards = ({ total, fixCount }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <KPICard
            label="SEO coverage"
            value={total > 0 ? `${ fixCount > 0 ? fixCount : 0 } to review` : OPPORTUNITY}
            tone="primary"
            icon="search"
            foot={total > 0 ? 'Unlock report for page-level insights' : REVEAL_FOOT}
        />
        <KPICard
            label="Pages scanned"
            value={total > 0 ? String( total ) : OPPORTUNITY}
            tone="primary"
            icon="search"
            foot={total > 0 ? 'Live scan from your WordPress site' : REVEAL_FOOT}
        />
        <KPICard
            label="Missing meta descriptions"
            value={OPPORTUNITY}
            tone="warn"
            icon="alert"
            foot="Reveal metadata issues"
        />
        <KPICard
            label="Missing SEO titles"
            value={OPPORTUNITY}
            tone="warn"
            icon="trend"
            foot="Reveal affected pages"
        />
    </div>
);

const SerpOverviewCard = ({ fixCount }) => (
    <AuditCard
        eyebrow="Search appearance"
        title="SERP Overview"
        icon="shield"
        tone="danger"
        callout="Some pages may be missing titles or descriptions that help search engines understand and display your content."
        metrics={[
            { label: 'Pages missing meta description', value: OPPORTUNITY, tone: 'warn' },
            { label: 'Pages missing SEO title', value: OPPORTUNITY, tone: 'warn' },
            { label: 'Pages needing review', value: fixCount > 0 ? String( fixCount ) : OPPORTUNITY, tone: 'primary' },
            { label: 'Typical CTR improvement', value: `+${ EST_GAIN }`, tone: 'ok' },
        ]}
    />
);

const AutopilotCard = ({ onUnlock }) => (
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
                    Publish with search-ready metadata automatically
                </h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '4px 9px', borderRadius: 999, background: 'var(--primary-soft)', border: '1px solid var(--primary-border)', color: 'var(--primary-ink)', fontSize: 11.5, fontWeight: 700 }}>
                    Available on Starter &amp; Pro
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 16px', maxWidth: 520 }}>
                    Autopilot generates SEO titles and meta descriptions whenever new content is published.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 18px' }}>
                    {[
                        { group: 'Automation', items: [ 'Generate metadata automatically', 'Optimise existing content' ] },
                        { group: 'Performance', items: [ 'Improve search appearance', 'Match your writing style' ] },
                        { group: 'Workflow', items: [ 'Review before publishing', 'Works with WordPress SEO plugins' ] },
                    ].map( ( col, ci ) => (
                        <div key={ci}>
                            <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{col.group}</div>
                            {col.items.map( ( t, i ) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--text)', marginBottom: 8, lineHeight: 1.35 }}>
                                    <span style={{
                                        width: 17, height: 17, borderRadius: 999, flexShrink: 0, marginTop: 1,
                                        background: 'var(--ok-soft)', border: '1px solid var(--ok-border)',
                                        color: 'var(--ok-ink)',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    }}><Icon name="check" size={10} strokeWidth={3}/></span>
                                    {t}
                                </div>
                            ) )}
                        </div>
                    ) )}
                </div>
                <div style={{ marginTop: 20 }}>
                    <Button variant="pro" size="md" icon="zap" onClick={onUnlock}>Unlock Autopilot</Button>
                </div>
            </div>
            <div style={{
                borderLeft: '1px solid var(--hairline)',
                background: 'var(--surface-2)',
                padding: '26px 28px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            }}>
                <AutopilotWorkflow/>
            </div>
        </div>
    </Card>
);

const AutopilotWorkflow = () => {
    const steps = [
        { label: 'New Page Published', icon: 'library' },
        { label: 'AI Generates Metadata', icon: 'zap' },
        { label: 'Review', icon: 'eye' },
        { label: 'Publish', icon: 'check' },
    ];

    return (
        <div style={{ width: '100%', maxWidth: 220 }}>
            {steps.map( ( step, i ) => (
                <div key={i}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 'var(--r-md)',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        <span style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            background: 'var(--primary-soft)', color: 'var(--primary-ink)', border: '1px solid var(--primary-border)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}><Icon name={step.icon} size={14}/></span>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, textAlign: 'left' }}>{step.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0', color: 'var(--text-3)' }}>
                            <Icon name="chevron-down" size={16}/>
                        </div>
                    )}
                </div>
            ) )}
        </div>
    );
};

const SocialProofCard = () => (
    <Card padding={0} style={{ marginBottom: 28 }}>
        <div style={{ padding: '22px 24px' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em' }}>Built for real WordPress SEO workflows</h2>
            <p style={{ margin: '6px 0 14px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 640 }}>
                Designed for bloggers, agencies, WooCommerce stores and content-heavy WordPress websites.
            </p>
            <p style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 640 }}>
                Designed to fit existing WordPress SEO workflows without changing how your team publishes content.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <TrustPill>Metadata workflows for WordPress</TrustPill>
                <TrustPill>Works with Yoast &amp; Rank Math</TrustPill>
                <TrustPill>Manual review before publishing</TrustPill>
                <TrustPill>No credit card required</TrustPill>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.45 }}>
                Save time on repetitive metadata work without giving up editorial control.
            </p>
        </div>
    </Card>
);

const PLAN_COPY = {
    free: {
        features: [
            'Preview metadata opportunities',
            'Generate SEO titles',
            'Generate meta descriptions',
            'Manual review workflow',
        ],
        cta: 'Start Free',
    },
    starter: {
        features: [
            'Everything in Free',
            '100 AI generations per month',
            'Bulk metadata generation',
            'SEO titles and descriptions',
            'Manual review workflow',
        ],
        cta: 'Choose Starter',
        badge: 'Most Popular',
    },
    pro: {
        features: [
            'Everything in Starter',
            '1000 AI generations per month',
            'Autopilot mode',
            'Optimise larger content libraries',
            'Priority processing',
            'Agency-friendly usage limits',
        ],
        cta: 'Choose Pro',
        badge: 'Best Value',
    },
};

const PricingTeaserCard = ({ onPlanSelect }) => {
    const [plans, setPlans] = useState( null );
    useEffect( () => {
        let alive = true;
        fetchPlans()
            .then( res => { if ( alive ) setPlans( res?.plans || [] ); } )
            .catch( () => { if ( alive ) setPlans( [] ); } );
        return () => { alive = false; };
    }, [] );

    const starter      = ( plans || [] ).find( p => p.id === 'starter' );
    const pro          = ( plans || [] ).find( p => p.id === 'pro' );
    const freeQuota    = QUOTA_DEFAULTS.monthly_limit;
    const starterQuota = starter?.quota || 100;
    const starterPrice = starter ? fmtPrice( starter.price, starter.currency ) : '£4.99';
    const proQuota     = pro?.quota || 1000;
    const proPrice     = pro ? fmtPrice( pro.price, pro.currency ) : '£12.99';

    return (
        <Card padding={0} style={{ marginBottom: 28, overflow: 'hidden' }}>
            <div style={{ padding: '22px 24px' }}>
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Pricing</div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: '-0.018em' }}>Plans for every website size</h2>
                </div>
                <PricingTrustRow/>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                    <PlanTeaser
                        planId="free"
                        name="Free"
                        allowance={`${ freeQuota } generations/month`}
                        features={PLAN_COPY.free.features}
                        cta={PLAN_COPY.free.cta}
                        onSelect={onPlanSelect}
                        variant="neutral"
                    />
                    <PlanTeaser
                        planId="starter"
                        name="Starter"
                        allowance={`${ starterQuota } generations/month`}
                        price={`${ starterPrice }/month`}
                        badge={PLAN_COPY.starter.badge}
                        features={PLAN_COPY.starter.features}
                        cta={PLAN_COPY.starter.cta}
                        onSelect={onPlanSelect}
                        variant="starter"
                    />
                    <PlanTeaser
                        planId="pro"
                        name="Pro"
                        allowance={`${ proQuota } generations/month`}
                        price={`${ proPrice }/month`}
                        badge={PLAN_COPY.pro.badge}
                        features={PLAN_COPY.pro.features}
                        cta={PLAN_COPY.pro.cta}
                        highlight
                        onSelect={onPlanSelect}
                    />
                </div>
                <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.45, textAlign: 'center' }}>
                    Most users recover the monthly cost after optimising just a handful of pages.
                </p>
            </div>
        </Card>
    );
};

const PricingTrustRow = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginBottom: 14 }}>
        {['Built for WordPress', 'Works with Yoast & Rank Math', 'Setup in under 60 seconds', 'No credit card required'].map( ( t, i ) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
                <Icon name="check" size={12} strokeWidth={2.6} style={{ color: 'var(--ok-ink)' }}/> {t}
            </span>
        ) )}
    </div>
);

const PlanTeaser = ({ planId, name, allowance, price, badge, features = [], cta, highlight, variant, onSelect }) => {
    const styles = highlight
        ? {
            padding: '18px 16px',
            border: '2px solid var(--primary)',
            background: 'var(--primary-soft)',
            boxShadow: '0 10px 30px rgba(37,99,235,0.12)',
        }
        : variant === 'starter'
            ? {
                padding: 14,
                border: '1px solid var(--primary-border)',
                background: 'var(--surface)',
                boxShadow: '0 4px 14px rgba(37,99,235,0.06)',
            }
            : {
                padding: 14,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                boxShadow: 'none',
            };

    return (
    <div style={{
        ...styles,
        borderRadius: 'var(--r-md)', minWidth: 0, position: 'relative',
        display: 'flex', flexDirection: 'column',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: highlight ? 15 : 14, fontWeight: 700, color: 'var(--text)' }}>{name}</span>
            {badge && (
                <span style={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: 999,
                    background: highlight ? 'var(--primary)' : 'var(--primary-soft)',
                    color: highlight ? '#fff' : 'var(--primary-ink)',
                    border: highlight ? '1px solid var(--primary)' : '1px solid var(--primary-border)',
                }}>{badge}</span>
            )}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600 }}>{allowance}</div>
        {price && <div style={{ fontSize: highlight ? 15 : 13, color: 'var(--text)', fontWeight: 700, marginTop: 8 }}>{price}</div>}
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {features.map( ( f, i ) => (
                <span key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.35 }}>
                    <Icon name="check" size={11} strokeWidth={2.6} style={{ color: 'var(--ok-ink)', flexShrink: 0, marginTop: 1 }}/>
                    {f}
                </span>
            ) )}
        </div>
        {cta && onSelect && (
            <Button
                variant={highlight ? 'primary' : 'secondary'}
                size="sm"
                full
                onClick={() => onSelect( planId )}
                style={{ marginTop: 12 }}
            >
                {cta}
            </Button>
        )}
    </div>
    );
};

const TrustPill = ({ children }) => (
    <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '7px 10px', background: 'var(--bg-sunken)', border: '1px solid var(--border)',
        borderRadius: 999, fontSize: 12, color: 'var(--text-2)', fontWeight: 600,
    }}>
        <Icon name="check" size={12} strokeWidth={2.6} style={{ color: 'var(--ok-ink)' }}/>
        {children}
    </span>
);

const SectionLabel = ({ children }) => (
    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>{children}</div>
);

const KPICard = ({ label, value, tone, icon, foot }) => {
    const tones = {
        ok:      { soft: 'var(--ok-soft)',      ink: 'var(--ok-ink)',      bd: 'var(--ok-border)' },
        neutral: { soft: 'var(--bg-sunken)',    ink: 'var(--text-3)',      bd: 'var(--border)' },
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
            <div className="mono tnum" style={{ fontSize: value === OPPORTUNITY ? 14 : 28, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.2 }}>{value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>{foot}</div>
        </Card>
    );
};

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
            fontSize: value === OPPORTUNITY ? 12 : 13, fontWeight: 600, color: colors[tone] || 'var(--text)',
            whiteSpace: 'nowrap',
        }}>{value}</span>
    );
};

const TimeSavedCard = ({ fixCount }) => (
    <Card padding={0} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 6px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Time saved</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>Reduce repetitive SEO work</h3>
            {fixCount > 0 && (
                <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '6px 0 0', lineHeight: 1.45 }}>
                    Estimated { ( fixCount * 3 ).toLocaleString() } minutes saved on pages needing review.
                </p>
            )}
        </div>
        <div style={{ padding: '12px 20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <CompareBar label="Manual SEO" value="3–5 minutes per page" pct={100} tone="danger"/>
            <CompareBar label="With BeepBeep Titles" value="30 seconds" pct={6} tone="ok"/>
            <div style={{
                marginTop: 4, padding: '12px 14px',
                background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 'var(--r-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
                <span style={{ fontSize: 12.5, color: 'var(--ok-ink)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <Icon name="clock" size={14}/> Save hours across larger websites
                </span>
                <span className="mono tnum" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ok-ink)', whiteSpace: 'nowrap' }}>Up to 10x faster</span>
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
