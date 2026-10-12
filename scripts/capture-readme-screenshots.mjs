#!/usr/bin/env node
/**
 * Capture WordPress.org readme screenshots from wp-env (port 8890).
 * Run: npm run build && node scripts/capture-readme-screenshots.mjs
 *
 * Writes to .wordpress-org/ (SVN assets folder sibling — copy into SVN `assets/`).
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const OUT = join( ROOT, '.wordpress-org' );
const BASE = process.env.WP_ENV_URL || 'http://localhost:8890';
const ADMIN = `${ BASE }/wp-admin`;
const PLUGIN = `${ ADMIN }/admin.php?page=beepbeep-titles`;
const USER = 'admin';
const PASS = 'password';

function findCliContainer() {
	if ( process.env.WP_CLI_CONTAINER ) return process.env.WP_CLI_CONTAINER.trim();
	const names = execSync( 'docker ps --format "{{.Names}}"', { encoding: 'utf8' } )
		.split( '\n' )
		.map( s => s.trim() )
		.filter( Boolean );
	const titles = names.find( n => /beepbeep-titles/i.test( n ) && /-cli-1$/.test( n ) && ! /tests/i.test( n ) );
	if ( titles ) return titles;
	const any = names.find( n => /wp-env/i.test( n ) && /-cli-1$/.test( n ) && ! /tests/i.test( n ) );
	if ( any ) return any;
	throw new Error( 'wp-env CLI container not found (expected beepbeep-titles *-cli-1)' );
}

function wp( ...args ) {
	const cli = findCliContainer();
	const quoted = args.map( a => `'${ String( a ).replace( /'/g, "'\\''" ) }'` ).join( ' ' );
	return execSync( `docker exec ${ cli } wp ${ quoted } --path=/var/www/html`, { encoding: 'utf8' } ).trim();
}

async function login( page ) {
	await page.goto( `${ BASE }/wp-login.php` );
	await page.fill( '#user_login', USER );
	await page.fill( '#user_pass', PASS );
	await page.click( '#wp-submit' );
	await page.waitForURL( /wp-admin/ );
}

async function mockQuota( page, connected = true, plan = 'free' ) {
	await page.route( '**/wp-json/beepbeep-titles/v1/quota**', route => {
		const paid = plan === 'pro' || plan === 'starter';
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( connected ? {
				connected: true,
				plan,
				daily_limit: paid ? 200 : 5,
				daily_remaining: paid ? 180 : 3,
				daily_used: paid ? 20 : 2,
				monthly_limit: paid ? 2000 : 15,
				monthly_used: paid ? 120 : 7,
				credits_remaining: paid ? 1880 : 8,
				reset_date: '2026-08-01T00:00:00Z',
				usage_by_feature: { alt_text: 4, title_meta: 3 },
				can_use_autopilot: paid,
				can_use_continuous: plan === 'pro',
			} : {
				connected: false,
				plan: 'free',
				monthly_limit: 15,
				monthly_used: 0,
				credits_remaining: 0,
			} ),
		} );
	} );
}

async function openPlugin( page ) {
	await page.goto( PLUGIN, { waitUntil: 'networkidle' } );
	await page.waitForSelector( '#beepti-root', { timeout: 30000 } );
	await page.waitForTimeout( 2500 );
}

async function clickTab( page, label ) {
	await page.locator( '#beepti-root nav button', { hasText: label } ).first().click();
	await page.waitForTimeout( 1500 );
}

async function shotApp( page, name ) {
	const el = page.locator( '#beepti-root' );
	await el.screenshot( { path: join( OUT, name ), animations: 'disabled' } );
	console.log( `Saved ${ name }` );
}

function seedContent() {
	wp( 'plugin', 'activate', 'beepbeep-titles' );
	wp( 'option', 'update', 'beepti_license_disconnected', '' );
	wp( 'option', 'update', 'beepti_settings', JSON.stringify( {
		tone: 'direct',
		title_length: 'standard',
		meta_length: 'standard',
		auto_generate: false,
		onboarding_complete: true,
	} ), '--format=json' );
	wp( 'option', 'update', 'beepti_last_scan', '2026-07-28 22:00:00' );
	try {
		wp( 'post', 'generate', '--count=12', '--post_type=page', '--post_status=publish' );
	} catch ( e ) {
		/* pages may already exist */
	}
	try {
		wp( 'eval', 'delete_transient("beepti_stats"); (new \\BeepBeep_Titles\\Scanner())->scan_and_cache();' );
	} catch ( e ) {
		console.warn( 'Scan seed warning:', e.message );
	}
}

async function main() {
	mkdirSync( OUT, { recursive: true } );
	console.log( 'CLI container:', findCliContainer() );
	seedContent();

	const browser = await chromium.launch( { headless: true } );
	const context = await browser.newContext( {
		viewport: { width: 1280, height: 900 },
		deviceScaleFactor: 2,
	} );
	const page = await context.newPage();

	await page.addInitScript( () => {
		const style = document.createElement( 'style' );
		style.textContent = '.notice, .update-nag, #wpfooter { display: none !important; }';
		document.documentElement.appendChild( style );
	} );

	await login( page );

	// 1 — Signed-out audit (conversion dashboard)
	wp( 'option', 'delete', 'beepti_license_key' );
	wp( 'option', 'update', 'beepti_license_disconnected', '1' );
	await mockQuota( page, false );
	await openPlugin( page );
	await shotApp( page, 'screenshot-1.png' );

	// Connected free plan for Home / Library / Settings / Billing / paywall
	wp( 'option', 'update', 'beepti_license_key', 'readme-demo-license' );
	wp( 'option', 'delete', 'beepti_license_disconnected' );
	await mockQuota( page, true, 'free' );

	// 2 — Home / Dashboard
	await openPlugin( page );
	await shotApp( page, 'screenshot-2.png' );

	// 3 — Advanced Library
	await clickTab( page, 'Advanced Library' );
	await shotApp( page, 'screenshot-3.png' );

	// 4 — Autopilot (locked on free — shows upgrade gate; switch to starter mock for usable UI)
	await mockQuota( page, true, 'starter' );
	await openPlugin( page );
	await clickTab( page, 'Autopilot' );
	await shotApp( page, 'screenshot-4.png' );

	// Back to free for Settings + Billing + paywall realism
	await mockQuota( page, true, 'free' );
	await openPlugin( page );

	// 5 — Settings
	await clickTab( page, 'Settings' );
	await shotApp( page, 'screenshot-5.png' );

	// 6 — Billing
	await clickTab( page, 'Billing' );
	await shotApp( page, 'screenshot-6.png' );

	// 7 — Upgrade / paywall modal (bonus — optional 7th shot for docs)
	await clickTab( page, 'Home' );
	const upgrade = page.locator( '#beepti-root button', { hasText: /Upgrade to Pro|Get more credits|Upgrade/i } ).first();
	if ( await upgrade.count() ) {
		await upgrade.click();
		await page.waitForTimeout( 1000 );
		try {
			await page.getByText( /Fix missing SEO metadata|We found SEO issues|Starter|Pro|credits/i ).first().waitFor( { timeout: 8000 } );
		} catch ( e ) {
			/* paywall copy may vary */
		}
		await page.waitForTimeout( 600 );
		await page.screenshot( { path: join( OUT, 'screenshot-7.png' ), animations: 'disabled' } );
		console.log( 'Saved screenshot-7.png' );
	}

	await browser.close();
	console.log( '\nScreenshots written to .wordpress-org/' );
}

main().catch( err => {
	console.error( err );
	process.exit( 1 );
} );
