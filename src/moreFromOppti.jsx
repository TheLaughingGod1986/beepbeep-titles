import { useEffect, useRef } from 'react';
import { Card } from './components';
import { track } from './telemetry';

/**
 * "More from Oppti" panel.
 *
 * Shown on this plugin's own Dashboard screen only, after the first applied
 * title/meta (server flag or this session), until the user dismisses it, and
 * only while there is at least one OpptiAI plugin this site does not have.
 * All copy comes from PHP (MoreFromOppti::copy()) so it lives in one place.
 */
export function shouldShowMoreFromOppti( state ) {
    return !! state
        && !! state.eligible
        && ! state.dismissed
        && Array.isArray( state.items )
        && state.items.length > 0;
}

/** Ids suggested by a visible panel (used to stand down older single-plugin cards). */
export function moreFromOpptiIds( state ) {
    return shouldShowMoreFromOppti( state ) ? state.items.map( ( i ) => i.id ) : [];
}

/** Event props: ids and states only, never URLs. */
export function crosssellProps( state, extra = {} ) {
    return {
        from_plugin: state?.from || 'titles',
        account_state: state?.accountState === 'connected' ? 'connected' : 'guest',
        placement: 'after_generation',
        ...extra,
    };
}

export const MoreFromOpptiCard = ( { state, onDismiss } ) => {
    const sent = useRef( false );
    useEffect( () => {
        if ( sent.current ) return;
        sent.current = true;
        track( 'crosssell_panel_shown', crosssellProps( state, { suggested: moreFromOpptiIds( state ).join( '-' ) } ) );
    }, [] ); // eslint-disable-line react-hooks/exhaustive-deps

    const dismiss = () => {
        track( 'crosssell_panel_dismissed', crosssellProps( state ) );
        onDismiss();
    };

    return (
        <Card padding={0} style={{ marginTop: 20 }}>
            <section className="beepti-more-from-oppti" aria-labelledby="beepti-mfo-heading" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <h3 id="beepti-mfo-heading" style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                        {state.heading}
                    </h3>
                    <button
                        type="button"
                        className="beepti-more-from-oppti__dismiss"
                        onClick={dismiss}
                        aria-label={state.dismissLabel}
                        style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)', textDecoration: 'underline' }}
                    >
                        {state.dismiss}
                    </button>
                </div>
                {state.intro ? (
                    <p className="beepti-more-from-oppti__intro" style={{ margin: '6px 0 4px', fontSize: 12.5, color: 'var(--text-2)' }}>
                        {state.intro}
                    </p>
                ) : null}
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {state.items.map( ( item ) => (
                        <li key={item.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px', padding: '8px 0', borderTop: '1px solid var(--hairline)' }}>
                            <span style={{ flex: '1 1 240px', fontSize: 13, color: 'var(--text)' }}>{item.desc}</span>
                            <a
                                href={item.url}
                                data-to={item.id}
                                data-link-target={item.target}
                                {...( item.target === 'wporg' ? { target: '_blank', rel: 'noopener noreferrer' } : {} )}
                                onClick={() => track( 'crosssell_clicked', crosssellProps( state, { to_plugin: item.id, link_target: item.target } ) )}
                                style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-ink)', textDecoration: 'none' }}
                            >
                                {item.cta}
                                {item.suffix ? <span className="screen-reader-text"> {item.suffix}</span> : null}
                            </a>
                            {item.helper ? (
                                <span style={{ flexBasis: '100%', fontSize: 12, color: 'var(--text-3)' }}>{item.helper}</span>
                            ) : null}
                        </li>
                    ) )}
                </ul>
            </section>
        </Card>
    );
};
