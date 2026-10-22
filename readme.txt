=== OpptiAI Titles – AI SEO Titles and Meta Descriptions ===
Contributors: beepbeepv2
Tags: seo, ai seo, meta description, title tag, site audit
Requires at least: 6.3
Tested up to: 7.1
Requires PHP: 8.1
Stable tag: 1.0.30
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Free SEO health check, no account: missing, duplicate and wrong-length titles and meta. Works next to Yoast, Rank Math and AIOSEO.

== Description ==

https://www.youtube.com/watch?v=zUo5rRgYCZ4

**Free SEO health check, no account needed: find missing, duplicate and wrong-length titles and meta descriptions. Works next to Yoast, Rank Math and AIOSEO.**

OpptiAI Titles scans your published pages inside WordPress and gives you a metadata health score, a list of the pages that need attention, and the order to fix them in. The scan is local and does not need an account. When you want help writing, connect a free OpptiAI account and generate SEO titles and meta descriptions that you review before anything changes. Approved metadata is written through the SEO plugin you already use.

**Two more free audits from OpptiAI:** [OpptiAI Alt Text](https://wordpress.org/plugins/beepbeep-ai-alt-text-generator/) shows how many of your images have no alt text, and [OpptiAI Internal Linking](https://wordpress.org/plugins/opptiai-internal-linking/) finds orphan pages that no other page links to. Both scan your site before you sign up.

= Features =

**Free SEO health check (no account)**

Find pages with:

* Missing SEO titles
* Missing meta descriptions
* Duplicate titles
* Duplicate descriptions
* Titles that are too short or too long
* Meta descriptions outside recommended lengths

You also get an overall health score, priority recommendations and progress tracking as issues are resolved.

**AI titles and meta descriptions you review**

Generate search-friendly SEO titles and meta descriptions from the Dashboard or Advanced Library. Every suggestion can be edited or rejected before it is applied.

**Works with your SEO plugin**

OpptiAI Titles does not replace your SEO suite. It detects which SEO plugin is active and writes metadata through it.

**Manual editing, free**

Edit titles and meta descriptions yourself from one list, without opening each page.

**Bulk optimisation**

Select many pages, generate suggestions in one run and approve them individually or in batches. Bulk works within your free allowance once your account is connected, and paid plans raise the allowance.

**Autopilot and Continuous Optimisation (paid)**

Autopilot (Growth or Agency) generates titles and descriptions when new content is published, using your tone and length preferences. Continuous Optimisation (Growth or Agency) keeps newly published pages covered.

**Lightweight**

* Minimal performance impact
* Simple setup
* Local system fonts, no remote font loading

= How it works =

1. Install and activate OpptiAI Titles.
2. Run the free health check to find missing titles, missing meta descriptions and pages needing review. No account required.
3. Fix pages by hand, or connect a free OpptiAI account when you want AI suggestions.
4. Generate suggestions one page at a time or in bulk, then review and apply them from the Dashboard or Advanced Library.
5. Optionally upgrade for a higher allowance, **Autopilot** (Growth or Agency) or **Continuous Optimisation** (Growth or Agency).

= SEO plugin compatibility =

* **Yoast SEO:** `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`
* **Rank Math:** `rank_math_title`, `rank_math_description`
* **All in One SEO (AIOSEO):** native AIOSEO tables
* **No SEO plugin:** stores fallback title and meta in post meta

= Free to try, then paid plans =

* **Free, no account:** the SEO health check, full reports, manual metadata editing and settings.
* **Free account:** a monthly allowance of AI generations, used one page at a time or in bulk, performed by the external OpptiAI service.
* **Starter:** a higher allowance.
* **Growth or Agency:** higher allowances, **Autopilot** and **Continuous Optimisation** for newly published pages.

See [plans](https://oppti.dev/docs/titles/plans).

= Part of OpptiAI =

OpptiAI Titles shares one OpptiAI account and credit wallet with [OpptiAI Alt Text](https://wordpress.org/plugins/beepbeep-ai-alt-text-generator/) and [OpptiAI Internal Linking](https://wordpress.org/plugins/opptiai-internal-linking/). Each plugin runs its own free audit first.

= Privacy =

AI-generated suggestions are created securely using OpptiAI services.

Only the content required to generate suggestions is processed. Page titles and content snippets are sent only when AI generation is requested, including when an administrator enables Autopilot and publishes content.

No personal visitor information is collected. See the External Services section for details.

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

Service: PostHog (usage stats, opt-in only)
Service URL: https://us.i.posthog.com
Purpose: Help us understand which features are used so we can improve OpptiAI Titles.
When data is sent: Only after an administrator turns on "Share usage stats to help improve OpptiAI Titles" in Settings. It is off by default, and nothing is sent or queued before you opt in. Turning it off stops sending immediately.
Data sent: Anonymous feature usage events (for example, which screen was opened or that a generation finished), the plugin, WordPress and PHP versions, and a pseudonymous installation identifier. If you sign up or sign in to an OpptiAI account, the OpptiAI account ID (never the email) is linked to those events so usage across OpptiAI plugins is counted once. Never page content, titles, meta descriptions, URLs, post IDs, search terms or personal data.
Privacy Policy: https://posthog.com/privacy
Terms of Use: https://posthog.com/terms

== Installation ==
1. Upload the `opptiai-titles` folder to `/wp-content/plugins/` or install from **Plugins → Add New** (WordPress.org slug: `opptiai-titles`).
2. Activate **OpptiAI Titles** through the **Plugins** menu in WordPress.
3. Open **OpptiAI Titles** in the admin sidebar.
4. Run your first free SEO health check to review missing SEO titles and meta descriptions.
5. Connect your OpptiAI account when you want to request AI generation.
6. Review recommendations and generate AI improvements.
7. Apply changes individually or in bulk.

= Custom backend (optional) =

To point the plugin at a staging or self-hosted backend, add this to `wp-config.php`:

`define( 'BEEPBEEP_TITLES_API_URL', 'https://your-backend.example.com' );`

== Frequently Asked Questions ==

= Do I need an account to run the SEO health check? =

No. The health check, reports and manual editing run in WordPress without an account. An OpptiAI account is only needed when you ask for AI suggestions.

= Does this replace my SEO plugin? =

No. OpptiAI Titles works alongside Yoast SEO, Rank Math or AIOSEO and writes through them. It helps you find and fix SEO title and meta description issues faster.

= Can I review AI suggestions before applying them? =

Yes. Every AI-generated title and description can be reviewed before your website is updated.

= Can I optimise existing content? =

Yes. The plugin analyses existing metadata and suggests improvements rather than replacing everything.

= Is bulk optimisation supported? =

Yes. Generate improvements across many pages and approve them individually or in batches. Bulk works on the free plan within your monthly allowance; if a selection needs more than you have left, you can run part of it now or upgrade for a higher allowance.

= Is this an AI title generator for WordPress? =

Yes. You can request AI-generated SEO titles and meta descriptions from the Dashboard or Advanced Library. Generation uses the OpptiAI service and your available credits.

= Can it generate meta descriptions automatically? =

Yes, with Autopilot on a **Growth or Agency** plan. Autopilot requests titles and descriptions from the external service when new content is published. Free users can still scan, edit manually and generate on demand, one page at a time or in bulk.

= Do I need a paid plan to use the plugin? =

No. Scanning, full reports, manual metadata editing and settings are free with no account. AI generation, including bulk, is free to try with a free OpptiAI account. Autopilot needs Growth or Agency, and Continuous Optimisation needs Growth or Agency.

= Will this guarantee better Google rankings? =

No plugin can guarantee rankings. Better titles and descriptions can help improve **search appearance** and click-through potential when your pages already rank.

= What data is removed on uninstall? =

Plugin options and transients are removed. Data written through Yoast, Rank Math or AIOSEO is never deleted. The optional "Delete data on uninstall" setting removes the plugin's own fallback post meta.

= What PHP and WordPress versions are supported? =

Requires **WordPress 6.3+** and **PHP 8.1+**, tested up to **WordPress 7.1**.

= Are there other OpptiAI plugins? =

Yes, two more free audits. [OpptiAI Alt Text](https://wordpress.org/plugins/beepbeep-ai-alt-text-generator/) shows how many of your images have no alt text, free to try, before you sign up. [OpptiAI Internal Linking](https://wordpress.org/plugins/opptiai-internal-linking/) finds every orphan page in one scan, in WordPress, with no account and no credits.

== Screenshots ==

1. Free SEO health check result before you connect an account: health score, missing and duplicate titles and meta descriptions, and the pages to fix first.
2. OpptiAI Titles Home: metadata health score, today's priorities, coverage stats and continuous optimisation controls.
3. OpptiAI Titles Advanced Library: filter pages needing attention and generate SEO titles or meta descriptions in bulk.
4. OpptiAI Titles Autopilot: configure tone, title length and auto-generate on publish (Growth or Agency).
5. OpptiAI Titles Settings: account connection, shared OpptiAI credit wallet, notifications and support.

== Development Notes ==
Non-minified React source files and the npm build configuration are included in this plugin package. Production assets are compiled into `build/` with `@wordpress/scripts` using `npm run build`.

WordPress.org slug / install folder: `opptiai-titles`. The plugin text domain, REST namespace, and internal admin slug remain `beepbeep-titles` for backwards compatibility with existing installs, options, and translations.

== Changelog ==
= 1.0.30 - 2026-10-22 =
* New: automatic titles on new posts are now included in Starter.
* New: a short, optional prompt to leave a review on WordPress.org. You can dismiss it.
* Fixed: upgrade checkout opens in the same tab, with a way to continue if the payment page does not load.
* Fixed: plan prices show in the currency for your country.
* Fixed: Continuous Optimisation is available on Agency.
* Fixed: sign-up errors stay on screen.
* Changed: automatic titles pause with one notice when you run out of credits, and resume when credits are back.
* Changed: if you opt in to usage stats and connect an account, usage is linked to your OpptiAI account ID, never your email.
* Changed: support requests go to support@oppti.dev.

= 1.0.29 - 2026-10-12 =
* Privacy: usage stats are only sent after you opt in.

= 1.0.28 - 2026-10-12 =
* **Improved**: Sign-up question options.

= 1.0.27 - 2026-10-12 =
* **Added**: An optional "How did you find us?" question on the sign-up form. You can skip it.

= 1.0.26 - 2026-09-02 =
* US visitors (Cloudflare CF-IPCountry) see USD Titles paywall amounts and check out with USD Stripe price IDs; non-US / unknown country unchanged (GBP).

= 1.0.25 - 2026-08-21 =
* In-plugin By line is now OpptiAI linked to https://oppti.dev.

= 1.0.24 - 2026-08-18 =
* Signed-out first open shows the free health-check onboarding wizard when `onboarding_complete` is false (no longer gated on a connected account). Quotas, billing id `pro`, and Guest Library behaviour are unchanged.

= 1.0.23 - 2026-08-18 =
* Add a quiet Home Alt Text cross-sell for signed-in Free, Starter, and Growth: locked copy with CTA “Open Alt Text” when installed or “Get OpptiAI Alt Text” when not; links to the sibling admin page or WordPress.org. Hidden from guests and Agency. Plan grid and Free allowance are unchanged.
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
* Rebrand: BeepBeep Titles is now **OpptiAI Titles**, part of the OpptiAI platform. Display naming only: plugin slug, settings, accounts, licenses, and data are unchanged and existing installs are unaffected.
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

= 1.0.0 - 2026-06-16 =
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
= 1.0.30 =
Starter now includes automatic titles on new posts. Also fixes upgrade checkout and sign-up errors.

= 1.0.24 =
Signed-out first open now shows the free health-check wizard when onboarding is incomplete. Free allowance and plan ids unchanged.

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
BeepBeep Titles is now OpptiAI Titles: new name, same plugin. No action needed; settings, accounts, and licenses carry over unchanged.

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
