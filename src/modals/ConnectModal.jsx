import { useState } from 'react';
import { Modal } from './Modal';
import { Icon, Button } from '../components';
import { setLicense, loginWithPassword } from '../api';

const inputStyle = ( error, mono = false ) => ( {
    display: 'block', width: '100%', boxSizing: 'border-box',
    padding: '11px 14px',
    border: `1.5px solid ${ error ? 'var(--danger)' : 'var(--border)' }`,
    borderRadius: 'var(--r-md)',
    fontSize: 14, fontFamily: mono ? 'var(--font-mono)' : 'inherit',
    color: 'var(--text)', background: error ? 'var(--danger-soft)' : 'var(--surface)',
    outline: 0,
    transition: 'border-color .15s ease, box-shadow .15s ease, background .15s ease',
    letterSpacing: mono ? '0.04em' : 'normal',
} );

const focusHandlers = ( error ) => ( {
    onFocus: e => {
        if ( ! error ) {
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.16)';
        }
    },
    onBlur: e => {
        if ( ! error ) {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.boxShadow = 'none';
        }
    },
} );

const FieldLabel = ({ children }) => (
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, letterSpacing: '0.02em' }}>
        {children}
    </div>
);

const FieldError = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 7, fontSize: 12, color: 'var(--danger-ink)', lineHeight: 1.45 }}>
        <Icon name="alert" size={13} style={{ flexShrink: 0, marginTop: 1 }}/>
        {children}
    </div>
);

