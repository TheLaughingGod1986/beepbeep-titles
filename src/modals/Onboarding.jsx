import { useState } from 'react';
import { Icon, Button } from '../components';
import { Row, Stack } from '../ui';
import { Modal } from './Modal';

/**
 * 4-screen onboarding: Welcome -> choose what to scan -> run the free health
 * check -> show the score + opportunities found. Every step here is free —
 * no AI credits are used until the user chooses to optimise something later.
 */
export const Onboarding = ({ open, onClose, onComplete, onScan, availablePostTypes = [], onSaveScanScope }) => {
    const [step, setStep] = useState( 0 );
    const [selectedTypes, setSelectedTypes] = useState( () => new Set() ); // empty = scan everything
    const [scanning, setScanning] = useState( false );
    const [scanned, setScanned] = useState( false );
    const [health, setHealth] = useState( { score: 0, issuesFound: 0, itemsScanned: 0 } );

    const steps = ['Welcome', 'Choose scope', 'Health check', 'Results'];

    const toggleType = ( slug ) => {
        setSelectedTypes( prev => {
            const next = new Set( prev );
            if ( next.has( slug ) ) next.delete( slug ); else next.add( slug );
            return next;
        } );
    };

    const runHealthCheck = async () => {
        setScanning( true );
        try {
            if ( onSaveScanScope ) {
                await onSaveScanScope( Array.from( selectedTypes ) );
            }
            const result = onScan ? await onScan() : null;
            if ( result ) {
                setHealth( {
                    score: result.health?.average_score ?? result.coverage ?? 0,
                    issuesFound: result.health?.issues_found ?? 0,
                    itemsScanned: result.health?.items_scanned ?? result.total ?? 0,
                } );
            }
        } catch ( e ) {
            // Keep whatever we have — the results screen still opens.
        } finally {
            setScanning( false );
            setScanned( true );
            setStep( 3 );
        }
    };

    return (
        <Modal open={open} onClose={onClose} width={620} dismissable={false}>
            <Row align="stretch" gap={8} style={{ padding: '20px 28px 0' }}>
                {steps.map( ( s, i ) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? 'var(--text)' : 'var(--bg-sunken)', transition: 'background .3s' }}/>
                ) )}
            </Row>
            <div style={{ padding: '8px 28px 4px', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Step {step + 1} of {steps.length} · {steps[step]}
            </div>

            {/* ── Screen 1: Welcome ── */}
            {step === 0 && (
                <div style={{ padding: '16px 28px 28px' }}>
                    <Icon name="logo" size={44} style={{ color: 'var(--primary-strong)', marginBottom: 14 }}/>
                    <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Improve your website continuously with OptiAI.</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
                        OptiAI scans your content, identifies issues and helps you improve them with AI-powered recommendations. The health check is free — you only spend credits when you choose to fix something.
                    </p>
                    <Stack gap={12} style={{ marginTop: 20, padding: 16, background: 'var(--bg-sunken)', borderRadius: 'var(--r-md)' }}>
                        {[
                            { icon: 'shield', text: 'Free health score — scanning never uses credits' },
                            { icon: 'zap',    text: 'Priority Action Centre shows what to fix first' },
                            { icon: 'flame',  text: 'Continuous optimisation keeps new pages covered' },
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

            {/* ── Screen 2: Choose what to scan ── */}
            {step === 1 && (
                <div style={{ padding: '16px 28px 28px' }}>
                    <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Choose what to scan</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 16px', lineHeight: 1.5 }}>
                        Leave everything selected to scan your whole site, or narrow it down. You can change this later in Settings.
                    </p>
                    <Stack gap={0} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                        {( availablePostTypes.length ? availablePostTypes : [ { slug: 'post', label: 'Posts' }, { slug: 'page', label: 'Pages' } ] ).map( ( pt, i ) => {
                            const checked = selectedTypes.size === 0 || selectedTypes.has( pt.slug );
                            return (
                                <label key={pt.slug} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', borderTop: i ? '1px solid var(--hairline)' : 'none' }}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleType( pt.slug )}
                                        style={{ width: 16, height: 16 }}
                                    />
                                    <span style={{ fontSize: 13.5, color: 'var(--text)' }}>{pt.label}</span>
                                </label>
                            );
                        } )}
                    </Stack>
                    <Row justify="between" align="stretch" style={{ marginTop: 20 }}>
                        <Button variant="ghost" size="md" onClick={() => setStep( 0 )}>Back</Button>
                        <Button variant="primary" size="md" iconRight="arrow-right" onClick={() => setStep( 2 )}>Continue</Button>
                    </Row>
                </div>
            )}

            {/* ── Screen 3: Run free health check ── */}
            {step === 2 && (
                <div style={{ padding: '16px 28px 28px' }}>
                    <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Run your free health check</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 20px', lineHeight: 1.55 }}>
                        We'll scan every selected page for missing titles, missing descriptions, duplicates and more. This is completely free — no credits are used.
                    </p>
                    <div style={{ padding: 28, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                        {scanning ? (
                            <>
                                <span className="pulse-dot" style={{ width: 10, height: 10, background: 'var(--primary)', display: 'inline-block', marginBottom: 12 }}/>
                                <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Scanning your site…</div>
                            </>
                        ) : (
                            <Button variant="primary" size="lg" icon="search" onClick={runHealthCheck}>
                                Run My Free Health Check
                            </Button>
                        )}
                    </div>
                    <Row justify="between" align="stretch" style={{ marginTop: 20 }}>
                        <Button variant="ghost" size="md" disabled={scanning} onClick={() => setStep( 1 )}>Back</Button>
                        <div/>
                    </Row>
                </div>
            )}

            {/* ── Screen 4: Results ── */}
            {step === 3 && (
                <div style={{ padding: '12px 28px 28px' }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 999,
                        background: 'var(--ok-soft)', border: '1px solid var(--ok-border)',
                        color: 'var(--ok-ink)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 14,
                    }}>
                        <Icon name="check" size={22} strokeWidth={2.4}/>
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                        Your site score is <span className="mono tnum">{health.score}</span>
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 18px', lineHeight: 1.55 }}>
                        {health.issuesFound > 0
                            ? <>We found <span className="mono tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{health.issuesFound}</span> optimisation opportunit{health.issuesFound === 1 ? 'y' : 'ies'} across <span className="mono tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{health.itemsScanned}</span> pages.</>
                            : <>Nothing needs attention right now — your scanned pages already look healthy.</>}
                    </p>
                    <Stack gap={8} style={{ padding: '14px 16px', background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                        {['Free health checks whenever you want them', 'Fix issues one at a time or in bulk', 'You can change scan scope anytime in Settings'].map( ( t, i ) => (
                            <Row key={i} gap={10} style={{ fontSize: 13, color: 'var(--text)' }}>
                                <Icon name="check" size={13} strokeWidth={2.4} style={{ color: 'var(--ok-ink)', flexShrink: 0 }}/>
                                <span>{t}</span>
                            </Row>
                        ) )}
                    </Stack>
                    <Row justify="end" align="stretch" style={{ marginTop: 20 }}>
                        <Button variant="primary" size="md" iconRight="arrow-right" onClick={onComplete}>View Recommendations</Button>
                    </Row>
                </div>
            )}
        </Modal>
    );
};
