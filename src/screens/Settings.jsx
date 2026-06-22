import { useState } from 'react';
import { Icon, Card, Pill, Button, Progress, Toggle, Divider } from '../components';
import { saveSettings, setLicense, clearLicense, submitSupport } from '../api';
import { creditUsageRows } from '../usage';

const formatResetDate = value => {
    if ( ! value ) return 'Not available';
    const date = new Date( value );
    if ( Number.isNaN( date.getTime() ) ) return String( value );
    return new Intl.DateTimeFormat( undefined, { month: 'long', day: 'numeric', year: 'numeric' } ).format( date );
};

export const SettingsScreen = ({ plan, quota, user, settings, connected, onUpgrade, onBuyCredits, onManageBilling, onToast, onConnect }) => {
    const isPro = plan === 'pro';
    const [advancedOpen, setAdvancedOpen] = useState( false );
    const [notifFresh, setNotifFresh]     = useState( settings?.notify_new_pages ?? true );
    const [notifDigest, setNotifDigest]   = useState( settings?.weekly_digest ?? false );
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

    const monthlyUsed  = quota?.monthly_used  || 0;
    const monthlyLimit = quota?.monthly_limit || 50;
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
        <div style={{ padding: '24px 32px 56px', maxWidth: 880, margin: '0 auto' }}>
            <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Settings</div>
                <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>Plan & preferences</h1>
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0', lineHeight: 1.5 }}>Manage your account, notifications, and advanced options.</p>
            </div>

            <PlanCard isPro={isPro} monthlyUsed={monthlyUsed} monthlyLimit={monthlyLimit} pct={pct} resetDate={resetDate} onUpgrade={onUpgrade} onBuyCredits={onBuyCredits} onManageBilling={onManageBilling}/>

            <CreditUsageCard quota={quota} used={monthlyUsed} limit={monthlyLimit} resetDate={resetDate}/>

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
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{isPro ? 'BeepBeep AI Pro service' : 'BeepBeep AI Free service'}</span>
                    <Pill tone={isPro ? 'primary' : 'neutral'}>{isPro ? 'Pro' : 'Free'}</Pill>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
                    {monthlyLimit} AI service credits per cycle · shared across your BeepBeep plugins · usable manually, in bulk, or with Autopilot.
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Button variant="secondary" size="sm" icon="zap" onClick={onBuyCredits}>Buy credits</Button>
                {isPro
                    ? <Button variant="secondary" size="sm" icon="external" onClick={onManageBilling}>Manage billing</Button>
                    : <Button variant="pro" size="sm" icon="crown" onClick={onUpgrade}>View Pro service plan</Button>}
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
    const companion = window.beeptiAdminData?.altTextCompanion?.state;
    const { rows, attributed } = creditUsageRows( quota, used, {
        alt_text: companion === 'active' || companion === 'installed',
    } );

    // Only show per-plugin numbers when the credits we could attribute actually
    // reconcile with the total used — otherwise (e.g. credits spent before
    // tracking began) fall back to one honest shared-usage bar instead of a
    // misleading row of zeros.
    const showBreakdown = used > 0 && attributed >= used;

    return (
        <Card padding={0} style={{ marginBottom: 18, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid var(--hairline)' }}>
                <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Shared across BeepBeep AI</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Credit usage</div>
                </div>
                <div className="tnum" style={{ fontSize: 13, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                    <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{used}</strong> / {limit} credits used
                </div>
            </div>
            <div style={{ padding: '11px 20px', display: 'flex', alignItems: 'flex-start', gap: 9, background: 'var(--surface-2)', borderBottom: '1px solid var(--hairline)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>
                <Icon name="info" size={14} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 1 }}/>
                <span>
                    One credit pool is shared by every BeepBeep AI plugin on this site. {showBreakdown
                        ? `The breakdown below shows which plugin consumed each credit · resets ${resetDate}.`
                        : `Per-plugin credits aren't itemised yet — the total above is shared across these plugins · resets ${resetDate}.`}
                </span>
            </div>
            {! showBreakdown && (
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--hairline)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 7 }}>
                        <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Shared usage</span>
                        <span className="mono tnum" style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}>{used} / {limit}</span>
                    </div>
                    <Progress value={used} max={limit} tone={limit > 0 && used / limit > 0.9 ? 'danger' : limit > 0 && used / limit > 0.75 ? 'warn' : 'primary'} height={6}/>
                </div>
            )}
            <div>
                {rows.map( ( row, index ) => {
                    const hasNumber = showBreakdown && row.used !== null && row.used !== undefined;
                    const percentage = hasNumber && used > 0 ? Math.min( 100, Math.round( ( row.used / used ) * 100 ) ) : 0;
                    return (
                        <div key={row.id} style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) auto', gap: 12, alignItems: 'center', borderBottom: index === rows.length - 1 ? 0 : '1px solid var(--hairline)', background: row.current ? row.soft : 'var(--surface)', opacity: row.installed ? 1 : 0.72 }}>
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
                            {hasNumber && (
                                <div className="tnum" style={{ minWidth: 46, textAlign: 'right' }}>
                                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{row.used}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{percentage}%</div>
                                </div>
                            )}
                        </div>
                    );
                } )}
            </div>
        </Card>
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
        const info = `Plugin: BeepBeep Titles\nWordPress: ${window.beeptiAdminData?.wpVersion || '6.x'}\nPHP: ${window.beeptiAdminData?.phpVersion || '8.x'}\nLicense: ${connected ? 'Connected' : 'Not connected'}\nSEO plugin: ${window.beeptiAdminData?.seoPlugin || 'fallback'}\nPlan: ${plan || 'free'}\nSite: ${window.location.hostname}`;
        navigator.clipboard?.writeText( info ).catch( () => {} );
        setCopied( true );
        setTimeout( () => setCopied( false ), 1800 );
    };

    const sysRows = [
        { k: 'Plugin',     v: 'BeepBeep Titles 1.0.0' },
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

    const inputStyle = {
        width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
        fontSize: 13, color: 'var(--text)', background: 'var(--surface)', outline: 0, fontFamily: 'inherit',
    };
    const focus = e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.18)'; };
    const blur  = e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; };

    return (
        <SettingsSection title="Contact support" eyebrow="Help">
            <div style={{ padding: '14px 20px' }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.45 }}>
                    Have a question or hit a problem? Send us a message — your diagnostic logs and contact
                    details are attached automatically so we can help faster.
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Name</label>
                        <input value={name} onChange={e => setName( e.target.value )} placeholder="Your name" autoComplete="name" style={inputStyle} onFocus={focus} onBlur={blur}/>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Email</label>
                        <input value={email} onChange={e => setEmail( e.target.value )} type="email" placeholder="you@example.com" autoComplete="email" style={inputStyle} onFocus={focus} onBlur={blur}/>
                    </div>
                </div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Message</label>
                <textarea
                    value={message}
                    onChange={e => setMessage( e.target.value )}
                    placeholder="Tell us what's going on…"
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    onFocus={focus}
                    onBlur={blur}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 12 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.4 }}>
                        Diagnostics &amp; recent activity are included automatically.
                    </span>
                    <Button variant="primary" size="sm" icon="mail" onClick={handleSend} disabled={! canSend}>
                        {sending ? 'Sending…' : 'Send message'}
                    </Button>
                </div>
            </div>
        </SettingsSection>
    );
};
