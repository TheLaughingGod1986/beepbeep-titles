import { useState, useEffect } from 'react';
import { WPChrome } from './chrome';
import { Dashboard } from './screens/Dashboard';
import { PagesLibrary } from './screens/Library';
import { AutopilotScreen } from './screens/Autopilot';
import { SettingsScreen } from './screens/Settings';
import { AuditSignedOutScreen } from './screens/Audit';
import { Onboarding, GenerationDrawer, Paywall, Toast, HelpModal, ConnectModal } from './modals/index';
import { SignOutConfirm } from './auth';
import { getInitialData, fetchQuota, fetchPages, fetchActivity, runScan, normalizeQuota, createCheckout, createBillingPortal, clearLicense, saveSettings } from './api';
import { paywallTrigger, errorToast, checkoutErrorToast } from './errors';
import { hasDailyCap } from './quota';
import { usePaywallGate } from './hooks/usePaywallGate';
import { resolveAllowedTab } from './navigation';

export default function App() {
    const initial = getInitialData();

    const [tab, setTab]       = useState( 'dashboard' );
    const [user, setUser]     = useState( initial.user );
    const [quota, setQuota]   = useState( initial.quota );
    const [settings, setSettings] = useState( initial.settings );
    const [stats, setStats]   = useState( null );
    const [quotaReady, setQuotaReady] = useState( false );
    const [activity, setActivity] = useState( [] );
    const [queuePages, setQueuePages] = useState( [] );
    const [autoOptimise, setAutoOptimise] = useState( initial.settings?.auto_generate ?? false );
    const [connected, setConnected] = useState( initial.connected );

    const [paywall, setPaywall]       = useState( { open: false, trigger: 'default', entitlement: null } );
    const [drawer, setDrawer]         = useState( { open: false, pages: null } );
    const [toast, setToast]           = useState( null );
    const [onboardingOpen, setOnboardingOpen] = useState( false );
    const [helpOpen, setHelpOpen]     = useState( false );
    const [signOutOpen, setSignOutOpen] = useState( false );
    const [connectOpen, setConnectOpen] = useState( false );
    const [connectMode, setConnectMode] = useState( 'register' ); // 'register' | 'password'

    // Open the connect modal on a specific tab ('register' = create account,
    // 'password' = sign in) so each entry point lands on the right form.
    const openConnect = ( mode = 'register' ) => {
        setConnectMode( mode );
        setConnectOpen( true );
    };

    const selectTab = ( nextTab ) => {
        setTab( resolveAllowedTab( nextTab, connected ) );
    };

    const handleSignOut = async () => {
        try { await clearLicense(); } catch ( e ) {}
        setConnected( false );
        setQuota( normalizeQuota( null ) );
        // Land on the signed-out audit report (Home) rather than Settings —
        // it carries the reconnect CTA and shows what's at stake.
        setTab( 'dashboard' );
        setToast( { message: 'Signed out', sub: 'Connect your account to resume generation.', icon: 'check', tone: 'ok' } );
    };

    const plan = quota?.plan || 'free';
    const { dailyRemaining, isDailyExhausted, isBulkOverLimit, heroCap, isFree } = usePaywallGate( plan, quota );

    // The avatar menu represents the BeepBeep account (license), not the WP
    // user — show the account email when we know it, fall back to WP identity.
    const accountEmail = quota?.account_email || initial.accountEmail || '';
    const menuUser     = accountEmail ? { name: accountEmail.split( '@' )[0], email: accountEmail } : user;

    // Bootstrap: refresh quota + load queue/stats on mount.
    useEffect( () => {
        refreshQuota();
        loadQueuePages();
        loadStats();
        loadActivity();

        // Returning from Stripe checkout?
        const params  = new URLSearchParams( window.location.search );
        const billing = params.get( 'bbt_billing' );
        if ( billing === 'success' ) {
            setToast( { message: 'Purchase complete 🎉', sub: 'Your credits/plan are now active across every BeepBeep plugin.', icon: 'crown', tone: 'ok' } );
            refreshQuota();
        } else if ( billing === 'cancelled' ) {
            setToast( { message: 'Checkout cancelled', sub: 'No charge was made.', icon: 'info', tone: 'warn' } );
        }
        if ( billing ) {
            params.delete( 'bbt_billing' );
            const qs = params.toString();
            window.history.replaceState( {}, '', window.location.pathname + ( qs ? '?' + qs : '' ) );
        } else if ( initial.licenseAdopted ) {
            // Another BeepBeep plugin on this site already had a license in
            // the database — we connected with it automatically.
            setToast( { message: 'Account connected automatically', sub: 'We found an existing BeepBeep account connection on this site.', icon: 'check', tone: 'ok' } );
        } else if ( ! initial.connected ) {
            // No account yet — nudge the user toward the connect modal.
            setToast( { message: 'Connect your BeepBeep account', sub: 'Create an account or sign in to activate AI title & meta generation.', icon: 'info', tone: 'warn' } );
        }
    }, [] );

    // First-time connected users see the onboarding wizard once.
    useEffect( () => {
        if ( connected && ! ( settings?.onboarding_complete ?? true ) ) {
            setOnboardingOpen( true );
        }
    }, [connected, settings?.onboarding_complete] );

    // Signed-out users can only view Home. This also catches any stale tab
    // state after sign-out or failed entitlement refreshes.
    useEffect( () => {
        setTab( current => resolveAllowedTab( current, connected ) );
    }, [connected] );

    const refreshQuota = async () => {
        try {
            const q = await fetchQuota();
            setQuota( q );
            setConnected( !! q.connected );
        } catch ( e ) {}
        finally { setQuotaReady( true ); }
    };

    // Push fresh entitlement_state (from a /generate response) into quota.
    const applyEntitlement = ( ent ) => {
        if ( ent ) {
            setQuota( normalizeQuota( ent ) );
        }
    };

    const loadQueuePages = async () => {
        try {
            const res = await fetchPages( { filter: 'needs', perPage: 5 } );
            setQueuePages( res.pages || [] );
        } catch ( e ) {
            setQueuePages( [] );
        }
    };

    const loadStats = async () => {
        try {
            const res   = await fetchPages( { filter: 'needs', perPage: 1 } );
            const s     = res.stats || {};
            const total = s.total || 0;
            setStats( {
                total,
                optimised:           s.optimised || 0,
                needs_attention:     s.remaining || res.total || 0,
                missing_title:       Math.max( 0, total - ( s.with_title ?? total ) ),
                missing_meta:        Math.max( 0, total - ( s.with_meta ?? total ) ),
                coverage:            s.coverage ?? ( total > 0 ? Math.round( ( ( s.optimised || 0 ) / total ) * 100 ) : 0 ),
                new_since_last_visit: 0,
                streak:              0,
            } );
        } catch ( e ) {
            // A failed request must NOT render as real zeros — "0% coverage, 0
            // needing" is indistinguishable from "all optimised" and hides
            // pages that need work. Keep the last known figures and surface the
            // failure instead of silently overwriting with zeros.
            setStats( prev => prev ?? { total: 0, optimised: 0, needs_attention: 0, missing_title: 0, missing_meta: 0, coverage: 0, new_since_last_visit: 0, streak: 0 } );
            setToast( { message: 'Couldn’t refresh your library stats', sub: 'Showing the last known figures — check your connection and try again.', icon: 'alert', tone: 'warn' } );
        }
    };

    const loadActivity = async () => {
        try {
            const res = await fetchActivity( { limit: 8 } );
            setActivity( res.events || [] );
        } catch ( e ) {
            setActivity( [] );
        }
    };

    // ── Error → paywall / toast ──
    const handleApiError = ( err ) => {
        if ( err?.name === 'AbortError' ) return;
        const trigger = paywallTrigger( err );
        if ( trigger ) {
            setPaywall( { open: true, trigger, entitlement: err.entitlement_state || null } );
            return;
        }
        if ( err?.code === 'INVALID_LICENSE' ) {
            setConnected( false );
            setTab( 'dashboard' );
            setConnectOpen( true );
        }
        setToast( errorToast( err ) );
    };

    // The shared wallet may have no daily sub-cap (daily_limit: null) — then
    // exhaustion means the MONTHLY credits are gone, not today's allowance.
    const exhaustedTrigger = hasDailyCap( quota ) ? 'daily-limit' : 'monthly-limit';

    // ── Open generation drawer ──
    const openGen = () => {
        if ( isDailyExhausted() ) {
            setPaywall( { open: true, trigger: exhaustedTrigger, entitlement: quota } );
            return;
        }
        const count = Math.min( heroCap(), queuePages.length );
        if ( count <= 0 ) return;
        setDrawer( { open: true, pages: queuePages.slice( 0, count ) } );
    };

    const openGenSingle = ( pg ) => {
        if ( isDailyExhausted() ) {
            setPaywall( { open: true, trigger: exhaustedTrigger, entitlement: quota } );
            return;
        }
        setDrawer( { open: true, pages: [ { ...pg, hue: pg.hue ?? 220 } ] } );
    };

    const openBulk = ( pages ) => {
        if ( isBulkOverLimit( pages.length ) ) {
            setPaywall( { open: true, trigger: 'bulk', entitlement: quota } );
            return;
        }
        if ( ! pages.length ) return;
        setDrawer( { open: true, pages } );
    };

    const completeGen = () => {
        const n = drawer.pages?.length || 0;
        setDrawer( { open: false, pages: null } );
        setToast( { message: `${ n } page${ n === 1 ? '' : 's' } improved`, sub: 'Title & meta descriptions are live in your site.', icon: 'sparkles', tone: 'ok' } );
        loadQueuePages();
        loadStats();
        loadActivity();
        refreshQuota();
    };

    const handleAutoToggle = async ( val ) => {
        if ( isFree ) {
            setPaywall( { open: true, trigger: 'auto-feature', entitlement: quota } );
            return;
        }
        try {
            await saveSettings( { auto_generate: val } );
            setAutoOptimise( val );
            setSettings( s => ( { ...s, auto_generate: val } ) );
            setToast( { message: val ? 'Auto-generate enabled' : 'Auto-generate paused', sub: val ? 'BeepBeep Titles will write title & meta for every new page you publish.' : null, icon: val ? 'check' : 'info', tone: 'ok' } );
        } catch ( e ) {
            handleApiError( e );
        }
    };

    // Open a URL produced by an async call in a new tab without tripping popup
    // blockers: synchronously open a blank tab on the user gesture, then point
    // it at the resolved URL (or close it and fall back if the call failed).
    //
    // NB: do NOT pass 'noopener' to window.open here — with noopener the call
    // returns null, so we'd lose the handle and the fallback would navigate
    // the *current* WordPress tab to Stripe. We open a real handle and sever
    // window.opener manually for the same security benefit.
    const openInNewTab = async ( getUrl ) => {
        const win = window.open( 'about:blank', '_blank' );
        if ( win ) { try { win.opener = null; } catch ( e ) {} }
        try {
            const res = await getUrl();
            if ( res?.url ) {
                if ( win ) { win.location = res.url; }
                else { window.location.href = res.url; } // popup blocked — same-tab fallback
            } else {
                // 200 with no url — surface whatever the backend said (e.g. a
                // bad/archived Stripe price) instead of a generic message.
                if ( win ) win.close();
                setToast( checkoutErrorToast( res ) );
            }
        } catch ( e ) {
            if ( win ) win.close();
            if ( e?.name === 'AbortError' ) return;
            // License / quota errors still route to the connect modal or paywall.
            if ( e?.code === 'INVALID_LICENSE' || paywallTrigger( e ) ) { handleApiError( e ); return; }
            // Everything else: show the real checkout/Stripe error so a
            // misconfigured plan is diagnosable, not hidden behind "try again".
            setToast( checkoutErrorToast( e ) );
        }
    };

    // ── Billing: open Stripe checkout / portal in a new tab (shared account) ──
    const goToCheckout = ( checkout = 'pro' ) => {
        const args = typeof checkout === 'string' ? { plan: checkout } : checkout;
        openInNewTab( () => createCheckout( args ) );
    };

    const handleUpgrade      = () => goToCheckout( 'pro' );
    const handleBuyCredits   = () => goToCheckout( 'credits' );
    const handleManageBilling = () => openInNewTab( () => createBillingPortal() );

    const handleScan = async () => {
        try {
            const result = await runScan();
            await loadQueuePages();
            await loadStats();
            await loadActivity();
            return result;
        } catch ( e ) {
            return null;
        }
    };

    // ── Tab content ──
    let body = null;
    switch ( tab ) {
        case 'dashboard':
            // No license connected → conversion-focused audit report
            // (Claude Design signed-out screen) in place of the dashboard.
            body = connected ? (
                <Dashboard
                    quota={quota}
                    quotaReady={quotaReady}
                    stats={stats}
                    activity={activity}
                    queuePages={queuePages}
                    autoOptimise={autoOptimise}
                    onAutoToggle={handleAutoToggle}
                    onGenerate={openGen}
                    onUpgrade={() => setPaywall( { open: true, trigger: 'default', entitlement: null } )}
                    onView={selectTab}
                />
            ) : (
                <AuditSignedOutScreen
                    stats={stats}
                    onConnect={() => setConnectOpen( true )}
                    onHelp={() => setHelpOpen( true )}
                    onUpgrade={() => setPaywall( { open: true, trigger: 'default', entitlement: null } )}
                />
            );
            break;
        case 'library':
            body = (
                <PagesLibrary
                    plan={plan}
                    quota={quota}
                    connected={connected}
                    onConnect={() => setConnectOpen( true )}
                    onGenerate={openGenSingle}
                    onBulkGenerate={openBulk}
                    onUpgrade={() => setPaywall( { open: true, trigger: 'bulk', entitlement: quota } )}
                />
            );
            break;
        case 'automation':
            body = (
                <AutopilotScreen
                    plan={plan}
                    settings={settings}
                    autoOptimise={autoOptimise}
                    onAutoToggle={handleAutoToggle}
                    onUpgrade={() => setPaywall( { open: true, trigger: 'auto-feature', entitlement: quota } )}
                    onToast={setToast}
                />
            );
            break;
        case 'settings':
            body = (
                <SettingsScreen
                    plan={plan}
                    quota={quota}
                    user={user}
                    settings={settings}
                    connected={connected}
                    onUpgrade={() => setPaywall( { open: true, trigger: 'default', entitlement: null } )}
                    onBuyCredits={handleBuyCredits}
                    onManageBilling={handleManageBilling}
                    onToast={setToast}
                    onConnect={refreshQuota}
                />
            );
            break;
    }

    return (
        <>
            <WPChrome
                activeTab={tab}
                onTab={selectTab}
                plan={plan}
                user={menuUser}
                connected={connected}
                onSignOut={() => setSignOutOpen( true )}
                onHelp={() => setHelpOpen( true )}
                onConnect={() => openConnect( 'register' )}
                onSignIn={() => openConnect( 'password' )}
                onUpgrade={() => setPaywall( { open: true, trigger: 'default', entitlement: null } )}
            >
                {body}
            </WPChrome>

            <Onboarding
                open={onboardingOpen}
                onClose={() => setOnboardingOpen( false )}
                onScan={handleScan}
                onComplete={async () => {
                    try {
                        await saveSettings( { onboarding_complete: true } );
                        setSettings( s => ( { ...s, onboarding_complete: true } ) );
                    } catch ( e ) {}
                    setOnboardingOpen( false );
                    setToast( plan === 'pro'
                        ? { message: 'Welcome to BeepBeep Titles', sub: 'Autopilot is monitoring your site — continuous optimisation enabled.', icon: 'zap', tone: 'ok' }
                        : { message: 'Welcome to BeepBeep Titles', sub: 'Your first 5 daily generations are ready.', icon: 'logo', tone: 'ok' } );
                }}
            />

            <HelpModal
                open={helpOpen}
                onClose={() => setHelpOpen( false )}
                onStartScan={handleScan}
            />

            <ConnectModal
                open={connectOpen}
                initialMode={connectMode}
                onClose={() => setConnectOpen( false )}
                onSuccess={( res ) => {
                    refreshQuota();
                    setToast( { message: 'Account connected', sub: `Plan: ${ res?.plan || 'free' } · generations ready.`, icon: 'check', tone: 'ok' } );
                }}
            />

            <SignOutConfirm
                open={signOutOpen}
                onCancel={() => setSignOutOpen( false )}
                onConfirm={() => { setSignOutOpen( false ); handleSignOut(); }}
            />

            <GenerationDrawer
                open={drawer.open}
                pages={drawer.pages}
                plan={plan}
                onClose={() => setDrawer( { open: false, pages: null } )}
                onComplete={completeGen}
                onPaywall={( trigger, entitlement ) => setPaywall( { open: true, trigger, entitlement } )}
                onApiError={handleApiError}
                onEntitlement={applyEntitlement}
                onToast={setToast}
            />

            <Paywall
                open={paywall.open}
                trigger={paywall.trigger}
                entitlement={paywall.entitlement}
                stats={stats}
                onClose={() => setPaywall( { open: false, trigger: 'default', entitlement: null } )}
                onCheckout={goToCheckout}
                onUpgrade={handleUpgrade}
                onBuyCredits={handleBuyCredits}
            />

            {toast && <Toast {...toast} onDismiss={() => setToast( null )}/>}
        </>
    );
}
