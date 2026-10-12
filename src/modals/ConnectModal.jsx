import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Icon, Button } from '../components';
import { Row } from '../ui';
import { loginWithPassword, registerAccount } from '../api';
import { track } from '../telemetry';

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
    <Row align="start" gap={6} style={{ marginTop: 7, fontSize: 12, color: 'var(--danger-ink)', lineHeight: 1.45 }}>
        <Icon name="alert" size={13} style={{ flexShrink: 0, marginTop: 1 }}/>
        {children}
    </Row>
);

const isValidEmail = ( value ) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test( value );

const validateAuthInput = ( mode, email, password, confirmPassword ) => {
    if ( ! isValidEmail( email.trim() ) ) {
        return 'Enter a valid email address.';
    }

    if ( mode !== 'register' ) {
        return null;
    }

    if ( password.length < 8 ) {
        return 'Use at least 8 characters for your password.';
    }

    if ( password !== confirmPassword ) {
        return 'Passwords do not match.';
    }

    return null;
};

const authErrorMessage = ( err, mode, fallback ) => {
    const code = String( err?.code || '' ).toLowerCase();

    if ( mode === 'register' ) {
        if ( err?.status === 409 || [ 'user_exists', 'site_has_license' ].includes( code ) ) {
            return 'That account already exists. Sign in to connect this site.';
        }

        if ( err?.status === 400 || code === 'invalid_request' || code === 'weak_password' ) {
            return err?.message || 'Couldn\'t create that account. Check the email address and password.';
        }
    }

    if ( mode === 'password' && ( err?.status === 400 || err?.status === 401 ) ) {
        if ( code === 'no_password' ) {
            return err?.message || 'This account uses license key authentication. Connect with your license key or use the existing Alt Text plugin connection on this site.';
        }

        if ( code === 'invalid_credentials' ) {
            return 'Couldn\'t sign in with those details. Check the email and password.';
        }

        return 'Couldn\'t sign in with those details. Check the email and password.';
    }

    return err?.message || fallback;
};

export const ConnectModal = ({ open, onClose, onSuccess, initialMode = 'register' }) => {
    const [mode, setMode]         = useState( initialMode ); // 'register' | 'password'
    const [email, setEmail]       = useState( '' );
    const [password, setPassword] = useState( '' );
    const [confirmPassword, setConfirmPassword] = useState( '' );
    const [showPw, setShowPw]     = useState( false );
    const [connecting, setConnecting] = useState( false );
    const [error, setError]       = useState( null );
    const [done, setDone]         = useState( false );

    // Open on the requested tab (e.g. "Sign in" vs "Create account") each time
    // the modal is shown, so the entry point controls which form appears.
    useEffect( () => {
        if ( open ) {
            setMode( initialMode );
            setError( null );
        }
    }, [open, initialMode] );

    const reset = () => {
        setMode( initialMode );
        setEmail( '' );
        setPassword( '' );
        setConfirmPassword( '' );
        setShowPw( false );
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

    const canSubmit = email.trim() !== '' && password !== '' && ( mode !== 'register' || confirmPassword !== '' );

    const handleConnect = async () => {
        if ( ! canSubmit || connecting ) return;
        setError( null );

        const validationError = validateAuthInput( mode, email, password, confirmPassword );
        if ( validationError ) {
            setError( validationError );
            return;
        }

        setConnecting( true );
        try {
            track( mode === 'register' ? 'signup_started' : 'login_started', {
                feature_name: mode === 'register' ? 'signup' : 'login',
            } );
            const res = mode === 'register'
                ? await registerAccount( email.trim(), password )
                : await loginWithPassword( email.trim(), password );
            track( mode === 'register' ? 'signup_succeeded' : 'login_succeeded', {
                feature_name: mode === 'register' ? 'signup' : 'login',
                plan: res?.plan || null,
            } );
            track( 'license_connected', { source: mode } );
            finish( res );
        } catch ( err ) {
            track( 'login_failed', {
                feature_name: mode === 'register' ? 'signup' : 'login',
                error_code: String( err?.code || 'unknown' ),
            } );
            const fallback = mode === 'register'
                ? 'Couldn\'t create that account. Check the details and try again.'
                : 'Couldn\'t sign in with those details. Check them and try again.';
            const code = String( err?.code || '' ).toLowerCase();
            setError( authErrorMessage( err, mode, fallback ) );
            if ( mode === 'register' && ( err?.status === 409 || ['user_exists', 'site_has_license'].includes( code ) ) ) {
                setMode( 'password' );
                setError( null );
            }
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
                <Row align="start" justify="between" style={{ marginBottom: 20 }}>
                    <Row gap={12}>
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
                                {mode === 'register'
                                    ? 'Create your OpptiAI account'
                                    : 'Sign in to OpptiAI'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                                OpptiAI Titles
                            </div>
                        </div>
                    </Row>
                    <button
                        onClick={handleClose}
                        disabled={connecting}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 6, lineHeight: 0 }}
                    >
                        <Icon name="x" size={16}/>
                    </button>
                </Row>

                {done ? (
                    /* ── Success state ── */
                    <SuccessState/>
                ) : (
                    <>
                        <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 20px' }}>
                            {mode === 'register' ? (
                                <>Create a <strong style={{ color: 'var(--text)', fontWeight: 600 }}>OpptiAI account</strong> to connect this site,
                                use the external AI title and meta generation service.</>
                            ) : (
                                <>Sign in with your <strong style={{ color: 'var(--text)', fontWeight: 600 }}>OpptiAI account</strong> and
                                we&rsquo;ll connect this site automatically.</>
                            )}
                        </p>

                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 4, background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
                                {[
                                    { id: 'register', label: 'Create account' },
                                    { id: 'password', label: 'Sign in' },
                                ].map( option => {
                                    const active = mode === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => switchMode( option.id )}
                                            disabled={connecting}
                                            style={{
                                                border: '1px solid transparent',
                                                background: active ? 'var(--surface)' : 'transparent',
                                                color: active ? 'var(--text)' : 'var(--text-2)',
                                                boxShadow: active ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
                                                borderRadius: 8,
                                                padding: '8px 10px',
                                                fontSize: 12.5,
                                                fontWeight: 700,
                                                cursor: connecting ? 'default' : 'pointer',
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                } )}
                            </div>

                                {/* Email */}
                                <label style={{ display: 'block', marginBottom: 12 }}>
                                    <FieldLabel>Email</FieldLabel>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail( e.target.value ); setError( null ); }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="you@yoursite.com"
                                        autoComplete={mode === 'register' ? 'email' : 'username'}
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
                                            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
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
                                </label>

                                {mode === 'register' && (
                                    <label style={{ display: 'block', marginBottom: 16 }}>
                                        <FieldLabel>Confirm password</FieldLabel>
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => { setConfirmPassword( e.target.value ); setError( null ); }}
                                            onKeyDown={handleKeyDown}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            disabled={connecting}
                                            style={inputStyle( error )}
                                            {...focusHandlers( error )}
                                        />
                                    </label>
                                )}

                            {error && <FieldError>{error}</FieldError>}
                        </>

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
                                ? ( mode === 'register' ? 'Creating account…' : 'Signing in…' )
                                : ( mode === 'register' ? 'Create account & connect' : 'Sign in & connect' )}
                        </Button>
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
            Account connected
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
            Your OpptiAI account is live. Heading to your dashboard…
        </div>
    </div>
);
