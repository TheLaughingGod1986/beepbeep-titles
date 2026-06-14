import { useEffect, useState } from 'react';
import { Icon, Card, Button } from '../components';
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

/* BeepBeep Titles — signed-out "Title & Meta Description Audit".
   A conversion surface shown in place of the dashboard when no license is
   connected: it previews the value of the product (audit KPIs, SERP +
   CTR findings, time saved, before/after, Autopilot) and drives the user
   to connect their license in Settings.

   Ported from the BeepBeep AI (ALT text) audit signed-out screen in the
   Claude Design handoff, adapted to titles & meta descriptions and the
   titles plugin's license-key auth model. */

const EST_GAIN = '12–18%';

const trackingProps = ( stats = {} ) => ( {
    site_url: window.bbtData?.siteUrl || window.location.origin,
    pages_scanned: Math.max( 0, stats?.total ?? 0 ),
    plugin_version: window.bbtData?.version || '',
    authenticated_state: 'signed_out',
} );

export const AuditSignedOutScreen = ({ stats, onConnect, onHelp, onUpgrade }) => {
    const total        = Math.max( 0, stats?.total ?? 0 );
    const missingTitle = Math.max( 0, stats?.missing_title ?? 0 );
    const missingMeta  = Math.max( 0, stats?.missing_meta ?? 0 );
    const fixCount     = Math.max( 0, stats?.needs_attention ?? 0 );
    const eventProps   = trackingProps( stats );

    useEffect( () => {
        track( 'logged_out_dashboard_viewed', eventProps );
        track( 'before_after_viewed', eventProps );
    }, [] );

    const connectFromHero = () => {
        track( 'hero_connect_clicked', eventProps );
        onConnect();
    };

    const openQuickSetup = () => {
        track( 'quick_setup_clicked', eventProps );
        onHelp();
    };

    return (
        <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 32px - 52px)', overflowX: 'hidden' }}>
            <div style={{ maxWidth: 1080, width: '100%', margin: '0 auto', padding: '20px 32px 72px' }}>

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
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 7,
                                padding: '4px 11px', marginBottom: 16,
                                background: 'var(--primary-soft)', border: '1px solid var(--primary-border)',
                                borderRadius: 999, fontSize: 11.5, color: 'var(--primary-ink)', fontWeight: 600,
                            }}>
                                <Icon name="search" size={12}/> Preview Report
                            </span>
                            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 10px' }}>
                                Find missing SEO titles and meta descriptions across your website
                            </h1>
                            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 22px', maxWidth: 460 }}>
                                Connect your account to unlock AI-powered optimisation, identify missing metadata, and improve how your pages appear in search results.
                            </p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <Button variant="primary" size="lg" icon="arrow-right" onClick={connectFromHero}>Connect Account</Button>
                                <Button variant="secondary" size="lg" onClick={openQuickSetup}>Quick Setup Guide</Button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px 24px', marginTop: 22, flexWrap: 'wrap' }}>
                                {['No credit card required', 'Setup in under 60 seconds', 'Works with Yoast, Rank Math & AIOSEO', 'Trusted by WordPress site owners'].map( ( t, i ) => (
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

                    <LockedCoverageCard onConnect={onConnect}/>
                </div>

                <BeforeAfterCard/>

                <SearchOpportunityCard/>

                <SectionLabel>SEO coverage & website health</SectionLabel>
                <WebsiteHealthCards
                    total={total}
                    missingTitle={missingTitle}
                    missingMeta={missingMeta}
                    fixCount={fixCount}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 14, marginBottom: 28 }}>
                    <TimeSavedCard/>
                    <SerpOverviewCard missingTitle={missingTitle} missingMeta={missingMeta} fixCount={fixCount}/>
                </div>

                <AutopilotCard onUnlock={() => {
                    track( 'autopilot_cta_clicked', eventProps );
                    onConnect();
                }}/>

                <PricingTeaserCard onCompare={() => {
                    track( 'pricing_teaser_clicked', eventProps );
                    onUpgrade?.();
                }}/>

                <SocialProofCard/>

                <Card padding={0} style={{
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 100%)',
                    borderColor: 'var(--primary-border)',
                }}>
                    <div style={{ padding: '28px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--primary-ink)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Unlock your full SEO report</div>
                            <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Find missing titles, discover metadata opportunities and generate optimised content automatically.</h2>
                        </div>
                        <Button variant="primary" size="lg" icon="arrow-right" onClick={() => {
                            track( 'footer_connect_clicked', eventProps );
                            onConnect();
                        }}>Connect Account</Button>
                    </div>
                </Card>

            </div>
        </div>
    );
};

