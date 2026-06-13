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
   Problem first → value → pricing (Pro dominant) → ROI → single primary
   CTA → secondary links → social proof. Prices come live from the backend
   /billing/plans catalog so they always match Stripe. */
export const Paywall = ({ open, onClose, entitlement, stats, onCheckout, onUpgrade, onBuyCredits }) => {
    const [plans, setPlans] = useState( null );

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

    const eventProps = {
        missing_titles_count: missingTitles,
        missing_meta_count:   missingMeta,
        site_size:            siteSize,
        current_plan:         currentPlan,
        plugin_name:          PLUGIN,
    };

    // One "viewed" event per open.
    useEffect( () => {
        if ( open ) track( 'titles_upgrade_modal_viewed', eventProps );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open] );

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
    // Free allowance comes from the live entitlement (currently 15), never hard-coded.
    const freeLimit    = Number.isFinite( entitlement?.token_limit ) ? entitlement.token_limit : 15;

    const checkout = ( planId ) => {
        if ( typeof onCheckout === 'function' ) { onCheckout( planId ); return; }
        if ( planId === 'credits' && onBuyCredits ) { onBuyCredits(); return; }
        if ( onUpgrade ) onUpgrade();
    };
    const onPro     = () => { track( 'titles_pro_cta_clicked', eventProps ); checkout( 'pro' ); };
    const onStarter = () => { track( 'titles_starter_link_clicked', eventProps ); checkout( 'starter' ); };
    const onCredits = () => { track( 'titles_credit_pack_clicked', eventProps ); checkout( 'credits' ); };

    const showScanGaps = ( missingTitles !== null || missingMeta !== null )
        && ( ( missingTitles || 0 ) > 0 || ( missingMeta || 0 ) > 0 );

    const R = 16; // card / surface radius
    const trust = [
        'Improve search visibility',
        'Save hours of manual editing',
        'Works with your existing SEO plugin',
    ];

    return (
        <Modal open={open} onClose={onClose} width={760}>
            <div className="bbt-pw" style={{ position: 'relative' }}>
                <style>{`
                    .bbt-pw__plans { display:grid; grid-template-columns: 1fr 1fr 1.18fr; gap:14px; align-items:stretch; }
                    .bbt-pw__plan { border-radius:${R}px; padding:18px 18px 20px; display:flex; flex-direction:column; }
                    .bbt-pw__plan--pro { transform: scale(1.02); }
                    @media (max-width: 640px) {
                        .bbt-pw__plans { display:flex; flex-direction:column; gap:12px; }
                        .bbt-pw__plan--pro { order:1; transform:none; }
                        .bbt-pw__plan--free { order:2; }
                        .bbt-pw__plan--starter { order:3; }
                    }
                `}</style>

                <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 18, right: 18, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 999, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', zIndex: 2 }}>
                    <Icon name="x" size={14}/>
                </button>

                {/* ── Section 1: Problem first ── */}
                <div style={{ padding: '40px 40px 8px' }}>
                    <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 10px', maxWidth: 520 }}>
                        Fix missing SEO metadata in minutes
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 20px', maxWidth: 560 }}>
                        Automatically generate SEO-optimised titles and meta descriptions for your pages, posts and WooCommerce products.
                    </p>

                    {showScanGaps ? (
                        <div style={{ borderRadius: R, border: '1px solid var(--warn-border)', background: 'var(--warn-soft)', padding: '16px 18px', marginBottom: 18 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--warn-ink)', marginBottom: 10 }}>Your site scan found</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {( missingTitles || 0 ) > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: 'var(--text)' }}>
                                        <Icon name="alert" size={15} style={{ color: 'var(--warn-ink)', flexShrink: 0 }}/>
                                        <span><span className="mono tnum" style={{ fontWeight: 600 }}>{fmtCount( missingTitles )}</span> pages missing titles</span>
                                    </div>
                                )}
                                {( missingMeta || 0 ) > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: 'var(--text)' }}>
                                        <Icon name="alert" size={15} style={{ color: 'var(--warn-ink)', flexShrink: 0 }}/>
                                        <span><span className="mono tnum" style={{ fontWeight: 600 }}>{fmtCount( missingMeta )}</span> pages missing meta descriptions</span>
                                    </div>
                                )}
                            </div>
                            <div style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: 12 }}>BeepBeep Titles Pro can fix these automatically.</div>
                        </div>
                    ) : (
                        <div style={{ borderRadius: R, border: '1px solid var(--border)', background: 'var(--surface-2)', padding: '16px 18px', marginBottom: 18 }}>
                            <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55, margin: 0 }}>
                                Many WordPress sites are missing titles and meta descriptions that help search engines understand content. Generate them automatically with BeepBeep Titles Pro.
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                        {trust.map( ( t, i ) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--ok-ink)', fontWeight: 500 }}>
                                <Icon name="check" size={13} strokeWidth={2.6}/> {t}
                            </span>
                        ) )}
                    </div>
                </div>

                {/* ── Section 2: Pricing (Pro dominant) ── */}
                <div style={{ padding: '22px 40px 4px' }}>
                    <div className="bbt-pw__plans">
                        {/* Free — current plan, muted */}
                        <div className="bbt-pw__plan bbt-pw__plan--free" style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Current plan</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>Free</div>
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[ `${ fmtCount( freeLimit ) } generations per month`, 'Manual generation', 'Basic optimisation' ].map( ( f, i ) => (
                                    <div key={i} style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.4 }}>{f}</div>
                                ) )}
                            </div>
                        </div>

                        {/* Starter — secondary, neutral */}
                        <div className="bbt-pw__plan bbt-pw__plan--starter" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Starter</div>
                            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>{starterPrice}<span style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 400 }}> /mo</span></div>
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[ `${ fmtCount( starterQuota ) } generations per month`, 'No daily limits', 'Great for small websites' ].map( ( f, i ) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: 'var(--text-2)' }}>
                                        <Icon name="check" size={12} strokeWidth={2.4} style={{ color: 'var(--text-3)', flexShrink: 0 }}/> {f}
                                    </div>
                                ) )}
                            </div>
                        </div>

                        {/* Pro — dominant */}
                        <div className="bbt-pw__plan bbt-pw__plan--pro" style={{ border: '2px solid var(--primary)', background: 'var(--surface)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: -11, left: 18, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, letterSpacing: '0.05em' }}>BEST VALUE</div>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary-ink)', marginBottom: 8 }}>Pro</div>
                            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{proPrice}<span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}> /mo</span></div>
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{fmtCount( proQuota )} SEO generations every month</div>
                                {[ 'Auto-generate on publish', 'Bulk optimise your entire website', 'Fix hundreds of pages in minutes', 'Shared across all BeepBeep plugins', 'Priority processing' ].map( ( f, i ) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: 'var(--text)' }}>
                                        <Icon name="check" size={12} strokeWidth={2.6} style={{ color: 'var(--primary-ink)', flexShrink: 0 }}/> {f}
                                    </div>
                                ) )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 3: ROI ── */}
                <div style={{ padding: '20px 40px 4px' }}>
                    <div style={{ borderRadius: R, background: 'var(--primary-soft)', border: '1px solid var(--primary-border)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 200 }}>
                            <Icon name="clock" size={18} style={{ color: 'var(--text-3)', flexShrink: 0 }}/>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Manual optimisation</div>
                                <div style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>3–5 minutes per page</div>
                            </div>
                        </div>
                        <Icon name="arrow-right" size={16} style={{ color: 'var(--primary-ink)' }}/>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 200 }}>
                            <Icon name="zap" size={18} style={{ color: 'var(--primary-ink)', flexShrink: 0 }}/>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--primary-ink)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>With BeepBeep Titles Pro</div>
                                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>Optimise hundreds of pages in minutes</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 4: Primary CTA ── */}
                <div style={{ padding: '20px 40px 0' }}>
                    <Button variant="pro" size="lg" full icon="crown" onClick={onPro} style={{ paddingTop: 14, paddingBottom: 14, fontSize: 15 }}>
                        Start Optimising My Site · {proPrice}/month
                    </Button>

                    {/* ── Section 5: Secondary options (text links) ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 14 }}>
                        {starterPlan && (
                            <button onClick={onStarter} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12.5, color: 'var(--text-2)' }}>
                                Need fewer generations? <span style={{ color: 'var(--primary-ink)', fontWeight: 600 }}>Start with Starter ({starterPrice}/month)</span>
                            </button>
                        )}
                        {creditsPlan && (
                            <button onClick={onCredits} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12.5, color: 'var(--text-3)' }}>
                                Or buy a one-time credit pack — <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{fmtCount( creditsQuota )} credits for {creditsPrice}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Section 6: Social proof ── */}
                <div style={{ padding: '20px 40px 32px', marginTop: 16, borderTop: '1px solid var(--hairline)', textAlign: 'center' }}>
                    <div aria-hidden="true" style={{ fontSize: 14, letterSpacing: 2, color: '#F59E0B', marginBottom: 6 }}>★★★★★</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5, maxWidth: 460, margin: '0 auto' }}>
                        Trusted by WordPress site owners, bloggers, agencies and WooCommerce stores.
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--text-3)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11}/> Secure Stripe checkout</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11}/> Cancel anytime</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
