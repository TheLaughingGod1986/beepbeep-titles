=== BeepBeep Titles ===
Contributors: beepbeepai
Tags: seo, meta description, title tag, yoast seo, rank math
Requires at least: 6.3
Tested up to: 7.0
Requires PHP: 8.1
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Generate AI SEO title tags and meta descriptions for WordPress. Scan pages, fix missing metadata, and automate with Yoast SEO or Rank Math.

== Description ==

**BeepBeep Titles** is an AI SEO metadata plugin for WordPress that helps you write better **SEO title tags** and **meta descriptions** at scale — without leaving wp-admin.

Whether you run a blog, agency site, WooCommerce store, or content-heavy WordPress website, BeepBeep Titles scans your pages, highlights **missing SEO titles** and **missing meta descriptions**, and generates optimised metadata in seconds.

= Why WordPress site owners use BeepBeep Titles =

* **Site-wide SEO audit** — See pages scanned, pages needing review, and metadata coverage at a glance.
* **AI title & meta generation** — Create search-ready SEO titles and descriptions with one click.
* **Works with your SEO plugin** — Writes directly to **Yoast SEO**, **Rank Math**, and **All in One SEO** (or uses built-in fallback meta).
* **Autopilot mode** — Automatically generate metadata when new pages and posts are published (Pro).
* **Premium admin experience** — A fast React dashboard inside WordPress, designed for daily SEO workflows.
* **Quota & billing** — Secure account connection with plan-based monthly generations.

= Perfect for =

* WordPress bloggers improving on-page SEO
* Agencies managing metadata across many pages
* WooCommerce stores with large product catalogues
* Teams using Yoast SEO or Rank Math who want faster metadata workflows

= How it works =

1. Install and activate BeepBeep Titles.
2. Connect your BeepBeep account (no credit card required to start).
3. Run a scan to find **missing titles**, **missing meta descriptions**, and pages needing review.
4. Generate optimised SEO metadata from the Library or Dashboard.
5. Enable **Autopilot** (Starter/Pro) to cover new content automatically.

= SEO plugin compatibility =

BeepBeep Titles detects which SEO plugin is active and writes metadata through it:

* **Yoast SEO** — `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`
* **Rank Math** — `rank_math_title`, `rank_math_description`
* **All in One SEO (AIOSEO)** — native AIOSEO tables
* **No SEO plugin** — stores fallback title and meta in post meta

= Important =

Generation and entitlement are validated by the BeepBeep backend on each request. A stored license key alone does not guarantee quota — the API confirms your plan and remaining credits.

= Privacy =

Page titles and content snippets may be sent to the BeepBeep API for AI generation. See [beepbeep.ai](https://beepbeep.ai) for privacy terms.

== Installation ==

1. Upload the `beepbeep-titles` folder to `/wp-content/plugins/` or install the zip from **Plugins → Add New → Upload Plugin**.
2. Activate **BeepBeep Titles** through the **Plugins** menu in WordPress.
3. Open **BeepBeep Titles** in the admin sidebar.
4. Connect your BeepBeep account to unlock generation and view your full SEO metadata report.

= Custom backend (optional) =

To point the plugin at a staging or self-hosted backend, add this to `wp-config.php`:

`define( 'BEEPBEEP_TITLES_API_URL', 'https://your-backend.example.com' );`

== Frequently Asked Questions ==

= Is BeepBeep Titles an SEO plugin? =

It focuses on **SEO titles** and **meta descriptions** — the metadata that appears in search results. It works alongside Yoast SEO, Rank Math, or AIOSEO rather than replacing them.

= Does it work with Yoast SEO and Rank Math? =

Yes. BeepBeep Titles detects your active SEO plugin and writes generated titles and meta descriptions through it.

= Can it generate meta descriptions automatically? =

Yes. Generate metadata on demand from the Library, run a batch pass from the Dashboard, or enable Autopilot (Starter/Pro) to generate titles and descriptions when new content is published.

= Do I need a license to use the plugin? =

You can install the plugin and view audit previews without connecting. AI generation, full reports, and quota require a connected BeepBeep account.

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
6. Upgrade modal — compare Free, Starter, and Pro plans to increase monthly AI generations.

== Changelog ==

= 1.0.0 — 2026-06-16 =
* **Initial public release** of BeepBeep Titles for WordPress.
* AI-powered SEO **title tag** and **meta description** generation.
* React admin dashboard with Home, Library, Autopilot, and Settings screens.
* Site-wide metadata scan with coverage stats (pages scanned, optimised, needing review).
* Signed-out **AI Metadata Audit** conversion dashboard with real scan KPIs.
* Logged-in **operational dashboard** — status banner, top opportunities, coverage progress, activity, and credits usage.
* **Library** with filters for missing titles, missing meta, and bulk generation.
* **Autopilot** mode for automatic metadata on publish (Starter/Pro).
* SEO plugin integration: Yoast SEO, Rank Math, All in One SEO, plus fallback meta.
* Stripe-backed billing with Free, Starter, and Pro plans.
* Onboarding wizard, Help modal, and contact support form with diagnostics.
* Activity log for latest optimisation history.
* Admin Billing diagnostics page (admin-only).
* Checkout funnel analytics and durable billing telemetry.
* Plugin Check and WordPress.org packaging readiness (prepared SQL, readme, dist archive).
* Uninstall cleanup with optional fallback meta removal.

== Upgrade Notice ==

= 1.0.0 =
Initial release. Connect your BeepBeep account to scan your site and start generating SEO titles and meta descriptions.
