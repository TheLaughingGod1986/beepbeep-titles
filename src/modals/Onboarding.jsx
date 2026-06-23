import { useState, useEffect } from 'react';
import { Icon, Button, Progress } from '../components';
import { Row, Stack } from '../ui';
import { Modal } from './Modal';

/* ── Onboarding wizard ─────────────────────────────────────────────── */
export const Onboarding = ({ open, onClose, onComplete, onScan }) => {
    const [step, setStep] = useState( 0 );
    const [scanning, setScanning] = useState( false );
    const [scanProgress, setScanProgress] = useState( 0 );
    const [scanned, setScanned] = useState( false );
    const [scanStats, setScanStats] = useState( { total: 0, missingTitle: 0, missingMeta: 0 } );
    const [showFasterOptions, setShowFasterOptions] = useState( false );

    useEffect( () => {
        if ( step === 1 && !scanned ) {
            setScanning( true );
            setScanProgress( 0 );
            const doScan = async () => {
                const iv = setInterval( () => {
                    setScanProgress( p => Math.min( p + 3, 85 ) );
                }, 60 );
                try {
                    const result = onScan ? await onScan() : null;
                    clearInterval( iv );
                    setScanProgress( 100 );
                    setScanning( false );
                    setScanned( true );
                    if ( result ) {
                        setScanStats( { total: result.total || 0, missingTitle: result.missing_title || 0, missingMeta: result.missing_meta || 0 } );
                    }
                } catch ( e ) {
                    clearInterval( iv );
                    setScanProgress( 100 );
                    setScanning( false );
                    setScanned( true );
                }
            };
            doScan();
        }
    }, [step, scanned] );

    const steps = ['Welcome', 'Scan site', 'Ready'];
    const totalNeeds = scanStats.missingTitle + scanStats.missingMeta;

    return (
        <Modal open={open} onClose={onClose} width={620} dismissable={false}>
            <Row align="stretch" gap={8} style={{ padding: '20px 28px 0' }}>
                {steps.map( ( s, i ) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? 'var(--text)' : 'var(--bg-sunken)', transition: 'background .3s' }}/>
                ) )}
            </Row>
            <div style={{ padding: '8px 28px 4px', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Step {step + 1} of 3 · {steps[step]}
            </div>

            {step === 0 && (
                <div style={{ padding: '16px 28px 28px' }}>
                    <Icon name="logo" size={44} style={{ color: 'var(--primary-strong)', marginBottom: 14 }}/>
                    <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Welcome to BeepBeep Titles.</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
                        Page SEO that runs continuously in the background. BeepBeep Titles crawls your published pages, writes title tags and meta descriptions, and keeps your coverage climbing.
                    </p>
                    <Stack gap={12} style={{ marginTop: 20, padding: 16, background: 'var(--bg-sunken)', borderRadius: 'var(--r-md)' }}>
                        {[
                            { icon: 'shield', text: 'Daily crawl to catch pages with missing title & meta' },
                            { icon: 'zap',    text: 'Generate 5 pages per day on Free — no rush' },
                            { icon: 'flame',  text: 'Build a streak — your site stays healthy over time' },
                        ].map( ( f, i ) => (
                            <Row key={i} gap={10} style={{ fontSize: 13, color: 'var(--text)' }}>
                                <Icon name={f.icon} size={15} style={{ color: 'var(--primary)' }}/>
                                {f.text}
                            </Row>
                        ) )}
                    </Stack>
                    <Row justify="end" align="stretch" style={{ marginTop: 20 }}>
                        <Button variant="primary" size="md" iconRight="arrow-right" onClick={() => setStep( 1 )}>Let's go</Button>
                    </Row>
                </div>
            )}

            {step === 1 && (
                <div style={{ padding: '16px 28px 28px' }}>
                    <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Scanning your site</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 20px' }}>
                        We'll look at every page and tell you what's missing. This won't use any credits.
                    </p>
                    <div style={{ padding: 24, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                        <Row justify="between" style={{ marginBottom: 12 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{scanning ? 'Crawling pages & posts…' : scanned ? 'Crawl complete' : 'Ready'}</span>
                            <span className="mono tnum" style={{ fontSize: 13, fontWeight: 600 }}>{scanProgress}%</span>
                        </Row>
                        <Progress value={scanProgress} max={100} tone={scanned ? 'ok' : 'primary'} height={6}/>
                        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                            <ScanStat label="Total pages"   value={scanned ? scanStats.total : scanning ? Math.floor( scanStats.total * scanProgress / 100 ) : 0}/>
                            <ScanStat label="Missing title" value={scanned ? scanStats.missingTitle : 0} tone="danger"/>
                            <ScanStat label="Missing meta"  value={scanned ? scanStats.missingMeta : 0} tone="warn"/>
                        </div>
                    </div>
                    {scanned && (
                        <Row gap={10} style={{ marginTop: 14, padding: 14, background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ok-ink)' }}>
                            <Icon name="check" size={16}/>
                            <span>
                                {totalNeeds > 0
                                    ? <><strong>{totalNeeds} pages</strong> need attention. You'll work through them gradually.</>
                                    : <><strong>Great news!</strong> Your site is already looking healthy.</>}
                            </span>
                        </Row>
                    )}
                    <Row justify="between" align="stretch" style={{ marginTop: 20 }}>
                        <Button variant="ghost" size="md" onClick={() => setStep( 0 )}>Back</Button>
                        <Button variant="primary" size="md" iconRight="arrow-right" disabled={!scanned} onClick={() => setStep( 2 )}>Continue</Button>
                    </Row>
                </div>
            )}

            {step === 2 && (
                <div style={{ padding: '12px 28px 28px' }}>
                    <div className="onboarding-success" style={{
                        width: 44, height: 44, borderRadius: 999,
                        background: 'var(--ok-soft)', border: '1px solid var(--ok-border)',
                        color: 'var(--ok-ink)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 14,
                    }}>
                        <Icon name="check" size={22} strokeWidth={2.4}/>
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Your site is ready</h2>
                    {totalNeeds > 0 && (
                        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 6px', lineHeight: 1.55 }}>
                            We found <span className="mono tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{totalNeeds}</span> pages needing attention.
                        </p>
                    )}
                    <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 18px', lineHeight: 1.55 }}>
                        We'll guide you through them gradually — no rush.
                    </p>
                    <Stack gap={8} style={{ padding: '14px 16px', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                        {['5 pages per day included free', 'Builds steady SEO coverage', 'You can change settings anytime'].map( ( t, i ) => (
                            <Row key={i} gap={10} style={{ fontSize: 13, color: 'var(--text)' }}>
                                <Icon name="check" size={13} strokeWidth={2.4} style={{ color: 'var(--ok-ink)', flexShrink: 0 }}/>
                                <span>{t}</span>
                            </Row>
                        ) )}
                    </Stack>
                    <div style={{ marginBottom: 4 }}>
                        <button
                            onClick={() => setShowFasterOptions( v => !v )}
                            aria-expanded={showFasterOptions}
                            style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {showFasterOptions ? 'Hide faster options' : 'See faster options'}
                            <Icon name={showFasterOptions ? 'chevron-down' : 'chevron-right'} size={12}/>
                        </button>
                        {showFasterOptions && (
                            <Stack className="fade-in" gap={10} style={{ marginTop: 10, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)' }}>
                                <Stack gap={2}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Bulk catch-up</div>
                                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>Use available BeepBeep AI service credits to optimise multiple pages, then let Autopilot handle new pages.</div>
                                </Stack>
                                <div style={{ height: 1, background: 'var(--hairline)' }}/>
                                <Stack gap={2}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Monitor only</div>
                                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>Just track SEO health and generate manually when you want to.</div>
                                </Stack>
                                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>You can switch to either of these later from Settings.</div>
                            </Stack>
                        )}
                    </div>
                    <Row justify="between" align="stretch" style={{ marginTop: 20 }}>
                        <Button variant="ghost" size="md" onClick={() => setStep( 1 )}>Back</Button>
                        <Button variant="primary" size="md" iconRight="arrow-right" onClick={onComplete}>Open dashboard</Button>
                    </Row>
                </div>
            )}
        </Modal>
    );
};

const ScanStat = ({ label, value, tone = 'neutral' }) => {
    const colors = { neutral: 'var(--text)', danger: 'var(--danger-ink)', warn: 'var(--warn-ink)' };
    return (
        <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
            <div className="mono tnum" style={{ fontSize: 22, fontWeight: 600, marginTop: 4, color: colors[tone] }}>{value}</div>
        </div>
    );
};
