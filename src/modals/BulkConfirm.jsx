import { Icon, Button } from '../components';
import { Row } from '../ui';
import { Modal } from './Modal';

/**
 * Pre-flight confirmation for any bulk optimise action — Priority Action
 * Centre "Optimise All", Hero "Optimise Critical Issues", and the Advanced
 * Library's bulk action bar all route through this before spending credits.
 */
export const BulkConfirm = ({ open, count, creditsRemaining, onCancel, onConfirm }) => {
    if ( ! open ) return null;
    const overBudget = creditsRemaining != null && count > creditsRemaining;

    return (
        <Modal open={open} onClose={onCancel} width={440}>
            <div style={{ padding: '24px 28px 28px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-soft)', color: 'var(--primary-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon name="zap" size={19}/>
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.015em', margin: '0 0 8px' }}>
                    Optimise {count} item{count === 1 ? '' : 's'}?
                </h2>
                <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: '0 0 4px', lineHeight: 1.5 }}>
                    You are about to optimise <strong style={{ color: 'var(--text)' }}>{count}</strong> item{count === 1 ? '' : 's'}. This will use up to <strong style={{ color: 'var(--text)' }}>{count}</strong> credit{count === 1 ? '' : 's'}.
                </p>
                {creditsRemaining != null && (
                    <p style={{ fontSize: 12.5, color: overBudget ? 'var(--danger-ink)' : 'var(--text-3)', margin: '4px 0 0' }}>
                        {overBudget
                            ? `Only ${creditsRemaining} credit${creditsRemaining === 1 ? '' : 's'} remaining — some items may not complete.`
                            : `${creditsRemaining} credit${creditsRemaining === 1 ? '' : 's'} remaining before this runs.`}
                    </p>
                )}
                <Row justify="end" gap={8} style={{ marginTop: 22 }}>
                    <Button variant="ghost" size="md" onClick={onCancel}>Cancel</Button>
                    <Button variant="primary" size="md" icon="zap" onClick={onConfirm}>Optimise {count}</Button>
                </Row>
            </div>
        </Modal>
    );
};
