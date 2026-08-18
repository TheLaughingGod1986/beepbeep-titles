import { useState } from 'react';
import { Icon, Card, Pill, Button, Progress, Toggle, Divider } from '../components';
import { Input, PageShell, Textarea, Row } from '../ui';
import { Modal } from '../modals/Modal';
import { saveSettings, setLicense, clearLicense, submitSupport } from '../api';
import { creditUsageRows } from '../usage';
import { QUOTA_DEFAULTS, usageCreditsLabel, USAGE_CREDITS_FOOTNOTE } from '../quota';

const formatResetDate = value => {
    if ( ! value ) return 'Not available';
    const date = new Date( value );
    if ( Number.isNaN( date.getTime() ) ) return String( value );
    return new Intl.DateTimeFormat( undefined, { month: 'long', day: 'numeric', year: 'numeric' } ).format( date );
};

export const SettingsScreen = ({
    plan,
    quota,
    user,
    accountEmail,
    settings,
    connected,
    onUpgrade,
    onBuyCredits,
    onManageBilling,
    onToast,
    onConnect,
    onOpenConnect,
    onSignIn,
    onSignOut,
    onReset,
}) => {
    const isPro = plan === 'pro';
    const [advancedOpen, setAdvancedOpen] = useState( false );
    const [notifFresh, setNotifFresh]     = useState( settings?.notify_new_pages ?? true );
    const [notifDigest, setNotifDigest]   = useState( settings?.weekly_digest ?? false );
    const [notifLimit, setNotifLimit]     = useState( settings?.notify_quota_warning ?? true );
    const [uninstallData, setUninstallData] = useState( settings?.delete_on_uninstall ?? false );
    const [licenseInput, setLicenseInput] = useState( '' );
    const [connecting, setConnecting]     = useState( false );
    const [saving, setSaving]             = useState( false );
    const [resetOpen, setResetOpen]       = useState( false );
    const [resetting, setResetting]       = useState( false );

    // OpptiAI account email (license/quota) — never the WordPress admin identity.
    const opptiEmail = accountEmail || quota?.account_email || '';

    const handleConnect = async () => {
        const key = licenseInput.trim();
        if ( ! key ) return;
        setConnecting( true );
        try {
            const res = await setLicense( key );
            const remainingNote = ( res.daily_remaining ?? null ) !== null
                ? `${ res.daily_remaining } left today`
                : `${ res.credits_remaining ?? 0 } credits available`;
            onToast?.( { message: 'License connected', sub: `Plan: ${ res.plan || 'free' } · ${ remainingNote }`, icon: 'check', tone: 'ok' } );
            setLicenseInput( '' );
            onConnect?.();
        } catch ( err ) {
            onToast?.( { message: 'Couldn\'t verify that license', sub: err?.message || 'Check the key and try again.', icon: 'alert', tone: 'warn' } );
        } finally {
            setConnecting( false );
        }
    };

    const handleDisconnect = async () => {
        try {
            await clearLicense();
            onToast?.( { message: 'License removed', sub: 'Generation is paused until you reconnect.', icon: 'info', tone: 'warn' } );
            onConnect?.();
        } catch ( err ) {}
    };

    const handleResetGenerated = async () => {
        setResetting( true );
        try {
            const res = await onReset?.();
            const count = res?.reset_count ?? 0;
            setResetOpen( false );
            onToast?.( count > 0
                ? { message: `${ count } page${ count === 1 ? '' : 's' } reset`, sub: 'Titles & meta descriptions are back to how they looked before OpptiAI optimised them.', icon: 'check', tone: 'ok' }
                : { message: 'Nothing to reset', sub: 'OpptiAI hasn\u2019t generated a title or meta description on this site yet.', icon: 'info', tone: 'warn' } );
        } catch ( err ) {
            onToast?.( { message: 'Reset failed', sub: err?.message || 'Please try again.', icon: 'alert', tone: 'warn' } );
        } finally {
            setResetting( false );
        }
    };

    const monthlyUsed  = quota?.monthly_used  || 0;
    const monthlyLimit = quota?.monthly_limit || QUOTA_DEFAULTS.monthly_limit;
    const pct = monthlyLimit > 0 ? ( monthlyUsed / monthlyLimit ) * 100 : 0;
    const resetDate = formatResetDate( quota?.reset_date );

    const handleSaveNotifs = async () => {
        setSaving( true );
        try {
            await saveSettings( { notify_new_pages: notifFresh, weekly_digest: notifDigest, notify_quota_warning: notifLimit, delete_on_uninstall: uninstallData } );
            if ( onToast ) onToast( { message: 'Preferences saved', icon: 'check', tone: 'ok' } );
        } catch ( e ) {
            if ( onToast ) onToast( { message: 'Failed to save preferences', icon: 'alert', tone: 'warn' } );
        } finally {
            setSaving( false );
        }
    };

    return (
        <PageShell style={{ paddingTop: 24, paddingBottom: 56 }}>
            <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Settings</div>
                <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>Plan & preferences</h1>
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0', lineHeight: 1.5 }}>Manage your account, notifications, and advanced options.</p>
            </div>

            <PlanCard isPro={isPro} monthlyUsed={monthlyUsed} monthlyLimit={monthlyLimit} pct={pct} resetDate={resetDate} onUpgrade={onUpgrade} onBuyCredits={onBuyCredits} onManageBilling={onManageBilling}/>

            <CreditUsageCard quota={quota} used={monthlyUsed} limit={monthlyLimit} resetDate={resetDate}/>

            <AccountSection
                connected={connected}
                isPro={isPro}
                opptiEmail={opptiEmail}
                onOpenConnect={onOpenConnect}
                onSignIn={onSignIn}
                onSignOut={onSignOut}
                onUpgrade={onUpgrade}
                onManageBilling={onManageBilling}
            />

            {( user?.name || user?.email ) && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0 4px', marginBottom: 18, marginTop: -4,
                    fontSize: 12, color: 'var(--text-3)', lineHeight: 1.45,
                }}>
                    <Icon name="info" size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }}/>
                    <span>
                        This WordPress site · editing as{' '}
                        <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{user?.name || 'Admin'}</span>
                        {user?.email ? (
                            <>
                                {' '}(<span className="mono">{user.email}</span>)
                            </>
                        ) : null}
                        . Not your OpptiAI account.
                    </span>
                </div>
            )}

            <SettingsSection title="OpptiAI license" eyebrow="Connection">
                {connected ? (
                    <SettingsRow
                        label="License key"
                        desc="Your site is connected to OpptiAI. Generations draw from your plan's quota."
                        right={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Pill tone="ok"><span className="pulse-dot" style={{ width: 6, height: 6 }}/> Connected</Pill>
                                <Button variant="secondary" size="sm" onClick={handleDisconnect}>Disconnect</Button>
                            </div>
                        }
                        last
                    />
                ) : (
                    <div style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>License key</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 10px', lineHeight: 1.45 }}>
                            Connect your OpptiAI license to start generating. Find your key in your OpptiAI account dashboard.
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                value={licenseInput}
                                onChange={e => setLicenseInput( e.target.value )}
                                onKeyDown={e => { if ( e.key === 'Enter' ) handleConnect(); }}
                                placeholder="BBT-XXXX-XXXX-XXXX"
                                autoComplete="off"
                                spellCheck={false}
                                style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text)', background: 'var(--surface)', outline: 0 }}
                                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.18)'; }}
                                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                            />
                            <Button variant="primary" size="md" icon="check" onClick={handleConnect} disabled={connecting || ! licenseInput.trim()}>
                                {connecting ? 'Connecting…' : 'Connect'}
                            </Button>
                        </div>
                    </div>
                )}
            </SettingsSection>

            <SettingsSection title="Notifications" eyebrow="Email & in-app">
                <SettingsRow
                    label="New page alerts"
                    desc="In-app banner when fresh pages need attention."
                    right={<Toggle on={notifFresh} onChange={setNotifFresh}/>}
                />
                <SettingsRow
                    label="Weekly digest"
                    desc="Sunday email with coverage + activity summary."
                    right={<Toggle on={notifDigest} onChange={setNotifDigest}/>}
                />
                <SettingsRow
                    label="Quota warnings"
                    desc="In-app alert when close to the monthly generation limit."
                    right={<Toggle on={notifLimit} onChange={setNotifLimit}/>}
                    last
                />
            </SettingsSection>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Button variant="primary" size="sm" icon="check" onClick={handleSaveNotifs} disabled={saving}>
                    {saving ? 'Saving…' : 'Save preferences'}
                </Button>
            </div>

            <Card padding={0} style={{ marginBottom: 12 }}>
                <button
                    onClick={() => setAdvancedOpen( !advancedOpen )}
                    style={{ width: '100%', padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--r-lg)' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Advanced</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>Debug & system info</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.45 }}>For troubleshooting and support. Most users never need to open this.</div>
                    </div>
                    <Icon name={advancedOpen ? 'chevron-down' : 'chevron-right'} size={16} style={{ color: 'var(--text-3)' }}/>
                </button>
                {advancedOpen && <AdvancedPanel settings={settings} connected={connected} plan={plan}/>}
            </Card>

            <ContactSupport user={user} onToast={onToast}/>

            <SettingsSection title="Danger zone" eyebrow="Destructive">
                <SettingsRow
                    label="Reset generated title & meta"
                    desc="Clear all OpptiAI Titles-generated titles and meta descriptions from your site. This cannot be undone."
                    right={<Button variant="secondary" size="sm" onClick={() => setResetOpen( true )}>Reset…</Button>}
                />
                <SettingsRow
                    label="Delete data on uninstall"
                    desc="Remove all OpptiAI Titles settings and history when the plugin is uninstalled."
                    right={<Toggle on={uninstallData} onChange={setUninstallData}/>}
                    last
                />
            </SettingsSection>

            <ResetConfirm open={resetOpen} resetting={resetting} onCancel={() => setResetOpen( false )} onConfirm={handleResetGenerated}/>
        </PageShell>
    );
};

