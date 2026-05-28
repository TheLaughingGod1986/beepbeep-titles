import { Icon, Pill, Button, Tooltip } from './components';
import { UserMenu } from './auth';

export const WPChrome = ({ children, activeTab, onTab, plan, onUpgrade, user, onSignOut, onHelp }) => {
    const naiTabs = [
        { id: 'dashboard',  label: 'Home' },
        { id: 'library',    label: 'Library' },
        { id: 'automation', label: 'Autopilot' },
        { id: 'settings',   label: 'Settings' },
    ];

    const wpItems = [
        { label: 'Dashboard', glyph: '🅦',  group: 'core' },
        { label: 'Posts',     glyph: '📌', group: 'core' },
        { label: 'Media',     glyph: '🖼',  group: 'core' },
        { label: 'Pages',     glyph: '📄', group: 'core' },
        { label: 'Comments',  glyph: '💬', group: 'core' },
        { label: 'BeepBeep Titles', isNai: true, group: 'active' },
        { label: 'Appearance', glyph: '🎨', group: 'lower' },
        { label: 'Plugins',   glyph: '🔌', group: 'lower' },
        { label: 'Users',     glyph: '👤', group: 'lower' },
        { label: 'Tools',     glyph: '🛠',  group: 'lower' },
        { label: 'Settings',  glyph: '⚙',  group: 'lower' },
        { label: 'Collapse menu', glyph: '◀', group: 'footer' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
            {/* WP Admin top bar */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, height: 32,
                background: 'var(--wp-bg)', color: 'var(--wp-text)',
                display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 16,
                zIndex: 100, fontSize: 13,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#c3c4c7', width: '100%' }}>
                    <span style={{ fontSize: 18, opacity: 0.7 }}>≡</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 16, height: 16, borderRadius: 2, background: '#3c434a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🏠</span>
                        <span>My WordPress Site</span>
                    </span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ opacity: 0.7 }}>💬 0</span>
                    <span style={{ opacity: 0.7 }}>+ New</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.7 }}>Howdy, {user?.name || 'Admin'}</span>
                    <span style={{ width: 22, height: 22, borderRadius: 999, background: '#3c434a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                        {(user?.name || 'A')[0].toUpperCase()}
                    </span>
                </div>
            </div>

            {/* WP Admin sidebar */}
            <aside style={{
                width: 160, background: 'var(--wp-bg)', color: 'var(--wp-text)',
                position: 'fixed', top: 32, bottom: 0, left: 0,
                paddingTop: 8, paddingBottom: 16,
                display: 'flex', flexDirection: 'column',
                fontSize: 13, zIndex: 50,
                overflowY: 'auto',
            }}>
                {wpItems.map( ( item, i ) => (
                    <WPNavItem key={i} {...item}/>
                ) )}
            </aside>

            {/* Main content */}
            <main style={{ marginLeft: 160, marginTop: 32, flex: 1, minWidth: 0, position: 'relative' }}>
                {/* BeepBeep AI tab strip */}
                <div style={{
                    background: 'var(--surface)',
                    borderBottom: '1px solid var(--border)',
                    padding: '0 28px',
                    display: 'flex', alignItems: 'center', gap: 0,
                    height: 52,
                    position: 'sticky', top: 32, zIndex: 20,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: 22 }}>
                        <span style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.015em', color: 'var(--text)' }}>BeepBeep Titles</span>
                    </div>
                    <nav style={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
                        {naiTabs.map( t => {
                            const active = activeTab === t.id;
                            return (
                                <button key={t.id} onClick={() => onTab( t.id )}
                                    onMouseEnter={e => { if ( !active ) e.currentTarget.style.color = 'var(--text)'; }}
                                    onMouseLeave={e => { if ( !active ) e.currentTarget.style.color = 'var(--text-3)'; }}
                                    style={{
                                        background: 'transparent', border: 'none',
                                        padding: '0 12px', height: '100%',
                                        fontSize: 12.5, fontWeight: active ? 600 : 500,
                                        color: active ? 'var(--text)' : 'var(--text-3)',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'color .2s cubic-bezier(0.16,1,0.3,1)',
                                        letterSpacing: '-0.005em',
                                    }}>
                                    {t.label}
                                    <span aria-hidden="true" style={{
                                        position: 'absolute', left: 12, right: 12, bottom: -1, height: 2,
                                        background: active ? 'var(--text)' : 'transparent',
                                        borderRadius: 2,
                                        transition: 'background .2s cubic-bezier(0.16,1,0.3,1)',
                                    }}/>
                                </button>
                            );
                        } )}
                    </nav>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Tooltip content="BeepBeep Titles is monitoring your site in the background">
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '3px 9px',
                                background: 'var(--bg-sunken)',
                                border: '1px solid var(--border)',
                                borderRadius: 999,
                                fontSize: 11, color: 'var(--text-3)', fontWeight: 500,
                                whiteSpace: 'nowrap',
                            }}>
                                <span className="pulse-dot" style={{ width: 6, height: 6 }}/>
                                Active
                            </span>
                        </Tooltip>
                        {plan === 'free' ? (
                            <Button variant="pro" size="sm" icon="crown" onClick={onUpgrade}>Upgrade to Pro</Button>
                        ) : (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '3px 10px 3px 8px',
                                background: 'linear-gradient(180deg,#EFF4FE 0%,#DCE7FB 100%)',
                                border: '1px solid #C7D7F7',
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 0 0 3px rgba(37,99,235,0.06)',
                                borderRadius: 999,
                                fontSize: 11.5, fontWeight: 600, color: '#1D4ED8',
                                whiteSpace: 'nowrap',
                            }}>
                                <Icon name="crown" size={12} strokeWidth={2.2}/>
                                Pro
                            </span>
                        )}
                        {user && (
                            <UserMenu
                                user={user}
                                plan={plan}
                                onSignOut={onSignOut}
                                onAccount={() => onTab( 'settings' )}
                                onHelp={onHelp || (() => {})}
                            />
                        )}
                    </div>
                </div>

                <div>{children}</div>
            </main>
        </div>
    );
};

const WPNavItem = ({ label, glyph, isNai, group }) => {
    const isActive = isNai;
    const isSpacerBefore = group === 'lower' || group === 'footer';
    return (
        <>
            {isSpacerBefore && <div style={{ height: 10 }}/>}
            <div style={{
                padding: '8px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
                background: isActive ? 'var(--wp-active)' : 'transparent',
                color: isActive ? '#fff' : 'var(--wp-text)',
                cursor: 'pointer', fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                marginLeft: -1,
            }}>
                <span style={{ width: 16, fontSize: 13, display: 'inline-flex', justifyContent: 'center', opacity: isActive ? 1 : 0.85 }}>
                    {isNai ? <Icon name="logo" size={14} style={{ color: '#fff' }}/> : glyph}
                </span>
                <span>{label}</span>
            </div>
            {isActive && (
                <div style={{ background: '#2c3338', paddingTop: 4, paddingBottom: 4 }}>
                    {['Home','Library','Autopilot','Settings'].map( ( l, i ) => (
                        <div key={l} style={{ padding: '5px 12px 5px 30px', fontSize: 13, color: i === 0 ? '#fff' : '#bfc4ca', fontWeight: i === 0 ? 600 : 400 }}>{l}</div>
                    ) )}
                </div>
            )}
        </>
    );
};
