import { useState, useEffect } from 'react';
import { Icon, Card, Pill, Button, Divider, Toggle, SerpPreview } from '../components';
import { saveSettings } from '../api';

const PRESETS = [
    { id: 'direct',        label: 'Direct',        desc: 'Plain, factual phrasing. Best for utility pages, docs, support.',                     sampleTitle: 'Cappuccino & Latte Art Tutorials | My Site',                                  sampleMeta: 'Learn cappuccino, latte, and macchiato techniques. Step-by-step guides, photos, and short videos for any home espresso machine.' },
    { id: 'benefit',       label: 'Benefit-led',   desc: 'Leads with the outcome. Higher click-through on commercial pages.',                    sampleTitle: 'Make Cafe-Quality Cappuccino at Home in 6 Minutes',                           sampleMeta: 'Stop paying $6 a cup. Our barista-tested method gets you silky foam and balanced espresso every morning.' },
    { id: 'authoritative', label: 'Authoritative', desc: 'Credibility signals. Good for guides, cornerstone content, longform.',                sampleTitle: 'The Complete Guide to Cappuccino Latte Art (2026)',                            sampleMeta: 'From milk temperature to free pours — the definitive cappuccino guide trusted by thousands. Written by expert trainers, updated for 2026.' },
    { id: 'conversational',label: 'Conversational',desc: 'Friendly and human. Lowers click-friction on blog content.',                          sampleTitle: 'Cappuccino, but actually good — at home',                                     sampleMeta: 'We\'ve spent years tuning coffee for our site. Here\'s everything we\'d tell a friend about getting started. No gatekeeping.' },
];

const TITLE_LENGTHS = [
    { id: 'compact',  label: 'Compact',  range: '40–50 chars' },
    { id: 'standard', label: 'Standard', range: '50–60 chars' },
    { id: 'rich',     label: 'Rich',     range: '60–65 chars' },
];
const META_LENGTHS = [
    { id: 'brief',    label: 'Brief',    range: '110–130 chars' },
    { id: 'standard', label: 'Standard', range: '140–160 chars' },
    { id: 'detailed', label: 'Detailed', range: '160–170 chars' },
];

const TITLE_MAX = { compact: 50, standard: 60, rich: 65 };
const META_MAX  = { brief: 130, standard: 160, detailed: 170 };

const trimToChars = ( text, max ) => {
    if ( text.length <= max ) return text;
    const slice = text.slice( 0, max );
    const lastSpace = slice.lastIndexOf( ' ' );
    return slice.slice( 0, lastSpace > max - 12 ? lastSpace : max ).replace( /[,.;:\s]$/, '' ) + '…';
};

