import { useState, useEffect } from 'react';
import { WPChrome } from './chrome';
import { Dashboard } from './screens/Dashboard';
import { PagesLibrary } from './screens/Library';
import { AutopilotScreen } from './screens/Autopilot';
import { SettingsScreen } from './screens/Settings';
import { AuditSignedOutScreen } from './screens/Audit';
import { Onboarding, GenerationDrawer, Paywall, Toast, HelpModal, ConnectModal } from './modals/index';
import { SignOutConfirm } from './auth';
import { getInitialData, fetchQuota, fetchPages, runScan, normalizeQuota, createCheckout, createBillingPortal, clearLicense, saveSettings } from './api';
import { paywallTrigger, errorToast } from './errors';
import { hasDailyCap } from './quota';
import { usePaywallGate } from './hooks/usePaywallGate';

export default function App() {
    const initial = getInitialData();

    const [tab, setTab]       = useState( 'dashboard' );
    const [user, setUser]     = useState( initial.user );
    const [quota, setQuota]   = useState( initial.quota );
    const [settings, setSettings] = useState( initial.settings );
    const [stats, setStats]   = useState( null );
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

    const handleSignOut = async () => {
        try { await clearLicense(); } catch ( e ) {}
        setConnected( false );
        setQuota( normalizeQuota( null ) );
        // Land on the signed-out audit report (Home) rather than Settings —
        // it carries the reconnect CTA and shows what's at stake.
        setTab( 'dashboard' );
        setToast( { message: 'Signed out', sub: 'Reconnect your license key in Settings to resume.', icon: 'check', tone: 'ok' } );
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
            setToast( { message: 'License connected automatically', sub: 'We found your BeepBeep license from another BeepBeep plugin on this site.', icon: 'check', tone: 'ok' } );
        } else if ( ! initial.connected ) {
            // No license yet — nudge the user toward the connect modal.
            setToast( { message: 'Connect your BeepBeep license', sub: 'Click "Connect license" to activate AI title & meta generation.', icon: 'info', tone: 'warn' } );
        }
    }, [] );

    // First-time connected users see the onboarding wizard once.
    useEffect( () => {
        if ( connected && ! ( settings?.onboarding_complete ?? true ) ) {
            setOnboardingOpen( true );
        }
    }, [connected, settings?.onboarding_complete] );

    const refreshQuota = async () => {
        try {
            const q = await fetchQuota();
            setQuota( q );
            setConnected( !! q.connected );
        } catch ( e ) {}
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
            setStats( { total: 0, optimised: 0, needs_attention: 0, missing_title: 0, missing_meta: 0, coverage: 0, new_since_last_visit: 0, streak: 0 } );
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
            setTab( 'settings' );
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
    const openInNewTab = async ( getUrl ) => {
        const win = window.open( '', '_blank', 'noopener,noreferrer' );
        try {
            const res = await getUrl();
            if ( res?.url ) {
                if ( win ) { win.opener = null; win.location = res.url; }
                else { window.location.href = res.url; } // popup blocked — same-tab fallback
            } else {
                if ( win ) win.close();
                setToast( errorToast( {} ) );
            }
        } catch ( e ) {
            if ( win ) win.close();
            handleApiError( e );
        }
    };

    // ── Billing: open Stripe checkout / portal in a new tab (shared account) ──
    const goToCheckout = ( plan ) => openInNewTab( () => createCheckout( { plan } ) );

    const handleUpgrade      = () => goToCheckout( 'pro' );
    const handleBuyCredits   = () => goToCheckout( 'credits' );
    const handleManageBilling = () => openInNewTab( () => createBillingPortal() );

    const handleScan = async () => {
        try {
            const result = await runScan();
            await loadQueuePages();
            await loadStats();
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
                    stats={stats}
                    queuePages={queuePages}
                    autoOptimise={autoOptimise}
                    onAutoToggle={handleAutoToggle}
                    onGenerate={openGen}
                    onUpgrade={() => setPaywall( { open: true, trigger: 'default', entitlement: null } )}
                    onView={setTab}
                />
            ) : (
                <AuditSignedOutScreen
                    stats={stats}
                    onConnect={() => setConnectOpen( true )}
                    onHelp={() => setHelpOpen( true )}
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
                onTab={setTab}
                plan={plan}
                user={menuUser}
                connected={connected}
                onSignOut={() => setSignOutOpen( true )}
                onHelp={() => setHelpOpen( true )}
                onConnect={() => setConnectOpen( true )}
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

            <HelpModal open={helpOpen} onClose={() => setHelpOpen( false )}/>

            <ConnectModal
                open={connectOpen}
                onClose={() => setConnectOpen( false )}
                onSuccess={( res ) => {
                    refreshQuota();
                    setToast( { message: 'License connected', sub: `Plan: ${ res?.plan || 'free' } · generations ready.`, icon: 'check', tone: 'ok' } );
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
