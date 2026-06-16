import { useState, useEffect, useCallback } from 'react';
import { Icon, Card, Pill, Button, Divider } from '../components';
import { fetchBillingHealth, fetchBillingInfo } from '../api';
import { readCheckoutTelemetry } from '../billingTelemetry';

/* Admin-only billing diagnostics. Lets support/dev diagnose upgrade issues
   without opening Stripe, Supabase, or backend logs. Read-only — no checkout,
   pricing, or entitlement behaviour is triggered here beyond an explicit
   entitlement refresh. */

const fmtTs = ( ts ) => {
    if ( ! ts ) return '—';
    const d = typeof ts === 'number' ? new Date( ts ) : new Date( String( ts ) );
    return Number.isNaN( d.getTime() ) ? String( ts ) : d.toLocaleString();
};
// First present, non-empty value across candidate keys on the merged sources.
const pick = ( sources, keys ) => {
    for ( const src of sources ) {
        if ( ! src ) continue;
        for ( const k of keys ) {
            const v = src[ k ];
            if ( v !== undefined && v !== null && v !== '' ) return v;
        }
    }
    return null;
};

export const BillingScreen = ({ quota, initial, onRefreshQuota, onToast }) => {
    const [health, setHealth]   = useState( null );
    const [info, setInfo]       = useState( null );
    const [telemetry, setTelemetry] = useState( () => readCheckoutTelemetry() );
    const [loading, setLoading] = useState( true );
    const [busy, setBusy]       = useState( null ); // 'health' | 'entitlements' | 'copy'
    const [lastRefresh, setLastRefresh] = useState( null );

    const loadDiagnostics = useCallback( async () => {
        setLoading( true );
        const [h, i] = await Promise.allSettled( [ fetchBillingHealth(), fetchBillingInfo() ] );
        setHealth( h.status === 'fulfilled' ? h.value : { error: h.reason?.message || 'unavailable' } );
        setInfo( i.status === 'fulfilled' ? i.value : null );
        setTelemetry( readCheckoutTelemetry() );
        setLastRefresh( Date.now() );
        setLoading( false );
    }, [] );

    useEffect( () => { loadDiagnostics(); }, [loadDiagnostics] );

    // ── Merged view of every entitlement source we have client-side ──
    const sources = [ info, quota ];
    const plan            = pick( sources, [ 'plan' ] ) || 'free';
    const subStatus       = pick( sources, [ 'subscription_status', 'status' ] ) || ( plan === 'free' ? 'none' : 'unknown' );
    const trialStatus     = pick( sources, [ 'trial_status' ] ) || ( pick( sources, [ 'trial_ends_at', 'trial_end' ] ) ? 'trialing' : 'none' );
    const periodEnd       = pick( sources, [ 'current_period_end', 'period_end', 'reset_date' ] );
    const renewalDate     = pick( sources, [ 'renews_at', 'renewal_date', 'current_period_end' ] );
    const stripeCustomer  = pick( sources, [ 'stripe_customer_id', 'customer_id' ] );
    const stripeSub       = pick( sources, [ 'stripe_subscription_id', 'subscription_id' ] );
    const activePriceId   = pick( sources, [ 'active_price_id', 'price_id' ] );
    const monthlyLimit    = pick( sources, [ 'monthly_limit', 'total_limit' ] );
    const monthlyUsed     = pick( sources, [ 'monthly_used', 'credits_used' ] );
    const creditsRemaining = pick( sources, [ 'credits_remaining' ] )
        ?? ( Number.isFinite( monthlyLimit ) && Number.isFinite( monthlyUsed ) ? Math.max( 0, monthlyLimit - monthlyUsed ) : null );
    const resetDate       = pick( sources, [ 'reset_date' ] );

    const healthOk = health && ! health.error;
    const checkoutAvailable = healthOk ? !! ( health.stripe && health.pro ) : null;
    const lastFailure = telemetry.last_failure;

    // ── Task 4: the structured support report ──
    const report = {
        site_url:                initial?.siteUrl || '',
        plugin_version:          initial?.version || '',
        backend_url:             initial?.backendUrl || '',
        current_plan:            plan,
        subscription_status:     subStatus,
        stripe_customer_id:      stripeCustomer || '',
        stripe_subscription_id:  stripeSub || '',
        active_price_id:         activePriceId || '',
        credits_used:            Number.isFinite( monthlyUsed ) ? monthlyUsed : 0,
        credits_remaining:       Number.isFinite( creditsRemaining ) ? creditsRemaining : 0,
        checkout_available:      checkoutAvailable,
        last_entitlement_refresh: fmtTs( lastRefresh ),
        last_checkout_error:     lastFailure
            ? `${ lastFailure.error_category }: ${ lastFailure.error_message } (${ fmtTs( lastFailure.ts ) })`
            : '',
        billing_health:          healthOk ? { stripe: health.stripe, starter: health.starter, pro: health.pro, entitlements: health.entitlements } : null,
        generated_at:            new Date().toISOString(),
    };

    const runHealthCheck = async () => {
        setBusy( 'health' );
        try {
            const h = await fetchBillingHealth();
            setHealth( h );
            onToast?.( { message: 'Billing health checked', icon: 'check', tone: h.stripe && h.pro ? 'ok' : 'warn' } );
        } catch ( e ) {
            setHealth( { error: e?.message || 'unavailable' } );
            onToast?.( { message: 'Health check failed', sub: e?.message, icon: 'alert', tone: 'warn' } );
        } finally { setBusy( null ); }
    };

    const refreshEntitlements = async () => {
        setBusy( 'entitlements' );
        try {
            await onRefreshQuota?.();
            setLastRefresh( Date.now() );
            await loadDiagnostics();
            onToast?.( { message: 'Entitlements refreshed', icon: 'check', tone: 'ok' } );
        } finally { setBusy( null ); }
    };

    const copyReport = async () => {
        setBusy( 'copy' );
        const text = JSON.stringify( report, null, 2 );
        try {
            await navigator.clipboard.writeText( text );
            onToast?.( { message: 'Diagnostic report copied', icon: 'check', tone: 'ok' } );
        } catch ( e ) {
            onToast?.( { message: 'Copy failed — select & copy manually', icon: 'alert', tone: 'warn' } );
        } finally { setBusy( null ); }
    };

    return (
        <div style={{ padding: '24px 32px 56px', maxWidth: 980, margin: '0 auto' }}>
            <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Diagnostics</div>
                <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>Billing</h1>
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0', maxWidth: 620, lineHeight: 1.5 }}>
                    Diagnose upgrade and entitlement issues without opening Stripe, Supabase, or backend logs. Admin only · read-only.
                </p>
            </div>

            {/* Diagnostic actions */}
            <Card padding={0} style={{ marginBottom: 14 }}>
                <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <Button variant="secondary" size="sm" icon="refresh" disabled={busy === 'entitlements'} onClick={refreshEntitlements}>
                        {busy === 'entitlements' ? 'Refreshing…' : 'Refresh entitlements'}
                    </Button>
                    <Button variant="secondary" size="sm" icon="activity" disabled={busy === 'health'} onClick={runHealthCheck}>
                        {busy === 'health' ? 'Checking…' : 'Run billing health check'}
                    </Button>
                    <Button variant="secondary" size="sm" disabled={busy === 'copy'} onClick={copyReport}>
                        Copy diagnostic report
                    </Button>
                    <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-3)' }}>
                        {loading ? 'Loading…' : `Updated ${ fmtTs( lastRefresh ) }`}
                    </span>
                </div>
            </Card>

            {/* Health summary */}
            <Card style={{ marginBottom: 14 }}>
                <SectionLabel icon="activity">Checkout health</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    <HealthPill label="Stripe" ok={health?.stripe} unknown={! healthOk}/>
                    <HealthPill label="Starter" ok={health?.starter} unknown={! healthOk}/>
                    <HealthPill label="Pro" ok={health?.pro} unknown={! healthOk}/>
                    <HealthPill label="Entitlements" ok={health?.entitlements} unknown={! healthOk}/>
                    <HealthPill label="Checkout available" ok={checkoutAvailable} unknown={checkoutAvailable === null}/>
                </div>
                {health?.error && <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--warn-ink)' }}>Health probe error: {String( health.error )}</div>}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Card>
                    <SectionLabel icon="crown">Subscription</SectionLabel>
                    <Rows rows={[
                        [ 'Current plan', plan ],
                        [ 'Subscription status', subStatus ],
                        [ 'Trial status', trialStatus ],
                        [ 'Billing period end', fmtTs( periodEnd ) ],
                        [ 'Renewal date', fmtTs( renewalDate ) ],
                    ]}/>
                </Card>
                <Card>
                    <SectionLabel icon="lock">Stripe</SectionLabel>
                    <Rows rows={[
                        [ 'Customer ID', stripeCustomer || '—', true ],
                        [ 'Subscription ID', stripeSub || '—', true ],
                        [ 'Active price ID', activePriceId || '—', true ],
                        [ 'Checkout available', checkoutAvailable === null ? 'unknown' : ( checkoutAvailable ? 'yes' : 'no' ) ],
                    ]}/>
                </Card>
                <Card>
                    <SectionLabel icon="trend">Usage</SectionLabel>
                    <Rows rows={[
                        [ 'Monthly allowance', Number.isFinite( monthlyLimit ) ? monthlyLimit : '—' ],
                        [ 'Used', Number.isFinite( monthlyUsed ) ? monthlyUsed : '—' ],
                        [ 'Remaining', Number.isFinite( creditsRemaining ) ? creditsRemaining : '—' ],
                        [ 'Reset date', fmtTs( resetDate ) ],
                    ]}/>
                </Card>
                <Card>
                    <SectionLabel icon="settings">Environment</SectionLabel>
                    <Rows rows={[
                        [ 'Backend URL', initial?.backendUrl || '—', true ],
                        [ 'Backend health', healthOk ? `ok · ${ fmtTs( health.timestamp ) }` : 'unavailable' ],
                        [ 'Last entitlement refresh', fmtTs( lastRefresh ) ],
                        [ 'Plugin version', initial?.version || '—' ],
                        [ 'WordPress / PHP', `${ initial?.wpVersion || '?' } / ${ initial?.phpVersion || '?' }` ],
                    ]}/>
                </Card>
            </div>

            {/* Last checkout outcome (telemetry) */}
            <Card style={{ marginTop: 14 }}>
                <SectionLabel icon="clock">Recent checkout outcomes</SectionLabel>
                <Rows rows={[
                    [ 'Last attempt', telemetry.last_attempt ? `${ telemetry.last_attempt.plan || '?' } · ${ fmtTs( telemetry.last_attempt.ts ) }` : '—' ],
                    [ 'Last success', telemetry.last_success ? `${ telemetry.last_success.plan || '?' } · ${ fmtTs( telemetry.last_success.ts ) }` : '—' ],
                    [ 'Last failure', lastFailure ? `${ lastFailure.error_category }: ${ lastFailure.error_message } · ${ fmtTs( lastFailure.ts ) }` : '—' ],
                ]}/>
            </Card>
        </div>
    );
};

const SectionLabel = ({ icon, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {icon && <Icon name={icon} size={14} style={{ color: 'var(--text-3)' }}/>}
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{children}</span>
    </div>
);

const Rows = ({ rows }) => (
    <div style={{ marginTop: 10 }}>
        {rows.map( ( [ label, value, mono ], i ) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderTop: i ? '1px solid var(--hairline)' : 'none' }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
                <span className={mono ? 'mono' : undefined} style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{String( value )}</span>
            </div>
        ) )}
    </div>
);

const HealthPill = ({ label, ok, unknown }) => (
    <Pill tone={unknown ? 'neutral' : ( ok ? 'ok' : 'danger' )} icon={unknown ? 'info' : ( ok ? 'check' : 'x' )}>
        {label}
    </Pill>
);
