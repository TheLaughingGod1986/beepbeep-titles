/* ── Modal shell ───────────────────────────────────────────────────── */
export const Modal = ({ open, onClose, children, width = 560, dismissable = true }) => {
    if ( !open ) return null;
    return (
        <div style={{
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
