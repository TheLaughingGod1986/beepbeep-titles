import { __ } from '@wordpress/i18n';
import { Icon, Card, Button } from './components';

/**
 * Show the WordPress.org review ask once a title/meta has been applied on
 * this site (server flag or this session), until the user answers it.
 */
export function shouldShowReviewPrompt( state ) {
    return !! state && !! state.url && !! state.eligible && ! state.done;
}

/** Inline, dismissible review card (not a modal). */
export const ReviewPromptCard = ( { url, onAnswer } ) => (
    <Card padding={0} style={{ marginBottom: 14 }}>
        <div role="region" aria-label={__( 'Review OpptiAI Titles', 'beepbeep-titles' )} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Icon name="sparkles" size={16} style={{ color: 'var(--primary)', flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {__( 'Is OpptiAI Titles helping?', 'beepbeep-titles' )}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {__( 'A quick review on WordPress.org helps other site owners find it.', 'beepbeep-titles' )}
                </div>
            </div>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onAnswer( 'review' )}
                className="beepti-review-prompt__review"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-ink)', textDecoration: 'none' }}
            >
                {__( 'Leave a review', 'beepbeep-titles' )}
            </a>
            <Button variant="secondary" size="sm" onClick={() => onAnswer( 'dismiss' )}>
                {__( 'No thanks', 'beepbeep-titles' )}
            </Button>
        </div>
    </Card>
);
