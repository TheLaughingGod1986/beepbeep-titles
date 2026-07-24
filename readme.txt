=== OpptiAI Titles ===
Contributors: beepbeepv2
Tags: seo, meta description, title tag, yoast seo, rank math
Requires at least: 6.3
Tested up to: 7.0
Requires PHP: 8.1
Stable tag: 1.0.16
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Generate AI SEO title tags and meta descriptions for WordPress. Scan pages, fix missing metadata, and automate with Yoast SEO or Rank Math.

== Description ==

**OpptiAI Titles** is an AI SEO metadata plugin for WordPress that helps you write better **SEO title tags** and **meta descriptions** at scale — without leaving wp-admin.

Whether you run a blog, agency site, WooCommerce store, or content-heavy WordPress website, OpptiAI Titles scans your pages, highlights **missing SEO titles** and **missing meta descriptions**, and generates optimised metadata in seconds.

= Why WordPress site owners use OpptiAI Titles =

* **Site-wide SEO audit** — See pages scanned, pages needing review, and metadata coverage at a glance.
* **AI title & meta generation** — Create search-ready SEO titles and descriptions with one click.
* **Works with your SEO plugin** — Writes directly to **Yoast SEO**, **Rank Math**, and **All in One SEO** (or uses built-in fallback meta).
* **Autopilot mode** — Automatically request metadata from the OpptiAI service when new pages and posts are published.
* **Admin experience** — A fast React dashboard inside WordPress, designed for daily SEO workflows.
* **Service usage** — Secure account connection with service-credit-based AI generations.

= Perfect for =

* WordPress bloggers improving on-page SEO
* Agencies managing metadata across many pages
* WooCommerce stores with large product catalogues
* Teams using Yoast SEO or Rank Math who want faster metadata workflows

= How it works =

1. Install and activate OpptiAI Titles.
2. Connect your OpptiAI account (no credit card required to start).
3. Run a scan to find **missing titles**, **missing meta descriptions**, and pages needing review.
4. Generate optimised SEO metadata from the Library or Dashboard.
5. Optionally enable **Autopilot** to request AI metadata for newly published content.

= SEO plugin compatibility =

OpptiAI Titles detects which SEO plugin is active and writes metadata through it:

* **Yoast SEO** — `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`
* **Rank Math** — `rank_math_title`, `rank_math_description`
* **All in One SEO (AIOSEO)** — native AIOSEO tables
* **No SEO plugin** — stores fallback title and meta in post meta

= Important =

Scanning, reporting, manual metadata editing, settings, and Autopilot configuration are local plugin features and are not restricted by a paid plan. AI generation is performed by the external OpptiAI service and is not performed locally by the plugin. The service may require an account and available service credits.

= Privacy =

Page titles and content snippets are sent only when AI generation is requested, including when an administrator enables Autopilot and publishes content. See the External Services section for details.

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

1. Upload the `beepbeep-titles` folder to `/wp-content/plugins/` or install the zip from **Plugins → Add New → Upload Plugin**.
2. Activate **OpptiAI Titles** through the **Plugins** menu in WordPress.
3. Open **OpptiAI Titles** in the admin sidebar.
4. Review and edit the local SEO metadata report. Connect an OpptiAI account when you want to request external AI generation.

= Custom backend (optional) =

To point the plugin at a staging or self-hosted backend, add this to `wp-config.php`:

`define( 'BEEPBEEP_TITLES_API_URL', 'https://your-backend.example.com' );`

== Frequently Asked Questions ==

= Is OpptiAI Titles an SEO plugin? =

It focuses on **SEO titles** and **meta descriptions** — the metadata that appears in search results. It works alongside Yoast SEO, Rank Math, or AIOSEO rather than replacing them.

= Does it work with Yoast SEO and Rank Math? =

Yes. OpptiAI Titles detects your active SEO plugin and writes generated titles and meta descriptions through it.

= Can it generate meta descriptions automatically? =

Yes. Generate metadata on demand from the Library, run a batch pass from the Dashboard, or enable Autopilot to request titles and descriptions from the external service when new content is published. AI requests require an account and available service credits.

= Do I need a license to use the plugin? =

No license is required for scanning, full reports, manual metadata editing, saving settings, or configuring Autopilot. External AI generation requires a connected OpptiAI account and may require available service credits.

= Will this guarantee better Google rankings? =

No plugin can guarantee rankings. Better titles and descriptions can help improve **search appearance** and click-through potential when your pages already rank.

= What data is removed on uninstall? =

Plugin options and transients are removed. Data written through Yoast, Rank Math, or AIOSEO is never deleted. Optional "Delete data on uninstall" removes the plugin's own fallback post meta.

= What PHP and WordPress versions are supported? =

Requires **WordPress 6.3+**, **PHP 8.1+**, and was tested up to **WordPress 7.0**.

== Screenshots ==

1. AI metadata audit dashboard — scan your WordPress site and discover SEO title and meta description opportunities before connecting.
2. Operational SEO dashboard — pages needing attention, site health KPIs, top opportunities, and coverage progress.
3. Content Library — filter pages missing SEO titles or meta descriptions and generate metadata in bulk.
4. Autopilot — workflow to automatically generate titles and descriptions when new pages are published.
5. Settings — connect your account, configure generation preferences, and manage plugin options.
6. Service plans — compare available OpptiAI service-credit options for remote generation.

== Development Notes ==

Non-minified React source files and the npm build configuration are included in this plugin package. Production assets are compiled into `build/` with `@wordpress/scripts` using `npm run build`.

== Changelog ==

= 1.0.16 - 2026-07-14 =
* Remove remote Google Fonts loading from the admin screen; the plugin now uses local system font stacks only.
* Restrict the support contact endpoint to administrators and filter attached activity diagnostics by per-post edit permissions.
* Restrict the `/billing/info` REST endpoint to administrators (`manage_options`); account-level billing and subscription details are no longer exposed to editors.

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
* AI-powered SEO **title tag** and **meta description** generation.
* React admin dashboard with Home, Library, Autopilot, and Settings screens.
* Site-wide metadata scan with coverage stats (pages scanned, optimised, needing review).
* Signed-out **AI Metadata Audit** conversion dashboard with real scan KPIs.
* Logged-in **operational dashboard** — status banner, top opportunities, coverage progress, activity, and credits usage.
* **Library** with filters for missing titles, missing meta, and bulk generation.
* **Autopilot** mode for requesting external AI metadata on publish.
* SEO plugin integration: Yoast SEO, Rank Math, All in One SEO, plus fallback meta.
* Service-credit and billing integration for external AI generation.
* Onboarding wizard, Help modal, and contact support form with diagnostics.
* Activity log for latest optimisation history.
* Admin Billing diagnostics page (admin-only).
* Durable local billing telemetry for support diagnostics.
* Plugin Check and WordPress.org packaging readiness (prepared SQL, readme, dist archive).
* Uninstall cleanup with optional fallback meta removal.

== Upgrade Notice ==

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
