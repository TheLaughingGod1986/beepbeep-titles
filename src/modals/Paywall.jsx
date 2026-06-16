import { useState, useEffect } from 'react';
import { Icon, Button } from '../components';
import { Modal } from './Modal';
import { fetchPlans, track } from '../api';

const PLUGIN = 'beepbeep-titles';

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

const fmtCount = ( n ) => ( typeof n === 'number' ? n.toLocaleString() : n );

/* ── Conversion-focused upgrade modal ──────────────────────────────────
   Problem → Solution → Upgrade. Scan issues + ROI/time-saving first → pricing
   (Pro dominant) → big Starter→Pro comparison → one dynamic problem-framed CTA
   ("Fix N SEO issues automatically") → trust → social proof. Alternative
   purchase paths (Starter, credit pack) stay quiet so they never dilute the
   primary CTA. Prices come live from /billing/plans so they always match Stripe. */
export const Paywall = ({ open, onClose, entitlement, stats, onCheckout, onUpgrade, onBuyCredits, sourceScreen }) => {
    const [plans, setPlans] = useState( null );
    const [showMore, setShowMore] = useState( false );

    // Pull live Stripe-backed pricing so the modal can never drift.
    useEffect( () => {
        if ( !open || plans ) return;
        let alive = true;
        fetchPlans()
            .then( res => { if ( alive ) setPlans( res?.plans || [] ); } )
            .catch( () => { if ( alive ) setPlans( [] ); } );
        return () => { alive = false; };
    }, [open, plans] );

    const missingTitles = Number.isFinite( stats?.missing_title ) ? stats.missing_title : null;
    const missingMeta   = Number.isFinite( stats?.missing_meta ) ? stats.missing_meta : null;
    const siteSize      = Number.isFinite( stats?.total ) ? stats.total : null;
    const currentPlan   = entitlement?.plan || 'free';

    const siteUrl   = ( typeof window !== 'undefined' && ( window.bbtData?.siteUrl || window.location?.origin ) ) || '';
    const userState = entitlement ? currentPlan : 'signed_out';

    const eventProps = {
        missing_titles_count: missingTitles,
        missing_meta_count:   missingMeta,
        site_size:            siteSize,
        current_plan:         currentPlan,
        plugin_name:          PLUGIN,
    };

    // Properties for the pricing_* funnel events.
    const pricingProps = ( planSelected = null ) => ( {
        plan_selected: planSelected,
        plugin_name:   PLUGIN,
        site_url:      siteUrl,
        pages_scanned: siteSize,
        user_state:    userState,
    } );

    // One "opened" event per open (plus the comparison strip is in view).
    useEffect( () => {
        if ( open ) {
            track( 'titles_upgrade_modal_viewed', eventProps );
            track( 'pricing_modal_opened', pricingProps() );
            track( 'pricing_comparison_viewed', pricingProps() );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open] );

    const handleClose = () => {
        track( 'pricing_modal_closed', pricingProps() );
        onClose?.();
    };

    if ( !open ) return null;

    const starterPlan  = ( plans || [] ).find( p => p.id === 'starter' );
    const proPlan      = ( plans || [] ).find( p => p.id === 'pro' );
    const creditsPlan  = ( plans || [] ).find( p => p.id === 'credits' );
    const starterPrice = starterPlan ? fmtPrice( starterPlan.price, starterPlan.currency ) : '£4.99';
    const starterQuota = starterPlan?.quota || 100;
    const proPrice     = proPlan ? fmtPrice( proPlan.price, proPlan.currency ) : '£12.99';
    const proQuota     = proPlan?.quota || 1000;
    const creditsPrice = creditsPlan ? fmtPrice( creditsPlan.price, creditsPlan.currency ) : '£9.99';
    const creditsQuota = creditsPlan?.quota || 100;
    // The backend flags a plan `available:false` (and drops its priceId) when its
    // Stripe price can't be retrieved — don't offer a CTA that would dead-end at
    // checkout. Only an explicit false disables; absent/true stays clickable.
    const proAvailable     = proPlan?.available !== false;
    const starterAvailable = starterPlan?.available !== false;
    const creditsAvailable = creditsPlan?.available !== false;
    // Free allowance comes from the live entitlement (currently 15), never hard-coded.
    const freeLimit    = Number.isFinite( entitlement?.token_limit ) ? entitlement.token_limit : 15;

    // Pro-vs-Starter value framing, derived from live prices/quotas.
    const monthlyExtra = ( proPlan && starterPlan && proPlan.price > starterPlan.price )
        ? fmtPrice( Math.round( ( proPlan.price - starterPlan.price ) * 100 ) / 100, proPlan.currency )
        : '£8';
    const capacityMult = ( proQuota && starterQuota ) ? Math.max( 2, Math.round( proQuota / starterQuota ) ) : 10;

    const checkout = ( planId ) => {
        const plan = ( plans || [] ).find( p => p.id === planId );
        const checkoutArgs = plan?.priceId
            ? { plan: planId, priceId: plan.priceId }
            : { plan: planId };
        if ( typeof onCheckout === 'function' ) { onCheckout( checkoutArgs ); return; }
        if ( planId === 'credits' && onBuyCredits ) { onBuyCredits(); return; }
        if ( onUpgrade ) onUpgrade();
    };
    // Canonical funnel event (kept alongside the legacy CTA events for compat).
    // user_state here is auth-state (anonymous|authenticated), distinct from the
    // plan-flavoured user_state the legacy pricing_* events carry.
    const authState = ( entitlement || window.bbtData?.connected ) ? 'authenticated' : 'anonymous';
    const upgradeProps = ( planId ) => {
        const plan = ( plans || [] ).find( p => p.id === planId );
        return {
            ...pricingProps( planId ),
            plan:             planId,
            price_id:         plan?.priceId,
            source_screen:    sourceScreen || 'modal',
            source_component: 'upgrade_modal',
            user_state:       authState,
        };
    };
    const onPro     = () => { track( 'titles_pro_cta_clicked', eventProps ); track( 'pro_cta_clicked', pricingProps( 'pro' ) ); track( 'upgrade_clicked', upgradeProps( 'pro' ) ); checkout( 'pro' ); };
    const onStarter = () => { track( 'titles_starter_link_clicked', eventProps ); track( 'starter_cta_clicked', pricingProps( 'starter' ) ); track( 'upgrade_clicked', upgradeProps( 'starter' ) ); checkout( 'starter' ); };
    const onCredits = () => { track( 'titles_credit_pack_clicked', eventProps ); checkout( 'credits' ); };

    const showScanGaps = ( missingTitles !== null || missingMeta !== null )
        && ( ( missingTitles || 0 ) > 0 || ( missingMeta || 0 ) > 0 );
    // Total detected issues drives the dynamic, problem-framed primary CTA.
    const totalIssues   = ( missingTitles || 0 ) + ( missingMeta || 0 );
    const issuePlural   = totalIssues === 1 ? 'Issue' : 'Issues';

    const R = 16; // card / surface radius

    // ROI framing — users buy time saved, not generations.
    const why = [
        'Generate SEO titles and descriptions in seconds',
        'Save hours of manual editing',
        'Improve search visibility',
        'Fix metadata across your site automatically',
    ];
    // Risk reducers kept beside the purchase button.
    const trust = [
        'Secure Stripe checkout',
        'Cancel anytime',
        'No long-term contracts',
        'Works with Rank Math, Yoast and other SEO plugins',
    ];

    return (
        <Modal open={open} onClose={handleClose} width={760}>
            <div className="bbt-pw" style={{ position: 'relative' }}>
                <style>{`
                    .bbt-pw__plans { display:grid; grid-template-columns: 0.92fr 0.92fr 1.22fr; gap:14px; align-items:stretch; }
                    .bbt-pw__plan { border-radius:${R}px; padding:16px 16px 18px; display:flex; flex-direction:column; }
                    .bbt-pw__plan--pro { transform: scale(1.04); transform-origin:center; }
                    .bbt-pw__why { display:grid; grid-template-columns:1fr 1fr; gap:8px 18px; }
                    @media (max-width: 640px) {
                        .bbt-pw__section { padding-left:20px !important; padding-right:20px !important; }
                        .bbt-pw__plans { display:flex; flex-direction:column; gap:16px; }
                        .bbt-pw__plan--pro { order:1; transform:none; }
                        .bbt-pw__plan--starter { order:2; }
                        .bbt-pw__why { grid-template-columns:1fr; }
                        /* Free (current plan) is contextual only and has no CTA — hide it on
                           mobile so the Pro CTA stays reachable without excess scrolling. */
                        .bbt-pw__plan--free { display:none; }
                    }
                `}</style>

                <button onClick={handleClose} aria-label="Close" style={{ position: 'absolute', top: 18, right: 18, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 999, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', zIndex: 2 }}>
                    <Icon name="x" size={14}/>
                </button>

                {/* ── Section 1: Headline → Issue Summary → SEO Impact → CTA (above the fold) ── */}
                <div className="bbt-pw__section" style={{ padding: '36px 40px 4px' }}>
                    <h2 style={{ fontSize: 25, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 8px', maxWidth: 560 }}>
                        {showScanGaps ? 'We found SEO issues on your site' : 'Fix missing SEO metadata in minutes'}
                    </h2>
                    <p style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.5, margin: '0 0 16px', maxWidth: 580 }}>
                        {showScanGaps
                            ? <>Some pages are missing SEO metadata, which may reduce visibility in Google Search. Fix every detected issue automatically — <strong style={{ color: 'var(--text)', fontWeight: 600 }}>in under 60 seconds</strong>.</>
                            : <>Many WordPress pages are missing the titles and meta descriptions search engines rely on. BeepBeep generates them automatically and fixes your whole site in under 60 seconds.</> }
                    </p>

                    {showScanGaps && (
                        <div style={{ borderRadius: R, border: '1px solid var(--warn-border)', background: 'var(--warn-soft)', padding: '14px 16px', marginBottom: 14 }}>
                            {/* Issue count — the primary visual conversion anchor */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                                <span className="mono tnum" style={{ fontSize: 30, fontWeight: 700, color: 'var(--warn-ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmtCount( totalIssues )}</span>
                                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--warn-ink)' }}>SEO {issuePlural} Detected</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {( missingTitles || 0 ) > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--warn-border)', borderRadius: 10, padding: '9px 11px' }}>
                                        <Icon name="alert" size={15} style={{ color: 'var(--warn-ink)', flexShrink: 0 }}/>
                                        <span><span className="mono tnum" style={{ fontWeight: 700 }}>{fmtCount( missingTitles )}</span> pages missing SEO titles</span>
                                    </div>
                                )}
                                {( missingMeta || 0 ) > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--warn-border)', borderRadius: 10, padding: '9px 11px' }}>
                                        <Icon name="alert" size={15} style={{ color: 'var(--warn-ink)', flexShrink: 0 }}/>
                                        <span><span className="mono tnum" style={{ fontWeight: 700 }}>{fmtCount( missingMeta )}</span> pages missing meta descriptions</span>
                                    </div>
                                )}
                            </div>
                            {/* SEO impact — subtle, non-alarmist */}
                            <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--warn-ink)', lineHeight: 1.45, margin: '12px 0 0' }}>
                                <Icon name="trend" size={15} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }}/>
                                <span>Pages without titles and descriptions may not appear optimally in Google Search, lowering click-through and making your content harder to rank.</span>
                            </p>
                        </div>
                    )}

                    {/* ── Primary action — problem-framed dynamic CTA, kept above the fold ── */}
                    <Button variant="pro" size="lg" full icon="zap" onClick={onPro} disabled={!proAvailable} style={{ paddingTop: 15, paddingBottom: 15, fontSize: 16 }}>
                        {!proAvailable
                            ? 'Pro temporarily unavailable'
                            : totalIssues > 0
                                ? `Fix All ${fmtCount( totalIssues )} SEO ${issuePlural} Now`
                                : `Fix My SEO Issues Automatically · ${proPrice}/month` }
                    </Button>
                    <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-3)', margin: '8px 0 0', lineHeight: 1.5 }}>
                        {!proAvailable
                            ? 'This plan is being updated. Please try again shortly or contact support.'
                            : totalIssues > 0
                                ? `Upgrade to Pro and generate the missing metadata now · ${proPrice}/month`
                                : `Upgrade to Pro and generate missing metadata across your site · ${proPrice}/month` }
                    </p>

                    {/* Checkout confidence signals — right beside the button */}
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 16px', margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
                        {trust.map( ( t, i ) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <Icon name="check" size={12} strokeWidth={2.6} style={{ color: 'var(--ok-ink)' }}/> {t}
                            </span>
                        ) )}
                    </div>
                </div>

                {/* ── Section 2: Benefits + time-saving comparison ── */}
                <div className="bbt-pw__section" style={{ padding: '20px 40px 4px' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 0 10px' }}>Why upgrade?</div>
                    <div className="bbt-pw__why" style={{ marginBottom: 14 }}>
                        {why.map( ( t, i ) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-2)', fontWeight: 500, lineHeight: 1.4 }}>
                                <Icon name="check" size={14} strokeWidth={2.6} style={{ color: 'var(--ok-ink)', flexShrink: 0, marginTop: 1 }}/> {t}
                            </span>
                        ) )}
                    </div>

                    {/* Manual vs BeepBeep — the time-saving punchline */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: R, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRight: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Manual optimisation</div>
                            <div style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 600 }}>100 pages = 2–4 hours</div>
                        </div>
                        <div style={{ padding: '12px 16px', background: 'var(--ok-soft)' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ok-ink)', marginBottom: 4 }}>BeepBeep AI</div>
                            <div style={{ fontSize: 14, color: 'var(--ok-ink)', fontWeight: 700 }}>100 pages = under 2 minutes</div>
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Pricing (Pro dominant) ── */}
                <div className="bbt-pw__section" style={{ padding: '22px 40px 4px' }}>
                    <div className="bbt-pw__plans">
                        {/* Free — current plan, intentionally quietest (trial tier) */}
                        <div className="bbt-pw__plan bbt-pw__plan--free" style={{ border: '1px solid var(--hairline)', background: 'var(--bg-sunken)', opacity: 0.85 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Current plan</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-3)' }}>Free</div>
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[ `${ fmtCount( freeLimit ) } generations per month`, 'Manual generation', 'Basic optimisation' ].map( ( f, i ) => (
                                    <div key={i} style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.4 }}>{f}</div>
                                ) )}
                            </div>
                        </div>

                        {/* Starter — lower-friction entry point, deliberately quieter */}
                        <div className="bbt-pw__plan bbt-pw__plan--starter" style={{ border: '1px solid var(--border)', background: 'var(--surface)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: -10, left: 16, background: 'var(--bg-sunken)', color: 'var(--text-3)', border: '1px solid var(--border)', fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.04em' }}>GOOD FOR SMALL SITES</div>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8, marginTop: 4 }}>Starter</div>
                            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>{starterPrice}<span style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 400 }}> /mo</span></div>
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[ `${ fmtCount( starterQuota ) } SEO generations every month`, 'No daily limits', 'Great for bloggers and small business sites' ].map( ( f, i ) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4 }}>
                                        <Icon name="check" size={12} strokeWidth={2.4} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }}/> {f}
                                    </div>
                                ) )}
                            </div>
                        </div>

                        {/* Pro — dominant, recommended */}
                        <div className="bbt-pw__plan bbt-pw__plan--pro" style={{ border: '2.5px solid var(--primary)', background: 'var(--surface)', boxShadow: '0 14px 36px rgba(37,99,235,0.18)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: -12, left: 18, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, letterSpacing: '0.05em' }}>⭐ MOST POPULAR</div>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary-ink)', marginBottom: 8 }}>Pro</div>
                            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{proPrice}<span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}> /mo</span></div>
                            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', background: 'var(--primary)', color: '#fff', borderRadius: 8, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, lineHeight: 1.25 }}>
                                <Icon name="trend" size={12} strokeWidth={2.4}/>
                                For only {monthlyExtra} more than Starter
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {[ `${ capacityMult }× more SEO generations (${ fmtCount( proQuota ) }/mo)`, 'Auto-generate SEO metadata on publish', 'Bulk optimise your entire website', 'Priority processing', 'Shared across all BeepBeep plugins' ].map( ( f, i ) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--text)', fontWeight: i === 0 ? 600 : 500, lineHeight: 1.4 }}>
                                        <Icon name="check" size={13} strokeWidth={2.6} style={{ color: 'var(--primary-ink)', flexShrink: 0, marginTop: 1 }}/> {f}
                                    </div>
                                ) )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Starter → Pro comparison banner (large, visual) ── */}
                <div className="bbt-pw__section" style={{ padding: '20px 40px 4px' }}>
                    <div style={{ borderRadius: R, background: 'var(--primary-soft)', border: '1px solid var(--primary-border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Starter</div>
                            <div className="mono tnum" style={{ fontSize: 26, color: 'var(--text-2)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{fmtCount( starterQuota )}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>generations · {starterPrice}/mo</div>
                        </div>
                        <Icon name="arrow-right" size={26} strokeWidth={2.4} style={{ color: 'var(--primary)' }}/>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 10.5, color: 'var(--primary-ink)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pro</div>
                            <div className="mono tnum" style={{ fontSize: 34, color: 'var(--primary-ink)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{fmtCount( proQuota )}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--primary-ink)', fontWeight: 500 }}>generations · {proPrice}/mo</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: 'var(--primary)', borderRadius: 999, padding: '5px 14px' }}>{capacityMult}× more optimisation</div>
                            <div style={{ fontSize: 12, color: 'var(--primary-ink)', fontWeight: 700, marginTop: 6 }}>Only {monthlyExtra} more per month</div>
                        </div>
                    </div>
                </div>

                {/* ── Section 4: Secondary actions — quieter Starter + credit top-up ── */}
                <div className="bbt-pw__section" style={{ padding: '20px 40px 0' }}>
                    {starterPlan && (
                        <Button variant="secondary" size="md" full onClick={onStarter} disabled={!starterAvailable} style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border-strong)', fontSize: 13.5 }}>
                            {starterAvailable ? `Or start with Starter · ${starterPrice}/month` : 'Starter temporarily unavailable'}
                        </Button>
                    )}

                    {/* Secondary purchase paths tucked away so they never dilute the CTA */}
                    {creditsPlan && creditsAvailable && (
                        <div style={{ textAlign: 'center', marginTop: 14 }}>
                            <button onClick={() => setShowMore( v => !v )} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: 'var(--text-3)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                More options <Icon name={showMore ? 'chevron-down' : 'chevron-right'} size={13} strokeWidth={2.2}/>
                            </button>
                            {showMore && (
                                <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
                                    Need a one-off top-up?{' '}
                                    <button onClick={onCredits} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12.5, color: 'var(--primary-ink)', fontWeight: 600 }}>
                                        Buy {fmtCount( creditsQuota )} credits for {creditsPrice}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Section 5: Social proof ── */}
                <div className="bbt-pw__section" style={{ padding: '18px 40px 32px', marginTop: 16, borderTop: '1px solid var(--hairline)', textAlign: 'center' }}>
                    <div aria-hidden="true" style={{ fontSize: 14, letterSpacing: 2, color: '#F59E0B', marginBottom: 6 }}>★★★★★</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5, maxWidth: 460, margin: '0 auto' }}>
                        Trusted by WordPress site owners, bloggers and WooCommerce stores to automate SEO optimisation.
                    </div>
                </div>
            </div>
        </Modal>
    );
};
