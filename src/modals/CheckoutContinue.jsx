import { useState } from 'react';
import { emailCheckoutLink } from '../api';

/**
 * Visible recovery panel for upgrade checkout.
 *
 * Shown when the tab has not navigated to Stripe ~2s after the session came
 * back, or straight away on any error. Offers the URL as a real link
 * ("Continue to payment", same tab), a copy button, and "Email me this link"
 * (backend sends to the account's own email on file — no recipient here).
 */
export const CheckoutContinue = ( { url, sessionId, message, onClose } ) => {
    const [ copyState, setCopyState ] = useState( '' );
    const [ emailState, setEmailState ] = useState( { status: '', text: '' } );

    const copy = async () => {
        let ok = false;
        try {
            if ( navigator.clipboard?.writeText ) {
                await navigator.clipboard.writeText( url );
                ok = true;
            }
        } catch ( e ) { /* fall back below */ }
        if ( ! ok ) {
            try {
                const ta = document.createElement( 'textarea' );
                ta.value = url;
                ta.setAttribute( 'readonly', '' );
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild( ta );
                ta.select();
                ok = document.execCommand( 'copy' );
                document.body.removeChild( ta );
            } catch ( e ) { ok = false; }
        }
        setCopyState( ok ? 'Link copied' : 'Copy failed — select the link above' );
    };

    const email = async () => {
        if ( ! sessionId || emailState.status === 'sending' ) return;
        setEmailState( { status: 'sending', text: 'Sending…' } );
        try {
            await emailCheckoutLink( sessionId );
            setEmailState( { status: 'sent', text: 'Sent to the email on your OpptiAI account.' } );
        } catch ( e ) {
            setEmailState( { status: 'error', text: e?.message || 'We could not send the email. Please copy the link instead.' } );
        }
    };

    const btn = {
        border: '1px solid var(--hairline, #d0d5dd)', background: 'var(--bg, #fff)', color: 'var(--text, #101828)',
        padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    };

    return (
        <div
            role={ message ? 'alert' : 'status' }
            data-beepti-checkout-continue=""
            style={ {
                position: 'fixed', right: 24, bottom: 24, zIndex: 1600, maxWidth: 420,
                background: 'var(--bg, #fff)', color: 'var(--text, #101828)',
                border: '1px solid var(--hairline, #d0d5dd)', borderRadius: 10,
                boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(16,24,40,.18))', padding: '16px 18px',
                fontSize: 13.5, lineHeight: 1.45,
            } }
        >
            <div style={ { fontWeight: 600, marginBottom: 6 } }>
                { message ? 'Checkout could not start automatically' : 'Taking you to secure payment…' }
            </div>
            { message && <div style={ { marginBottom: 10, color: 'var(--warn-ink, #b42318)' } }>{ message }</div> }
            { url ? (
                <>
                    { ! message && (
                        <div style={ { marginBottom: 10, color: 'var(--text-2, #475467)' } }>
                            If nothing happens, use the button below. You are not charged until you complete payment.
                        </div>
                    ) }
                    <div style={ { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' } }>
                        <a
                            href={ url }
                            rel="noreferrer"
                            style={ { ...btn, background: 'var(--accent, #1d4ed8)', color: '#fff', borderColor: 'transparent', textDecoration: 'none' } }
                        >
                            Continue to payment
                        </a>
                        <button type="button" style={ btn } onClick={ copy }>Copy link</button>
                        { sessionId && (
                            <button type="button" style={ btn } onClick={ email } disabled={ emailState.status === 'sending' || emailState.status === 'sent' }>
                                Email me this link
                            </button>
                        ) }
                    </div>
                    <input
                        readOnly
                        value={ url }
                        onFocus={ ( e ) => e.target.select() }
                        aria-label="Checkout link"
                        style={ { marginTop: 10, width: '100%', fontSize: 12, padding: '5px 8px', boxSizing: 'border-box' } }
                    />
                    { copyState && <div style={ { marginTop: 6, fontSize: 12 } }>{ copyState }</div> }
                    { emailState.text && <div style={ { marginTop: 6, fontSize: 12 } }>{ emailState.text }</div> }
                </>
            ) : null }
            <button
                type="button"
                onClick={ onClose }
                aria-label="Close"
                style={ { position: 'absolute', top: 8, right: 10, border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', color: 'var(--text-3, #667085)' } }
            >
                ×
            </button>
        </div>
    );
};
