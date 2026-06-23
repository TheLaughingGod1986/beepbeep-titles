/**
 * Primitive components — the implementation home of the shared design system.
 *
 * These were previously in src/components/index.jsx; that file now re-exports
 * from here so existing `../components` imports keep working. Self-contained
 * (React + CSS-variable tokens only), so this directory can be lifted into the
 * published @beepbeep/ui package without dragging app code along.
 */
import { useState } from 'react';

export const Icon = ({ name, size = 16, strokeWidth = 1.75, className = '', style = {} }) => {
    const s = size;
    const props = {
        width: s, height: s, viewBox: '0 0 24 24',
        fill: 'none', stroke: 'currentColor',
        strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
        className, style,
    };
    switch ( name ) {
        case 'shield':       return <svg {...props}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/></svg>;
        case 'shield-check': return <svg {...props}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
        case 'sparkles':     return <svg {...props}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
        case 'wand':         return <svg {...props}><path d="m15 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z"/><path d="M3 21 14 10"/><path d="m17 7 1.5 1.5"/></svg>;
        case 'image':        return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>;
        case 'upload':       return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>;
        case 'flame':        return <svg {...props}><path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-6-1 2-2 3-4 3 0-3-1-5-3-7-1 4-5 6-5 10 0 4 3 7 8 7Z"/></svg>;
        case 'zap':          return <svg {...props}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>;
        case 'clock':        return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
        case 'calendar':     return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
        case 'chevron-right':return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
        case 'chevron-down': return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
        case 'chevron-left': return <svg {...props}><path d="m15 18-6-6 6-6"/></svg>;
        case 'arrow-right':  return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
        case 'check':        return <svg {...props}><path d="m5 12 5 5 9-11"/></svg>;
        case 'x':            return <svg {...props}><path d="M18 6 6 18M6 6l12 12"/></svg>;
        case 'plus':         return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
        case 'info':         return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>;
        case 'alert':        return <svg {...props}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>;
        case 'search':       return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
        case 'filter':       return <svg {...props}><path d="M3 5h18M6 12h12M10 19h4"/></svg>;
        case 'settings':     return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .67.39 1.27 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01c.24.61.84 1 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>;
        case 'activity':     return <svg {...props}><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>;
        case 'library':      return <svg {...props}><path d="M3 19a2 2 0 0 1 2-2h14v4H5a2 2 0 0 1-2-2Z"/><path d="M3 5a2 2 0 0 1 2-2h14v14H5a2 2 0 0 1-2-2V5Z"/></svg>;
        case 'home':         return <svg {...props}><path d="m3 11 9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9Z"/></svg>;
        case 'bell':         return <svg {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
        case 'crown':        return <svg {...props}><path d="m2 19 2-11 5 5 3-7 3 7 5-5 2 11H2Z"/><path d="M2 21h20"/></svg>;
        case 'mail':         return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
        case 'lock':         return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>;
        case 'refresh':      return <svg {...props}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>;
        case 'trend':        return <svg {...props}><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>;
        case 'edit':         return <svg {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>;
        case 'code':         return <svg {...props}><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/></svg>;
        case 'eye':          return <svg {...props}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>;
        case 'play':         return <svg {...props}><path d="m6 4 14 8-14 8V4Z"/></svg>;
        case 'external':     return <svg {...props}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></svg>;
        case 'trash':        return <svg {...props}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
        case 'logout':       return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>;
        case 'user':         return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>;
        case 'logo':         return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}><rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor"/><path d="M7.5 16V9.5l4 5V9.5M14.5 9.5h2.5M15.75 9.5V16" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
        case 'dot':          return <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>;
        default:             return null;
    }
};

export const Card = ({ children, className = '', style = {}, padding = 24, onClick }) => (
    <div
        onClick={onClick}
        className={`beepti-card${ className ? ' ' + className : '' }`}
        style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            padding,
            boxShadow: 'var(--shadow-sm)',
            transition: 'border-color .15s ease, box-shadow .15s ease',
            cursor: onClick ? 'pointer' : 'default',
            ...style,
        }}
    >{children}</div>
);

