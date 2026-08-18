=== OpptiAI Titles ===
Contributors: beepbeepv2
Tags: seo, ai seo, meta description, title tag, site audit
Requires at least: 6.3
Tested up to: 7.0
Requires PHP: 8.1
Stable tag: 1.0.23
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AI SEO Health Check for WordPress. Scan missing titles and meta descriptions, get a health score, and fix metadata with AI.

== Description ==

**Improve your WordPress SEO with an AI-powered SEO Health Check.**

**OpptiAI Titles** analyses your website, identifies SEO issues affecting visibility, prioritises the most important problems, and helps you fix them using AI.

Rather than simply generating titles and meta descriptions, the plugin gives you a clear picture of your site's SEO health and guides you towards the improvements that will have the greatest impact.

Whether you manage a small business website or hundreds of pages, OpptiAI Titles helps you discover opportunities and optimise your content in minutes.

= Features =

**SEO Health Dashboard**

Get an instant overview of your website's SEO health, including:

* Overall SEO Health Score
* Number of issues detected
* Priority recommendations
* Progress tracking as issues are resolved

**AI Metadata Optimisation**

Generate high-quality, search-friendly:

* SEO Titles
* Meta Descriptions

Each suggestion is written using AI and designed to improve relevance, readability, and click-through potential.

**Site-wide SEO Audit**

Automatically identify pages with:

* Missing SEO titles
* Missing meta descriptions
* Duplicate titles
* Duplicate descriptions
* Titles that are too short or too long
* Meta descriptions outside recommended lengths

**Bulk Optimisation**

Optimise many pages in just a few clicks.

Instead of editing each page individually, generate AI suggestions in bulk and review them before applying changes. Free includes a monthly generation allowance (25 credits); Starter and Growth unlock higher limits and Autopilot workflows.

**Smart Recommendations**

Receive actionable recommendations including:

* Improve title length
* Increase keyword relevance
* Remove duplicate metadata
* Improve click-through potential
* Complete missing metadata

**Fast & Lightweight**

Designed specifically for WordPress.

* Minimal performance impact
* Simple setup
* Modern interface
* Works alongside existing SEO plugins (Yoast SEO, Rank Math, All in One SEO)

= Why use OpptiAI Titles? =

Most SEO tools simply tell you that something is wrong.

OpptiAI Titles shows you:

* what needs fixing
* why it matters
* how important it is
* and helps fix it with AI

Instead of manually reviewing hundreds of pages, your SEO improvements become a guided workflow.

= Perfect for =

* Website owners
* Bloggers
* Agencies
* Freelancers
* WooCommerce stores
* Publishers
* Marketing teams

= How it works =

1. Install and activate OpptiAI Titles.
2. Run a local scan to find missing titles, missing meta descriptions, and pages needing review — no account required to audit.
3. Connect your OpptiAI account when you want AI generation (no credit card required to start on Free).
4. Generate metadata from the Dashboard or Advanced Library.
5. Optionally upgrade to enable **Autopilot** (Starter or Growth) or **Continuous Optimisation** (Growth) for newly published content.

= SEO plugin compatibility =

OpptiAI Titles detects which SEO plugin is active and writes metadata through it:

* **Yoast SEO** — `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`
* **Rank Math** — `rank_math_title`, `rank_math_description`
* **All in One SEO (AIOSEO)** — native AIOSEO tables
* **No SEO plugin** — stores fallback title and meta in post meta

= What is free vs paid =

* **Included locally (no paid plan required):** scanning, reporting, manual metadata editing, settings, and reviewing opportunities.
* **AI generation:** performed by the external OpptiAI service; requires a connected account and available service credits. **Free includes 25 monthly credits.**
* **Autopilot** (auto-generate on publish + writing preferences): requires a **Starter or Growth** subscription.
* **Continuous Optimisation** for newly published pages: requires **Growth**.

= Future SEO Health Checks =

OpptiAI Titles is evolving into a broader WordPress SEO Health platform.

Upcoming health checks may include:

* Image Alt Text
* Heading structure
* Internal linking (listed in-product as coming soon — not a live feature of this plugin today)
* Broken links
* Image optimisation
* Accessibility improvements
* Schema recommendations
* Content quality analysis
* SEO performance trends

= Privacy =

AI-generated suggestions are created securely using OpptiAI services.

Only the content required to generate suggestions is processed. Page titles and content snippets are sent only when AI generation is requested, including when an administrator enables Autopilot and publishes content.

No personal visitor information is collected. See the External Services section for details.

= Upgrade to Starter or Growth =

Unlock more of OpptiAI Titles:

* Higher monthly AI generation allowances (Free includes 25 credits)
* Bulk optimisation workflows at scale
* **Autopilot** on Starter or Growth
* **Continuous Optimisation** on Growth
* Priority AI models where available on paid plans
* Access to future OpptiAI optimisation modules as they ship
* Agency-oriented features on higher plans

== External Services ==

This plugin connects to the OpptiAI API to generate SEO titles and meta descriptions. AI generation is performed by the external service and is not performed locally by this plugin.

Service: OpptiAI API
Service URL: https://alttext-ai-backend.onrender.com
Website: https://oppti.dev
Purpose: Generate SEO title and meta description suggestions, connect an OpptiAI account, report available service credits, and manage service billing status.
When data is sent: When an administrator signs in or registers, checks service usage, requests AI generation, uses Autopilot on publication, opens billing functions, or submits the contact support form.
Data sent: Site URL; WordPress, PHP, and plugin versions; a pseudonymous installation/site identifier; connected account credentials or license key for authentication; selected post IDs; post title, current SEO title, current meta description, excerpt or content snippet, content type and section; generation preferences; and request metadata needed to provide the service. When the contact support form is submitted, the name, reply email address, and message entered by the administrator are also sent, together with a plugin diagnostics summary (site name and URL; WordPress, PHP, and plugin versions; active theme and SEO plugin; account connection status with a masked license suffix; the connected account email; the submitting admin user's display name, email, and roles; and recent plugin activity log entries) so support can troubleshoot the request.
Privacy Policy: https://oppti.dev/privacy
Terms of Use: https://oppti.dev/terms

== Installation ==

1. Upload the `opptiai-titles` folder to `/wp-content/plugins/` or install from **Plugins → Add New** (WordPress.org slug: `opptiai-titles`).
2. Activate **OpptiAI Titles** through the **Plugins** menu in WordPress.
3. Open **OpptiAI Titles** in the admin sidebar.
4. Run your first SEO Health Check / site scan to review missing SEO titles and meta descriptions.
5. Connect your OpptiAI account when you want to request AI generation.
6. Review recommendations and generate AI improvements.
7. Apply changes individually or in bulk.

= Custom backend (optional) =

To point the plugin at a staging or self-hosted backend, add this to `wp-config.php`:

`define( 'BEEPBEEP_TITLES_API_URL', 'https://your-backend.example.com' );`

== Frequently Asked Questions ==

= Does this replace my SEO plugin? =

No. OpptiAI Titles complements popular SEO plugins by helping you identify and improve SEO title and meta description issues more efficiently. It works alongside Yoast SEO, Rank Math, or AIOSEO rather than replacing them.

= Can I review AI suggestions before applying them? =

Yes. Every AI-generated title and description can be reviewed before updating your website.

= Can I optimise existing content? =

Yes. The plugin analyses existing metadata and suggests improvements rather than simply replacing everything.

= Is bulk optimisation supported? =

Yes. Generate improvements across multiple pages and approve them individually or in batches. AI generation uses your available OpptiAI credits (Free includes 25 monthly credits).

= Is this an AI title generator for WordPress? =

Yes. You can request AI-generated SEO titles and meta descriptions from the Dashboard or Advanced Library. Generation uses the OpptiAI service and available credits.

= Can it generate meta descriptions automatically? =

Yes, with Autopilot on a **Starter or Growth** plan. Autopilot can request titles and descriptions from the external service when new content is published. Free users can still scan, edit manually, and use their monthly AI generation allowance on demand.

= Do I need a paid plan to use the plugin? =

No paid plan is required for scanning, full reports, manual metadata editing, or settings. External AI generation requires a connected OpptiAI account and available service credits. Autopilot requires Starter or Growth; Continuous Optimisation requires Growth.

= Will this guarantee better Google rankings? =

No plugin can guarantee rankings. Better titles and descriptions can help improve **search appearance** and click-through potential when your pages already rank.

= What data is removed on uninstall? =

Plugin options and transients are removed. Data written through Yoast, Rank Math, or AIOSEO is never deleted. Optional "Delete data on uninstall" removes the plugin's own fallback post meta.

= What PHP and WordPress versions are supported? =

Requires **WordPress 6.3+**, **PHP 8.1+**, and was tested up to **WordPress 7.0**.

== Screenshots ==

1. OpptiAI Titles signed-out audit — scan your WordPress site for missing SEO titles and meta descriptions before connecting an account.
2. OpptiAI Titles Home — metadata health score, today's priorities, coverage stats, and continuous optimisation controls.
3. OpptiAI Titles Advanced Library — filter pages needing attention and generate SEO titles or meta descriptions in bulk.
4. OpptiAI Titles Autopilot — configure tone, title length, and auto-generate on publish (Starter or Growth).
5. OpptiAI Titles Settings — account connection, shared OpptiAI credit wallet, notifications, and support.

== Development Notes ==

Non-minified React source files and the npm build configuration are included in this plugin package. Production assets are compiled into `build/` with `@wordpress/scripts` using `npm run build`.

WordPress.org slug / install folder: `opptiai-titles`. The plugin text domain, REST namespace, and internal admin slug remain `beepbeep-titles` for backwards compatibility with existing installs, options, and translations.

== Changelog ==

= 1.0.23 - 2026-08-18 =
* Add a quiet Home Alt Text cross-sell for signed-in Free, Starter, and Growth: locked copy with CTA “Open Alt Text” when installed or “Get OpptiAI Alt Text” when not; links to the sibling admin page or WordPress.org. Hidden from guests and Agency. Plan grid and Free allowance (25) are unchanged.
* Credit usage card: remaining 0 → “No credits left this month”; remaining 1 → “Only 1 credit left this month”; remaining 2–5 → “Only X credits left this month”; above 5 → used/limit. Quiet footnote: “Credits count generations, including retries and alt text. Pages count what you applied.”
* Settings plan CTA: “View Growth plan” (billing id `pro` unchanged). Credit Wallet keeps usage_by_feature split; AltText row shows Open when installed; Internal Linking and Schema stay Not installed with no Get / Install / WP.org.

= 1.0.22 - 2026-08-18 =
* Rename user-facing paid plan name from Pro to Growth to match the live Free / Starter / Growth / Agency grid (oppti.dev and checkout). Billing plan id `pro` and Stripe checkout are unchanged.

= 1.0.21 - 2026-08-17 =
* Replace WordPress.org directory icons and banners with original OpptiAI Titles artwork (SEO title / health-check / text-lines). Icons are no longer byte-identical copies of OpptiAI Alt Text chart assets. Paid plans and slugs unchanged.

= 1.0.20 - 2026-08-17 =
* Correct user-facing branding from “OptiAI” to “OpptiAI” (including the health-score disclaimer). Internal namespaces, text domain, REST slug, and option names are unchanged.
* Prevent the signed-out Home / Audit screen from flashing a false “No published pages… / 0 scanned” state on first paint after a successful scan. Coverage stats are seeded from PHP and the empty copy only shows once loaded totals are known.
* Signed-out SEO Health Check / local scanning remains free and account-free. Free monthly AI allowance stays at 25. Paid plans unchanged.

= 1.0.19 - 2026-08-17 =
* Raise the Free plan monthly AI allowance from 15 to 25 credits (user-facing defaults, paywall, and WordPress.org copy).
* SEO Health Check / signed-out scanning remains free and does not require an account or consume credits.
* Paid plan allowances and Autopilot gating are unchanged.

= 1.0.18 - 2026-08-02 =
* Add PostHog product analytics for Titles plugin activity (lifecycle, screens, generation, auth, billing, scans, autopilot).
* Events are consent-gated and forwarded server-side with `plugin_slug=opptiai-titles` so they sit alongside Alt Text in the shared OpptiAI PostHog project.

= 1.0.16 - 2026-07-14 =
* Remove remote Google Fonts loading from the admin screen; the plugin now uses local system font stacks only.
* Restrict the support contact endpoint to administrators and filter attached activity diagnostics by per-post edit permissions.
* Restrict the `/billing/info` REST endpoint to administrators (`manage_options`); account-level billing and subscription details are no longer exposed to editors.
* SEO Health Check workflows remain the core experience: health score dashboard, site-wide metadata audit, AI title/meta generation, and bulk optimisation.

= 1.0.15 - 2026-07-14 =
* Tighten the activity REST endpoint so returned activity entries are filtered by `current_user_can( 'edit_post', $post_id )`.

= 1.0.14 - 2026-07-10 =
* Rebrand: BeepBeep Titles is now **OpptiAI Titles**, part of the OpptiAI platform. Display naming only — plugin slug, settings, accounts, licenses, and data are unchanged and existing installs are unaffected.
* The shared credit balance is now presented as the OpptiAI Credit Wallet.

= 1.0.13 - 2026-07-08 =
* Remove all bundled analytics and session replay. The plugin no longer sends any usage data to analytics services.
* Complete uninstall cleanup: remove the local encryption key, disconnect flag, support log, and site identifier options.
* Store the plugin's site identifier under its own `beepti_` prefixed option instead of a shared unprefixed key.

= 1.0.12 - 2026-07-02 =
* Remove use of WordPress authentication salts for plugin fingerprints and local license storage.
* Tighten REST permissions for page listing and job polling so returned posts and job writes are limited to posts the current user can edit.

= 1.0.9 - 2026-06-25 =
* Standardise the admin screen container width across Home, Library, Autopilot, Settings, Billing, and the signed-out audit dashboard.

= 1.0.8 - 2026-06-24 =
* Send support-form messages through the OpptiAI backend mailer with local mail fallback.

= 1.0.7 - 2026-06-24 =
* Connect from an existing OpptiAI Alt Text license when signing in or creating an account.

= 1.0.6 - 2026-06-24 =
* Clear stale account-exists messages when switching from account creation to sign-in.

= 1.0.5 - 2026-06-24 =
* Avoid unauthenticated billing-plan requests on the signed-out audit screen.

= 1.0.4 - 2026-06-24 =
* Remove non-essential auth request headers for WordPress Playground compatibility.

= 1.0.3 - 2026-06-24 =
* Improve OpptiAI account login and registration compatibility in WordPress Playground by using minimal auth request headers.

= 1.0.2 - 2026-06-24 =
* Fix OpptiAI account registration error handling when the service returns a JSON error response.

= 1.0.1 - 2026-06-24 =
* Release package refresh for WordPress.org resubmission.

= 1.0.0 — 2026-06-16 =
* **Initial public release** of OpptiAI Titles for WordPress.
* SEO Health Dashboard with coverage stats and progress tracking.
* AI-powered SEO **title tag** and **meta description** generation.
* Site-wide SEO audit for missing, duplicate, and weak metadata.
* Bulk optimisation from the Advanced Library.
* React admin dashboard with Home, Library, Autopilot, and Settings screens.
* Signed-out **AI Metadata Audit** conversion dashboard with real scan KPIs.
* **Autopilot** mode for requesting external AI metadata on publish.
* SEO plugin integration: Yoast SEO, Rank Math, All in One SEO, plus fallback meta.
* Service-credit and billing integration for external AI generation.
* Onboarding wizard, Help modal, and contact support form with diagnostics.
* Activity log for latest optimisation history.
* Plugin Check and WordPress.org packaging readiness.

== Upgrade Notice ==

= 1.0.23 =
Adds a quiet Home cross-sell to OpptiAI Alt Text for Free, Starter, and Growth (CTAs “Open Alt Text” / “Get OpptiAI Alt Text”); clearer low-balance usage copy; and Settings Growth plan / wallet alignment. No plan ids, slug, or Free allowance changes.

= 1.0.21 =
WordPress.org directory icons and banners now use original OpptiAI Titles artwork (distinct from OpptiAI AltText). No functional or plan changes.

= 1.0.20 =
Fixes OpptiAI branding in user-facing copy and stops the Home audit from flashing a false empty/0-scanned state on first paint. Free monthly allowance remains 25; signed-out scans stay account-free.

= 1.0.19 =
Free monthly AI allowance is now 25 credits. Signed-out SEO health scans remain free and account-free.

= 1.0.18 =
Adds PostHog product analytics for Titles plugin activity in the shared OpptiAI project.

= 1.0.16 =
Removes remote Google Fonts loading and tightens support diagnostics permissions.

= 1.0.15 =
Filters activity REST responses by per-post edit permissions.

= 1.0.14 =
BeepBeep Titles is now OpptiAI Titles — new name, same plugin. No action needed; settings, accounts, and licenses carry over unchanged.

= 1.0.13 =
Removes all bundled analytics and session replay, completes uninstall cleanup, and prefixes the plugin's site identifier option.

= 1.0.12 =
Addresses WordPress.org review feedback for auth salt handling and REST route permissions.

= 1.0.9 =
Standardises the admin screen container width across the plugin screens.

= 1.0.8 =
Sends support-form messages through the OpptiAI backend mailer with local mail fallback.

= 1.0.7 =
Connects from an existing OpptiAI Alt Text license during account connection.

= 1.0.6 =
Clears stale account-exists messages when switching from account creation to sign-in.

= 1.0.5 =
Avoids unauthenticated billing-plan requests on the signed-out audit screen.

= 1.0.4 =
Removes non-essential auth request headers for WordPress Playground compatibility.

= 1.0.3 =
Improves account login and registration compatibility in WordPress Playground.

= 1.0.2 =
Fixes account registration error handling for OpptiAI service responses.

= 1.0.1 =
Release package refresh for WordPress.org resubmission.

= 1.0.0 =
Initial release. Connect your OpptiAI account to scan your site and start generating SEO titles and meta descriptions.