export const AutopilotScreen = ({ plan, settings, autoOptimise, onAutoToggle, onUpgrade, onToast }) => {
    const isPro = plan === 'pro';
    const [style, setStyle]           = useState( settings?.tone || 'direct' );
    const [titleLen, setTitleLen]     = useState( settings?.title_length || 'standard' );
    const [metaLen, setMetaLen]       = useState( settings?.meta_length  || 'standard' );
    const [instructions, setInstructions] = useState( settings?.custom_instructions || '' );
    const [saving, setSaving]         = useState( false );
    const [scanDaily, setScanDaily]       = useState( settings?.scan_daily     ?? isPro );
    const [weeklyDigest, setWeeklyDigest] = useState( settings?.weekly_digest  ?? isPro );
    const [driftAlerts, setDriftAlerts]   = useState( settings?.drift_alerts   ?? false );

    const toggleSchedule = async ( key, setter, value, toast ) => {
        if ( !isPro ) { onUpgrade(); return; }
        setter( value );
        try { await saveSettings( { [key]: value } ); } catch ( e ) {}
        if ( value && onToast ) onToast( toast );
    };

    const preset = PRESETS.find( p => p.id === style );
    const previewTitle = trimToChars( preset.sampleTitle, TITLE_MAX[titleLen] );
    const previewMeta  = trimToChars( preset.sampleMeta,  META_MAX[metaLen] );

    const handleSave = async () => {
        if ( !isPro ) { onUpgrade(); return; }
        setSaving( true );
        try {
            await saveSettings( { tone: style, title_length: titleLen, meta_length: metaLen, custom_instructions: instructions } );
            if ( onToast ) onToast( { message: 'Settings saved', icon: 'check', tone: 'ok' } );
        } catch ( e ) {
            if ( onToast ) onToast( { message: 'Failed to save settings', icon: 'alert', tone: 'warn' } );
        } finally {
            setSaving( false );
        }
    };

    const handleReset = () => {
        setStyle( 'direct' );
        setTitleLen( 'standard' );
        setMetaLen( 'standard' );
        setInstructions( '' );
    };

    return (
        <div style={{ padding: '24px 32px 56px', maxWidth: 960, margin: '0 auto' }}>
            <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Autopilot</div>
                <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>Hands-off page SEO</h1>
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0', maxWidth: 580, lineHeight: 1.5 }}>
                    Decide how BeepBeep Titles writes page titles and meta descriptions — and let it run quietly in the background every time you publish.
                </p>
            </div>

            <AutopilotHero isPro={isPro} on={isPro && autoOptimise} onToggle={() => isPro ? onAutoToggle( !autoOptimise ) : onUpgrade()} onUpgrade={onUpgrade}/>

            <SectionTitle eyebrow="Generation" title="How BeepBeep Titles writes" subtitle="These preferences apply to every page — manual and automated." pill={!isPro && <Pill tone="primary" icon="crown">Pro</Pill>}/>

            <LockedSection
                locked={!isPro}
                onUpgrade={onUpgrade}
                title="Control how your titles & meta are written"
                sub="Tone, length, and custom instructions are a Pro feature. Free plans generate with smart defaults."
            >
                <Card padding={0} style={{ marginBottom: 12 }}>
                    <div style={{ padding: '16px 20px' }}>
                        <Label>Tone</Label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                            {PRESETS.map( p => <PresetCard key={p.id} preset={p} active={style === p.id} onClick={() => setStyle( p.id )}/>)}
                        </div>
                    </div>
                    <Divider/>
                    <LengthRow label="Title length"            options={TITLE_LENGTHS} value={titleLen}  onChange={setTitleLen}/>
                    <Divider/>
                    <LengthRow label="Meta description length" options={META_LENGTHS}  value={metaLen}   onChange={setMetaLen}/>
                    <Divider/>
                    <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                            <Label>Custom instructions <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 6 }}>Optional</span></Label>
                            <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{instructions.length}/280</span>
                        </div>
                        <textarea
                            value={instructions}
                            onChange={e => setInstructions( e.target.value.slice( 0, 280 ) )}
                            placeholder='e.g. "Always include the city in the title for location pages."'
                            rows={3}
                            style={{ width: '100%', marginTop: 8, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--text)', background: 'var(--surface)', resize: 'vertical', minHeight: 68, lineHeight: 1.5, outline: 0 }}/>
                    </div>
                </Card>

                <SERPPreviewCard preset={preset} title={previewTitle} meta={previewMeta} instructions={instructions}/>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                    <Button variant="ghost" size="md" onClick={handleReset}>Reset defaults</Button>
                    <Button variant="primary" size="md" icon="check" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </LockedSection>

            <SectionTitle eyebrow="Run on a schedule" title="Background work" subtitle="Optional Pro extras that keep your site SEO healthy without you opening BeepBeep Titles."/>

            <Card padding={0} style={{ marginBottom: 14 }}>
                <ScheduleRow
                    icon="calendar"
                    title="Daily site crawl"
                    desc="Sweep your published pages every morning to catch anything with missing or weak titles & meta."
                    on={isPro && scanDaily}
                    locked={!isPro}
                    onChange={() => toggleSchedule( 'scan_daily', setScanDaily, !scanDaily, { message: 'Daily crawl enabled', sub: 'BeepBeep Titles will sweep your pages every morning at 6 am.', icon: 'calendar', tone: 'ok' } )}
                />
                <Divider/>
                <ScheduleRow
                    icon="mail"
                    title="Weekly digest email"
                    desc="A Sunday health report: what was optimised, what needs review, coverage trend."
                    on={isPro && weeklyDigest}
                    locked={!isPro}
                    onChange={() => toggleSchedule( 'weekly_digest', setWeeklyDigest, !weeklyDigest, { message: 'Weekly digest enabled', sub: 'Next report lands Sunday at 9 am.', icon: 'mail', tone: 'ok' } )}
                />
                <Divider/>
                <ScheduleRow
                    icon="bell"
                    title="SEO drift alerts"
                    desc="Notify when content updates make existing title & meta stale or off-topic."
                    on={isPro && driftAlerts}
                    locked={!isPro}
                    onChange={() => toggleSchedule( 'drift_alerts', setDriftAlerts, !driftAlerts, { message: 'SEO drift alerts enabled', sub: 'Sample alert: 3 pages on /blog may be off-topic after recent edits.', icon: 'bell', tone: 'warn' } )}
                />
            </Card>
        </div>
    );
};

