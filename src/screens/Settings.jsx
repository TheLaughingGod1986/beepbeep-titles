import { useState } from 'react';
import { Icon, Card, Pill, Button, Progress, Toggle, Divider } from '../components';
import { saveSettings, setLicense, clearLicense } from '../api';

export const SettingsScreen = ({ plan, quota, user, settings, connected, onUpgrade, onBuyCredits, onManageBilling, onToast, onConnect }) => {
    const isPro = plan === 'pro';
    const [advancedOpen, setAdvancedOpen] = useState( false );
    const [notifFresh, setNotifFresh]     = useState( settings?.notify_new_pages ?? true );
    const [notifDigest, setNotifDigest]   = useState( settings?.weekly_digest ?? isPro );
    const [notifLimit, setNotifLimit]     = useState( settings?.notify_quota_warning ?? true );
    const [uninstallData, setUninstallData] = useState( settings?.delete_on_uninstall ?? false );
    const [licenseInput, setLicenseInput] = useState( '' );
    const [connecting, setConnecting]     = useState( false );
    const [saving, setSaving]             = useState( false );

    const handleConnect = async () => {
        const key = licenseInput.trim();
        if ( ! key ) return;
        setConnecting( true );
        try {
            const res = await setLicense( key );
            onToast?.( { message: 'License connected', sub: `Plan: ${ res.plan || 'free' } · ${ res.daily_remaining ?? 0 } left today`, icon: 'check', tone: 'ok' } );
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

    const monthlyUsed  = quota?.monthly_used  || 0;
    const monthlyLimit = quota?.monthly_limit || 50;
    const pct = monthlyLimit > 0 ? ( monthlyUsed / monthlyLimit ) * 100 : 0;
    const resetDate = 'June 1, 2026';

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
        <div style={{ padding: '24px 32px 56px', maxWidth: 880, margin: '0 auto' }}>
            <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Settings</div>
                <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>Plan & preferences</h1>
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0', lineHeight: 1.5 }}>Manage your account, notifications, and advanced options.</p>
            </div>

            <PlanCard isPro={isPro} monthlyUsed={monthlyUsed} monthlyLimit={monthlyLimit} pct={pct} resetDate={resetDate} onUpgrade={onUpgrade} onBuyCredits={onBuyCredits} onManageBilling={onManageBilling}/>

            <SettingsSection title="Account" eyebrow="Sign-in">
                <SettingsRow
                    label="Email"
                    desc="The WordPress administrator account connected to this plugin."
                    right={<span className="mono" style={{ fontSize: 13, color: 'var(--text-2)' }}>{user?.email || 'admin@yoursite.com'}</span>}
                />
                <SettingsRow
                    label="WordPress user"
                    desc="Logged in as this user when generating titles & meta."
                    right={<span style={{ fontSize: 13, color: 'var(--text-2)' }}>{user?.name || 'Admin'}</span>}
                    last
                />
            </SettingsSection>

            <SettingsSection title="BeepBeep license" eyebrow="Connection">
                {connected ? (
                    <SettingsRow
                        label="License key"
                        desc="Your site is connected to BeepBeep. Generations draw from your plan's quota."
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
                            Connect your BeepBeep license to start generating. Find your key in your BeepBeep account dashboard.
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
                    desc={isPro ? 'Sunday email with coverage + activity summary.' : 'Pro · Sunday email with coverage + activity summary.'}
                    right={<Toggle on={notifDigest && isPro} disabled={!isPro} onChange={v => isPro ? setNotifDigest( v ) : onUpgrade()}/>}
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

            <SettingsSection title="Danger zone" eyebrow="Destructive">
                <SettingsRow
                    label="Reset generated title & meta"
                    desc="Clear all BeepBeep Titles-generated titles and meta descriptions from your site. This cannot be undone."
                    right={<Button variant="secondary" size="sm">Reset…</Button>}
                />
                <SettingsRow
                    label="Delete data on uninstall"
                    desc="Remove all BeepBeep Titles settings and history when the plugin is uninstalled."
                    right={<Toggle on={uninstallData} onChange={setUninstallData}/>}
                    last
                />
            </SettingsSection>
        </div>
    );
};

const PlanCard = ({ isPro, monthlyUsed, monthlyLimit, pct, resetDate, onUpgrade, onBuyCredits, onManageBilling }) => (
    <Card padding={0} style={{ marginBottom: 18, overflow: 'hidden', ...( isPro ? { background: 'var(--primary-soft)', borderColor: 'var(--primary-border)' } : {} ) }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: isPro ? 'var(--primary)' : 'var(--bg-sunken)', color: isPro ? '#fff' : 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: isPro ? 'none' : '1px solid var(--border)' }}>
                <Icon name={isPro ? 'crown' : 'shield'} size={18} strokeWidth={2}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{isPro ? 'BeepBeep Titles Pro' : 'Free plan'}</span>
                    <Pill tone={isPro ? 'primary' : 'neutral'}>{isPro ? 'Pro' : 'Free'}</Pill>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
                    {isPro
                        ? 'Unlimited AI generations · no daily or monthly limits · automation & priority queue.'
                        : `Up to ${monthlyLimit} AI generations per month · shared across your BeepBeep plugins · manual generation only.`}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Button variant="secondary" size="sm" icon="zap" onClick={onBuyCredits}>Buy credits</Button>
                {isPro
                    ? <Button variant="secondary" size="sm" icon="external" onClick={onManageBilling}>Manage billing</Button>
                    : <Button variant="pro" size="sm" icon="crown" onClick={onUpgrade}>Upgrade to Pro</Button>}
            </div>
        </div>
        <div style={{ borderTop: '1px solid var(--hairline)', padding: '12px 20px 14px', background: 'var(--surface-2)' }}>
            {isPro ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="pulse-dot" style={{ width: 6, height: 6, background: 'var(--ok)' }}/>
                        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Continuous optimisation enabled</span>
                    </div>
                    <div className="tnum" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                        <span className="mono" style={{ color: 'var(--text-2)', fontWeight: 500 }}>{monthlyUsed}</span> pages improved this cycle
                        <span style={{ margin: '0 6px', opacity: 0.6 }}>·</span>
                        <span>Renews {resetDate}</span>
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>This billing cycle</span>
                        <span className="mono tnum" style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {monthlyUsed} / {monthlyLimit} AI generations used
                        </span>
                    </div>
                    <Progress value={monthlyUsed} max={monthlyLimit} tone={pct > 90 ? 'danger' : pct > 75 ? 'warn' : 'primary'} height={5}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
                        <span className="mono">{( monthlyLimit - monthlyUsed ).toLocaleString()} remaining</span>
                        <span className="mono">Resets {resetDate}</span>
                    </div>
                </>
            )}
        </div>
    </Card>
);

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

const DEBUG_EVENTS = [
    { time: 'just now',  level: 'info',  msg: 'Plugin initialised' },
    { time: '3:41 pm',   level: 'debug', msg: 'API request started — POST /wp-json/bbt/v1/generate' },
    { time: '3:41 pm',   level: 'debug', msg: 'API response received — 200 OK' },
    { time: '1:18 pm',   level: 'info',  msg: 'Scheduled scan complete — 0 issues' },
    { time: 'Yesterday', level: 'warn',  msg: 'Quota warning — 85% of monthly credits used' },
];

const AdvancedPanel = ({ settings, connected, plan }) => {
    const [copied, setCopied] = useState( false );
    const handleCopy = () => {
        const info = `Plugin: BeepBeep Titles\nWordPress: ${window.bbtData?.wpVersion || '6.x'}\nPHP: ${window.bbtData?.phpVersion || '8.x'}\nLicense: ${connected ? 'Connected' : 'Not connected'}\nSEO plugin: ${window.bbtData?.seoPlugin || 'fallback'}\nPlan: ${plan || 'free'}\nSite: ${window.location.hostname}`;
        navigator.clipboard?.writeText( info ).catch( () => {} );
        setCopied( true );
        setTimeout( () => setCopied( false ), 1800 );
    };

    const sysRows = [
        { k: 'Plugin',     v: 'BeepBeep Titles 1.0.0' },
        { k: 'WordPress',  v: window.bbtData?.wpVersion || '6.x' },
        { k: 'PHP',        v: window.bbtData?.phpVersion || '8.x' },
        { k: 'License',    v: connected ? 'Connected' : 'Not connected', tone: connected ? 'ok' : undefined },
        { k: 'SEO plugin', v: window.bbtData?.seoPlugin || 'fallback' },
        { k: 'Site URL',   v: window.location.hostname },
    ];

    const levelTones = { info: 'neutral', debug: 'neutral', warn: 'warn', error: 'danger' };

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
                    <Button variant="ghost" size="sm">Export CSV</Button>
                </div>
            </div>
            <Divider/>
            <div style={{ padding: '14px 20px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Recent events</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {DEBUG_EVENTS.map( ( e, i ) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 2px', borderBottom: i === DEBUG_EVENTS.length - 1 ? 'none' : '1px solid var(--hairline)' }}>
                            <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', width: 64, flexShrink: 0 }}>{e.time}</span>
                            <Pill tone={levelTones[e.level]} style={{ fontSize: 10.5, padding: '1px 8px', minWidth: 52, textAlign: 'center' }}>{e.level}</Pill>
                            <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.msg}</span>
                        </div>
                    ) )}
                </div>
                <button style={{ marginTop: 10, background: 'transparent', border: 0, padding: 0, color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    View full log →
                </button>
            </div>
        </div>
    );
};
