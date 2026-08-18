import { useState, useEffect, useRef } from 'react';
import { Icon, Pill, Button } from './components';
import { Field, Input } from './ui';
import { Modal } from './modals/Modal';
import { loginWithPassword, registerAccount, setLicense } from './api';
import { planDisplayName } from './quota';

const isValidEmail = ( value ) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test( value );

const signupValidationMessage = ( email, password ) => {
    if ( ! isValidEmail( email.trim() ) ) {
        return 'Enter a valid email address.';
    }

    if ( password.length < 8 ) {
        return 'Use at least 8 characters for your password.';
    }

    return null;
};

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
                        {plan && plan !== 'free'
                            ? <Pill tone="primary" icon="crown">{planDisplayName( plan )}</Pill>
                            : <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Free</span>}
                    </div>

                    <MenuItem icon="settings" label="Account settings" onClick={() => { setOpen( false ); onAccount(); }}/>
                    <MenuItem icon="info"     label="Quick Setup Guide" onClick={() => { setOpen( false ); onHelp(); }}/>
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
            <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: '0 0 6px' }}>Sign out of OpptiAI Titles?</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
                Autopilot will pause and no new pages will be optimised until you reconnect your account.
                All previously generated titles & meta descriptions stay on your site.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <Button variant="ghost" size="md" onClick={onCancel}>Stay signed in</Button>
                <Button variant="secondary" size="md" onClick={onConfirm}>Sign out</Button>
            </div>
        </div>
    </Modal>
);

/* ----------------------------------------------------------------
   SignedOutScreen — calm reconnect surface shown in place of the
   dashboard when no account is connected. Three paths: sign in with a
   password, paste a license key, or create an account. Wired to the
   real auth endpoints; on success the parent refreshes quota/connection.
   ---------------------------------------------------------------- */
