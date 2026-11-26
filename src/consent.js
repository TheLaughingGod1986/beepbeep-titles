/**
 * First-run usage-stats card (1.0.32). Opt-in only: nothing is sent to
 * analytics before "Share usage stats" is clicked, and "No thanks" only saves
 * the answer on this site.
 */
export const CONSENT_CARD_SOURCE = 'guest_card';

export const CONSENT_COPY = {
	title: 'Help improve OpptiAI Titles',
	body: 'Share usage stats with OpptiAI, like which features you use and when a request fails. You can change this any time in Settings, Privacy.',
	accept: 'Share usage stats',
	decline: 'No thanks',
};

/** PHP decides: admin, no saved answer, not forced in wp-config. */
export function shouldShowConsentCard( telemetryCfg ) {
	return telemetryCfg?.showConsentCard === true;
}

/**
 * Save the answer, then (only on a stored yes) switch browser telemetry on
 * and record plugin_opened for this session.
 *
 * @return {Promise<boolean>} whether usage stats are now on.
 */
export async function answerConsent( optIn, { save, setTelemetryEnabled, trackPluginOpened } ) {
	const res = await save( optIn === true );
	const on = optIn === true && res?.usage_stats_opt_in === true;
	if ( on ) {
		setTelemetryEnabled( true );
		trackPluginOpened();
	}
	return on;
}