const LockedCoverageCard = ({ onConnect }) => (
    <Card padding={0} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '26px 24px' }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>SEO coverage</div>
        <div style={{ position: 'relative', width: 148, height: 148, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', filter: 'blur(0.15px)' }}>
            <svg width={148} height={148} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={74} cy={74} r={62} fill="none" stroke="var(--bg-sunken)" strokeWidth={12}/>
                <circle cx={74} cy={74} r={62} fill="none" stroke="var(--border-strong)" strokeWidth={12} strokeLinecap="round" strokeDasharray="250 390" opacity="0.55"/>
            </svg>
            <span style={{
                position: 'absolute', width: 58, height: 58, borderRadius: 999,
                background: 'rgba(255,255,255,0.72)', border: '1px solid var(--border)',
                color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            }}>
                <Icon name="lock" size={24}/>
            </span>
        </div>
        <h2 style={{ margin: '14px 0 5px', fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>Coverage Report Locked</h2>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.45 }}>Connect your account to analyse your website.</p>
        <Button variant="secondary" size="sm" icon="lock" onClick={onConnect}>Connect Account</Button>
    </Card>
);

const SearchOpportunityCard = () => (
    <Card padding={0} style={{ marginBottom: 28, overflow: 'hidden', borderColor: 'var(--primary-border)' }}>
        <div style={{ padding: '22px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 20, background: 'linear-gradient(135deg,#F8FAFF 0%,#EEF4FF 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--primary-soft)', color: 'var(--primary-ink)', border: '1px solid var(--primary-border)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}><Icon name="trend" size={19}/></span>
                <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Search opportunity</div>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: '-0.018em' }}>Potential CTR Improvement</h2>
                    <p style={{ margin: '7px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-2)', maxWidth: 560 }}>
                        Improve how pages appear in search results with optimised titles and meta descriptions.
                        Websites with stronger metadata often achieve higher click-through rates and improved search visibility.
                    </p>
                </div>
            </div>
            <div className="mono tnum" style={{ fontSize: 34, fontWeight: 700, color: 'var(--primary-ink)', letterSpacing: '-0.035em', whiteSpace: 'nowrap' }}>+12% to +18%</div>
        </div>
    </Card>
);

const WebsiteHealthCards = ({ total, missingTitle, missingMeta, fixCount }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <KPICard label="Coverage report" value="Locked" tone="neutral" icon="lock" foot="Connect to analyse"/>
        <KPICard label="Pages scanned" value={total > 0 ? String( total ) : 'Locked'} tone="primary" icon="search" foot="Connect account to analyse"/>
        <KPICard label="Missing meta descriptions" value={missingMeta > 0 ? String( missingMeta ) : 'Locked'} tone="danger" icon="alert" foot="Connect account to analyse"/>
        <KPICard label="Missing SEO titles" value={missingTitle > 0 ? String( missingTitle ) : ( fixCount > 0 ? String( fixCount ) : 'Locked' )} tone="warn" icon="trend" foot="Connect account to analyse"/>
    </div>
);

const SerpOverviewCard = ({ missingTitle, missingMeta, fixCount }) => (
    <AuditCard
        eyebrow="Search appearance"
        title="SERP Overview"
        icon="shield"
        tone="danger"
        callout="Missing titles and meta descriptions let search engines improvise how your pages appear in results."
        metrics={[
            { label: 'Pages missing meta description', value: missingMeta > 0 ? String( missingMeta ) : 'Check needed', tone: 'danger' },
            { label: 'Pages missing SEO title', value: missingTitle > 0 ? String( missingTitle ) : 'Check needed', tone: 'warn' },
            { label: 'Pages needing review', value: fixCount > 0 ? String( fixCount ) : 'After scan', tone: 'primary' },
            { label: 'Estimated improvement', value: EST_GAIN, tone: 'ok' },
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
                                Never write SEO titles manually again
                            </h2>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '4px 9px', borderRadius: 999, background: 'var(--primary-soft)', border: '1px solid var(--primary-border)', color: 'var(--primary-ink)', fontSize: 11.5, fontWeight: 700 }}>
                                Available on Starter & Pro
                            </div>
                            <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 16px', maxWidth: 520 }}>
                                Automatically generate optimised titles and meta descriptions whenever new content is published.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 18px' }}>
                                {[
                                    'Generate metadata automatically',
                                    'Improve click-through rates',
                                    'Match your preferred writing style',
                                    'Review before publishing',
                                    'Bulk optimise existing content',
                                    'Works with WordPress SEO plugins',
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
                            <div style={{ width: 118, height: 118, borderRadius: 999, background: 'var(--primary-soft)', border: '1px solid var(--primary-border)', color: 'var(--primary-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                                <Icon name="zap" size={42} strokeWidth={1.9}/>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Always-on metadata</div>
                            <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.45, maxWidth: 230 }}>New pages can get search-ready titles and meta descriptions automatically.</div>
                        </div>
                    </div>
                </Card>
);

const SocialProofCard = () => (
    <Card padding={0} style={{ marginBottom: 28 }}>
        <div style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div>
                <div style={{ color: '#F59E0B', fontSize: 18, letterSpacing: '0.08em', marginBottom: 6 }}>★★★★★</div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em' }}>Growing community of WordPress site owners</h2>
                <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-2)' }}>Built specifically for WordPress SEO workflows.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <TrustPill>Metadata workflows for WordPress</TrustPill>
                <TrustPill>Built for SEO plugins</TrustPill>
            </div>
        </div>
    </Card>
);

const PricingTeaserCard = ({ onCompare }) => {
    // Pull live Stripe-backed prices so the teaser always matches checkout.
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Pricing</div>
                        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: '-0.018em' }}>Plans for every website size</h2>
                    </div>
                    <Button variant="secondary" size="sm" icon="external" onClick={onCompare}>Compare Plans</Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                    <PlanTeaser name="Free" allowance={`${ freeQuota } generations/month`}/>
                    <PlanTeaser name="Starter" allowance={`${ starterQuota } generations/month`} price={`${ starterPrice }/month`} note="Most popular for small websites"/>
                    <PlanTeaser name="Pro" allowance={`${ proQuota } generations/month`} price={`${ proPrice }/month`} note="Best value"/>
                </div>
            </div>
        </Card>
    );
};