export const Pill = ({ tone = 'neutral', icon, children, style = {} }) => {
    const tones = {
        neutral: { bg: 'var(--bg-sunken)', fg: 'var(--text-2)', bd: 'var(--border)' },
        ok:      { bg: 'var(--ok-soft)',      fg: 'var(--ok-ink)',      bd: 'var(--ok-border)' },
        warn:    { bg: 'var(--warn-soft)',    fg: 'var(--warn-ink)',    bd: 'var(--warn-border)' },
        danger:  { bg: 'var(--danger-soft)',  fg: 'var(--danger-ink)',  bd: 'var(--danger-border)' },
        primary: { bg: 'var(--primary-soft)', fg: 'var(--primary-ink)', bd: 'var(--primary-border)' },
        streak:  { bg: 'var(--streak-soft)',  fg: '#B45309',            bd: '#FDE3BE' },
    };
    const t = tones[tone] || tones.neutral;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
            borderRadius: 'var(--r-pill)',
            padding: '3px 10px',
            fontSize: 12, fontWeight: 600, letterSpacing: '-0.005em',
            lineHeight: 1.4,
            ...style,
        }}>
            {icon && <Icon name={icon} size={12} strokeWidth={2.2}/>}
            {children}
        </span>
    );
};

export const Button = ({ variant = 'primary', size = 'md', icon, iconRight, children, onClick, disabled, style = {}, full, type = 'button' }) => {
    const sizes = {
        sm: { px: 10, py: 6,  fs: 13, gap: 6, ic: 14 },
        md: { px: 14, py: 9,  fs: 14, gap: 8, ic: 15 },
        lg: { px: 18, py: 12, fs: 15, gap: 8, ic: 16 },
    }[size];
    const variants = {
        primary:   { bg: 'var(--text)', fg: '#fff', bd: 'var(--text)', hover: '#020617', disabledBg: '#F1F5F9', disabledFg: 'var(--text-2)', disabledBd: '#E2E8F0' },
        secondary: { bg: 'var(--surface)', fg: 'var(--text)', bd: 'var(--border-strong)', hover: 'var(--bg-sunken)', disabledBg: '#F1F5F9', disabledFg: 'var(--text-3)', disabledBd: 'var(--border)' },
        ghost:     { bg: 'transparent', fg: 'var(--text-2)', bd: 'transparent', hover: 'var(--bg-sunken)', disabledBg: 'transparent', disabledFg: 'var(--text-3)', disabledBd: 'transparent' },
        danger:    { bg: 'var(--danger)', fg: '#fff', bd: 'var(--danger)', hover: '#DC2626', disabledBg: '#F1F5F9', disabledFg: 'var(--text-2)', disabledBd: '#E2E8F0' },
        pro:       { bg: 'linear-gradient(180deg,#2563EB 0%,#1D4ED8 100%)', fg: '#fff', bd: '#1D4ED8', hover: 'linear-gradient(180deg,#1D4ED8 0%,#1E40AF 100%)', disabledBg: '#F1F5F9', disabledFg: 'var(--text-2)', disabledBd: '#E2E8F0' },
    };
    const v = variants[variant];
    const bg = disabled ? v.disabledBg : v.bg;
    const fg = disabled ? v.disabledFg : v.fg;
    const bd = disabled ? v.disabledBd : v.bd;
    const showShadow = !disabled && ( variant === 'primary' || variant === 'pro' );
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={e => { if ( !disabled ) e.currentTarget.style.background = v.hover; }}
            onMouseLeave={e => { if ( !disabled ) e.currentTarget.style.background = v.bg; }}
            onMouseDown={e => !disabled && ( e.currentTarget.style.transform = 'scale(0.98)' )}
            onMouseUp={e => !disabled && ( e.currentTarget.style.transform = 'scale(1)' )}
            style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: sizes.gap,
                background: bg, color: fg, border: `1px solid ${bd}`,
                borderRadius: 'var(--r-md)',
                padding: `${sizes.py}px ${sizes.px}px`,
                fontSize: sizes.fs, fontWeight: 600, letterSpacing: '-0.005em',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background .18s ease, border-color .18s ease, color .18s ease, transform .08s ease',
                width: full ? '100%' : 'auto',
                whiteSpace: 'nowrap',
                boxShadow: showShadow ? '0 1px 0 rgba(255,255,255,0.18) inset, 0 1px 2px rgba(0,0,0,0.18)' : 'none',
                ...style,
            }}
        >
            {icon && <Icon name={icon} size={sizes.ic} strokeWidth={2}/>}
            {children}
            {iconRight && <Icon name={iconRight} size={sizes.ic} strokeWidth={2}/>}
        </button>
    );
};