export const SignedOutScreen = ({ lastEmail, onConnected, onToast }) => {
    const [email, setEmail]       = useState( lastEmail || '' );
    const [password, setPassword] = useState( '' );
    const [name, setName]         = useState( '' );
    const [license, setLicenseKey] = useState( '' );
    const [showPw, setShowPw]     = useState( false );
    const [mode, setMode]         = useState( 'password' ); // 'password' | 'license' | 'signup'
    const [submitting, setSubmitting] = useState( false );
    const [error, setError]       = useState( null );

    const run = async ( fn, fallback ) => {
        setSubmitting( true );
        setError( null );
        try {
            const res = await fn();
            onConnected?.( res );
        } catch ( err ) {
            const msg = err?.message || fallback;
            setError( msg );
            onToast?.( { message: "Couldn't connect", sub: msg, icon: 'alert', tone: 'warn' } );
            setSubmitting( false );
        }
    };

    const submitPassword = ( e ) => {
        e?.preventDefault?.();
        if ( ! email.trim() || ! password ) return;
        run( () => loginWithPassword( email.trim(), password ), 'Check your email and password and try again.' );
    };
    const submitLicense = ( e ) => {
        e?.preventDefault?.();
        if ( ! license.trim() ) return;
        run( () => setLicense( license.trim() ), 'Check the key and try again.' );
    };
    const submitSignup = ( e ) => {
        e?.preventDefault?.();
        const validation = signupValidationMessage( email, password );
        if ( validation ) {
            setError( validation );
            return;
        }
        run( () => registerAccount( email.trim(), password ), 'Couldn\'t create that account. Try again.' );
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 32px - 52px)',
            padding: '56px 32px 80px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            background: 'var(--bg)',
        }}>
            <div className="signedout-in" style={{ width: '100%', maxWidth: 400 }}>
                {/* Brand mark — tighter, single line */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                    <Icon name="logo" size={26} style={{ color: 'var(--primary-strong)' }}/>
                    <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', lineHeight: 1 }}>OpptiAI</span>
                    <span aria-hidden="true" style={{ width: 1, height: 12, background: 'var(--border-strong)', opacity: 0.7 }}/>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)', letterSpacing: '0.04em', fontWeight: 500 }}>Title &amp; Meta SEO</span>
                </div>

                <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.022em', margin: '0 0 6px', lineHeight: 1.2 }}>
                    {mode === 'signup' ? 'Create your account' : 'Welcome back'}
                </h1>
                <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: '0 0 24px', lineHeight: 1.55 }}>
                    {mode === 'password' && 'Sign in to keep your pages covered.'}
                    {mode === 'license'  && 'Paste your license key to connect this site.'}
                    {mode === 'signup'   && 'Start covering your pages in under a minute. Free, no credit card.'}
                </p>

                {mode === 'password' && (
                    <form onSubmit={submitPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Field label="Email">
                            <Input
                                type="email"
                                autoFocus={! email}
                                value={email}
                                onChange={e => { setEmail( e.target.value ); setError( null ); }}
                                placeholder="you@yoursite.com"
                            />
                        </Field>
                        <Field
                            label="Password"
                            right={<button type="button" style={{ ...quietLinkStyle, fontSize: 11.5 }}>Forgot password?</button>}
                        >
                            <PasswordInput value={password} onChange={v => { setPassword( v ); setError( null ); }} show={showPw} onToggle={() => setShowPw( s => ! s )} autoFocus={!! email} placeholder="Enter your password"/>
                        </Field>
                        {error && <AuthError>{error}</AuthError>}
                        <Button variant="primary" size="md" full type="submit" iconRight={submitting ? null : 'arrow-right'} disabled={! email.trim() || ! password || submitting} onClick={submitPassword}>
                            {submitting ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </form>
                )}

                {mode === 'license' && (
                    <form onSubmit={submitLicense} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Field label="License key">
                            <Input
                                autoFocus
                                value={license}
                                onChange={e => { setLicenseKey( e.target.value ); setError( null ); }}
                                placeholder="BBT-XXXX-XXXX-XXXX"
                                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}
                            />
                        </Field>
                        {error && <AuthError>{error}</AuthError>}
                        <Button variant="primary" size="md" full type="submit" iconRight={submitting ? null : 'arrow-right'} disabled={! license.trim() || submitting} onClick={submitLicense}>
                            {submitting ? 'Connecting…' : 'Connect site'}
                        </Button>
                    </form>
                )}

                {mode === 'signup' && (
                    <form onSubmit={submitSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Field label="Name">
                            <Input autoFocus value={name} onChange={e => setName( e.target.value )} placeholder="Your name"/>
                        </Field>
                        <Field label="Email">
                            <Input type="email" value={email} onChange={e => { setEmail( e.target.value ); setError( null ); }} placeholder="you@yoursite.com"/>
                        </Field>
                        <Field label="Password" right={<span style={{ fontSize: 11, color: 'var(--text-3)' }}>At least 8 characters</span>}>
                            <PasswordInput value={password} onChange={v => { setPassword( v ); setError( null ); }} show={showPw} onToggle={() => setShowPw( s => ! s )} placeholder="Create a password"/>
                        </Field>
                        {error && <AuthError>{error}</AuthError>}
                        <Button variant="primary" size="md" full type="submit" iconRight={submitting ? null : 'arrow-right'} disabled={! email.trim() || password.length < 8 || submitting} onClick={submitSignup}>
                            {submitting ? 'Creating account…' : 'Create account'}
                        </Button>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
                            By creating an account you agree to OpptiAI&rsquo;s{' '}
                            <button type="button" style={quietLinkStyle}>Terms</button> and{' '}
                            <button type="button" style={quietLinkStyle}>Privacy Policy</button>.
                        </p>
                    </form>
                )}

                {/* Mode switch — quiet text link. Hidden during signup; that has its own footer. */}
                {mode !== 'signup' && (
                    <div style={{ marginTop: 18, textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => { setMode( mode === 'password' ? 'license' : 'password' ); setError( null ); }}
                            style={{ background: 'transparent', border: 'none', padding: 6, fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500, cursor: 'pointer', transition: 'color .15s ease' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                        >
                            {mode === 'password' ? 'Use a license key instead' : 'Use email instead'}
                        </button>
                    </div>
                )}

                {/* Reassurance strip — quiet, mature. The "system alive" signal:
                    confirms the user's data is intact while signed out. */}
                <div style={{
                    marginTop: 20, padding: '11px 13px',
                    background: 'var(--surface-2)', border: '1px solid var(--hairline)',
                    borderRadius: 'var(--r-md)',
                    display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                    {[
                        'Your existing titles & meta descriptions stay on your site.',
                        'Autopilot resumes the moment you sign back in.',
                        'You can switch plans anytime from Settings.',
                    ].map( ( t, i ) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-2)', letterSpacing: '-0.005em' }}>
                            <Icon name="check" size={11} strokeWidth={2.6} style={{ color: 'var(--ok-ink)', flexShrink: 0 }}/>
                            <span>{t}</span>
                        </div>
                    ) )}
                </div>

                {/* Footer — swaps between sign-up prompt and sign-in prompt by mode. */}
                <div style={{ marginTop: 22, fontSize: 12, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6 }}>
                    {mode === 'signup' ? (
                        <>
                            Already have an account?{' '}
                            <button type="button" onClick={() => { setMode( 'password' ); setError( null ); }} style={authLinkStyle}>Sign in</button>
                        </>
                    ) : (
                        <>
                            New to OpptiAI?{' '}
                            <button type="button" onClick={() => { setMode( 'signup' ); setError( null ); }} style={authLinkStyle}>Create an account</button>
                            <span style={{ margin: '0 8px', opacity: 0.5 }}>·</span>
                            <WhatIsNai/>
                        </>
                    )}
                </div>

                {/* Tiny system-alive footnote — the quietest sign of life on the page. */}
                <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 11, color: 'var(--text-3)' }}>
                    <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--ok)', opacity: 0.7 }}/>
                    <span>Your pages are ready when you sign in.</span>
                </div>
            </div>
        </div>
    );
};