const ScheduleRow = ({ icon, title, desc, on, locked, onChange }) => (
    <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: locked ? 'transparent' : on ? 'var(--ok-soft)' : 'var(--bg-sunken)', color: locked ? 'var(--text-3)' : on ? 'var(--ok-ink)' : 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: locked ? '1px solid var(--border)' : 'none' }}>
            <Icon name={locked ? 'lock' : icon} size={14}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: locked ? 'var(--text-2)' : 'var(--text)', lineHeight: 1.3 }}>{title}</span>
                {locked && <Pill tone="neutral">Pro</Pill>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.45 }}>{desc}</div>
        </div>
        <Toggle on={on} disabled={locked} onChange={onChange}/>
    </div>
);


const AutopilotHero = ({ isPro, on, onToggle, onUpgrade }) => {
    if ( !isPro ) {
        return (
            <Card padding={0} style={{ marginBottom: 22, background: 'var(--primary-soft)', borderColor: 'var(--primary-border)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="crown" size={17} strokeWidth={2}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Auto-generate on publish</span>
                            <Pill tone="primary" icon="crown">Pro</Pill>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
                            Every page you publish gets a title & meta description in seconds. Free users can still generate manually from the Library.
                        </div>
                    </div>
                    <Button variant="pro" size="sm" icon="crown" onClick={onUpgrade}>Upgrade</Button>
                </div>
            </Card>
        );
    }

    return (
        <Card padding={0} style={{ marginBottom: 22, borderColor: on ? 'var(--ok-border)' : 'var(--border)' }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: on ? 'var(--ok-soft)' : 'var(--bg-sunken)', color: on ? 'var(--ok-ink)' : 'var(--text-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${on ? 'var(--ok-border)' : 'var(--border)'}` }}>
                    <Icon name="zap" size={18} strokeWidth={2}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>Auto-generate on publish</span>
                        {on ? <Pill tone="ok"><span className="pulse-dot" style={{ width: 6, height: 6 }}/> Running</Pill> : <Pill tone="neutral">Paused</Pill>}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
                        {on ? 'BeepBeep Titles will write a title & meta description for every page the moment it goes live.' : 'Turn this on so you never have to think about title & meta again.'}
                    </div>
                </div>
                <Toggle on={on} onChange={onToggle}/>
            </div>
            {on && (
                <div className="fade-in" style={{ borderTop: '1px solid var(--hairline)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 24, background: 'var(--surface-2)', fontSize: 12 }}>
                    <HeroStat label="Optimised, last 24h" value="—"/>
                    <HeroStat label="Avg generation time" value="~2s"/>
                    <HeroStat label="Last run" value="Just now"/>
                </div>
            )}
        </Card>
    );
};

const HeroStat = ({ label, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
        <span className="mono tnum" style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </div>
);

const SectionTitle = ({ eyebrow, title, subtitle, pill }) => (
    <div style={{ margin: '20px 0 10px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{eyebrow}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.25 }}>{title}</h2>
            {pill}
        </div>
        {subtitle && <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.45 }}>{subtitle}</div>}
    </div>
);

/**
 * Wraps Pro-only settings. When `locked`, the children render dimmed and
 * non-interactive behind a blurred overlay with an Upgrade CTA; otherwise they
 * render untouched.
 */
const LockedSection = ({ locked, onUpgrade, title, sub, children }) => {
    if ( !locked ) return <>{children}</>;
    return (
        <div style={{ position: 'relative' }}>
            <div aria-hidden="true" style={{ pointerEvents: 'none', userSelect: 'none', filter: 'blur(2px)', opacity: 0.55 }}>
                {children}
            </div>
            <div style={{
                position: 'absolute', inset: 0, zIndex: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                textAlign: 'center', padding: '64px 24px',
                background: 'rgba(248,250,252,0.35)', backdropFilter: 'blur(1.5px)', WebkitBackdropFilter: 'blur(1.5px)',
            }}>
                <span style={{ width: 46, height: 46, borderRadius: 999, background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(15,23,42,0.14)', marginBottom: 12 }}>
                    <Icon name="lock" size={20} strokeWidth={2}/>
                </span>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--text)' }}>{title}</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.45, maxWidth: 400 }}>{sub}</p>
                <Button variant="pro" size="md" icon="crown" onClick={onUpgrade}>Upgrade to Pro</Button>
            </div>
        </div>
    );
};

const Label = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{children}</div>
);

const LengthRow = ({ label, options, value, onChange }) => (
    <div style={{ padding: '16px 20px' }}>
        <Label>{label}</Label>
        <div style={{ display: 'flex', gap: 3, marginTop: 8, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 3 }}>
            {options.map( l => {
                const isOn = value === l.id;
                return (
                    <button key={l.id} onClick={() => onChange( l.id )} style={{ flex: 1, padding: '7px 12px', background: isOn ? 'var(--surface)' : 'transparent', color: 'var(--text)', border: '1px solid', borderColor: isOn ? 'var(--border)' : 'transparent', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all .15s cubic-bezier(0.16,1,0.3,1)', boxShadow: isOn ? '0 1px 2px rgba(15,23,42,0.06)' : 'none' }}>
                        <div style={{ lineHeight: 1.2 }}>{l.label}</div>
                        <div className="mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', marginTop: 2 }}>{l.range}</div>
                    </button>
                );
            } )}
        </div>
    </div>
);

const PresetCard = ({ preset, active, onClick }) => (
    <button onClick={onClick} style={{ textAlign: 'left', padding: '12px 14px', background: active ? 'var(--primary-soft)' : 'var(--surface)', border: '1px solid', borderColor: active ? 'var(--primary-border)' : 'var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'all .15s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border-strong)'}`, background: active ? 'var(--primary)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff' }}/>}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--primary-ink)' : 'var(--text)', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{preset.label}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.45, paddingLeft: 22 }}>{preset.desc}</div>
    </button>
);

const SERPPreviewCard = ({ preset, title, meta, instructions }) => (
    <Card padding={0} style={{ marginBottom: 22, background: 'var(--surface-2)' }}>
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon name="eye" size={13} style={{ color: 'var(--text-3)' }}/>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Search result preview</span>
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{preset.label}</span>
        </div>
        <div style={{ padding: '18px 22px' }}>
            <SerpPreview
                variant="large"
                faviconLetter="M"
                siteName="My Site"
                displayUrl="https://mysite.com › page"
                title={title}
                titleKey={title}
                meta={meta}
                metaKey={meta}
                metaPrefix="May 2026 —"/>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
                <span className="mono">Title <span style={{ color: title.length > 60 ? 'var(--warn-ink)' : 'var(--text-2)', fontWeight: 600 }}>{title.length}</span>/60 chars</span>
                <span className="mono">Meta <span style={{ color: meta.length > 160 ? 'var(--warn-ink)' : 'var(--text-2)', fontWeight: 600 }}>{meta.length}</span>/160 chars</span>
            </div>
            {instructions && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 6, alignItems: 'flex-start', lineHeight: 1.45 }}>
                    <Icon name="info" size={12} style={{ marginTop: 2, flexShrink: 0 }}/>
                    <span>Your instructions will be applied: <em style={{ color: 'var(--text-2)' }}>"{instructions}"</em></span>
                </div>
            )}
        </div>
    </Card>
);