const ResetConfirm = ({ open, resetting, onCancel, onConfirm }) => (
    <Modal open={open} onClose={resetting ? () => {} : onCancel} width={440}>
        <div style={{ padding: '22px 24px 20px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon name="alert" size={17} style={{ color: 'var(--danger-ink)' }}/>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: '0 0 6px' }}>Reset generated title &amp; meta?</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
                Every page OpptiAI Titles has ever optimised will be reverted to how it looked before its first optimisation — including pages that had no title or meta description at all. Manual edits you made yourself in the Library are not affected. <strong style={{ color: 'var(--text)' }}>This cannot be undone</strong>, and any AI service credits already spent are not refunded.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <Button variant="ghost" size="md" onClick={onCancel} disabled={resetting}>Cancel</Button>
                <Button variant="secondary" size="md" icon="alert" onClick={onConfirm} disabled={resetting} style={{ color: 'var(--danger-ink)', borderColor: 'var(--danger-border)' }}>
                    {resetting ? 'Resetting…' : 'Reset everything'}
                </Button>
            </div>
        </div>
    </Modal>
);

const PlanCard = ({ isPro, monthlyUsed, monthlyLimit, pct, resetDate, onUpgrade, onBuyCredits, onManageBilling }) => (
    <Card padding={0} style={{ marginBottom: 18, overflow: 'hidden', ...( isPro ? { background: 'var(--primary-soft)', borderColor: 'var(--primary-border)' } : {} ) }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: isPro ? 'var(--primary)' : 'var(--bg-sunken)', color: isPro ? '#fff' : 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: isPro ? 'none' : '1px solid var(--border)' }}>
                <Icon name={isPro ? 'crown' : 'shield'} size={18} strokeWidth={2}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{isPro ? 'OpptiAI Growth service' : 'OpptiAI Free service'}</span>
                    <Pill tone={isPro ? 'primary' : 'neutral'}>{isPro ? 'Growth' : 'Free'}</Pill>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
                    {monthlyLimit} AI service credits per cycle · shared across your OpptiAI plugins · usable manually, in bulk, or with Autopilot.
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Button variant="secondary" size="sm" icon="zap" onClick={onBuyCredits}>Buy credits</Button>
                {isPro
                    ? <Button variant="secondary" size="sm" icon="external" onClick={onManageBilling}>Manage billing</Button>
                    : <Button variant="pro" size="sm" icon="crown" onClick={onUpgrade}>View Growth plan</Button>}
            </div>
        </div>
        <div style={{ borderTop: '1px solid var(--hairline)', padding: '12px 20px 14px', background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>This billing cycle</span>
                <span className="mono tnum" style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {monthlyUsed} / {monthlyLimit} AI service credits used
                </span>
            </div>
            <Progress value={monthlyUsed} max={monthlyLimit} tone={pct > 90 ? 'danger' : pct > 75 ? 'warn' : 'primary'} height={5}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
                <span className="mono">{Math.max( 0, monthlyLimit - monthlyUsed ).toLocaleString()} remaining</span>
                <span className="mono">Resets {resetDate}</span>
            </div>
        </div>
    </Card>
);

const CreditUsageCard = ({ quota, used, limit, resetDate }) => {
    const altTextCompanion = window.beeptiAdminData?.altTextCompanion;
    const altTextState = altTextCompanion?.state;
    const altTextInstalled = altTextState === 'active' || altTextState === 'installed';
    const altTextOpenUrl = altTextInstalled ? ( altTextCompanion?.url || '' ) : '';
    const remaining = Math.max( 0, ( quota?.credits_remaining ?? ( limit - used ) ) );
    const usageLabel = usageCreditsLabel( used, limit, remaining );
    // Keep the usage_by_feature split UI. Install badges/CTAs are separate:
    // AltText → Open when installed; Internal Linking + Schema → Not installed
    // only (no Get / Install / WP.org).
    const { rows: rawRows, attributed } = creditUsageRows( quota, used, {
        alt_text: altTextInstalled,
    } );
    const rows = rawRows.map( ( row ) => {
        if ( row.id === 'alt_text' ) {
            return { ...row, installed: altTextInstalled };
        }
        if ( row.id === 'internal_linking' || row.id === 'schema' ) {
            return { ...row, installed: false };
        }
        return row;
    } );

    // Only show per-plugin numbers when the credits we could attribute actually
    // reconcile with the total used — otherwise (e.g. credits spent before
    // tracking began) fall back to one honest shared-usage bar instead of a
    // misleading row of zeros.
    const showBreakdown = used > 0 && attributed >= used;

    return (
        <Card padding={0} style={{ marginBottom: 18, overflow: 'hidden' }}>
            <Row gap={16} justify="between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--hairline)' }}>
                <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>OpptiAI Credit Wallet</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Credit usage</div>
                </div>
                <div className="mono tnum" style={{ fontSize: 13, color: remaining <= 5 ? 'var(--warn-ink)' : 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {usageLabel}
                </div>
            </Row>
            <Row align="start" gap={9} style={{ padding: '11px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--hairline)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>
                <Icon name="info" size={14} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 1 }}/>
                <span>
                    One monthly credit balance shared across every OpptiAI solution on this site. {showBreakdown
                        ? `The breakdown below shows which plugin consumed each credit · resets ${resetDate}.`
                        : `Per-plugin credits aren't itemised yet — the total above is shared across these plugins · resets ${resetDate}.`}
                </span>
            </Row>
            {! showBreakdown && (
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--hairline)' }}>
                    <Row align="baseline" justify="between" style={{ marginBottom: 7 }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Shared usage</span>
                        <span className="mono tnum" style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}>{used} / {limit}</span>
                    </Row>
                    <Progress value={used} max={limit} tone={limit > 0 && used / limit > 0.9 ? 'danger' : limit > 0 && used / limit > 0.75 ? 'warn' : 'primary'} height={6}/>
                </div>
            )}
            <div>
                {rows.map( ( row, index ) => {
                    const hasNumber = showBreakdown && row.used !== null && row.used !== undefined;
                    const percentage = hasNumber && used > 0 ? Math.min( 100, Math.round( ( row.used / used ) * 100 ) ) : 0;
                    // Only AltText may show an action, and only Open when installed.
                    const showAltTextOpen = row.id === 'alt_text' && row.installed && !! altTextOpenUrl;
                    return (
                        <div key={row.id} style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) auto', gap: 12, alignItems: 'center', borderBottom: index === rows.length - 1 ? 0 : '1px solid var(--hairline)', background: row.current ? row.soft : 'var(--surface)', opacity: row.installed || row.current ? 1 : 0.72 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: row.color, background: row.soft, border: `1px solid ${row.border}` }}>
                                <Icon name={row.icon} size={16}/>
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: hasNumber ? 7 : 0, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{row.label}</span>
                                    {row.current
                                        ? <Pill tone="neutral">This plugin</Pill>
                                        : ! row.installed && <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>Not installed</span>}
                                </div>
                                {hasNumber && (
                                    <div style={{ height: 5, borderRadius: 999, overflow: 'hidden', background: 'var(--bg-sunken)' }} aria-label={`${row.label}: ${row.used} credits, ${percentage}% of used credits`}>
                                        <div style={{ width: `${percentage}%`, height: '100%', borderRadius: 999, background: row.color, transition: 'width .2s ease' }}/>
                                    </div>
                                )}
                            </div>
                            <div style={{ minWidth: 46, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                {hasNumber && (
                                    <div className="tnum">
                                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{row.used}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{percentage}%</div>
                                    </div>
                                )}
                                {showAltTextOpen && (
                                    <a
                                        href={altTextOpenUrl}
                                        style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary-ink)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                                    >
                                        Open
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                } )}
            </div>
            <p style={{
                margin: 0,
                padding: '12px 20px',
                borderTop: '1px solid var(--hairline)',
                fontSize: 12.5,
                color: 'var(--text-3)',
                lineHeight: 1.5,
            }}>
                {USAGE_CREDITS_FOOTNOTE}
            </p>
        </Card>
    );
};

const AccountSection = ({
    connected,
    isPro,
    opptiEmail,
    onOpenConnect,
    onSignIn,
    onSignOut,
    onUpgrade,
    onManageBilling,
}) => {
    if ( ! connected ) {
        return (
            <SettingsSection title="Account" eyebrow="OpptiAI">
                <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                            background: 'var(--bg-sunken)', border: '1px solid var(--border)',
                            color: 'var(--text-2)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Icon name="user" size={18} strokeWidth={2}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                                Not signed in to OpptiAI
                            </div>
                            <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '4px 0 0', lineHeight: 1.5 }}>
                                Sign in or create a free account to manage your plan, billing, and credit wallet.
                                The WordPress user below is only who is logged into this site — not an OpptiAI login.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                                <Button variant="primary" size="md" icon="arrow-right" onClick={() => { if ( onSignIn ) onSignIn(); else onOpenConnect?.(); }}>
                                    Sign in
                                </Button>
                                <Button variant="secondary" size="md" onClick={() => onOpenConnect?.()}>
                                    Create account
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsSection>
        );
    }

    return (
        <SettingsSection title="Account" eyebrow="OpptiAI">
            <SettingsRow
                label="OpptiAI email"
                desc="The account that owns this site's plan and shared credit wallet."
                right={
                    opptiEmail
                        ? <span className="mono" style={{ fontSize: 13, color: 'var(--text-2)' }}>{opptiEmail}</span>
                        : <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Connected</span>
                }
            />
            <SettingsRow
                label="Plan & billing"
                desc={isPro
                    ? 'Change plan or update payment details in the Stripe customer portal.'
                    : 'Open Stripe to manage billing, or view the Growth plan.'}
                right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {isPro
                            ? <Button variant="secondary" size="sm" icon="external" onClick={onManageBilling}>Manage billing</Button>
                            : (
                                <>
                                    <Button variant="pro" size="sm" icon="crown" onClick={onUpgrade}>View Growth plan</Button>
                                    <Button variant="secondary" size="sm" icon="external" onClick={onManageBilling}>Manage billing</Button>
                                </>
                            )}
                    </div>
                }
            />
            <SettingsRow
                label="Sign out"
                desc="Disconnect this WordPress site from your OpptiAI account. Generated titles stay on the site."
                right={<Button variant="secondary" size="sm" icon="logout" onClick={onSignOut}>Sign out</Button>}
                last
            />
        </SettingsSection>
    );
};

const SettingsSection = ({ title, eyebrow, children }) => (
    <Card padding={0} style={{ marginBottom: 12 }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--hairline)' }}>
            {eyebrow && <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{eyebrow}</div>}
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.25 }}>{title}</div>
        </div>
        <div>{children}</div>
    </Card>
);

const SettingsRow = ({ label, desc, right, last }) => (
    <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: last ? 'none' : '1px solid var(--hairline)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.45 }}>{desc}</div>
        </div>
        <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
);

const AdvancedPanel = ({ settings, connected, plan }) => {
    const [copied, setCopied] = useState( false );
    const handleCopy = () => {
        const info = `Plugin: OpptiAI Titles ${window.beeptiAdminData?.version || ''}\nWordPress: ${window.beeptiAdminData?.wpVersion || '6.x'}\nPHP: ${window.beeptiAdminData?.phpVersion || '8.x'}\nLicense: ${connected ? 'Connected' : 'Not connected'}\nSEO plugin: ${window.beeptiAdminData?.seoPlugin || 'fallback'}\nPlan: ${plan || 'free'}\nSite: ${window.location.hostname}`;
        navigator.clipboard?.writeText( info ).catch( () => {} );
        setCopied( true );
        setTimeout( () => setCopied( false ), 1800 );
    };

    const sysRows = [
        { k: 'Plugin',     v: `OpptiAI Titles ${window.beeptiAdminData?.version || ''}`.trim() },
        { k: 'WordPress',  v: window.beeptiAdminData?.wpVersion || '6.x' },
        { k: 'PHP',        v: window.beeptiAdminData?.phpVersion || '8.x' },
        { k: 'License',    v: connected ? 'Connected' : 'Not connected', tone: connected ? 'ok' : undefined },
        { k: 'SEO plugin', v: window.beeptiAdminData?.seoPlugin || 'fallback' },
        { k: 'Site URL',   v: window.location.hostname },
    ];

    return (
        <div className="fade-in" style={{ borderTop: '1px solid var(--hairline)' }}>
            <div style={{ padding: '14px 20px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>System info</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 24px' }}>
                    {sysRows.map( ( { k, v, tone }, i ) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--hairline)' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{k}</span>
                            <span className="mono" style={{ fontSize: 12, color: tone === 'ok' ? 'var(--ok-ink)' : 'var(--text-2)', fontWeight: 500 }}>{v}</span>
                        </div>
                    ) )}
                </div>
            </div>
            <Divider/>
            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>Diagnostic logs</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.45 }}>Share these with support if something looks wrong.</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="secondary" size="sm" icon={copied ? 'check' : 'external'} onClick={handleCopy}>
                        {copied ? 'Copied' : 'Copy debug info'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ContactSupport = ({ user, onToast }) => {
    const [name, setName]       = useState( user?.name || '' );
    const [email, setEmail]     = useState( user?.email || '' );
    const [message, setMessage] = useState( '' );
    const [sending, setSending] = useState( false );

    const canSend = message.trim().length > 0 && ! sending;

    const handleSend = async () => {
        if ( ! canSend ) return;
        setSending( true );
        try {
            const res = await submitSupport( { name: name.trim(), email: email.trim(), message: message.trim() } );
            onToast?.( { message: 'Message sent', sub: res?.message || 'Support will get back to you by email.', icon: 'check', tone: 'ok' } );
            setMessage( '' );
        } catch ( err ) {
            onToast?.( { message: "Couldn't send your message", sub: err?.message || 'Please try again shortly.', icon: 'alert', tone: 'warn' } );
        } finally {
            setSending( false );
        }
    };

    const labelStyle = { fontSize: 11, color: 'var(--text-3)', fontWeight: 600, display: 'block', marginBottom: 4 };

    return (
        <SettingsSection title="Contact support" eyebrow="Help">
            <div style={{ padding: '14px 20px' }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.45 }}>
                    Have a question or hit a problem? Send us a message — your diagnostic logs and contact
                    details are attached automatically so we can help faster.
                </div>
                <Row gap={8} align="stretch" style={{ marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Name</label>
                        <Input size="sm" value={name} onChange={e => setName( e.target.value )} placeholder="Your name" autoComplete="name"/>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Email</label>
                        <Input size="sm" type="email" value={email} onChange={e => setEmail( e.target.value )} placeholder="you@example.com" autoComplete="email"/>
                    </div>
                </Row>
                <label style={labelStyle}>Message</label>
                <Textarea size="sm" value={message} onChange={e => setMessage( e.target.value )} placeholder="Tell us what's going on…" rows={4}/>
                <Row gap={12} justify="between" style={{ marginTop: 10 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.4 }}>
                        Diagnostics &amp; recent activity are included automatically.
                    </span>
                    <Button variant="primary" size="sm" icon="mail" onClick={handleSend} disabled={! canSend}>
                        {sending ? 'Sending…' : 'Send message'}
                    </Button>
                </Row>
            </div>
        </SettingsSection>
    );
};
