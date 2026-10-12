import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.WP_ENV_URL || 'http://localhost:8890';
const ADMIN = `${BASE}/wp-admin`;
const USER = 'admin';
const PASS = 'password';
const OUT = path.resolve('/Users/ben/code/web/beepbeep-titles/.tmp/unify-dashboard-screenshots');
fs.mkdirSync(OUT, { recursive: true });

const results = [];

function record(plugin, tab, pass, detail, extras = {}) {
  const row = { plugin, tab, pass, detail, ...extras };
  results.push(row);
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${plugin} / ${tab}: ${detail}`);
}

async function login(page) {
  await page.goto(`${BASE}/wp-login.php`, { waitUntil: 'domcontentloaded' });
  // Already logged in?
  if (page.url().includes('wp-admin') && !page.url().includes('wp-login')) return;
  await page.fill('#user_login', USER);
  await page.fill('#user_pass', PASS);
  await page.click('#wp-submit');
  await page.waitForURL(/wp-admin/, { timeout: 20000 });
}

function collectConsole(page) {
  const errors = [];
  const warnings = [];
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') errors.push(text);
    else if (type === 'warning') warnings.push(text);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return { errors, warnings };
}

function filterNoise(errors) {
  return errors.filter((e) => {
    const t = String(e);
    // Common WP/dev noise
    if (/Download the React DevTools/i.test(t)) return false;
    if (/JQMIGRATE/i.test(t)) return false;
    if (/Failed to load resource:.*favicon/i.test(t)) return false;
    if (/net::ERR_ABORTED/i.test(t) && /heartbeat/i.test(t)) return false;
    return true;
  });
}

async function waitSettled(page, ms = 1500) {
  await page.waitForTimeout(ms);
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch (_) {}
}

async function screenshotHome(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

/** Click an in-app tab by visible text (case-insensitive exact-ish match). */
async function clickTabByText(page, label, rootSel) {
  const root = rootSel ? page.locator(rootSel) : page;
  // Prefer role=tab, then button/link with exact text
  const candidates = [
    root.getByRole('tab', { name: label, exact: true }),
    root.getByRole('button', { name: label, exact: true }),
    root.getByRole('link', { name: label, exact: true }),
    root.locator(`text=${label}`).first(),
  ];
  for (const loc of candidates) {
    try {
      if (await loc.count() && await loc.first().isVisible({ timeout: 800 })) {
        await loc.first().click({ timeout: 5000 });
        return true;
      }
    } catch (_) {}
  }
  return false;
}

async function testTitles(page) {
  const plugin = 'Titles';
  const consoleBag = collectConsole(page);
  await page.goto(`${ADMIN}/admin.php?page=beepbeep-titles`, { waitUntil: 'domcontentloaded' });
  await waitSettled(page, 2000);

  const root = page.locator('#beepti-root');
  const mounted = await root.count() > 0 && (await root.innerHTML()).length > 20;
  if (!mounted) {
    record(plugin, 'Home', false, 'React root #beepti-root empty/missing');
    return;
  }

  // Home screenshot
  const homeShot = await screenshotHome(page, '01-titles-home');
  const homeText = await page.locator('#beepti-root').innerText().catch(() => '');
  const hasPriorities = /Today.?s Priorities|Priority Action|Health/i.test(homeText);
  const homeErrors = filterNoise(consoleBag.errors.splice(0));
  record(plugin, 'Home', homeErrors.length === 0 && hasPriorities,
    hasPriorities
      ? `Dashboard rendered; console errors=${homeErrors.length}`
      : `Dashboard missing expected sections; console errors=${homeErrors.length}`,
    { screenshot: homeShot, consoleErrors: homeErrors.slice(0, 8) });

  // Other tabs via in-app nav
  const tabs = [
    { id: 'library', label: 'Advanced Library' },
    { id: 'automation', label: 'Autopilot' },
    { id: 'settings', label: 'Settings' },
    { id: 'billing', label: 'Billing' },
  ];
  for (const t of tabs) {
    consoleBag.errors.length = 0;
    const clicked = await clickTabByText(page, t.label, '#beepti-root');
    if (!clicked) {
      // Auth-gated tabs may be hidden when signed out — note as skip/conditional
      const visibleTabs = await page.locator('#beepti-root').innerText();
      if (!visibleTabs.includes(t.label)) {
        record(plugin, t.label, true, 'Tab not visible (likely requires sign-in) — skipped', { skipped: true });
        continue;
      }
      record(plugin, t.label, false, 'Could not click tab');
      continue;
    }
    await waitSettled(page, 1200);
    const errs = filterNoise(consoleBag.errors.splice(0));
    const body = await page.locator('#beepti-root').innerText().catch(() => '');
    const ok = errs.length === 0 && body.length > 10;
    record(plugin, t.label, ok, `clicked; bodyLen=${body.length}; console errors=${errs.length}`, {
      consoleErrors: errs.slice(0, 8),
    });
  }
}

async function testAltText(page) {
  const plugin = 'Alt Text';
  const pages = [
    { tab: 'Dashboard', url: `${ADMIN}/admin.php?page=bbai`, home: true },
    { tab: 'ALT Library', url: `${ADMIN}/admin.php?page=bbai-library` },
    { tab: 'Autopilot', url: `${ADMIN}/admin.php?page=bbai-autopilot` },
    { tab: 'Audit', url: `${ADMIN}/admin.php?page=bbai-audit` },
    { tab: 'Analytics', url: `${ADMIN}/admin.php?page=bbai-analytics` },
    { tab: 'Usage', url: `${ADMIN}/admin.php?page=bbai-credit-usage` },
    { tab: 'Settings', url: `${ADMIN}/admin.php?page=bbai-settings` },
  ];

  for (const p of pages) {
    const consoleBag = collectConsole(page);
    await page.goto(p.url, { waitUntil: 'domcontentloaded' });
    await waitSettled(page, 1800);
    const status = page.url();
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const phpFatal = /There has been a critical error|Fatal error|Parse error/i.test(bodyText);
    const notFound = /Sorry, you are not allowed|You need a higher level|Cannot load/i.test(bodyText);
    const errs = filterNoise(consoleBag.errors);
    let shot = null;
    if (p.home) {
      shot = await screenshotHome(page, '02-alttext-dashboard');
    }
    const hasContent = bodyText.length > 200 && !phpFatal;
    // Redirect to dashboard when unauthenticated for subpages is acceptable
    const redirectedHome = p.tab !== 'Dashboard' && /page=bbai($|&)/.test(status) && !status.includes(p.url.split('page=')[1]);
    const pass = hasContent && !phpFatal && errs.length === 0;
    let detail = phpFatal ? 'PHP critical error'
      : notFound ? 'Permission / not allowed'
      : redirectedHome ? `Redirected to dashboard (auth gate?) — content ok; console=${errs.length}`
      : `loaded; console errors=${errs.length}`;
    if (p.home) {
      const hasNew = /Today.?s Priorities|Priority Action|Images scanned|Missing alt/i.test(bodyText);
      detail += hasNew ? '; new dashboard markers present' : '; WARNING missing new dashboard markers';
    }
    record(plugin, p.tab, pass && !phpFatal, detail, {
      screenshot: shot,
      consoleErrors: errs.slice(0, 8),
      url: status,
    });
  }
}

async function testLinking(page) {
  const plugin = 'Internal Linking';
  const screens = [
    { tab: 'Dashboard', screen: null, home: true },
    { tab: 'Opportunities', screen: 'opportunities' },
    { tab: 'Pages', screen: 'pages' },
    { tab: 'Link Map', screen: 'map' },
    { tab: 'Settings', screen: 'settings' },
  ];

  // Discover actual section ids from page data if possible
  for (const s of screens) {
    const consoleBag = collectConsole(page);
    const url = s.screen
      ? `${ADMIN}/admin.php?page=oppti-internal-linking&screen=${s.screen}`
      : `${ADMIN}/admin.php?page=oppti-internal-linking`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await waitSettled(page, 2000);
    const root = page.locator('#oppti-linking-root');
    const mounted = (await root.count()) > 0 && (await root.innerHTML().catch(() => '')).length > 20;
    const bodyText = await (mounted ? root : page.locator('body')).innerText().catch(() => '');
    const phpFatal = /There has been a critical error|Fatal error/i.test(await page.locator('body').innerText());
    const errs = filterNoise(consoleBag.errors);
    let shot = null;
    if (s.home) shot = await screenshotHome(page, '03-linking-dashboard');
    let detail = !mounted ? 'App root empty'
      : phpFatal ? 'PHP fatal'
      : `mounted; console errors=${errs.length}`;
    if (s.home && mounted) {
      const hasNew = /Today.?s Priorities|Priority Action|Linking health|Orphan/i.test(bodyText);
      detail += hasNew ? '; new dashboard markers present' : '; WARNING missing new dashboard markers';
    }
    record(plugin, s.tab, mounted && !phpFatal && errs.length === 0, detail, {
      screenshot: shot,
      consoleErrors: errs.slice(0, 8),
      url: page.url(),
    });
  }
}

async function testAuditor(page) {
  const plugin = 'Auditor';
  const pages = [
    { tab: 'Dashboard', slug: 'oppti-optimizer', home: true },
    { tab: 'Website Audit', slug: 'oppti-optimizer-audit' },
    { tab: 'Opportunities', slug: 'oppti-optimizer-opportunities' },
    { tab: 'Progress', slug: 'oppti-optimizer-progress' },
    { tab: 'Solutions', slug: 'oppti-optimizer-solutions' },
    { tab: 'Workspace', slug: 'oppti-optimizer-workspace' },
  ];

  for (const p of pages) {
    const consoleBag = collectConsole(page);
    await page.goto(`${ADMIN}/admin.php?page=${p.slug}`, { waitUntil: 'domcontentloaded' });
    await waitSettled(page, 2500);

    // Auditor uses iframe — check outer page + try to peek into iframe
    const iframe = page.locator('iframe').first();
    let iframeText = '';
    let iframeMounted = false;
    if (await iframe.count()) {
      try {
        const frame = await iframe.contentFrame();
        if (frame) {
          await frame.waitForTimeout(1500);
          iframeText = await frame.locator('body').innerText().catch(() => '');
          iframeMounted = iframeText.length > 40;
        }
      } catch (e) {
        iframeText = `iframe access error: ${e.message}`;
      }
    }
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const phpFatal = /There has been a critical error|Fatal error/i.test(bodyText);
    const hasIframe = (await page.locator('iframe').count()) > 0;
    const errs = filterNoise(consoleBag.errors);
    let shot = null;
    if (p.home) {
      // Screenshot the iframe content if possible
      try {
        const frame = await iframe.contentFrame();
        if (frame) {
          shot = path.join(OUT, '04-auditor-dashboard.png');
          await frame.locator('body').screenshot({ path: shot });
        } else {
          shot = await screenshotHome(page, '04-auditor-dashboard');
        }
      } catch {
        shot = await screenshotHome(page, '04-auditor-dashboard');
      }
    }
    let detail = phpFatal ? 'PHP fatal'
      : !hasIframe ? 'No iframe found'
      : !iframeMounted ? 'Iframe empty/not mounted'
      : `iframe ok; console errors=${errs.length}`;
    if (p.home && iframeMounted) {
      const hasNew = /Today.?s Priorities|Priority Action|Health|Opportunit/i.test(iframeText);
      detail += hasNew ? '; new dashboard markers present' : '; WARNING missing new dashboard markers';
    }
    const pass = !phpFatal && hasIframe && iframeMounted && errs.length === 0;
    record(plugin, p.tab, pass, detail, {
      screenshot: shot,
      consoleErrors: errs.slice(0, 8),
      url: page.url(),
    });
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  try {
    await login(page);
    console.log('Logged in as admin');

    await testTitles(page);
    await testAltText(page);
    await testLinking(page);
    await testAuditor(page);
  } finally {
    await browser.close();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    results,
    summary: {
      total: results.length,
      pass: results.filter((r) => r.pass).length,
      fail: results.filter((r) => !r.pass).length,
      skipped: results.filter((r) => r.skipped).length,
    },
  };
  const reportPath = path.join(OUT, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(report.summary, null, 2));
  console.log('Report:', reportPath);
  console.log('Screenshots:', OUT);
  if (report.summary.fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
