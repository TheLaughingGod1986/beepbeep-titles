#!/usr/bin/env node
/**
 * Manual QA harness for wp-env (default port 8890).
 *
 * Mocks: Playwright `page.route()` intercepts only browser-originated
 * `/quota` fetches in this headless session. They never touch PHP, wp-env
 * files, or production plugin code.
 *
 * Run: npx --yes -p playwright node scripts/wp-env-manual-qa.mjs
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';

const BASE = process.env.WP_ENV_URL || 'http://localhost:8890';
const ADMIN = `${BASE}/wp-admin`;
const PLUGIN = `${ADMIN}/admin.php?page=beepbeep-titles`;
const USER = 'admin';
const PASS = 'password';

const SEO_META_KEYS = [
	'_beepti_seo_title',
	'_beepti_meta_description',
	'_yoast_wpseo_title',
	'_yoast_wpseo_metadesc',
	'rank_math_title',
	'rank_math_description',
];

const results = [];

function resolveCli() {
	if ( process.env.WP_ENV_CLI ) {
		return process.env.WP_ENV_CLI;
	}
	const names = execSync( 'docker ps --format "{{.Names}}"', { encoding: 'utf8' } )
		.split( '\n' )
		.map( s => s.trim() )
		.filter( Boolean );
	const cli = names.find( n => /wp-env.*-cli-1$/.test( n ) );
	if ( ! cli ) {
		throw new Error( 'wp-env CLI container not found (is wp-env running?)' );
	}
	return cli;
}

const CLI = resolveCli();

function wp( ...args ) {
	const quoted = args.map( a => `'${String( a ).replace( /'/g, "'\\''" )}'` ).join( ' ' );
	const cmd = `docker exec ${CLI} wp ${quoted} --path=/var/www/html`;
	return execSync( cmd, { encoding: 'utf8', stdio: [ 'pipe', 'pipe', 'pipe' ] } ).trim();
}

function settingsJson( obj ) {
	return JSON.stringify( obj );
}

function record( id, pass, detail ) {
	results.push( { id, pass, detail } );
	const mark = pass ? 'PASS' : 'FAIL';
	console.log( `[${mark}] ${id}: ${detail}` );
}

/** Extract only SEO-layer postmeta keys the plugin may write. */
function seoMetaSnapshot( postId ) {
	const raw = wp( 'post', 'meta', 'list', postId, '--format=json' );
	const all = JSON.parse( raw || '{}' );
	const snap = {};
	for ( const key of SEO_META_KEYS ) {
		if ( Object.prototype.hasOwnProperty.call( all, key ) ) {
			const vals = all[ key ];
			snap[ key ] = Array.isArray( vals ) ? String( vals[ 0 ] ?? '' ) : String( vals ?? '' );
		}
	}
	return snap;
}

function seoMetaChanged( before, after ) {
	const keys = new Set( [ ...Object.keys( before ), ...Object.keys( after ) ] );
	const added = [];
	for ( const key of keys ) {
		const b = before[ key ] ?? '';
		const a = after[ key ] ?? '';
		if ( b !== a && a !== '' ) {
			added.push( `${key}=${JSON.stringify( a )}` );
		}
	}
	return added;
}

async function login( page ) {
	await page.goto( `${BASE}/wp-login.php` );
	await page.fill( '#user_login', USER );
	await page.fill( '#user_pass', PASS );
	await page.click( '#wp-submit' );
	await page.waitForURL( /wp-admin/ );
}

/** Browser-only mock — does not affect PHP save_post / auto-generate. */
async function mockQuotaConnected( page ) {
	await page.route( '**/wp-json/beepbeep-titles/v1/quota', route => {
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( {
				connected: true,
				plan: 'free',
				daily_limit: 5,
				daily_remaining: 5,
				daily_used: 0,
				monthly_limit: 50,
				monthly_used: 0,
				reset_date: '2026-07-01T00:00:00Z',
				usage_by_feature: { alt_text: 0, title_meta: 0 },
			} ),
		} );
	} );
}

