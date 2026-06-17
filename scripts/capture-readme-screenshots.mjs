#!/usr/bin/env node
/**
 * Capture WordPress.org readme screenshots from wp-env (port 8890).
 * Run: npm run build && node scripts/capture-readme-screenshots.mjs
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const OUT = join( ROOT, 'assets' );
const BASE = process.env.WP_ENV_URL || 'http://localhost:8890';
const ADMIN = `${ BASE }/wp-admin`;
const PLUGIN = `${ ADMIN }/admin.php?page=beepbeep-titles`;
const USER = 'admin';
const PASS = 'password';

function wp( ...args ) {
	const cli = execSync( 'docker ps --format "{{.Names}}" | grep "wp-env.*-cli-1" | head -1', { encoding: 'utf8' } ).trim();
	if ( ! cli ) throw new Error( 'wp-env CLI container not found' );
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

async function mockQuota( page, connected = true ) {
	await page.route( '**/wp-json/beepbeep-titles/v1/quota**', route => {
		route.fulfill( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( connected ? {
				connected: true,
				plan: 'free',
				daily_limit: 5,
				daily_remaining: 3,
				daily_used: 2,
				monthly_limit: 15,
				monthly_used: 7,
				credits_remaining: 8,
			} : {
				connected: false,
				plan: 'free',
				monthly_limit: 15,
				monthly_used: 0,
			} ),
		} );
	} );
}

async function openPlugin( page ) {
	await page.goto( PLUGIN, { waitUntil: 'networkidle' } );
	await page.waitForSelector( '#bbt-root', { timeout: 20000 } );
	await page.waitForTimeout( 2000 );
}

async function clickTab( page, label ) {
	await page.locator( '#bbt-root nav button', { hasText: label } ).first().click();
	await page.waitForTimeout( 1200 );
}

async function shotApp( page, name ) {
	const el = page.locator( '#bbt-root' );
	await el.screenshot( { path: join( OUT, name ), animations: 'disabled' } );
	console.log( `Saved ${ name }` );
}

function seedContent() {
	wp( 'plugin', 'activate', 'beepbeep-titles' );
	wp( 'option', 'update', 'bbt_license_disconnected', '' );
	wp( 'option', 'update', 'bbt_settings', JSON.stringify( {
		tone: 'direct',
		title_length: 'standard',
		meta_length: 'standard',
		auto_generate: false,
		onboarding_complete: true,
	} ), '--format=json' );
	wp( 'option', 'update', 'bbt_last_scan', '2026-06-16 22:30:00' );
	try {
		wp( 'post', 'generate', '--count=12', '--post_type=page', '--post_status=publish' );
	} catch ( e ) {
		/* pages may already exist */
	}
	wp( 'eval', 'delete_transient("bbt_stats"); (new \\BeepBeep_Titles\\Scanner())->scan_and_cache();' );
}

async function main() {
	mkdirSync( OUT, { recursive: true } );
	seedContent();

	const browser = await chromium.launch( { headless: true } );
	const context = await browser.newContext( {
		viewport: { width: 1280, height: 900 },
		deviceScaleFactor: 2,
	} );
	const page = await context.newPage();

	// Hide WP admin notices for cleaner shots
	await page.addStyleTag( { content: '#wpadminbar { opacity: 0.85; } .notice, .update-nag { display: none !important; }' } );

	await login( page );

	// 1 — Signed-out audit (conversion dashboard)
	wp( 'option', 'delete', 'bbt_license_key' );
	wp( 'option', 'update', 'bbt_license_disconnected', '1' );
	await mockQuota( page, false );
	await openPlugin( page );
	await shotApp( page, 'screenshot-1.png' );

	// Connected state for remaining screens
	wp( 'option', 'update', 'bbt_license_key', 'readme-demo-license' );
	wp( 'option', 'delete', 'bbt_license_disconnected' );
	await mockQuota( page, true );

	// 2 — Home / Dashboard
	await openPlugin( page );
	await shotApp( page, 'screenshot-2.png' );

	// 3 — Library
	await clickTab( page, 'Library' );
	await shotApp( page, 'screenshot-3.png' );

	// 4 — Autopilot
	await clickTab( page, 'Autopilot' );
	await shotApp( page, 'screenshot-4.png' );

	// 5 — Settings
	await clickTab( page, 'Settings' );
	await shotApp( page, 'screenshot-5.png' );

	// 6 — Upgrade / paywall modal
	await clickTab( page, 'Home' );
	await page.locator( '#bbt-root button', { hasText: 'Upgrade to Pro' } ).first().click();
	await page.getByText( /Fix missing SEO metadata|We found SEO issues/i ).first().waitFor( { timeout: 10000 } );
	await page.waitForTimeout( 800 );
	await page.screenshot( { path: join( OUT, 'screenshot-6.png' ), animations: 'disabled' } );
	console.log( 'Saved screenshot-6.png' );

	await browser.close();
	console.log( '\nScreenshots written to assets/' );
}

main().catch( err => {
	console.error( err );
	process.exit( 1 );
} );