export const Progress = ({ value, max = 100, tone = 'ok', height = 6, showLabel = false }) => {
    const pct = Math.min( 100, Math.max( 0, ( value / max ) * 100 ) );
    const colors = { ok: 'var(--ok)', warn: 'var(--warn)', danger: 'var(--danger)', primary: 'var(--primary)', neutral: 'var(--text-2)' };
    return (
        <div style={{ width: '100%' }}>
            <div style={{ background: 'var(--bg-sunken)', borderRadius: 999, height, overflow: 'hidden', border: '1px solid var(--hairline)' }}>
                <div style={{ background: colors[tone], height: '100%', width: `${pct}%`, borderRadius: 999, transition: 'width .6s cubic-bezier(.2,.8,.2,1)' }}/>
            </div>
            {showLabel && <div className="mono tnum" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{pct.toFixed(0)}%</div>}
        </div>
    );
};

export const Ring = ({ value, max = 100, size = 96, stroke = 8, tone = 'ok', children }) => {
    const pct = Math.min( 100, Math.max( 0, ( value / max ) * 100 ) );
    const r = ( size - stroke ) / 2;
    const c = 2 * Math.PI * r;
    const dash = ( pct / 100 ) * c;
    const colors = { ok: 'var(--ok)', warn: 'var(--warn)', danger: 'var(--danger)', primary: 'var(--primary)' };
    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={stroke}/>
                <circle cx={size/2} cy={size/2} r={r} fill="none"
                    stroke={colors[tone]} strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${c}`}
                    style={{ transition: 'stroke-dasharray .8s cubic-bezier(.2,.8,.2,1)' }}/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </div>
        </div>
    );
};

export const Divider = ({ vertical, style = {} }) => (
    vertical
        ? <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)', ...style }}/>
        : <div style={{ height: 1, width: '100%', background: 'var(--border)', ...style }}/>
);

export const KBD = ({ children }) => (
    <kbd style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        background: 'var(--bg-sunken)', border: '1px solid var(--border)',
        borderBottomWidth: 2, borderRadius: 4,
        padding: '1px 5px', color: 'var(--text-2)',
    }}>{children}</kbd>
);

export const Tooltip = ({ children, content, placement = 'top' }) => {
    const [open, setOpen] = useState( false );
    const position = placement === 'bottom'
        ? { top: 'calc(100% + 6px)' }
        : { bottom: 'calc(100% + 6px)' };
    return (
        <span style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => setOpen( true )} onMouseLeave={() => setOpen( false )}>
            {children}
            {open && (
                <span style={{
                    position: 'absolute', left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--text)', color: '#fff',
                    fontSize: 11, padding: '4px 8px', borderRadius: 6,
                    whiteSpace: 'nowrap', zIndex: 1000, fontWeight: 500,
                    pointerEvents: 'none',
                    ...position,
                }}>{content}</span>
            )}
        </span>
    );
};

export const Toggle = ({ on, onChange, disabled = false, size = 'md' }) => {
    const dims = size === 'sm'
        ? { w: 34, h: 20, knob: 14, pad: 3 }
        : { w: 42, h: 24, knob: 18, pad: 3 };
    return (
        <button
            onClick={() => !disabled && onChange && onChange( !on )}
            disabled={disabled}
            aria-pressed={on}
            style={{
                width: dims.w, height: dims.h,
                borderRadius: 999,
                background: disabled ? 'var(--bg-sunken)' : on ? 'var(--ok)' : '#D2D8E2',
                border: '1px solid',
                borderColor: disabled ? 'var(--border)' : on ? 'var(--ok)' : 'var(--border-strong)',
                position: 'relative',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background .18s ease, border-color .18s ease',
                padding: 0,
                flexShrink: 0,
                opacity: disabled ? 0.7 : 1,
            }}>
            <span style={{
                position: 'absolute',
                top: dims.pad - 1, left: on ? dims.w - dims.knob - dims.pad - 1 : dims.pad - 1,
                width: dims.knob, height: dims.knob,
                borderRadius: 999,
                background: '#fff',
                boxShadow: '0 1px 2px rgba(15,23,42,0.18)',
                transition: 'left .18s cubic-bezier(.2,.8,.2,1)',
            }}/>
        </button>
    );
};
