import { useState, useEffect } from 'react';
import { WPChrome } from './chrome';
import { Dashboard } from './screens/Dashboard';
import { AuditSignedOutScreen } from './screens/Audit';
import { PagesLibrary } from './screens/Library';
import { AutopilotScreen } from './screens/Autopilot';
import { BillingScreen } from './screens/Billing';
import { SettingsScreen } from './screens/Settings';
import { Onboarding, GenerationDrawer, Paywall, Toast, HelpModal, ConnectModal, BulkConfirm } from './modals/index';
import { SignOutConfirm } from './auth';
import { getInitialData, fetchQuota, fetchPages, fetchActivity, runScan, normalizeQuota, createCheckout, createBillingPortal, clearLicense, saveSettings, fetchSettings, fetchHealth, fetchPriorities, fetchHealthItems, runHealthScan, undoPage, fetchAeo } from './api';
import { paywallTrigger, errorToast, checkoutErrorToast } from './errors';
import { hasDailyCap } from './quota';
import { usePaywallGate } from './hooks/usePaywallGate';
import { resolveAllowedTab } from './navigation';
import { recordCheckoutAttempt, recordCheckoutSuccess, recordCheckoutFailure } from './billingTelemetry';

// Checkout opens Stripe in a new tab, so the success return is a fresh page
// load that doesn't know which plan was bought. We stash the intent in
// localStorage (shared across tabs, same origin) at redirect time and read it
// back on return so the success handler can name the plan/price. 1h freshness
// guards against a stale entry from an abandoned attempt.
const PENDING_CHECKOUT_KEY = 'beepti_pending_checkout';
const PENDING_CHECKOUT_TTL = 60 * 60 * 1000;
const persistPendingCheckout = ( plan, priceId ) => {
    try { localStorage.setItem( PENDING_CHECKOUT_KEY, JSON.stringify( { plan, price_id: priceId, ts: Date.now() } ) ); } catch ( e ) {}
};
const readPendingCheckout = () => {
    try {
        const raw = localStorage.getItem( PENDING_CHECKOUT_KEY );
        if ( ! raw ) return null;
        const v = JSON.parse( raw );
        if ( ! v || ( Date.now() - ( v.ts || 0 ) ) > PENDING_CHECKOUT_TTL ) return null;
        return v;
    } catch ( e ) { return null; }
};
const clearPendingCheckout = () => { try { localStorage.removeItem( PENDING_CHECKOUT_KEY ); } catch ( e ) {} };

