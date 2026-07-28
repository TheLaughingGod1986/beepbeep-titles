import { useEffect } from 'react';

/* ── Modal shell ───────────────────────────────────────────────────── */
export const Modal = ({ open, onClose, children, width = 560, dismissable = true }) => {
    // Escape-to-close is standard modal behaviour and was missing entirely —
    // every dialog built on this shell (Help, Connect, Bulk confirm, Reset
    // confirm, Sign-out confirm, Paywall...) only ever closed via a click.
    useEffect( () => {
        if ( !open || !dismissable ) return;
        const onKey = ( e ) => { if ( e.key === 'Escape' ) onClose(); };
        window.addEventListener( 'keydown', onKey );
        return () => window.removeEventListener( 'keydown', onKey );
    }, [open, dismissable, onClose] );

    if ( !open ) return null;
    return (
        <div
            role="dialog"
            aria-modal="true"
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(15,23,42,0.45)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
            }} onClick={() => dismissable && onClose()}>
            <div onClick={e => e.stopPropagation()} style={{
                width, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto',
                background: 'var(--surface)', borderRadius: 'var(--r-xl)',
                boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
                animation: 'beepti-scale-in .2s cubic-bezier(.2,.8,.2,1)',
            }}>{children}</div>
        </div>
    );
};
