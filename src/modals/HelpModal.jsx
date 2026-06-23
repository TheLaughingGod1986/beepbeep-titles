import { useEffect } from 'react';
import { Icon, Button } from '../components';
import { Row, Stack } from '../ui';
import { track } from '../api';
import { Modal } from './Modal';

const DOCS_URL = 'https://oppti.dev/docs/titles';

const steps = [
    {
        icon: 'user',
        title: 'Connect your account',
        body: 'Scan and review metadata locally. Connect BeepBeep AI when you want external AI generation.',
        benefits: [
            'No credit card required',
            'Setup takes less than one minute',
            'Works with Yoast, Rank Math and AIOSEO',
        ],
    },
    {
        icon: 'search',
        title: 'Scan your website',
        body: 'BeepBeep analyses your pages and identifies what needs attention.',
        benefits: [
            'Missing SEO titles',
            'Missing meta descriptions',
            'Optimisation opportunities',
        ],
    },
    {
        icon: 'wand',
        title: 'Generate metadata',
        body: 'AI creates SEO-friendly metadata for the pages that need it.',
        benefits: [
            'Page titles',
            'Meta descriptions',
            'Search-ready content',
        ],
    },
    {
        icon: 'shield-check',
        title: 'Review & publish',
        body: 'Review suggestions before publishing. You remain in full control.',
        benefits: [
            'Edit before publishing',
            'Regenerate if needed',
            'Publish instantly',
        ],
    },
];

export const HelpModal = ({ open, onClose, onStartScan }) => {
    useEffect( () => {
        if ( open ) {
            track( 'setup_guide_opened', { completion_percent: 0 } );
        }
    }, [open] );

    const startScan = () => {
        track( 'setup_guide_completed', { completion_percent: 100, action: 'go_to_dashboard' } );
        onClose();
        if ( onStartScan ) {
            onStartScan();
        }
    };

    const openDocs = () => {
        track( 'docs_link_clicked', { source: 'quick_setup_guide', href: DOCS_URL, completion_percent: 100 } );
        window.open( DOCS_URL, '_blank', 'noopener,noreferrer' );
    };

    return (
        <Modal open={open} onClose={onClose} width={720}>
            <div style={{ position: 'relative' }}>
                <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 999, width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', zIndex: 2 }}>
                    <Icon name="x" size={13}/>
                </button>

                <div style={{ padding: '24px 28px 18px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: 'var(--primary-soft)', color: 'var(--primary-ink)',
                            border: '1px solid var(--primary-border)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Icon name="sparkles" size={15}/>
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>60 second tour</span>
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Quick Setup Guide</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
                        Generate SEO titles and meta descriptions automatically in four simple steps.
                    </p>
                </div>

                <div style={{ padding: '0 20px 18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                        {steps.map( ( step, index ) => (
                            <SetupStep key={step.title} index={index + 1} {...step}/>
                        ) )}
                    </div>
                </div>

                <Row justify="between" gap={12} wrap style={{
                    borderTop: '1px solid var(--hairline)',
                    background: 'var(--surface-2)',
                    padding: '14px 20px',
                    borderBottomLeftRadius: 'var(--r-xl)', borderBottomRightRadius: 'var(--r-xl)',
                }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.45 }}>
                        Start with a scan, then generate and publish only what you approve.
                    </div>
                    <Row gap={8} wrap>
                        <Button variant="secondary" size="md" icon="external" onClick={openDocs}>View Full Documentation</Button>
                        <Button variant="primary" size="md" icon="search" onClick={startScan}>Start My First Scan</Button>
                    </Row>
                </Row>
            </div>
        </Modal>
    );
};

const SetupStep = ({ index, icon, title, body, benefits }) => (
    <Row align="stretch" gap={12} style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: 14,
        minHeight: 176,
    }}>
        <Stack gap={0} align="center" style={{ flexShrink: 0 }}>
            <span className="mono tnum" style={{
                width: 22, height: 22, borderRadius: 999,
                background: 'var(--text)', color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
                marginBottom: 8,
            }}>{index}</span>
            <span style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'var(--bg-sunken)', color: 'var(--text-2)',
                border: '1px solid var(--border)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon name={icon} size={16}/>
            </span>
        </Stack>
        <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.01em', margin: '1px 0 5px', color: 'var(--text)', lineHeight: 1.25 }}>{title}</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45, margin: '0 0 9px' }}>{body}</p>
            <Stack gap={5}>
                {benefits.map( benefit => (
                    <Row key={benefit} align="start" gap={7} style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.35 }}>
                        <Icon name="check" size={12} strokeWidth={2.6} style={{ color: 'var(--ok-ink)', flexShrink: 0, marginTop: 1 }}/>
                        {benefit}
                    </Row>
                ) )}
            </Stack>
        </div>
    </Row>
);
