import { useState } from 'react';
import { Icon, Button, KBD } from '../components';
import { Modal } from './Modal';

/* ── Help modal ────────────────────────────────────────────────────── */
export const HelpModal = ({ open, onClose }) => {
    const [query, setQuery] = useState( '' );
    const topics = [
        { icon: 'sparkles', title: 'Getting started',           desc: 'Connect your site, run your first pass, and turn on Autopilot.' },
        { icon: 'zap',      title: 'How Autopilot works',       desc: 'What BeepBeep Titles does in the background and how to control it.' },
        { icon: 'shield',   title: 'Writing better title & meta', desc: 'Tone presets, length controls, and SEO best practice.' },
        { icon: 'crown',    title: 'Plans & billing',           desc: 'Free vs Pro, switching plans, invoices and refunds.' },
        { icon: 'settings', title: 'Troubleshooting',           desc: 'Connection issues, missing pages, regenerating title & meta.' },
        { icon: 'mail',     title: 'Contact support',           desc: 'Get a human within one business day.' },
    ];
    const q = query.trim().toLowerCase();
    const filtered = q ? topics.filter( t => ( t.title + ' ' + t.desc ).toLowerCase().includes( q ) ) : topics;

    return (
        <Modal open={open} onClose={onClose} width={620}>
            <div style={{ position: 'relative' }}>
                <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 999, width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)', zIndex: 2 }}>
                    <Icon name="x" size={13}/>
                </button>
                <div style={{ padding: '20px 24px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Help & docs</div>
                    <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>How can we help?</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0', lineHeight: 1.5 }}>Search documentation, browse guides, or reach our support team directly.</p>
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                        <Icon name="search" size={14} style={{ color: 'var(--text-3)' }}/>
                        <input autoFocus value={query} onChange={e => setQuery( e.target.value )} placeholder="Search help articles…" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}/>
                    </div>
                </div>
                <div style={{ padding: '0 12px 8px', maxHeight: '50vh', overflowY: 'auto' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>No articles matched. Try contacting support.</div>
                    ) : filtered.map( ( t, i ) => (
                        <button key={i} onClick={onClose} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: '10px 12px', background: 'transparent', border: 0, borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-soft)', color: 'var(--primary-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon name={t.icon} size={14}/>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{t.title}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1, lineHeight: 1.45 }}>{t.desc}</div>
                            </div>
                            <Icon name="chevron-right" size={14} style={{ color: 'var(--text-3)', marginTop: 7, flexShrink: 0 }}/>
                        </button>
                    ) )}
                </div>
                <div style={{ borderTop: '1px solid var(--hairline)', background: 'var(--surface-2)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', borderBottomLeftRadius: 'var(--r-xl)', borderBottomRightRadius: 'var(--r-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                        {[
                            { keys: ['G'],       label: "Start today's pass" },
                            { keys: ['⌘', 'K'],  label: 'Open command bar' },
                            { keys: ['⌘', '/'],  label: 'Open help' },
                            { keys: ['Esc'],     label: 'Close' },
                        ].map( ( s, i, arr ) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                {s.keys.map( ( k, j ) => <KBD key={j}>{k}</KBD> )}
                                <span style={{ color: 'var(--text-3)' }}>{s.label}</span>
                                {i < arr.length - 1 && <span style={{ opacity: 0.5, marginLeft: 4 }}>·</span>}
                            </span>
                        ) )}
                    </div>
                    <Button variant="secondary" size="sm" icon="external" onClick={onClose}>Open docs site</Button>
                </div>
            </div>
        </Modal>
    );
};
