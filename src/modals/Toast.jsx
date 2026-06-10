import { useEffect } from 'react';
import { Icon } from '../components';

/* ── Toast ─────────────────────────────────────────────────────────── */
export const Toast = ({ message, sub, onDismiss, action, icon = 'check', tone = 'ok' }) => {
    useEffect( () => { const t = setTimeout( onDismiss, 6000 ); return () => clearTimeout( t ); }, [] );
    const tones = {
        ok:   { bg: 'var(--text)', fg: '#fff', ic: 'var(--ok)' },
        warn: { bg: 'var(--warn-soft)', fg: 'var(--warn-ink)', ic: 'var(--warn-ink)' },
    };
    const tc = tones[tone] || tones.ok;
    return (
        <div style={{
            position: 'fixed', bottom: 20, left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1500,
            background: tc.bg, color: tc.fg,
            padding: '12px 14px 12px 16px',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 13, fontWeight: 500,
            animation: 'bbt-slide-up .25s cubic-bezier(.2,.8,.2,1)',
            maxWidth: 480,
        }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: tc.ic }}>
                <Icon name={icon} size={15}/>
            </div>
            <div style={{ flex: 1 }}>
                <div>{message}</div>
                {sub && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{sub}</div>}
            </div>
            {action && (
                <button onClick={action.onClick} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{action.label}</button>
            )}
            <button onClick={onDismiss} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}>
                <Icon name="x" size={14}/>
            </button>
        </div>
    );
};
