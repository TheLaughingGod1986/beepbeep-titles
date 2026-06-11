import { useState, useEffect, useRef } from 'react';
import { Icon, Pill, Button } from './components';
import { Modal } from './modals/Modal';

export const UserMenu = ({ user, plan, onSignOut, onAccount, onHelp }) => {
    const [open, setOpen] = useState( false );
    const wrapRef = useRef( null );

    useEffect( () => {
        if ( !open ) return;
        const onDown = ( e ) => { if ( wrapRef.current && !wrapRef.current.contains( e.target ) ) setOpen( false ); };
        const onKey  = ( e ) => { if ( e.key === 'Escape' ) setOpen( false ); };
        document.addEventListener( 'mousedown', onDown );
        window.addEventListener( 'keydown', onKey );
        return () => { document.removeEventListener( 'mousedown', onDown ); window.removeEventListener( 'keydown', onKey ); };
    }, [open] );

    const initials = ( user.name || user.email || '?' )
        .split( /[\s@.]+/ ).filter( Boolean ).slice( 0, 2 ).map( s => s[0] ).join( '' ).toUpperCase();

    return (
        <div ref={wrapRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen( v => !v )}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Account menu"
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '3px 6px 3px 3px',
                    background: open ? 'var(--bg-sunken)' : 'transparent',
                    border: '1px solid',
                    borderColor: open ? 'var(--border)' : 'transparent',
                    borderRadius: 999,
                    cursor: 'pointer',
                    transition: 'background .15s ease, border-color .15s ease',
                }}
                onMouseEnter={e => { if ( !open ) e.currentTarget.style.background = 'var(--bg-sunken)'; }}
                onMouseLeave={e => { if ( !open ) e.currentTarget.style.background = 'transparent'; }}
            >
                <Avatar initials={initials} size={22}/>
                <Icon name="chevron-down" size={11} style={{ color: 'var(--text-3)' }}/>
            </button>

            {open && (
                <div role="menu" className="fade-in" style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    width: 240, zIndex: 30,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden',
                }}>
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--hairline)' }}>
                        <Avatar initials={initials} size={32}/>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.name || 'Account'}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.email}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--hairline)' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Plan</span>
                        {plan === 'pro'
                            ? <Pill tone="primary" icon="crown">Pro</Pill>
                            : <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Free</span>}
                    </div>

                    <MenuItem icon="settings" label="Account settings" onClick={() => { setOpen( false ); onAccount(); }}/>
                    <MenuItem icon="info"     label="Help & docs"       onClick={() => { setOpen( false ); onHelp(); }}/>
                    <div style={{ borderTop: '1px solid var(--hairline)' }}/>
                    <MenuItem icon="logout"   label="Sign out"          tone="danger" onClick={() => { setOpen( false ); onSignOut(); }}/>
                </div>
            )}
        </div>
    );
};

const MenuItem = ({ icon, label, onClick, tone }) => {
    const [hover, setHover] = useState( false );
    const color = tone === 'danger' ? 'var(--danger-ink)' : 'var(--text-2)';
    return (
        <button
            role="menuitem"
            onClick={onClick}
            onMouseEnter={() => setHover( true )}
            onMouseLeave={() => setHover( false )}
            style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '8px 14px',
                background: hover ? 'var(--bg-sunken)' : 'transparent',
                border: 'none', cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13, color, fontWeight: 500,
                transition: 'background .12s ease',
            }}
        >
            <Icon name={icon} size={13} style={{ color, flexShrink: 0 }}/>
            {label}
        </button>
    );
};

export const Avatar = ({ initials, size = 28 }) => (
    <span style={{
        width: size, height: size, borderRadius: 999,
        background: 'linear-gradient(135deg,#3B82F6,#5046E5)',
        color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round( size * 0.42 ), fontWeight: 600, letterSpacing: '0.01em',
        flexShrink: 0,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
    }}>{initials}</span>
);

export const SignOutConfirm = ({ open, onCancel, onConfirm }) => (
    <Modal open={open} onClose={onCancel} width={420}>
        <div style={{ padding: '22px 24px 20px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--bg-sunken)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon name="logout" size={17} style={{ color: 'var(--text-2)' }}/>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: '0 0 6px' }}>Sign out of BeepBeep Titles?</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
                Autopilot will pause and no new pages will be optimised until you reconnect your license.
                All previously generated titles & meta descriptions stay on your site.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <Button variant="ghost" size="md" onClick={onCancel}>Stay signed in</Button>
                <Button variant="secondary" size="md" onClick={onConfirm}>Sign out</Button>
            </div>
        </div>
    </Modal>
);

