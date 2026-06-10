import { Icon, Pill, Button } from '../components';
import { Modal } from './Modal';

/* ── Paywall ───────────────────────────────────────────────────────── */
const countdownToReset = ( entitlement, trigger ) => {
    if ( trigger === 'monthly-limit' && entitlement?.reset_date ) {
        const resetMs = new Date( entitlement.reset_date ).getTime();
        const days    = Math.max( 1, Math.ceil( ( resetMs - Date.now() ) / 86400000 ) );
        return `Free credits reset in ${days} day${days === 1 ? '' : 's'}.`;
    }
    if ( trigger === 'daily-limit' ) {
        // Daily quota resets at the next UTC midnight.
        const now  = new Date();
        const next = Date.UTC( now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0 );
        const mins = Math.max( 1, Math.round( ( next - now.getTime() ) / 60000 ) );
        const h    = Math.floor( mins / 60 );
        const m    = mins % 60;
        const span = h > 0 ? `${h}h ${m}m` : `${m}m`;
        const n    = entitlement?.daily_limit;
        return n ? `Your next ${n} unlock in ${span}.` : `Your free generations reset in ${span}.`;
    }
    return null;
};

export const Paywall = ({ open, onClose, trigger, entitlement, onUpgrade, onBuyCredits }) => {
    if ( !open ) return null;
    const dynamicUrgency = countdownToReset( entitlement, trigger );
    const triggers = {
        'daily-limit':   { icon: 'clock',   title: "You've used today's free generations",     subtitle: "Pro lifts the daily allowance so you never have to wait — keep optimising every day.",     urgency: dynamicUrgency || 'Your free generations reset overnight.' },
        'monthly-limit': { icon: 'alert',   title: "You've reached this month's free limit",   subtitle: "Pro keeps your site improving without limits.",                                              urgency: dynamicUrgency || 'Free credits reset at the start of next month.' },
        'auto-feature':  { icon: 'zap',     title: 'Let BeepBeep Titles handle title & meta',  subtitle: 'Every new page you publish gets title & meta automatically.',                               urgency: 'Set it once. Never think about it again.' },
        'bulk':          { icon: 'library', title: 'Optimise your entire site in minutes',     subtitle: 'Catch up on every page with missing title & meta in one pass.',                             urgency: null },
        'default':       { icon: 'crown',   title: 'Never worry about missing meta again',    subtitle: 'Continuous, automated page SEO for your WordPress site.',                                    urgency: null },
    };
    const t = triggers[trigger] || triggers.default;

    return (
        <Modal open={open} onClose={onClose} width={680}>
            <div style={{ position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 999, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', zIndex: 2 }}>
                    <Icon name="x" size={14}/>
                </button>

                <div style={{ padding: '28px 32px 22px', background: 'linear-gradient(135deg,#F3F7FE 0%,#EEF0FE 100%)', borderBottom: '1px solid var(--primary-border)', borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: 'linear-gradient(180deg,#2563EB 0%,#1D4ED8 100%)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.28)' }}>
                            <Icon name={t.icon} size={22}/>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Pill tone="primary" icon="crown">BeepBeep Titles Pro</Pill>
                            <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '8px 0 6px' }}>{t.title}</h2>
                            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>{t.subtitle}</p>
                            {t.urgency && (
                                <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--warn-ink)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <Icon name="clock" size={13}/>{t.urgency}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '24px 32px 8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <PlanColumn title="Free" subtitle="What you have today" features={[
                            { ok: true,  text: '5 AI generations per day' },
                            { ok: true,  text: 'Up to 50 AI generations per month' },
                            { ok: true,  text: 'Site crawling' },
                            { ok: false, text: 'Auto-generate on publish' },
                            { ok: false, text: 'Bulk site optimisation' },
                            { ok: false, text: 'Background monitoring' },
                        ]}/>
                        <PlanColumn title="Pro" subtitle="$14.99 / month" features={[
                            { ok: true, text: 'Unlimited AI generations',         strong: true },
                            { ok: true, text: 'Never worry about missing meta',   strong: true },
                            { ok: true, text: 'Optimise your entire site',        strong: true },
                            { ok: true, text: 'Automatic monitoring',             strong: true },
                            { ok: true, text: 'See your site improving weekly' },
                            { ok: true, text: 'Works across multiple sites' },
                        ]} highlight/>
                    </div>
                </div>

                <div style={{ padding: '16px 32px 28px' }}>
                    <Button variant="pro" size="lg" full icon="crown" onClick={onUpgrade}>Upgrade to Pro · $14.99/mo</Button>
                    {onBuyCredits && (
                        <button onClick={onBuyCredits} style={{ width: '100%', marginTop: 10, background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                            <Icon name="zap" size={14}/> Or buy a one-time credit pack · $11.99 for 100 credits
                        </button>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--text-3)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11}/> Secure Stripe checkout</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11}/> Cancel anytime</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11}/> Shared across your BeepBeep plugins</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const PlanColumn = ({ title, subtitle, features, highlight }) => (
    <div style={{ padding: '16px 18px', border: `1px solid ${highlight ? 'var(--primary)' : 'var(--border)'}`, background: highlight ? 'var(--surface)' : 'var(--surface-2)', borderRadius: 'var(--r-md)', boxShadow: highlight ? '0 4px 12px rgba(37,99,235,0.14)' : 'none', position: 'relative' }}>
        {highlight && <div style={{ position: 'absolute', top: -10, right: 12, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.04em' }}>RECOMMENDED</div>}
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, marginBottom: 12 }}>{subtitle}</div>
        {features.map( ( f, i ) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', alignItems: 'center' }}>
                <Icon name={f.ok ? 'check' : 'x'} size={13} strokeWidth={2.5} style={{ color: f.ok ? 'var(--ok-ink)' : 'var(--text-3)', opacity: f.ok ? 1 : 0.5 }}/>
                <span style={{ fontSize: 12.5, color: f.ok ? 'var(--text)' : 'var(--text-3)', opacity: f.ok ? 1 : 0.7, fontWeight: f.strong ? 600 : 400 }}>{f.text}</span>
            </div>
        ) )}
    </div>
);
