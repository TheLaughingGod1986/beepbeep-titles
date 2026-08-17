/**
 * Status line for the signed-out Home / Audit hero.
 * Never treat "stats not loaded yet" as a real empty scan.
 *
 * @param {{ total?: number } | null | undefined} stats
 * @return {string}
 */
export function auditStatusMessage( stats ) {
	if ( stats == null ) {
		return 'Checking your local metadata audit\u2026';
	}
	const total = Math.max( 0, stats.total ?? 0 );
	return total > 0
		? `We scanned ${ total.toLocaleString() } pages and found metadata opportunities.`
		: 'No published pages were found in the local metadata audit.';
}
