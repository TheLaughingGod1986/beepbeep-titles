# BeepBeep Titles

AI-powered SEO title and meta description generation for WordPress. React admin UI, PHP REST API, and a remote BeepBeep backend for generation and billing.

**Requirements:** WordPress 6.3+, PHP 8.1+

## Install

1. Copy or symlink this plugin into `wp-content/plugins/beepbeep-titles`.
2. Run `npm install && npm run build` (ships with a pre-built `build/`; rebuild after changing `src/`).
3. Activate **BeepBeep Titles** in wp-admin.
4. Open **BeepBeep Titles** in the admin menu and connect your license key.

Generation, quota, and billing are enforced by the BeepBeep backend. A stored license key alone does not guarantee entitlement — the API validates on each generate call.

## License

Enter your key under **Settings → License**. Keys are encrypted at rest when OpenSSL is available. Disconnecting clears the key and pauses generation.

Override the API host in `wp-config.php`:

```php
define( 'BEEPBEEP_TITLES_API_URL', 'https://your-backend.example.com' );
```

## Local development (wp-env)

```bash
npm install
npx @wordpress/env start
```

Default site: `http://localhost:8890` (port set in `.wp-env.json` if 8888 is taken).

| Item | Value |
|------|-------|
| Admin | `http://localhost:8890/wp-admin` |
| Plugin page | `admin.php?page=beepbeep-titles` |
| Login | `admin` / `password` |

```bash
npx @wordpress/env stop
npx @wordpress/env reset   # clean database
```

## Tests & smoke checks

```bash
# PHP lint + production JS build
npm run smoke

# Jest unit tests
npm run test:unit

# PHP sanitizer + uninstall option list
php tests/php/settings-sanitize.test.php
php tests/php/uninstall-options.test.php

# REST route registration (requires wp-env running)
bash scripts/rest-smoke.sh

# Full manual QA checklist (Playwright + wp-cli)
npx --yes -p playwright node scripts/wp-env-manual-qa.mjs
```

Set `WP_ENV_URL` / `WP_ENV_CLI` if your wp-env port or container name differs.

## Project layout

```
beepbeep-titles.php   Bootstrap, constants, hooks
includes/
  Plugin.php          Auto-generate on publish, activation defaults
  Api/Client.php      Backend HTTP client (license headers, errors)
  PostPresenter.php   Post → API page envelope
  Seo/MetaWriter.php  Yoast / Rank Math / AIOSEO / fallback meta I/O
  Rest/               REST routes and controllers
  Scanner.php         Library stats and page listing
src/                  React admin app (built to build/)
scripts/              smoke.sh, rest-smoke.sh, wp-env-manual-qa.mjs
tests/                Jest + PHP CLI tests
```

## Distribution zip

Exclude dev files with `.distignore` (via `wp dist-archive` or similar). The README is included in release archives.

## Support

https://beepbeep.ai
