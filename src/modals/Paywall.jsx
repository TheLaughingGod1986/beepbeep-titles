import { useState, useEffect } from 'react';
import { Icon, Button } from '../components';
import { Modal } from './Modal';
import { fetchPlans } from '../api';
import {
    CREDITS_PER_PAGE,
    creditsPerPage,
    isInsufficientCredits,
    insufficientCreditsMessage,
    QUOTA_DEFAULTS,
} from '../quota';

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
export const Paywall = ({ open, onClose, trigger = 'default', entitlement, stats, connected = true, onCheckout, onUpgrade, onBuyCredits, onConnect }) => {
    const [plans, setPlans] = useState( null );
    const [plansLoading, setPlansLoading] = useState( false );
    const [checkoutBusy, setCheckoutBusy] = useState( null ); // 'pro' | 'starter' | 'credits' | null
    const [showMore, setShowMore] = useState( false );

    // Pull live Stripe-backed pricing so the modal can never drift.
    useEffect( () => {
        if ( !open ) {
            setCheckoutBusy( null );
            return;
        }
        if ( plans ) return;
        let alive = true;
        setPlansLoading( true );
        fetchPlans()
            .then( res => { if ( alive ) setPlans( res?.plans || [] ); } )
            .catch( () => { if ( alive ) setPlans( [] ); } )
            .finally( () => { if ( alive ) setPlansLoading( false ); } );
        return () => { alive = false; };
    }, [open, plans] );

    const missingTitles = Number.isFinite( stats?.missing_title ) ? stats.missing_title : null;
    const missingMeta   = Number.isFinite( stats?.missing_meta ) ? stats.missing_meta : null;

    const handleClose = () => {
        onClose?.();
    };

    if ( !open ) return null;

    const starterPlan  = ( plans || [] ).find( p => p.id === 'starter' );
    const proPlan      = ( plans || [] ).find( p => p.id === 'pro' || p.id === 'growth' );
    const creditsPlan  = ( plans || [] ).find( p => p.id === 'credits' );
    // Prefer live catalog prices; only fall back once the fetch finished empty
    // so we never flash a stale hardcoded amount over a different Stripe price.
    const starterPrice = starterPlan
        ? fmtPrice( starterPlan.price, starterPlan.currency )
        : ( plansLoading ? '…' : '£4.99' );
    const starterQuota = starterPlan?.quota || 100;
    const proPrice     = proPlan
        ? fmtPrice( proPlan.price, proPlan.currency )
        : ( plansLoading ? '…' : '£12.99' );
    const proQuota     = proPlan?.quota || 1000;
    const creditsPrice = creditsPlan ? fmtPrice( creditsPlan.price, creditsPlan.currency ) : '£9.99';
    const creditsQuota = creditsPlan?.quota || 100;
    // The backend flags a plan `available:false` (and drops its priceId) when its
    // Stripe price can't be retrieved — don't offer a CTA that would dead-end at
    // checkout. Only an explicit false disables; absent/true stays clickable.
    const proAvailable     = proPlan?.available !== false;
    const starterAvailable = starterPlan?.available !== false;
    const creditsAvailable = creditsPlan?.available !== false;
    // Free allowance comes from the live entitlement (currently 25), never hard-coded.
    const freeLimit    = Number.isFinite( entitlement?.token_limit ) ? entitlement.token_limit : QUOTA_DEFAULTS.monthly_limit;

    // Feature gates: Continuous Optimisation is Pro-only; Autopilot screen is paid (Starter/Pro).
    const continuousOptGate = trigger === 'continuous-optimisation';
    const autopilotGate     = trigger === 'autopilot';
    const featureGate       = continuousOptGate || autopilotGate;

    // Quota-triggered paywall: distinguish "out of credits" from "not enough for
    // this action" (e.g. 1 remaining when each page costs 2 for title + meta).
    const remainingCredits = Number.isFinite( Number( entitlement?.credits_remaining ) )
        ? Number( entitlement.credits_remaining )
        : null;
    const pageCost = creditsPerPage( entitlement ) || CREDITS_PER_PAGE;
    const quotaTrigger = trigger === 'daily-limit' || trigger === 'monthly-limit' || trigger === 'bulk';
    const showInsufficient = ! featureGate
        && quotaTrigger
        && remainingCredits != null
        && isInsufficientCredits( remainingCredits, pageCost );

    // Pro-vs-Starter value framing, derived from live prices/quotas.
    const monthlyExtra = ( proPlan && starterPlan && proPlan.price > starterPlan.price )
        ? fmtPrice( Math.round( ( proPlan.price - starterPlan.price ) * 100 ) / 100, proPlan.currency )
        : ( plansLoading ? '…' : '£8' );
    const capacityMult = ( proQuota && starterQuota ) ? Math.max( 2, Math.round( proQuota / starterQuota ) ) : 10;

    const checkout = ( planId ) => {
        if ( checkoutBusy ) return;
        if ( ! connected ) {
            onConnect?.();
            return;
        }
        const plan = ( plans || [] ).find( p => p.id === planId || ( planId === 'pro' && p.id === 'growth' ) );
        const checkoutArgs = plan?.priceId
            ? { plan: planId, priceId: plan.priceId }
            : { plan: planId };
        setCheckoutBusy( planId );
        // Clear the busy flag if the opener stays on this screen (failure toast /
        // portal). Success navigates away via Stripe so unmount covers it.
        const clearBusy = () => setCheckoutBusy( null );
        window.setTimeout( clearBusy, 12000 );
        if ( typeof onCheckout === 'function' ) { onCheckout( checkoutArgs ); return; }
        if ( planId === 'credits' && onBuyCredits ) { onBuyCredits(); clearBusy(); return; }
        if ( onUpgrade ) { onUpgrade(); clearBusy(); }
    };
    const needsSignIn = ! connected;
    const onPro     = () => checkout( 'pro' );
    const onStarter = () => checkout( 'starter' );
    const onCredits = () => checkout( 'credits' );

    const showScanGaps = ! featureGate
        && ( missingTitles !== null || missingMeta !== null )
        && ( ( missingTitles || 0 ) > 0 || ( missingMeta || 0 ) > 0 );
    // Total detected issues drives the dynamic, problem-framed primary CTA.
    const totalIssues   = ( missingTitles || 0 ) + ( missingMeta || 0 );
    const issuePlural   = totalIssues === 1 ? 'Issue' : 'Issues';

    const R = 16; // card / surface radius

    // ROI framing — users buy time saved, not generations.
    const why = continuousOptGate
        ? [
            'Continuously optimise newly published pages',
            'Generate SEO titles and descriptions automatically',
            'Save hours of manual editing',
            'Priority processing on Pro',
        ]
        : autopilotGate
            ? [
                'Configure tone, length, and custom instructions',
                'Auto-generate titles and meta on publish',
                'Hands-off SEO for every new page',
                'Available on Starter and Pro',
            ]
            : [
                'Generate SEO titles and descriptions in seconds',
                'Save hours of manual editing',
                'Improve search visibility',
                'Use credits with manual, bulk, or Continuous Optimisation',
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
            <div className="beepti-pw" style={{ position: 'relative' }}>
                <button onClick={handleClose} aria-label="Close" style={{ position: 'absolute', top: 18, right: 18, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 999, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', zIndex: 2 }}>
                    <Icon name="x" size={14}/>
                </button>

                {/* ── Section 1: Headline → Issue Summary → SEO Impact → CTA (above the fold) ── */}
                <div className="beepti-pw__section" style={{ padding: '36px 40px 4px' }}>
                    <h2 style={{ fontSize: 25, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 8px', maxWidth: 560 }}>
                        {continuousOptGate
                            ? 'Continuous Optimisation needs Pro'
                            : autopilotGate
                                ? 'Autopilot / hands-off SEO needs a paid subscription'
                                : showInsufficient
                                    ? 'Not enough credits for this page'
                                    : showScanGaps
                                        ? 'We found SEO issues on your site'
                                        : 'Add OpptiAI service credits'}
                    </h2>
                    <p style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.5, margin: '0 0 16px', maxWidth: 580 }}>
                        {continuousOptGate
                            ? <>A paid Pro subscription unlocks automatic optimisation for newly published pages. Upgrade to Pro to enable Continuous Optimisation.</>
                            : autopilotGate
                                ? <>Hands-off page SEO — tone, length, custom instructions, and auto-generate on publish — requires a Starter or Pro subscription.</>
                                : showInsufficient
                                    ? insufficientCreditsMessage( remainingCredits, pageCost )
                                    : showScanGaps
                                        ? <>Some of your content is missing SEO metadata. OpptiAI service credits can be used for manual, bulk, or Continuous Optimisation requests.</>
                                        : <>Choose the external-service credit allowance that fits your expected AI generation volume. Local scanning and editing remain available on every plan.</> }
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
                                        <span><span className="mono tnum" style={{ fontWeight: 700 }}>{fmtCount( missingTitles )}</span> missing SEO titles</span>
                                    </div>
                                )}
                                {( missingMeta || 0 ) > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--warn-border)', borderRadius: 10, padding: '9px 11px' }}>
                                        <Icon name="alert" size={15} style={{ color: 'var(--warn-ink)', flexShrink: 0 }}/>
                                        <span><span className="mono tnum" style={{ fontWeight: 700 }}>{fmtCount( missingMeta )}</span> missing meta descriptions</span>
                                    </div>
                                )}
                            </div>
                            {/* SEO impact — subtle, non-alarmist */}
                            <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--warn-ink)', lineHeight: 1.45, margin: '12px 0 0' }}>
                                <Icon name="trend" size={15} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }}/>
                                <span>Content without titles and descriptions may not appear optimally in Google Search, lowering click-through and making it harder to rank.</span>
                            </p>
                        </div>
                    )}

                    {/* ── Primary action — problem-framed dynamic CTA, kept above the fold ── */}
                    <Button variant="pro" size="lg" full icon={needsSignIn ? 'user' : 'zap'} onClick={onPro} disabled={(!proAvailable && !needsSignIn) || !!checkoutBusy || plansLoading} style={{ paddingTop: 15, paddingBottom: 15, fontSize: 16 }}>
                        {!proAvailable && !needsSignIn
                            ? 'Pro temporarily unavailable'
                            : needsSignIn
                                ? 'Sign in to upgrade'
                                : checkoutBusy === 'pro'
                                    ? 'Opening Stripe Checkout…'
                                    : plansLoading
                                        ? 'Loading Pro pricing…'
                                        : `Choose Pro Service Capacity · ${proPrice}/month` }
                    </Button>
                    <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-3)', margin: '8px 0 0', lineHeight: 1.5 }}>
                        {!proAvailable && !needsSignIn
                            ? 'This plan is being updated. Please try again shortly or contact support.'
                            : needsSignIn
                                ? 'Create a free account or sign in, then choose Starter or Pro at checkout.'
                                : 'Adds remote AI generation credits. All local plugin features remain available on every service plan.' }
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
                <div className="beepti-pw__section" style={{ padding: '20px 40px 4px' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 0 10px' }}>Why upgrade?</div>
                    <div className="beepti-pw__why" style={{ marginBottom: 14 }}>
                        {why.map( ( t, i ) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-2)', fontWeight: 500, lineHeight: 1.4 }}>
                                <Icon name="check" size={14} strokeWidth={2.6} style={{ color: 'var(--ok-ink)', flexShrink: 0, marginTop: 1 }}/> {t}
                            </span>
                        ) )}
                    </div>

                    {/* Manual vs OpptiAI — the time-saving punchline */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: R, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRight: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Manual optimisation</div>
                            <div style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 600 }}>100 pages &amp; posts = 2–4 hours</div>
                        </div>
                        <div style={{ padding: '12px 16px', background: 'var(--ok-soft)' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ok-ink)', marginBottom: 4 }}>OpptiAI</div>
                            <div style={{ fontSize: 14, color: 'var(--ok-ink)', fontWeight: 700 }}>100 pages &amp; posts = under 2 minutes</div>
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Pricing (Pro dominant) ── */}
                <div className="beepti-pw__section" style={{ padding: '22px 40px 4px' }}>
                    <div className="beepti-pw__plans">
                        {/* Free — current plan, intentionally quietest (trial tier) */}
                        <div className="beepti-pw__plan beepti-pw__plan--free" style={{ border: '1px solid var(--hairline)', background: 'var(--bg-sunken)', opacity: 0.85 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Current plan</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-3)' }}>Free</div>
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[ `${ fmtCount( freeLimit ) } generations per month`, 'Manual generation', 'Basic optimisation' ].map( ( f, i ) => (
                                    <div key={i} style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.4 }}>{f}</div>
                                ) )}
                            </div>
                        </div>

                        {/* Starter — lower-friction entry point, deliberately quieter */}
                        <div
                            className="beepti-pw__plan beepti-pw__plan--starter"
                            role="button"
                            tabIndex={0}
                            onClick={ () => { if ( starterAvailable || needsSignIn ) onStarter(); } }
                            onKeyDown={ ( e ) => { if ( e.key === 'Enter' || e.key === ' ' ) { e.preventDefault(); if ( starterAvailable || needsSignIn ) onStarter(); } } }
                            style={{ border: '1px solid var(--border)', background: 'var(--surface)', position: 'relative', cursor: ( starterAvailable || needsSignIn ) && !checkoutBusy ? 'pointer' : 'default' }}
                        >
                            <div style={{ position: 'absolute', top: -10, left: 16, background: 'var(--bg-sunken)', color: 'var(--text-3)', border: '1px solid var(--border)', fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.04em' }}>GOOD FOR SMALL SITES</div>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8, marginTop: 4 }}>Starter</div>
                            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>{starterPrice}<span style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 400 }}> /mo</span></div>
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[ `${ fmtCount( starterQuota ) } SEO generations every month`, 'Use credits manually or in bulk', 'Great for bloggers and small business sites' ].map( ( f, i ) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4 }}>
                                        <Icon name="check" size={12} strokeWidth={2.4} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }}/> {f}
                                    </div>
                                ) )}
                            </div>
                        </div>

                        {/* Pro — dominant, recommended */}
                        <div
                            className="beepti-pw__plan beepti-pw__plan--pro"
                            role="button"
                            tabIndex={0}
                            onClick={ () => { if ( proAvailable || needsSignIn ) onPro(); } }
                            onKeyDown={ ( e ) => { if ( e.key === 'Enter' || e.key === ' ' ) { e.preventDefault(); if ( proAvailable || needsSignIn ) onPro(); } } }
                            style={{ border: '2.5px solid var(--primary)', background: 'var(--surface)', boxShadow: '0 14px 36px rgba(37,99,235,0.18)', position: 'relative', cursor: ( proAvailable || needsSignIn ) && !checkoutBusy ? 'pointer' : 'default' }}
                        >
                            <div style={{ position: 'absolute', top: -12, left: 18, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999, letterSpacing: '0.05em' }}>⭐ MOST POPULAR</div>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary-ink)', marginBottom: 8 }}>Pro</div>
                            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{proPrice}<span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}> /mo</span></div>
                            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', background: 'var(--primary)', color: '#fff', borderRadius: 8, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, lineHeight: 1.25 }}>
                                <Icon name="trend" size={12} strokeWidth={2.4}/>
                                For only {monthlyExtra} more than Starter
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {[ `${ capacityMult }× more SEO generations (${ fmtCount( proQuota ) }/mo)`, 'Continuous Optimisation for new pages', 'Priority processing', 'Shared across all OpptiAI plugins' ].map( ( f, i ) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--text)', fontWeight: i === 0 ? 600 : 500, lineHeight: 1.4 }}>
                                        <Icon name="check" size={13} strokeWidth={2.6} style={{ color: 'var(--primary-ink)', flexShrink: 0, marginTop: 1 }}/> {f}
                                    </div>
                                ) )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Starter → Pro comparison banner (large, visual) ── */}
                <div className="beepti-pw__section" style={{ padding: '20px 40px 4px' }}>
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
                <div className="beepti-pw__section" style={{ padding: '20px 40px 0' }}>
                    {starterPlan && (
                        <Button variant="secondary" size="md" full onClick={onStarter} disabled={(!starterAvailable && !needsSignIn) || !!checkoutBusy || plansLoading} style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border-strong)', fontSize: 13.5 }}>
                            {needsSignIn
                                ? 'Sign in to view Starter'
                                : checkoutBusy === 'starter'
                                    ? 'Opening Stripe Checkout…'
                                    : starterAvailable ? `Or start with Starter · ${starterPrice}/month` : 'Starter temporarily unavailable'}
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
                <div className="beepti-pw__section" style={{ padding: '18px 40px 32px', marginTop: 16, borderTop: '1px solid var(--hairline)', textAlign: 'center' }}>
                    <div aria-hidden="true" style={{ fontSize: 14, letterSpacing: 2, color: '#F59E0B', marginBottom: 6 }}>★★★★★</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5, maxWidth: 460, margin: '0 auto' }}>
                        Trusted by WordPress site owners, bloggers and WooCommerce stores to automate SEO optimisation.
                    </div>
                </div>
            </div>
        </Modal>
    );
};