const PlanTeaser = ({ name, allowance, price, note }) => (
    <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600 }}>{allowance}</div>
        {price && <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 700, marginTop: 8 }}>{price}</div>}
        {note && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.35 }}>{note}</div>}
    </div>
);

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

/* ── Section label ────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>{children}</div>
);

/* ── KPI card ─────────────────────────────────────────────────────── */
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
const TimeSavedCard = () => (
    <Card padding={0} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 6px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Time saved</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>Manual SEO Optimisation</h3>
        </div>
        <div style={{ padding: '12px 20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <CompareBar label="Manual SEO optimisation" value="3–5 minutes per page" pct={100} tone="danger"/>
            <CompareBar label="With BeepBeep Titles" value="30 seconds" pct={6} tone="ok"/>
            <div style={{
                marginTop: 4, padding: '12px 14px',
                background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 'var(--r-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
                <span style={{ fontSize: 12.5, color: 'var(--ok-ink)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <Icon name="clock" size={14}/> Save hours across larger websites.
                </span>
                <span className="mono tnum" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ok-ink)', whiteSpace: 'nowrap' }}>10x faster</span>
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
    <Card padding={0} style={{ display: 'flex', flexDirection: 'column', marginBottom: 28 }}>
        <div style={{ padding: '18px 20px 14px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>AI generated title & meta example</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>See how AI improves your search appearance</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '5px 0 0' }}>Generate SEO-friendly titles and meta descriptions automatically.</p>
        </div>
        <div style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Before */}
            <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon name="x" size={12} strokeWidth={2.6} style={{ color: 'var(--danger-ink)' }}/>
                    <span style={{ fontSize: 10.5, color: 'var(--danger-ink)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Before Optimisation</span>
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>Sample Page – mysite.com</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', lineHeight: 1.5 }}>meta description: (empty)</div>
            </div>
            {/* After */}
            <div style={{ padding: '10px 12px', background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon name="check" size={12} strokeWidth={2.6} style={{ color: 'var(--ok-ink)' }}/>
                    <span style={{ fontSize: 10.5, color: 'var(--ok-ink)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>After Optimisation</span>
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>Handcrafted Oak Furniture, Made to Order | MySite</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>"Browse made-to-order oak tables, benches and shelving. Free UK delivery and a 10-year guarantee on every piece."</div>
            </div>
        </div>
    </Card>
);