const PasswordInput = ({ value, onChange, show, onToggle, autoFocus, placeholder }) => (
    <div style={{ position: 'relative' }}>
        <Input
            type={show ? 'text' : 'password'}
            autoFocus={autoFocus}
            value={value}
            onChange={e => onChange( e.target.value )}
            placeholder={placeholder}
            style={{ paddingRight: 44 }}
        />
        <button
            type="button"
            onClick={onToggle}
            aria-label={show ? 'Hide password' : 'Show password'}
            tabIndex={-1}
            style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', padding: 6,
                color: 'var(--text-3)', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, transition: 'color .18s ease, background .18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'var(--bg-sunken)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent'; }}
        >
            <Icon name="eye" size={14}/>
        </button>
    </div>
);

const AuthError = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--danger-ink)', lineHeight: 1.45 }}>
        <Icon name="alert" size={13} style={{ flexShrink: 0, marginTop: 1 }}/>
        <span>{children}</span>
    </div>
);

/* WhatIsNai — small trigger that reveals a concise, non-marketing
   explanation on hover/focus. No modal, no marketing surface. */
const WhatIsNai = () => {
    const [open, setOpen] = useState( false );
    return (
        <span
            style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => setOpen( true )}
            onMouseLeave={() => setOpen( false )}
        >
            <button
                type="button"
                onFocus={() => setOpen( true )}
                onBlur={() => setOpen( false )}
                style={{
                    background: 'transparent', border: 'none', padding: 0,
                    color: 'var(--text-3)', fontSize: 12, fontWeight: 500, cursor: 'help',
                    borderBottom: '1px dotted var(--border-strong)',
                    transition: 'color .18s ease, border-color .18s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderBottomColor = 'var(--text-3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderBottomColor = 'var(--border-strong)'; }}
            >What is OpptiAI?</button>
            {open && (
                <span role="tooltip" className="fade-in" style={{
                    position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%',
                    transform: 'translateX(-50%)', width: 256, padding: '10px 12px',
                    background: 'var(--text)', color: '#CBD5E1',
                    fontSize: 11.5, lineHeight: 1.55, fontWeight: 400,
                    borderRadius: 8, textAlign: 'left', letterSpacing: '-0.003em',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 50, pointerEvents: 'none',
                }}>
                    OpptiAI Titles automatically scans your pages and improves their SEO
                    <span style={{ whiteSpace: 'nowrap' }}> titles &amp; meta descriptions</span>
                    {' '}for search and click-through. Runs quietly in the background.
                    <span style={{
                        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                        borderTop: '5px solid var(--text)',
                    }}/>
                </span>
            )}
        </span>
    );
};

const authLinkStyle = {
    background: 'transparent', border: 'none', padding: 0,
    color: 'var(--primary-ink)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    transition: 'color .18s ease',
};

const quietLinkStyle = {
    background: 'transparent', border: 'none', padding: 0,
    color: 'var(--text-3)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
};
