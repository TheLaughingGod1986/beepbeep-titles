import { Icon, Button, Tooltip } from './components';
import { UserMenu } from './auth';
import { getVisibleTabs } from './navigation';
import { CREDITS_PER_PAGE, isInsufficientCredits } from './quota';

export const WPChrome = ({
    children, activeTab, onTab, plan, onUpgrade, user, connected, isAdmin,
    onSignOut, onHelp, onConnect, onSignIn,
    creditsUsed = null, creditsLimit = null, creditsRemaining = null, creditsPerPage = CREDITS_PER_PAGE,
}) => {
    const tabs = getVisibleTabs( connected, { isAdmin } );
    const hasWallet = connected && creditsLimit != null && Number( creditsLimit ) > 0;
    const used = Math.max( 0, Number( creditsUsed ) || 0 );
    const limit = Math.max( 0, Number( creditsLimit ) || 0 );
    const remaining = Number.isFinite( Number( creditsRemaining ) )
        ? Math.max( 0, Number( creditsRemaining ) )
        : Math.max( 0, limit - used );
    const pageCost = Number( creditsPerPage ) > 0 ? Number( creditsPerPage ) : CREDITS_PER_PAGE;
    const insufficient = isInsufficientCredits( remaining, pageCost );
    const walletWarn = remaining <= 0 || insufficient;
    const walletTitle = insufficient
        ? `Shared wallet: ${ remaining } left, but each Titles page needs ${ pageCost } (title + meta)`
        : remaining <= 0
            ? 'Shared OpptiAI credit wallet — no credits remaining'
            : 'Shared OpptiAI credit wallet';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            {/* OpptiAI Titles tab strip — sticky below the 32px WP admin bar */}
            <div style={{
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                padding: '0 28px',
                display: 'flex', alignItems: 'center', gap: 0,
                height: 52,
                // top:0 (not 32): #wpbody-content is the sticky scroll
                // container (it has overflow-x:hidden) and already starts
                // below the fixed WP admin bar, so offsetting by 32 would
                // push the bar down and leave a 32px gap.
                position: 'sticky', top: 0, zIndex: 50,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: 22 }}>
                    <span style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.015em', color: 'var(--text)' }}>OpptiAI Titles</span>
                </div>
                <nav style={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
                    {tabs.map( t => {
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
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {hasWallet ? (
                        <button
                            type="button"
                            onClick={ onUpgrade || ( () => onTab( 'settings' ) ) }
                            title={walletTitle}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '3px 10px',
                                background: walletWarn ? 'var(--warn-soft, #fffbeb)' : 'var(--bg-sunken)',
                                border: `1px solid ${ walletWarn ? 'var(--warn-border, #fde68a)' : 'var(--border)' }`,
                                borderRadius: 999,
                                fontSize: 11,
                                color: walletWarn ? 'var(--warn-ink, #b45309)' : 'var(--text-2)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                        >
                            <Icon name="zap" size={12} />
                            {insufficient ? (
                                <>
                                    <span className="mono tnum">{remaining}</span>
                                    <span style={{ fontWeight: 500 }}>left · need {pageCost}/page</span>
                                </>
                            ) : (
                                <>
                                    <span className="mono tnum">{used} / {limit}</span>
                                    <span style={{ fontWeight: 500, color: 'var(--text-3)' }}>used</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <Tooltip content="OpptiAI Titles is monitoring your site in the background" placement="bottom">
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
                    )}
                    {plan === 'free' ? (
                        <Button variant="pro" size="sm" icon={connected ? 'crown' : 'arrow-right'} onClick={connected ? onUpgrade : onConnect}>
                            {connected ? 'Get more credits' : 'Create Account'}
                        </Button>
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
                    {connected && user ? (
                        <UserMenu
                            user={user}
                            plan={plan}
                            onSignOut={onSignOut}
                            onAccount={() => onTab( 'settings' )}
                            onHelp={onHelp || (() => {})}
                        />
                    ) : (
                        <Button variant="secondary" size="sm" icon="user" onClick={onSignIn || onConnect || ( () => onTab( 'settings' ) )}>Sign in</Button>
                    )}
                </div>
            </div>

            <div>{children}</div>
        </div>
    );
};
