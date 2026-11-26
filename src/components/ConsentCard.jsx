import { Card, Button } from '../ui';
import { CONSENT_COPY } from '../consent';

/** First-run usage-stats card, same pattern as OpptiAI Alt Text's. */
export const ConsentCard = ({ busy, onAccept, onDecline }) => (
    <Card className="beepti-consent-card" padding="16px 18px" style={{ marginBottom: 16 }}>
        <section aria-labelledby="beepti-consent-title">
            <h2 id="beepti-consent-title" style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{CONSENT_COPY.title}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '6px 0 12px', lineHeight: 1.5 }}>{CONSENT_COPY.body}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="secondary" size="sm" onClick={onAccept} disabled={busy}>{CONSENT_COPY.accept}</Button>
                <Button variant="ghost" size="sm" onClick={onDecline} disabled={busy}>{CONSENT_COPY.decline}</Button>
            </div>
        </section>
    </Card>
);
