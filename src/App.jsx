import { useState, useEffect } from 'react';
import { WPChrome } from './chrome';
import { Dashboard } from './screens/Dashboard';
import { PagesLibrary } from './screens/Library';
import { AutopilotScreen } from './screens/Autopilot';
import { SettingsScreen } from './screens/Settings';
import { Onboarding, GenerationDrawer, Paywall, Toast, HelpModal } from './modals/index';
import { SignOutConfirm } from './auth';
import { getInitialData, fetchQuota, fetchPages, runScan, normalizeQuota } from './api';
import { paywallTrigger, errorToast } from './errors';

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

    const plan = quota?.plan || 'free';
    const dailyRemaining = quota?.daily_remaining ?? ( ( quota?.daily_limit || 5 ) - ( quota?.daily_used || 0 ) );

    // Bootstrap: refresh quota + load queue/stats on mount.
    useEffect( () => {
        refreshQuota();
        loadQueuePages();
        loadStats();
        if ( ! initial.connected ) {
            // No license yet — nudge the user toward Settings, but don't block.
            setToast( { message: 'Connect your BeepBeep license', sub: 'Add your license key in Settings to start generating.', icon: 'info', tone: 'warn' } );
        }
    }, [] );

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
            const res = await fetchPages( { filter: 'needs', perPage: 1 } );
            const s   = res.stats || {};
            setStats( {
                total:               s.total     || 0,
                optimised:           s.optimised || 0,
                needs_attention:     s.remaining || res.total || 0,
                new_since_last_visit: 0,
                streak:              0,
            } );
        } catch ( e ) {
            setStats( { total: 0, optimised: 0, needs_attention: 0, new_since_last_visit: 0, streak: 0 } );
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

    // ── Open generation drawer ──
    const openGen = () => {
        if ( plan === 'free' && dailyRemaining <= 0 ) {
            setPaywall( { open: true, trigger: 'daily-limit', entitlement: quota } );
            return;
        }
        const cap   = plan === 'pro' ? 10 : Math.min( dailyRemaining, 5 );
        const count = Math.min( cap, queuePages.length );
        if ( count <= 0 ) return;
        setDrawer( { open: true, pages: queuePages.slice( 0, count ) } );
    };

    const openGenSingle = ( pg ) => {
        if ( plan === 'free' && dailyRemaining <= 0 ) {
            setPaywall( { open: true, trigger: 'daily-limit', entitlement: quota } );
            return;
        }
        setDrawer( { open: true, pages: [ { ...pg, hue: pg.hue ?? 220 } ] } );
    };

    const openBulk = ( pages ) => {
        if ( plan === 'free' && pages.length > dailyRemaining ) {
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

    const handleAutoToggle = ( val ) => {
        if ( plan === 'free' ) {
            setPaywall( { open: true, trigger: 'auto-feature', entitlement: quota } );
            return;
        }
        setAutoOptimise( val );
        setToast( { message: val ? 'Auto-generate enabled' : 'Auto-generate paused', sub: val ? 'BeepBeep Titles will write title & meta for every new page you publish.' : null, icon: val ? 'check' : 'info', tone: 'ok' } );
    };

    const handleUpgrade = () => {
        setPaywall( { open: false, trigger: 'default', entitlement: null } );
        setToast( { message: 'Upgrade flow coming soon', sub: 'Contact support to upgrade to Pro.', icon: 'crown', tone: 'ok' } );
    };

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
            body = (
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
            );
            break;
        case 'library':
            body = (
                <PagesLibrary
                    plan={plan}
                    quota={quota}
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
                user={user}
                onSignOut={() => setSignOutOpen( true )}
                onHelp={() => setHelpOpen( true )}
                onUpgrade={() => setPaywall( { open: true, trigger: 'default', entitlement: null } )}
            >
                {body}
            </WPChrome>

            <Onboarding
                open={onboardingOpen}
                onClose={() => setOnboardingOpen( false )}
                onScan={handleScan}
                onComplete={() => {
                    setOnboardingOpen( false );
                    setToast( { message: 'Welcome to BeepBeep Titles', sub: 'Your first 5 daily generations are ready.', icon: 'logo', tone: 'ok' } );
                }}
            />

            <HelpModal open={helpOpen} onClose={() => setHelpOpen( false )}/>

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
                onClose={() => setPaywall( { open: false, trigger: 'default', entitlement: null } )}
                onUpgrade={handleUpgrade}
            />

            <SignOutConfirm
                open={signOutOpen}
                onCancel={() => setSignOutOpen( false )}
                onConfirm={() => {
                    setSignOutOpen( false );
                    setToast( { message: 'Signed out', icon: 'check', tone: 'ok' } );
                }}
            />

            {toast && <Toast {...toast} onDismiss={() => setToast( null )}/>}
        </>
    );
}