export default function App() {
    const initial = getInitialData();
    const isAdmin = !! initial.isAdmin;

    const [tab, setTab]       = useState( 'dashboard' );
    const [user, setUser]     = useState( initial.user );
    const [quota, setQuota]   = useState( initial.quota );
    const [settings, setSettings] = useState( initial.settings );
    const [stats, setStats]   = useState( null );
    const [quotaReady, setQuotaReady] = useState( false );
    const [activity, setActivity] = useState( [] );
    const [queuePages, setQueuePages] = useState( [] );
    const [health, setHealth] = useState( null );
    const [healthReady, setHealthReady] = useState( false );
    const [priorities, setPriorities] = useState( [] );
    const [previousScore, setPreviousScore] = useState( null );
    const [aeo, setAeo] = useState( null );
    const [autoOptimise, setAutoOptimise] = useState( initial.settings?.auto_generate ?? false );
    const [connected, setConnected] = useState( initial.connected );

    const [paywall, setPaywall]       = useState( { open: false, trigger: 'default', entitlement: null } );
    const [drawer, setDrawer]         = useState( { open: false, pages: null } );
    const [bulkConfirm, setBulkConfirm] = useState( { open: false, pages: [] } );
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
        setTab( resolveAllowedTab( nextTab, connected, { isAdmin } ) );
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
    const { dailyRemaining, isDailyExhausted, isBulkOverLimit, heroCap } = usePaywallGate( quota );

    // The avatar menu represents the OpptiAI account (license), not the WP
    // user — show the account email when we know it, fall back to WP identity.
    const accountEmail = quota?.account_email || initial.accountEmail || '';
    const menuUser     = accountEmail ? { name: accountEmail.split( '@' )[0], email: accountEmail } : user;

    // Bootstrap: refresh quota + load queue/stats on mount.
    useEffect( () => {
        refreshQuota();
        loadQueuePages();
        loadStats();
        loadActivity();
        loadHealth();
        loadPriorities();
        loadSettings();
        loadAeo();

        // Returning from Stripe checkout?
        const params  = new URLSearchParams( window.location.search );
        const billing = params.get( 'beepti_billing' );
        if ( billing === 'success' ) {
            setToast( { message: 'Purchase complete 🎉', sub: 'Your credits/plan are now active across every OpptiAI plugin.', icon: 'crown', tone: 'ok' } );
            // Record the confirmed upgrade only once the entitlement refresh
            // confirms the new state. Plan comes from the stashed intent
            // (falls back to the refreshed plan); price_id from the same stash.
            const pending = readPendingCheckout();
            refreshQuota().then( ( q ) => {
                if ( q ) {
                    recordCheckoutSuccess( { plan: pending?.plan || q.plan || null, priceId: pending?.price_id } );
                }
                clearPendingCheckout();
            } );
        } else if ( billing === 'cancelled' ) {
            setToast( { message: 'Checkout cancelled', sub: 'No charge was made.', icon: 'info', tone: 'warn' } );
            clearPendingCheckout();
        }
        if ( billing ) {
            params.delete( 'beepti_billing' );
            const qs = params.toString();
            window.history.replaceState( {}, '', window.location.pathname + ( qs ? '?' + qs : '' ) );
        } else if ( initial.licenseAdopted ) {
            // Another OpptiAI plugin on this site already had a license in
            // the database — we connected with it automatically.
            setToast( { message: 'Account connected automatically', sub: 'We found an existing OpptiAI account connection on this site.', icon: 'check', tone: 'ok' } );
        } else if ( ! initial.connected ) {
            // No account yet — nudge the user toward the connect modal.
            setToast( { message: 'Connect your OpptiAI account', sub: 'Create an account or sign in to activate AI title & meta generation.', icon: 'info', tone: 'warn' } );
        }
    }, [] );

    // First-time connected users see the onboarding wizard once.
    useEffect( () => {
        if ( connected && ! ( settings?.onboarding_complete ?? true ) ) {
            setOnboardingOpen( true );
        }
    }, [connected, settings?.onboarding_complete] );

    // Keep admin-only navigation protected when connection state changes.
    useEffect( () => {
        setTab( current => resolveAllowedTab( current, connected, { isAdmin } ) );
    }, [connected] );

    const refreshQuota = async () => {
        try {
            const q = await fetchQuota();
            setQuota( q );
            setConnected( !! q.connected );
            return q;
        } catch ( e ) { return null; }
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
            const res = await fetchActivity( { limit: 30 } );
            setActivity( res.events || [] );
        } catch ( e ) {
            setActivity( [] );
        }
    };

    // ── Health (dashboard-first score + Today's Priorities) ──
    const loadHealth = async () => {
        try {
            const res = await fetchHealth();
            setHealth( prev => {
                if ( prev && prev.score !== res.score ) setPreviousScore( prev.score );
                return res;
            } );
        } catch ( e ) {
            // Keep the last known score rather than flashing to zero.
        } finally {
            setHealthReady( true );
        }
    };

    /** Pulls available_post_types (and any other server-computed fields) into local settings state. */
    const loadSettings = async () => {
        try {
            const res = await fetchSettings();
            setSettings( s => ( { ...s, ...res } ) );
        } catch ( e ) {
            // Keep whatever settings we already have (from initial PHP data).
        }
    };

    /** Onboarding's "choose what to scan" step — persists before the first scan runs. */
    const handleSaveScanScope = async ( postTypes ) => {
        try {
            await saveSettings( { scan_post_types: postTypes } );
            setSettings( s => ( { ...s, scan_post_types: postTypes } ) );
        } catch ( e ) {
            // Non-fatal — the scan still runs against every post type.
        }
    };

    const loadAeo = async () => {
        try {
            setAeo( await fetchAeo() );
        } catch ( e ) {
            // Leave null — the Summary Card shows "Coming soon" until this loads.
        }
    };

    const loadPriorities = async () => {
        try {
            // Fetch every issue group the backend will return (capped at 10)
            // so the Summary Cards can look up specific codes without a
            // second request; the Priority Action Centre + Today's
            // Priorities banner only render the top few of these.
            const res = await fetchPriorities( { limit: 10 } );
            setPriorities( res.priorities || [] );
        } catch ( e ) {
            setPriorities( [] );
        }
    };

    /** Free, local rescore — no credits used. Used by Quick Scan. */
    const handleQuickScan = async () => {
        try {
            await runHealthScan();
        } catch ( e ) { /* fall through to refresh with whatever we have */ }
        await loadHealth();
        await loadPriorities();
        loadAeo();
    };

    /** Full scan: coverage stats + health score together (the existing "Run Full Scan" path). */
    const handleFullScan = async () => {
        const result = await handleScan();
        loadHealth();
        loadPriorities();
        loadAeo();
        return result;
    };

    /**
     * Onboarding's "Run My Free Health Check" — deliberately lighter than
     * handleFullScan: only the two calls the results screen needs (score +
     * issue count), not the whole library/activity/queue reload.
     */
    const handleOnboardingScan = async () => {
        const scan = await runHealthScan();
        loadPriorities();
        return { health: scan };
    };

    /** Pull up to `limit` affected items for one issue code, for an expanded Priority card. */
    const loadIssueItems = async ( issueCode, { limit = 50 } = {} ) => {
        try {
            const res = await fetchHealthItems( { issue: issueCode, sort: 'lowest-score', perPage: limit } );
            return res.items || [];
        } catch ( e ) {
            return [];
        }
    };

    /** "Optimise All" on a Priority card — queue every affected item into the existing credit-consuming generation flow. */
    const handleOptimiseIssue = async ( issueCode ) => {
        const items = await loadIssueItems( issueCode, { limit: 100 } );
        const pages = items.map( ( item ) => ( {
            id: Number( item.site_item_id ),
            url: item.edit_url || '',
            title: item.post_title || '',
            hue: ( Number( item.site_item_id ) * 47 ) % 360,
        } ) );
        openBulk( pages );
    };

    /** Revert one page to its pre-optimise value. Does not refund the credit spent. */
    const handleUndo = async ( postId ) => {
        try {
            await undoPage( postId );
            setToast( { message: 'Change undone', sub: 'The page is back to its previous title and meta description.', icon: 'check', tone: 'ok' } );
            loadHealth();
            loadPriorities();
            loadActivity();
            loadStats();
        } catch ( e ) {
            handleApiError( e );
        }
    };

    /** "Optimise Critical Issues" hero button — every item currently scored critical. */
    const handleOptimiseCritical = async () => {
        try {
            const res = await fetchHealthItems( { status: 'critical', sort: 'lowest-score', perPage: 100 } );
            const pages = ( res.items || [] ).map( ( item ) => ( {
                id: Number( item.site_item_id ),
                url: item.edit_url || '',
                title: item.post_title || '',
                hue: ( Number( item.site_item_id ) * 47 ) % 360,
            } ) );
            openBulk( pages );
        } catch ( e ) {
            handleApiError( e );
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
        // Single items already get a preview/confirm inside the drawer
        // itself — the pre-flight estimate below is specifically for bulk.
        if ( pages.length === 1 ) {
            setDrawer( { open: true, pages } );
            return;
        }
        setBulkConfirm( { open: true, pages } );
    };

    const confirmBulk = () => {
        const pages = bulkConfirm.pages;
        setBulkConfirm( { open: false, pages: [] } );
        setDrawer( { open: true, pages } );
    };

    const completeGen = ( summary = {} ) => {
        const total = summary.total ?? drawer.pages?.length ?? 0;
        const successfulCount = summary.successfulCount ?? total;
        const failedCount = summary.failedCount ?? 0;
        setDrawer( { open: false, pages: null } );
        setToast( failedCount > 0
            ? {
                message: `${ successfulCount } of ${ total } page${ total === 1 ? '' : 's' } improved`,
                sub: `${ failedCount } page${ failedCount === 1 ? '' : 's' } could not be generated and can be retried.`,
                icon: 'alert',
                tone: 'warn',
            }
            : {
                message: `${ successfulCount } page${ successfulCount === 1 ? '' : 's' } improved`,
                sub: 'Title & meta descriptions are live in your site.',
                icon: 'sparkles',
                tone: 'ok',
            }
        );
        loadQueuePages();
        loadStats();
        loadActivity();
        loadHealth();
        loadPriorities();
        refreshQuota();
    };

    const handleAutoToggle = async ( val ) => {
        try {
            await saveSettings( { auto_generate: val } );
            setAutoOptimise( val );
            setSettings( s => ( { ...s, auto_generate: val } ) );
            setToast( { message: val ? 'Auto-generate enabled' : 'Auto-generate paused', sub: val ? 'OpptiAI Titles will write title & meta for every new page you publish.' : null, icon: val ? 'check' : 'info', tone: 'ok' } );
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
    // Optional hooks let callers observe the resolved result without coupling
    // this popup helper to checkout semantics. `onResolved(res)` fires once a
    // usable URL is in hand (right before navigating); `onFailed(reason)` fires
    // when the call throws or returns no usable URL. Both are no-ops by default.
    const openInNewTab = async ( getUrl, { onResolved, onFailed } = {} ) => {
        const win = window.open( 'about:blank', '_blank' );
        if ( win ) { try { win.opener = null; } catch ( e ) {} }
        try {
            const res = await getUrl();
            if ( res?.url ) {
                onResolved?.( res );
                if ( win ) { win.location = res.url; }
                else { window.location.href = res.url; } // popup blocked — same-tab fallback
            } else {
                // 200 with no url — surface whatever the backend said (e.g. a
                // bad/archived Stripe price) instead of a generic message.
                if ( win ) win.close();
                onFailed?.( res );
                setToast( checkoutErrorToast( res ) );
            }
        } catch ( e ) {
            if ( win ) win.close();
            if ( e?.name === 'AbortError' ) return;
            onFailed?.( e );
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
        if ( ! connected ) {
            setPaywall( { open: false, trigger: 'default', entitlement: null } );
            openConnect( 'password' );
            setToast( {
                message: 'Sign in to continue',
                sub: 'Create a free account or sign in before choosing a paid plan.',
                icon: 'info',
                tone: 'warn',
            } );
            return;
        }
        openInNewTab( () => createCheckout( args ), {
            onResolved: () => {
                // Stash the intent so the success handler can name the plan on
                // return (localStorage survives the new-tab round-trip).
                persistPendingCheckout( args.plan, args.priceId );
                recordCheckoutAttempt( { plan: args.plan, priceId: args.priceId } );
            },
            onFailed: ( reason ) => {
                recordCheckoutFailure( { plan: args.plan, priceId: args.priceId, reason } );
            },
        } );
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
                    altTextCompanion={initial.altTextCompanion}
                    internalLinkingCompanion={initial.internalLinkingCompanion}
                    health={health}
                    healthReady={healthReady}
                    previousScore={previousScore}
                    priorities={priorities}
                    aeo={aeo}
                    onQuickScan={handleQuickScan}
                    onFullScan={handleFullScan}
                    onOptimiseCritical={handleOptimiseCritical}
                    onOptimiseIssue={handleOptimiseIssue}
                    onLoadIssueItems={loadIssueItems}
                    onOptimiseSingleItem={( item ) => openGenSingle( {
                        id: Number( item.site_item_id ),
                        url: item.edit_url || '',
                        title: item.post_title || '',
                        hue: ( Number( item.site_item_id ) * 47 ) % 360,
                    } )}
                    onUndo={handleUndo}
                />
            ) : (
                <AuditSignedOutScreen
                    stats={stats}
                    onConnect={() => openConnect( 'register' )}
                    onHelp={() => setHelpOpen( true )}
                    onLibrary={() => selectTab( 'library' )}
                    onAutopilot={() => selectTab( 'automation' )}
                />
            );
            break;
        case 'library':
            body = (
                <PagesLibrary
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
                    settings={settings}
                    autoOptimise={autoOptimise}
                    onAutoToggle={handleAutoToggle}
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
        case 'billing':
            // Admin-only diagnostics. Guard in render too (not just nav) so a
            // stale/forced tab can't expose it to non-admins.
            body = isAdmin ? (
                <BillingScreen
                    quota={quota}
                    initial={initial}
                    onRefreshQuota={refreshQuota}
                    onToast={setToast}
                />
            ) : null;
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
                isAdmin={isAdmin}
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
                onScan={handleOnboardingScan}
                availablePostTypes={settings?.available_post_types || []}
                onSaveScanScope={handleSaveScanScope}
                onComplete={async () => {
                    try {
                        await saveSettings( { onboarding_complete: true } );
                        setSettings( s => ( { ...s, onboarding_complete: true } ) );
                    } catch ( e ) {}
                    setOnboardingOpen( false );
                    setToast( { message: 'Welcome to OpptiAI Titles', sub: 'Your OpptiAI service credits are ready to use.', icon: 'logo', tone: 'ok' } );
                }}
            />

            <HelpModal
                open={helpOpen}
                onClose={() => setHelpOpen( false )}
                onStartScan={() => selectTab( 'dashboard' )}
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

            <BulkConfirm
                open={bulkConfirm.open}
                count={bulkConfirm.pages.length}
                creditsRemaining={quota?.credits_remaining ?? null}
                onCancel={() => setBulkConfirm( { open: false, pages: [] } )}
                onConfirm={confirmBulk}
            />

            <GenerationDrawer
                open={drawer.open}
                pages={drawer.pages}
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
                connected={connected}
                onClose={() => setPaywall( { open: false, trigger: 'default', entitlement: null } )}
                onCheckout={goToCheckout}
                onUpgrade={handleUpgrade}
                onBuyCredits={handleBuyCredits}
                onConnect={() => {
                    setPaywall( { open: false, trigger: 'default', entitlement: null } );
                    openConnect( 'password' );
                }}
                sourceScreen={tab}
            />

            {toast && <Toast {...toast} onDismiss={() => setToast( null )}/>}
        </>
    );
}