export const ConnectModal = ({ open, onClose, onSuccess }) => {
    const [mode, setMode]         = useState( 'password' ); // 'password' | 'license'
    const [email, setEmail]       = useState( '' );
    const [password, setPassword] = useState( '' );
    const [showPw, setShowPw]     = useState( false );
    const [key, setKey]           = useState( '' );
    const [connecting, setConnecting] = useState( false );
    const [error, setError]       = useState( null );
    const [done, setDone]         = useState( false );

    const reset = () => {
        setMode( 'password' );
        setEmail( '' );
        setPassword( '' );
        setShowPw( false );
        setKey( '' );
        setError( null );
        setDone( false );
        setConnecting( false );
    };

    const handleClose = () => { reset(); onClose(); };

    const finish = ( res ) => {
        setDone( true );
        // Brief success pause so the user sees the confirmation.
        setTimeout( () => {
            reset();
            onClose();
            onSuccess?.( res );
        }, 900 );
    };

    const canSubmit = mode === 'password'
        ? email.trim() !== '' && password !== ''
        : key.trim() !== '';

    const handleConnect = async () => {
        if ( ! canSubmit || connecting ) return;
        setError( null );
        setConnecting( true );
        try {
            const res = mode === 'password'
                ? await loginWithPassword( email.trim(), password )
                : await setLicense( key.trim() );
            finish( res );
        } catch ( err ) {
            setError( err?.message || ( mode === 'password'
                ? 'Couldn\'t sign in with those details. Check them and try again.'
                : 'Couldn\'t verify that license key. Check it and try again.' ) );
            setConnecting( false );
        }
    };

    const handleKeyDown = ( e ) => {
        if ( e.key === 'Enter' && canSubmit && ! connecting ) handleConnect();
    };

    const switchMode = ( next ) => {
        setMode( next );
        setError( null );
    };

    return (
        <Modal open={open} onClose={handleClose} width={480} dismissable={! connecting}>
            <div style={{ padding: '28px 28px 24px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 11,
                            background: 'linear-gradient(135deg,#3B82F6,#5046E5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(80,70,229,0.28)',
                            flexShrink: 0,
                        }}>
                            <Icon name="logo" size={24} style={{ color: '#fff' }}/>
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.2 }}>
                                {mode === 'password' ? 'Sign in to BeepBeep' : 'Connect your license'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                                BeepBeep Titles
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={connecting}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 6, lineHeight: 0 }}
                    >
                        <Icon name="x" size={16}/>
                    </button>
                </div>

                {done ? (
                    /* ── Success state ── */
                    <SuccessState/>
                ) : (
                    <>
                        <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 20px' }}>
                            {mode === 'password' ? (
                                <>Sign in with your <strong style={{ color: 'var(--text)', fontWeight: 600 }}>BeepBeep account</strong> and
                                we&rsquo;ll pull in your license automatically — no key to copy.</>
                            ) : (
                                <>Enter your BeepBeep license key to activate AI title &amp; meta generation.
                                Your key is in your <strong style={{ color: 'var(--text)', fontWeight: 600 }}>BeepBeep account dashboard</strong>.</>
                            )}
                        </p>

                        {mode === 'password' ? (
                            <>
                                {/* Email */}
                                <label style={{ display: 'block', marginBottom: 12 }}>
                                    <FieldLabel>Email</FieldLabel>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail( e.target.value ); setError( null ); }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="you@yoursite.com"
                                        autoComplete="username"
                                        spellCheck={false}
                                        autoFocus
                                        disabled={connecting}
                                        style={inputStyle( error )}
                                        {...focusHandlers( error )}
                                    />
                                </label>

                                {/* Password */}
                                <label style={{ display: 'block', marginBottom: 16 }}>
                                    <FieldLabel>Password</FieldLabel>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => { setPassword( e.target.value ); setError( null ); }}
                                            onKeyDown={handleKeyDown}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            disabled={connecting}
                                            style={{ ...inputStyle( error ), paddingRight: 42 }}
                                            {...focusHandlers( error )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPw( v => ! v )}
                                            aria-label={showPw ? 'Hide password' : 'Show password'}
                                            tabIndex={-1}
                                            style={{
                                                position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--text-3)', padding: 4, lineHeight: 0,
                                            }}
                                        >
                                            <Icon name="eye" size={15}/>
                                        </button>
                                    </div>
                                    {error && <FieldError>{error}</FieldError>}
                                </label>
                            </>
                        ) : (
                            /* License key */
                            <label style={{ display: 'block', marginBottom: 16 }}>
                                <FieldLabel>License key</FieldLabel>
                                <input
                                    value={key}
                                    onChange={e => { setKey( e.target.value ); setError( null ); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="BBT-XXXX-XXXX-XXXX"
                                    autoComplete="off"
                                    spellCheck={false}
                                    autoFocus
                                    disabled={connecting}
                                    style={inputStyle( error, true )}
                                    {...focusHandlers( error )}
                                />
                                {error && <FieldError>{error}</FieldError>}
                            </label>
                        )}

                        {/* Primary CTA */}
                        <Button
                            variant="primary"
                            size="lg"
                            icon={connecting ? 'refresh' : 'check'}
                            onClick={handleConnect}
                            disabled={connecting || ! canSubmit}
                            full
                        >
                            {connecting
                                ? ( mode === 'password' ? 'Signing in…' : 'Connecting…' )
                                : ( mode === 'password' ? 'Sign in & connect' : 'Connect license' )}
                        </Button>

                        {/* Mode switch */}
                        <div style={{ textAlign: 'center', marginTop: 14 }}>
                            <button
                                type="button"
                                onClick={() => switchMode( mode === 'password' ? 'license' : 'password' )}
                                disabled={connecting}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: 'var(--text-2)', fontWeight: 600, padding: '4px 8px', borderRadius: 6 }}
                                onMouseEnter={e => e.target.style.color = 'var(--text)'}
                                onMouseLeave={e => e.target.style.color = 'var(--text-2)'}
                            >
                                {mode === 'password' ? 'Use a license key instead' : 'Sign in with email instead'}
                            </button>
                        </div>

                        {/* Divider + footnote */}
                        <div style={{ marginTop: 16, paddingTop: 18, borderTop: '1px solid var(--hairline)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                                <Icon name="info" size={13} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 1 }}/>
                                <span style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                                    Already using BeepBeep AI Alt Text or another BeepBeep plugin?
                                    The same license key works across all of them — your credits and plan are shared.
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Icon name="external" size={12} style={{ color: 'var(--primary)' }}/>
                                <a
                                    href="https://beepbeep.ai/account"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', lineHeight: 1 }}
                                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                                    onMouseLeave={e => e.target.style.textDecoration = 'none'}
                                >
                                    Get your license key at beepbeep.ai
                                </a>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

const SuccessState = () => (
    <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
        <div style={{
            width: 52, height: 52, borderRadius: 999,
            background: 'var(--ok-soft)', border: '1.5px solid var(--ok-border)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
        }}>
            <Icon name="check" size={24} style={{ color: 'var(--ok-ink)', strokeWidth: 2.5 }}/>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 6 }}>
            License connected
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
            Your BeepBeep account is live. Heading to your dashboard…
        </div>
    </div>
);
