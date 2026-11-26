import { Card, Button, Icon } from '../ui';

/**
 * Shown once at the top of the Library right after an account connects:
 * one page and one Optimise button, so the first step is obvious.
 */
export const FirstActionCard = ({ page, onOptimise, onDismiss }) => {
    if ( ! page ) return null;
    const label = page.title || page.post_title || page.url || 'This page';
    return (
        <Card className="beepti-first-action" padding="16px 18px" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--primary-border, var(--hairline))' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Your account is connected. Start with this page.</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
            </div>
            <Button variant="primary" size="md" icon="sparkles" onClick={onOptimise}>Optimise</Button>
            <button type="button" aria-label="Dismiss" onClick={onDismiss} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
                <Icon name="x" size={14}/>
            </button>
        </Card>
    );
};
