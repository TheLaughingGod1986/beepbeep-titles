import { useState, useEffect } from 'react';
import { WPChrome } from './chrome';
import { Dashboard } from './screens/Dashboard';
import { PagesLibrary } from './screens/Library';
import { AutopilotScreen } from './screens/Autopilot';
import { SettingsScreen } from './screens/Settings';
import { Onboarding, GenerationDrawer, Paywall, Toast, HelpModal } from './modals/index';
import { SignOutConfirm } from './auth';
import { getInitialData, fetchQuota, fetchPages, generatePages, runScan, fetchSettings } from './api';

export default function App() {
    const initial = getInitialData();

    const [tab, setTab]       = useState( 'dashboard' );
    const [user, setUser]     = useState( initial.user );
    const [quota, setQuota]   = useState( initial.quota );
    const [settings, setSettings] = useState( initial.settings );
    const [stats, setStats]   = useState( null );
    const [queuePages, setQueuePages] = useState( [] );
    const [autoOptimise, setAutoOptimise] = useState( initial.settings?.auto_generate ?? false );

    const [paywall, setPaywall]       = useState( { open: false, trigger: 'default' } );
    const [drawer, setDrawer]         = useState( { open: false, pages: null } );
    const [toast, setToast]           = useState( null );
    const [onboardingOpen, setOnboardingOpen] = useState( false );
    const [helpOpen, setHelpOpen]     = useState( false );
    const [signOutOpen, setSignOutOpen] = useState( false );

    const plan = quota?.plan || 'free';
    const dailyRemaining = quota?.daily_remaining ?? ( ( quota?.daily_limit || 5 ) - ( quota?.daily_used || 0 ) );

    // Bootstrap: refresh quota + load queue pages on mount
    useEffect( () => {
        refreshQuota();
        loadQueuePages();
        loadStats();

        // Show onboarding on first visit
        if ( initial.settings?.show_onboarding ) {
            setOnboardingOpen( true );
        }
    }, [] );

    const refreshQuota = async () => {
        try {
            const q = await fetchQuota();
            setQuota( q );
        } catch ( e ) {}
    };

    const loadQueuePages = async () => {
        try {
            const res = await fetchPages( { filter: 'needs', perPage: 5 } );
            const pages = res.pages || res || [];
            setQueuePages( pages.map( ( p, i ) => ( {
                ...p,
                hue: [220, 145, 30, 280, 60][i % 5],
                section: p.section || p.type || 'Page',
            } ) ) );
        } catch ( e ) {
            setQueuePages( [] );
        }
    };

    const loadStats = async () => {
        try {
            const res = await fetchPages( { filter: 'all', perPage: 1 } );
            const totalRes = await fetchPages( { filter: 'needs', perPage: 1 } );
            setStats( {
                total: res.total || 0,
                optimised: res.total_optimised || 0,
                needs_attention: totalRes.total || 0,
                new_since_last_visit: 0,
                streak: 0,
            } );
        } catch ( e ) {
            setStats( { total: 0, optimised: 0, needs_attention: 0, new_since_last_visit: 0, streak: 0 } );
        }
    };

    // ── Open generation drawer ──
    const openGen = () => {
        if ( plan === 'free' && dailyRemaining <= 0 ) {
            setPaywall( { open: true, trigger: 'daily-limit' } );
            return;
        }
        const count = plan === 'pro' ? Math.min( queuePages.length, 10 ) : Math.min( dailyRemaining, 5 );
        setDrawer( { open: true, pages: queuePages.slice( 0, count ) } );
    };

    const openGenSingle = ( pg ) => {
        if ( plan === 'free' && dailyRemaining <= 0 ) {
            setPaywall( { open: true, trigger: 'daily-limit' } );
            return;
        }
        setDrawer( { open: true, pages: [{ ...pg, hue: pg.hue ?? 220 }] } );
    };

    const openBulk = ( ids ) => {
        if ( plan === 'free' && ids.length > dailyRemaining ) {
            setPaywall( { open: true, trigger: 'bulk' } );
            return;
        }
        // Resolve page objects from IDs
        const pages = ids.map( ( id, i ) => ( {
            id,
            url: `/page-${id}`,
            section: ['Blog', 'Shop', 'Pages', 'Reviews'][i % 4],
            hue: ( i * 70 ) % 360,
        } ) );
        setDrawer( { open: true, pages } );
    };

    const handleGenerate = async ( pageIds ) => {
        const result = await generatePages( pageIds );
        await refreshQuota();
        await loadQueuePages();
        await loadStats();
        return result;
    };

    const completeGen = () => {
        const n = drawer.pages?.length || 0;
        setDrawer( { open: false, pages: null } );
        setToast( { message: `${n} page${n === 1 ? '' : 's'} improved`, sub: 'Title & meta descriptions are live in your site.', icon: 'sparkles', tone: 'ok' } );
        loadQueuePages();
        loadStats();
        refreshQuota();
    };

    const handleAutoToggle = ( val ) => {
        if ( plan === 'free' ) {
            setPaywall( { open: true, trigger: 'auto-feature' } );
            return;
        }
        setAutoOptimise( val );
        setToast( { message: val ? 'Auto-generate enabled' : 'Auto-generate paused', sub: val ? 'BeepBeep Titles will write title & meta for every new page you publish.' : null, icon: val ? 'check' : 'info', tone: 'ok' } );
    };

    const handleUpgrade = () => {
        setPaywall( { open: false, trigger: 'default' } );
        // In production this would redirect to a billing page or trigger payment
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
                    onUpgrade={() => setPaywall( { open: true, trigger: 'default' } )}
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
                    onUpgrade={() => setPaywall( { open: true, trigger: 'bulk' } )}
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
                    onUpgrade={() => setPaywall( { open: true, trigger: 'auto-feature' } )}
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
                    onUpgrade={() => setPaywall( { open: true, trigger: 'default' } )}
                    onToast={setToast}
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
                onUpgrade={() => setPaywall( { open: true, trigger: 'default' } )}
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
                onGenerate={handleGenerate}
            />

            <Paywall
                open={paywall.open}
                trigger={paywall.trigger}
                onClose={() => setPaywall( { open: false, trigger: 'default' } )}
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
