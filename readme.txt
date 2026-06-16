=== BeepBeep Titles ===
Contributors: beepbeepai
Tags: seo, meta description, title tag, ai, opengraph
Requires at least: 6.3
Tested up to: 7.0
Requires PHP: 8.1
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AI-powered SEO title tag and meta description generation for WordPress, with a React admin UI and a remote backend for generation and billing.

== Description ==

BeepBeep Titles keeps your site's page SEO coverage climbing in the background. It generates SEO title tags and meta descriptions with AI and writes them through whichever SEO plugin you already use — Yoast, Rank Math, or All in One SEO — or to its own fallback meta when none is active.

* Scan your library and see coverage at a glance (missing titles, missing meta, optimised pages).
* Generate titles and meta descriptions on demand, or auto-generate on publish.
* Works with Yoast SEO, Rank Math, and All in One SEO, with a built-in fallback.
* Quota, generation, and billing are enforced by the BeepBeep backend.

A stored license key alone does not guarantee entitlement — the API validates on each generate call.

== Installation ==

1. Upload the plugin to `wp-content/plugins/beepbeep-titles`, or install it from the Plugins screen.
2. Activate **BeepBeep Titles** in wp-admin.
3. Open **BeepBeep Titles** in the admin menu and connect your license key.

To point the plugin at a custom backend, define the host in `wp-config.php`:

`define( 'BEEPBEEP_TITLES_API_URL', 'https://your-backend.example.com' );`

== Frequently Asked Questions ==

= Does it work with my SEO plugin? =

Yes. It detects Yoast SEO, Rank Math, and All in One SEO and writes through them. If none is active, it stores titles and meta descriptions in its own post meta.

= Is a license required? =

Generation and quota are enforced by the BeepBeep backend. You connect a license key under Settings; the API validates entitlement on each generate call.

= What happens to my data on uninstall? =

All plugin options and transients are removed. SEO-plugin data (Yoast / Rank Math / AIOSEO) is never touched. If you enable "Delete data on uninstall", the plugin's own fallback post meta is removed too.

== Changelog ==

= 1.0.0 =
* Initial release.