async function openPlugin( page ) {
	const errors = [];
	page.on( 'console', msg => {
		if ( msg.type() === 'error' ) errors.push( msg.text() );
	} );
	page.on( 'pageerror', err => errors.push( err.message ) );
	await page.goto( PLUGIN, { waitUntil: 'networkidle' } );
	await page.waitForSelector( '#beepti-root', { timeout: 15000 } );
	await page.waitForTimeout( 1500 );
	return errors;
}

async function navTab( page, label ) {
	await page.locator( '#beepti-root nav button', { hasText: label } ).click();
}

async function bodyText( page ) {
	return page.locator( '#beepti-root' ).innerText();
}

async function main() {
	let browser;
	try {
		browser = await chromium.launch( { headless: true } );
		const context = await browser.newContext();
		const page = await context.newPage();
		await mockQuotaConnected( page );

		// ── 1. Open plugin admin ──
		await login( page );
		const errors1 = await openPlugin( page );
		const loaded = await page.locator( '#beepti-root' ).isVisible();
		record( '1', loaded, loaded ? 'Plugin admin loaded at #beepti-root' : 'React shell did not render' );

		// ── 2. License/connect loads without console errors ──
		const benign = errors1.filter( e => !/favicon|fonts\.googleapis|401 \(Unauthorized\)|Failed to load resource/i.test( e ) );
		record( '2', benign.length === 0, benign.length ? `Console errors: ${benign.join( ' | ' )}` : 'No console errors on initial load' );

		// ── 4. Existing install without onboarding_complete does not surprise-open ──
		wp( 'option', 'update', 'beepti_license_key', 'qa-fake-license-invalid' );
		wp( 'option', 'update', 'beepti_settings', settingsJson( {
			tone: 'direct',
			title_length: 'standard',
			meta_length: 'standard',
			auto_generate: false,
		} ), '--format=json' );
		await page.goto( PLUGIN, { waitUntil: 'networkidle' } );
		await page.waitForTimeout( 2000 );
		const surprise = await page.getByText( 'Welcome to BeepBeep Titles', { exact: false } ).count();
		record( '4', surprise === 0, surprise ? 'Wizard opened without onboarding_complete key' : 'Wizard stayed closed when flag absent (treated as complete)' );

		// ── 3. Fresh install shows onboarding (connected + onboarding_complete false) ──
		wp( 'option', 'update', 'beepti_settings', settingsJson( {
			tone: 'direct',
			title_length: 'standard',
			meta_length: 'standard',
			auto_generate: false,
			onboarding_complete: false,
		} ), '--format=json' );
		await page.goto( PLUGIN, { waitUntil: 'networkidle' } );
		await page.waitForTimeout( 2500 );
		const boot = await page.evaluate( () => ( {
			connected: window.beeptiAdminData?.connected,
			onboarding_complete: window.beeptiAdminData?.settings?.onboarding_complete,
		} ) );
		const onboardingVisible = await page.getByText( 'Welcome to BeepBeep Titles', { exact: false } ).count() > 0;
		record( '3', onboardingVisible, onboardingVisible
			? 'Onboarding wizard visible for fresh connected install'
			: `Wizard not shown (beeptiAdminData connected=${boot.connected}, onboarding_complete=${boot.onboarding_complete})` );

		// Dismiss onboarding for remaining checks.
		wp( 'option', 'update', 'beepti_settings', settingsJson( {
			tone: 'direct',
			title_length: 'standard',
			meta_length: 'standard',
			auto_generate: false,
			onboarding_complete: true,
		} ), '--format=json' );

		// ── 5. Auto-generate toggle persists after reload ──
		wp( 'option', 'update', 'beepti_settings', settingsJson( {
			tone: 'direct',
			title_length: 'standard',
			meta_length: 'standard',
			onboarding_complete: true,
			auto_generate: true,
		} ), '--format=json' );
		await page.goto( PLUGIN, { waitUntil: 'networkidle' } );
		await page.waitForTimeout( 1500 );
		const hydrated = await page.evaluate( () => window.beeptiAdminData?.settings?.auto_generate );
		const settings = JSON.parse( wp( 'option', 'get', 'beepti_settings', '--format=json' ) || '{}' );
		const persisted = settings.auto_generate === true && hydrated === true;
		record( '5', persisted, persisted ? 'auto_generate=true in DB and beeptiAdminData after reload' : `DB=${settings.auto_generate}, beeptiAdminData=${hydrated}` );

		// ── 6. Auto-generate with fake license: no SEO meta without backend success ──
		wp( 'option', 'update', 'beepti_license_key', 'qa-fake-license-invalid' );
		wp( 'option', 'update', 'beepti_settings', settingsJson( {
			tone: 'direct',
			title_length: 'standard',
			meta_length: 'standard',
			auto_generate: true,
			onboarding_complete: true,
		} ), '--format=json' );
		delete_transient_safe();

		const stamp = Date.now();
		const draftId = wp(
			'post', 'create',
			'--post_type=post',
			`--post_title=QA Auto Gen ${stamp}`,
			'--post_status=draft',
			'--porcelain'
		).trim();
		const metaBefore = seoMetaSnapshot( draftId );

		wp( 'post', 'update', draftId, '--post_status=publish' );
		const status = wp( 'post', 'get', draftId, '--field=post_status' );
		const metaAfter = seoMetaSnapshot( draftId );
		const seoChanges = seoMetaChanged( metaBefore, metaAfter );
		const notices = wp( 'transient', 'get', 'beepti_admin_notices' );

		const published = status === 'publish';
		const noSeoWrite = seoChanges.length === 0;
		const pass6 = published && noSeoWrite;

		if ( ! noSeoWrite ) {
			console.error( '\n*** ENTITLEMENT BYPASS: SEO meta written with fake license ***' );
			console.error( `before: ${JSON.stringify( metaBefore )}` );
			console.error( `after:  ${JSON.stringify( metaAfter )}` );
			console.error( `changes: ${seoChanges.join( ', ' )}` );
			process.exitCode = 2;
		}

		record( '6', pass6, pass6
			? `Post ${draftId} published; SEO meta unchanged with fake license (before=${JSON.stringify( metaBefore )}, notices=${notices || 'none'})`
			: `Post ${draftId} status=${status}; seo changes=${seoChanges.join( ', ' )}` );

		// ── 7. Library: no Low quality tab ──
		await page.goto( PLUGIN, { waitUntil: 'networkidle' } );
		await navTab( page, 'Library' );
		await page.waitForTimeout( 1000 );
		const libText = await bodyText( page );
		record( '7', ! libText.includes( 'Low quality' ), libText.includes( 'Low quality' ) ? 'Low quality tab still present' : 'Low quality tab absent' );

		// ── 8. Autopilot: no fake schedule toggles ──
		await navTab( page, 'Autopilot' );
		await page.waitForTimeout( 800 );
		const autoText = await bodyText( page );
		const scheduleGone = ! autoText.includes( 'Daily site crawl' )
			&& ! autoText.includes( 'Weekly digest email' )
			&& ! autoText.includes( 'SEO drift alerts' )
			&& ! autoText.includes( 'Background work' );
		record( '8', scheduleGone, scheduleGone ? 'Schedule section removed' : 'Schedule UI still visible' );

		// ── 9. Stripe return URL toasts ──
		await page.goto( `${PLUGIN}&beepti_billing=success`, { waitUntil: 'networkidle' } );
		await page.waitForTimeout( 1500 );
		const successText = await bodyText( page );
		const successToast = successText.includes( 'Purchase complete' );
		await page.goto( `${PLUGIN}&beepti_billing=cancelled`, { waitUntil: 'networkidle' } );
		await page.waitForTimeout( 1500 );
		const cancelText = await bodyText( page );
		const cancelToast = cancelText.includes( 'Checkout cancelled' );
		record( '9', successToast && cancelToast, `success=${successToast}, cancelled=${cancelToast}` );

	} catch ( err ) {
		console.error( 'QA harness error:', err );
		process.exitCode = 1;
	} finally {
		if ( browser ) await browser.close();
	}

	const failed = results.filter( r => ! r.pass );
	console.log( '\n--- Summary ---' );
	console.log( `${results.length - failed.length}/${results.length} passed` );
	if ( failed.length && process.exitCode !== 2 ) {
		process.exitCode = 1;
	}
}

function delete_transient_safe() {
	try {
		wp( 'transient', 'delete', 'beepti_admin_notices' );
	} catch {
		// absent is fine
	}
}

main();
