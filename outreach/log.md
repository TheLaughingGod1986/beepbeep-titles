# BeepBeep Outreach — Weekly Log

*The weekly task appends a new dated block to the TOP of this list each run. Newest first.*

<!-- Each block looks like:

## 2026-07-27
### Last week's items — status
- [done] <thread> — detected new answer on your SE profile
- [not done] <thread> — no activity found; carried forward

### This week's picks
1. <platform> — <thread title/url> — why it fits — suggested reply (in email draft)
...
-->

## 2026-08-31

### Last week's items — status
Verified via WP.org profile (@beepbeepv2): activity since the 2026-08-24 run = CODE ONLY (releases 1.0.21–1.0.25 + 4.6.129–4.6.133, committed Aug 18 & 21 — same commits already logged last run; nothing newer). No forum replies. SE/SO/Reddit profiles still fetch-blocked (SE 403) → unverified, nothing concrete posted. All five carry forward.
- [not done] Accessibility (core) "FR: Alt text input field whilst uploading" — re-checked live: still 4 replies, last post Aug 18 (not you); carried (pick 1).
- [not done] Events Manager "Alt text will be replaced" — still 0 replies, still open; carried (pick 2).
- [not done] Rank Math "Bulk Upload Alt Text to all images" — still 1 reply; carried (pick 3).
- [not done] 10Web "Alt Text appears RANDOMLY in lightbox" — still 1 reply; carried (pick 4).
- [not done/unverified] SE/SO/Reddit manual scan — fetch still blocked; carried (pick 5).

### Venue access this run
- WP.org FRESH this run: alt-text topic tag current (top item Aug 30). AltText.ai forum fetched fresh — still no new threads since Feb 2026.
- Neutral-forum supply is DRY: no new non-competitor alt-text threads since last week. Only genuinely new threads are competitor-owned (neoWP: neo Rename bulk-action bug Aug 30, neo Duplicate Aug 19) → logged as signals, not picks (no poaching).
- Considered + rejected as a pick: Media Library Organizer "Deleting Alt Text Doesn't Save Properly" — RESOLVED (root cause Slim SEO auto-overwriting stored alt). Good real example for the blog, not a live pick.
- SE/SO/Reddit search + fetch still blocked; WebSearch surfaced no specific new thread. Pick 5 left as manual scan (template B).
- Branding: WP.org listing is "OpptiAI Alt Text" (+ second plugin "OpptiAI Titles"); config.md still says "BeepBeep AI" — reconcile.

### This week's picks
1. WP.org (A, no link) — Accessibility (core) "FR: Alt text input field whilst uploading" — https://wordpress.org/support/topic/fr-alt-text-input-field-whilst-uploading/ — carried; freshest neutral core thread (Aug 12); explain why alt field can't exist until the attachment record is created + bulk path.
2. WP.org (A, no link) — Events Manager "Alt text will be replaced" — https://wordpress.org/support/topic/alt-text-will-be-replaced/ — carried; Jul 13, 0 replies; stored vs dynamic alt (plugin injects event title over stored alt).
3. WP.org (A, no link) — Rank Math "Bulk Upload Alt Text to all images" — https://wordpress.org/support/topic/bulk-upload-alt-text-to-all-images-on-the-website/ — carried; bulk/large-library; Rank Math dynamic template vs stored `_wp_attachment_image_alt`.
4. WP.org (A, no link) — 10Web "Alt Text appears RANDOMLY in lightbox" — https://wordpress.org/support/topic/alt-text-appears-randomly-in-lightbox/ — carried; gallery-alt vs Media-Library-alt fallback chain.
5. SE/SO/Reddit (B, disclosed link OK) — manual scan (fetch blocked); ready template-B reply (code snippet: `_wp_attachment_image_alt` set + WP_Query for missing) in draft to adapt to one large-library bulk thread.

### Competitor signals
- AltText.ai (priority): forum re-fetched, still quiet — no new threads since ~Feb 2026. Top cluster unchanged: Feb stability incident (1.10.25/1.10.26 "crashed site" + "Critical Error", Feb 22–24) + evergreen "requires PAID account" + open "Bulk Generate Alt Text functionality" + unresolved "Support for AVIF and SVG." Switching moment persists; AVIF/SVG still their gap.
- neoWP surging AND stumbling on bulk: only new alt-text threads this week are theirs — neo Rename "'Write Image Alt Text with AI' bulk action not working" (Aug 30, 3 replies, active) + neo Duplicate "Different alt text" (Aug 19). Free bulk-AI tooling winning attention but hitting bulk-reliability bugs → differentiate on bulk reliability, not price. (Off-limits — their own forum.)
- "Free" now table stakes: EzAlt AI (free, bulk+on-upload, Aug 6), AltTextLab, Smart Alt Fixer, Infy SEO, Bilder Alt all active on the tag. Compete on quality/AVIF-SVG/bulk reliability. Roundups to pitch (not listed): ratedwithai.com, aidescribeimage.com, successtechservices.com; keep tracking ShortPixel.

### Suggested blog topic
- Primary: "Stored vs. dynamic alt text in WordPress: why your plugin's alt 'disappears' (and how WordPress actually saves it)" — three of five picks (Events Manager, Rank Math, 10Web) share this root cause; the resolved Media Library Organizer/Slim SEO thread is a perfect real example; doubles as the SE/Reddit resource link. Timely alt: "Free AI alt-text plugins compared (2026): what 'free' actually gets you." Draft via beepbeep-blog-writer.

### Delivery
- Gmail draft created to benoats86@gmail.com, subject "BeepBeep weekly outreach — 2026-08-31".

## 2026-08-24

### Last week's items — status
Verified via WP.org profile (@beepbeepv2): activity since the 2026-08-17 run = CODE ONLY (releases 1.0.21–1.0.25 + 4.6.129–4.6.133, committed Aug 18 & Aug 21). No forum replies. SE/SO/Reddit profiles still fetch-blocked (SE 403 blocklist) → unverified, nothing concrete posted. All five carry forward.
- [not done] Events Manager "Alt text will be replaced" — re-checked live: still 0 replies, still not resolved; carried (pick 2).
- [not done] Rank Math "Bulk Upload Alt Text to all images" — carried (pick 3).
- [not done] 10Web "Alt Text appears RANDOMLY in lightbox" — carried (pick 4).
- [not done] Yoast "not seeing alt text for featured images" — still open; rotated OUT this week for a fresh core-forum thread. Not lost.
- [not done/unverified] SE/SO/Reddit manual scan — carried (pick 5).

### Venue access this run
- WP.org FRESH this run: profile current to Aug 21; alt-text topic tag current (top item Aug 13). AltText.ai forum fetched fresh — still no new threads since Feb 2026.
- NEW neutral pick found: core Accessibility forum "FR: Alt text input field whilst uploading" (Aug 12) — 4 low-value replies, none explained the mechanism. Rotated in as pick 1.
- SE/SO/Reddit search + fetch still blocked (SE profile 403). Pick 5 left as manual scan (template B).
- Branding: WP.org listing now "OpptiAI Alt Text" + second plugin "OpptiAI Titles"; config.md still says "BeepBeep AI" — reconcile.

### This week's picks
1. WP.org (A, no link) — Accessibility (core) "FR: Alt text input field whilst uploading" — https://wordpress.org/support/topic/fr-alt-text-input-field-whilst-uploading/ — NEW, Aug 12, neutral core forum; explain WHY the field is greyed out (attachment record/_wp_attachment_image_alt doesn't exist until upload finishes) + bulk workflow.
2. WP.org (A, no link) — Events Manager "Alt text will be replaced" — https://wordpress.org/support/topic/alt-text-will-be-replaced/ — carried; Jul 13, 0 replies; plugin injects event title over stored alt.
3. WP.org (A, no link) — Rank Math "Bulk Upload Alt Text to all images" — https://wordpress.org/support/topic/bulk-upload-alt-text-to-all-images-on-the-website/ — carried; bulk/large-library; stored vs dynamic alt.
4. WP.org (A, no link) — 10Web "Alt Text appears RANDOMLY in lightbox" — https://wordpress.org/support/topic/alt-text-appears-randomly-in-lightbox/ — carried; gallery-alt vs Media-Library-alt fallback chain.
5. SE/SO/Reddit (B, disclosed link OK) — manual scan (fetch blocked); ready template-B reply in draft to adapt to one large-library bulk thread.

### Competitor signals
- AltText.ai (priority): forum re-fetched, still quiet — no new threads since ~Feb 2026. Top cluster unchanged: Feb stability incident (1.10.25/1.10.26 "crashed site" + "Critical Error", Feb 22–24) + evergreen "requires PAID account" + open "Bulk Generate Alt Text functionality" + unresolved "Support for AVIF and SVG". Switching moment persists; AVIF/SVG still their gap.
- "Free" now table stakes: alt-text tag crowded with vendor announcements — neoWP (neo Alt, neo Rename "Free AI generations", neoMedia PRO) + EzAlt AI (free, bulk+on-upload, Aug 6). Differentiate on quality/AVIF-SVG/bulk reliability, not price.
- Buyer-intent on competitor forums (off-limits): "[neo Alt] How does generation work under the hood?" (Aug 7); "[Auto Alt Text] How to Bulk Generate Alt Text for ALL Images" (7 replies). Roundups to pitch (not listed): ratedwithai.com, aidescribeimage.com, successtechservices.com; keep tracking ShortPixel.

### Suggested blog topic
- Primary: "Stored vs. dynamic alt text in WordPress: why your plugin's alt 'disappears' (and how WordPress actually saves it)" — three of five picks (Events Manager, Rank Math, 10Web) share this root cause; doubles as the SE/Reddit resource link. Timely alt: "Free AI alt-text plugins compared (2026): what 'free' actually gets you". Draft via beepbeep-blog-writer.

### Delivery
- Gmail draft created to benoats86@gmail.com, subject "BeepBeep weekly outreach — 2026-08-24".

## 2026-08-17

### Last week's items — status
Verified via WP.org profile (@beepbeepv2): activity since the 2026-08-11 run = CODE ONLY (latest contribution still Aug 02 release 1.0.18; recent commits are OpptiAI Titles, not the alt-text plugin). No forum replies. SE/SO/Reddit profiles still fetch-blocked (SE returned 403 blocklist) → unverified, nothing concrete posted.
- [not done] Events Manager "Alt text will be replaced" — still 0 replies, still open; carried (pick 1).
- [not done] Auto Alt Text "AVIF images" — moved to competitor SIGNAL (competitor's own forum = poaching); kept as differentiator note, dropped from active picks.
- [not done] Rank Math "Bulk Upload Alt Text to all images" — carried (pick 2).
- [not done] 10Web "Alt Text appears RANDOMLY in lightbox" — carried (pick 3).
- [not done] Yoast "not seeing alt text for featured images" — rotated back in (pick 4).
- [not done/unverified] SE/SO/Reddit manual scan — carried (pick 5).

### Venue access this run
- WP.org FRESH this run: alt-text topic tag shows genuinely recent threads (Aug 13, Aug 7, Aug 6). Cache is current.
- PhotoSwipe "No Alt Text on Lightbox image" (Jun 25) dropped — already RESOLVED by plugin author (PhotoSwipe-5-only + caption-driven), not under-answered.
- All four WP.org picks are neutral (non-competitor) forums this week — cleaner on the no-poaching principle.
- SE/SO/Reddit search + fetch still blocked; WebSearch surfaced no specific new thread. Pick 5 left as manual scan (template B).
- Branding: WP.org listing now "OpptiAI Alt Text" + second plugin "OpptiAI Titles"; config.md still says "BeepBeep AI" — reconcile.

### This week's picks
1. WP.org (A, no link) — Events Manager "Alt text will be replaced" — https://wordpress.org/support/topic/alt-text-will-be-replaced/ — Jul 13, 0 replies, neutral, accessibility asker; plugin hardcodes event title into alt instead of reading stored _wp_attachment_image_alt.
2. WP.org (A, no link) — Rank Math "Bulk Upload Alt Text to all images" — https://wordpress.org/support/topic/bulk-upload-alt-text-to-all-images-on-the-website/ — bulk/large-library; dynamic-output vs stored alt.
3. WP.org (A, no link) — 10Web "Alt Text appears RANDOMLY in lightbox" — https://wordpress.org/support/topic/alt-text-appears-randomly-in-lightbox/ — gallery-alt vs Media-Library-alt fallback chain.
4. WP.org (A, no link) — Yoast "not seeing alt text for featured images" — https://wordpress.org/support/topic/yoast-not-seeing-alt-text-for-featured-images/ — featured-image alt not scanned by Yoast content analysis.
5. SE/SO/Reddit (B, disclosed link OK) — manual scan (fetch blocked); ready template-B reply in draft to adapt to one large-library bulk thread.

### Competitor signals
- AltText.ai (priority): forum quiet, no new threads since ~Feb 2026. Top cluster still Feb stability incident (1.10.25/1.10.26 "crashed site" + "Critical Error", Feb 22–24) + open "Bulk Generate Alt Text" + evergreen "requires PAID account" + unresolved "AVIF and SVG". Switching moment persists; AVIF/SVG still their gap.
- "Free" now table stakes: neoWP (neo Alt/neo Rename "Free AI generations", neoMedia PRO), EzAlt AI (free, bulk+on-upload, Aug 6), AltTextLab, Smart Alt Fixer, Infy SEO, Image Alt Text Manager, Bilder Alt all active Jul–Aug. Differentiate on quality/AVIF-SVG/bulk reliability, not price.
- Buyer-intent on competitor forums (off-limits): "[neo Alt] How does generation work under the hood?" (Aug 7); "[Auto Alt Text] Bulk Generate for ALL Images" (7 replies). Roundups to pitch (not listed): ratedwithai.com, aidescribeimage.com, successtechservices.com; keep tracking ShortPixel.

### Suggested blog topic
- Primary: "Why your WordPress plugin ignores the alt text you wrote (and how WordPress actually stores it)" — three of five picks (Events Manager, 10Web, Yoast) share this root cause. Timely alt: "Free AI alt-text plugins compared (2026): what 'free' actually gets you". Draft via beepbeep-blog-writer.

### Delivery
- Gmail draft created to benoats86@gmail.com, subject "BeepBeep weekly outreach — 2026-08-17".

## 2026-08-11

### Last week's items — status
Verified via WP.org profile (@beepbeepv2): activity since the 2026-08-10 run = CODE ONLY (latest contribution still Aug 02 release 1.0.18; nothing newer). No forum replies. SE/SO/Reddit profiles still fetch-blocked → unverified, nothing concrete posted. (Last run was only 1 day ago, so "nothing done" is expected.)
- [not done] Auto Alt Text "does not generate alt text for AVIF images" — carried forward (pick 2)
- [not done] Rank Math "Bulk Upload Alt Text to all images" — carried forward (pick 3)
- [not done] 10Web "Alt Text appears RANDOMLY in lightbox" — carried forward (pick 4)
- [not done] Yoast "not seeing alt text for featured images" — still open; rotated out of active 5, not lost.
- [not done/unverified] SE/SO/Reddit manual scan — carried forward (pick 5)

### Venue access this run
- WP.org FRESH this run (first time in a while): alt-text topic tag shows Aug 6–7 threads. AltText.ai forum still stale (~mid-May cache, Feb-2026 top cluster).
- SE/SO/Reddit search + fetch still blocked. Pick 5 left as manual scan (templates B/C).
- Branding: WP.org listing now "OpptiAI Alt Text"; config.md still says "BeepBeep AI" — reconcile.

### This week's picks
1. WP.org (A, no link) — Events Manager "Alt text will be replaced" — https://wordpress.org/support/topic/alt-text-will-be-replaced/ — NEW (Jul 13, 0 replies), neutral forum, accessibility-focused asker; plugin hardcodes event title into alt instead of reading stored _wp_attachment_image_alt.
2. WP.org (A, no link) — Auto Alt Text "does not generate alt text for AVIF images" — https://wordpress.org/support/topic/auto-alt-text-does-not-generate-alt-text-for-avif-images/ — carried; AVIF/SVG cleanest differentiator.
3. WP.org (A, no link) — Rank Math "Bulk Upload Alt Text to all images" — https://wordpress.org/support/topic/bulk-upload-alt-text-to-all-images-on-the-website/ — carried; bulk/large-library demand.
4. WP.org (A, no link) — 10Web "Alt Text appears RANDOMLY in lightbox" — https://wordpress.org/support/topic/alt-text-appears-randomly-in-lightbox/ — carried; gallery-alt vs Media-Library-alt fallback chain.
5. SE/SO/Reddit (B/C, disclosed link OK) — manual scan (fetch blocked); ready template-B reply in draft to adapt to one large-library bulk thread.

### Competitor signals
- AltText.ai (priority): stale forum still shows Feb-2026 stability cluster (1.10.25/1.10.26 "crashed site", "Critical Error" Feb 22–24) + evergreen "requires PAID account" + open "Bulk Generate Alt Text" + unresolved AVIF/SVG. Switching moment; AVIF/SVG still their gap.
- Market crowding fast with "free" entrants (Jul–Aug 2026): neoWP (neo Alt/Rename/Media) announcing "Free AI generations", EzAlt AI (free, bulk+on-upload, Aug 6), AltTextLab, Smart Alt Fixer, Infy, Image Alt Text Manager. "Free" is now table stakes → differentiate on quality/AVIF-SVG/bulk reliability, not price.
- Buyer-intent on competitor forum: "[neo Alt] How does generation work under the hood?" (Aug 7) — off-limits for self-promo. Roundups to pitch (not listed): ratedwithai.com, aidescribeimage.com, successtechservices.com; keep tracking ShortPixel.

### Suggested blog topic
- Primary: "Does your alt-text plugin actually support AVIF and SVG? (2026)". Timely alt: "Free AI alt-text plugins compared (2026): what 'free' actually gets you" (meets the surge of free entrants). Draft via beepbeep-blog-writer.

### Delivery
- Gmail draft created to benoats86@gmail.com, subject "BeepBeep weekly outreach — 2026-08-11".

## 2026-08-10

### Last week's items — status
Verified via WP.org profile (@beepbeepv2): activity in window = CODE ONLY (release 1.0.18 Aug 02; 1.0.17 icon/readme commits Jul 28). No forum replies. SE/SO/Reddit profiles still fetch-blocklisted → unverified, nothing concrete posted.
- [not done] Auto Alt Text "does not generate alt text for AVIF images" — carried forward (pick 1)
- [not done] Yoast "not seeing alt text for featured images" — carried forward (pick 2)
- [not done] Rank Math "Bulk Upload Alt Text to all images" — carried forward (pick 3)
- [not done] 10Web Photo Gallery "Alt Text appears RANDOMLY in lightbox" — carried forward (pick 4)
- [not done/unverified] SE/SO/Reddit manual scan — carried forward (pick 5)

### Venue access this run
- WP.org fetchable but cache STILL stale (~mid-May snapshot): relative timestamps read days-ago, absolute dates are Jan–May 2026. AltText.ai forum returned same Feb-2026 top cluster as prior runs.
- SE/SO/Reddit search + fetch still blocked. WebSearch didn't surface specific new threads either. Pick 5 left as manual scan (templates B/C).
- Note: WP.org listing now branded "OpptiAI Alt Text" (slug unchanged). config.md still says "BeepBeep AI" — reconcile.

### This week's picks
1. WP.org (A, no link) — Auto Alt Text "does not generate alt text for AVIF images" — https://wordpress.org/support/topic/auto-alt-text-does-not-generate-alt-text-for-avif-images/ — fresh, under-answered; AVIF/SVG is the cleanest current differentiator.
2. WP.org (A, no link) — Yoast "not seeing alt text for featured images" — https://wordpress.org/support/topic/yoast-not-seeing-alt-text-for-featured-images/ — recurring false-negative; featured-image alt not scanned by Yoast content analysis.
3. WP.org (A, no link) — Rank Math "Bulk Upload Alt Text to all images" — https://wordpress.org/support/topic/bulk-upload-alt-text-to-all-images-on-the-website/ — bulk/large-library demand; clarify dynamic-output vs stored alt.
4. WP.org (A, no link) — 10Web Photo Gallery "Alt Text appears RANDOMLY in lightbox" — https://wordpress.org/support/topic/alt-text-appears-randomly-in-lightbox/ — gallery-alt vs Media-Library-alt fallback chain.
5. SE/SO/Reddit (B/C, disclosed link OK) — manual scan; ready template-B reply in draft to adapt to one large-library bulk thread.

### Competitor signals
- AltText.ai (priority): Feb 2026 stability cluster still top of forum (1.10.25/1.10.26 "crashed site" + "Critical Error", Feb 22–24) + evergreen "requires PAID account" gripe = switching moment.
- AltText.ai positioning shift: 2026 roundups credit it with WP-CLI + multisite added early 2026 → WP-CLI gap closing. AVIF/SVG still unresolved for them → now the cleaner differentiator.
- New independent roundups to pitch (BeepBeep not listed): ratedwithai.com, aidescribeimage.com. Keep tracking successtechservices.com + ShortPixel. Skip competitor-owned roundups (autoalt.ai, altmagic.pro, alttext.ai).

### Suggested blog topic
- "Does your alt-text plugin actually support AVIF and SVG? (2026)" — recurring failure + cleanest differentiator now WP-CLI gap closed. Bulk-add-alt remains evergreen backup. Draft via beepbeep-blog-writer.

### Delivery
- Gmail draft created to benoats86@gmail.com, subject "BeepBeep weekly outreach — 2026-08-10".

## 2026-08-03

### Last week's items — status
Verified via WP.org profile (beepbeepv2) = only code commits, no forum replies. SE/SO/Reddit profiles not fetchable (blocklisted) → unverified, but nothing concrete was posted.
- [not done] Yoast — "Yoast not seeing alt text for featured images" — carried forward (pick 1)
- [not done] Rank Math — "Bulk Upload Alt Text to all images" — carried forward (pick 2)
- [not done] 10Web Photo Gallery — "Alt Text appears RANDOMLY in lightbox" — carried forward (pick 3)
- [not done] AI Alt Text Generator bulk-action bug — moved to competitor signals (it's a competitor forum; replying there = poaching)
- [not done/unverified] SE/SO/Reddit manual scan — carried forward (pick 5)

### Venue access this run
- WP.org fetchable, but caching is inconsistent: alt-text topic tag + AltText.ai forum returned ~mid-May snapshots; AI Alt Text Generator forum returned fresh (~late July).
- SE/SO/Reddit still NOT crawlable (fetch blocklisted). Pick 5 left as manual scan (templates B/C).

### This week's picks
1. WP.org (A, no link) — Yoast "not seeing alt text for featured images" — https://wordpress.org/support/topic/yoast-not-seeing-alt-text-for-featured-images/ — featured-image alt vs Media Library alt; recurring false negative.
2. WP.org (A, no link) — Rank Math "Bulk Upload Alt Text to all images" — https://wordpress.org/support/topic/bulk-upload-alt-text-to-all-images-on-the-website/ — bulk/large-library demand, neutral forum.
3. WP.org (A, no link) — 10Web Photo Gallery "Alt Text appears RANDOMLY in lightbox" — https://wordpress.org/support/topic/alt-text-appears-randomly-in-lightbox/ — gallery-alt vs Media-Library-alt mismatch.
4. WP.org (A, no link) — Auto Alt Text "does not generate alt text for AVIF images" — https://wordpress.org/support/topic/auto-alt-text-does-not-generate-alt-text-for-avif-images/ — fresh, under-answered; AVIF/SVG is a category-wide gap.
5. SE/SO/Reddit manual scan (B/C, disclosed link OK) — couldn't crawl; scan live searches in the plan and answer one under-answered large-library thread.

### Competitor signals
- AltText.ai (priority): Feb stability cluster (1.10.25/1.10.26 "crashed site") + "requires PAID account" gripe = switching moment (dates as of mid-May cache).
- AI Alt Text Generator: fresh unanswered — bulk-action bug (Jul 16, 0 replies), "exclude words" (Jul 11), WP-CLI request (Jun 20). Users want reliable bulk + control.
- Category gap: AVIF/SVG support recurs. New 2026 roundups to pitch: successtechservices.com, rankpilotai.com (+ tracked ShortPixel).

### Suggested blog topic
- "Does your alt-text plugin actually support AVIF and SVG?" — recurring format frustration, clear differentiator angle. Bulk-add-alt remains evergreen backup. Draft via beepbeep-blog-writer.

### Delivery
- Gmail draft created to benoats86@gmail.com, subject "BeepBeep weekly outreach — 2026-08-03".

## 2026-07-23 (first run)

### Last week's items — status
- No prior run. Log was empty; nothing to carry forward.
- Profile check (Step 1) **skipped** — config.md profile URLs (Stack Exchange, WordPress.org, Reddit) are still blank. Fill these in so future runs can auto-verify whether replies got posted.

### Notes on venue access this run
- Stack Exchange / Stack Overflow / Reddit: **not crawlable** this run (search + fetch blocked). Picks below are WP.org (fetchable). SE/SO/Reddit left as manual-scan URLs in the brief.
- The plan's static "vetted WP.org threads" list is **stale** — the 3 I checked are all closed to new replies (2020–2025). Refresh that list from the live `alt-text` topic tag instead: https://wordpress.org/support/topic-tag/alt-text/

### This week's picks (all WP.org → help-only, template A, NO link)
1. Yoast SEO — "Yoast not seeing alt text for featured images" (Jan 2026) — https://wordpress.org/support/topic/yoast-not-seeing-alt-text-for-featured-images/ — recurring false-negative Q on a neutral forum.
2. Rank Math — "Bulk Upload Alt Text to all images on the website" (Oct 2025) — https://wordpress.org/support/topic/bulk-upload-alt-text-to-all-images-on-the-website/ — bulk demand, neutral forum.
3. AI Alt Text Generator — "Unable to apply Bulk Action: Generate Alt Text in wp-admin Media Library" (Jul 16 2026, OPEN, 0 replies) — https://wordpress.org/support/topic/unable-to-apply-bulk-action-generate-alt-text-in-wp-admin-media-library/ — freshest verified open thread; competitor forum → generic help only, no mention of BeepBeep.
4. Photo Gallery by 10Web — "Alt Text appears RANDOMLY in lightbox" (Apr 2026) — https://wordpress.org/support/topic/alt-text-appears-randomly-in-lightbox/ — gallery alt vs Media Library alt mismatch.
5. SE/SO/Reddit manual scan (couldn't crawl): check the 3 live search URLs in the plan; use template B (SE/SO, disclosed) or C (Reddit).

### Competitor signals
- AltText.ai (priority): repeated "site crashed" reports on v1.10.25/1.10.26 (Feb 2026) + older "requires a PAID account" gripe — stability + free-tier friction = warm switching moment.
- AI Alt Text Generator: fresh unanswered bulk-action bug (Jul 16, only first image updates), WP-CLI request (Jun 20), "exclude words" feature request (Jul 11) — users want reliable bulk + control.
- Ecosystem-wide: "bulk generate for ALL images" recurs across Auto Alt Text, Rank Math, Alt Magic; AVIF/SVG support requested repeatedly — possible BeepBeep differentiators.

### Suggested blog topic
- "How to bulk-add alt text to every image in WordPress (2026): WP-CLI, script, or plugin" — bulk is the single most recurring question. Draft via beepbeep-blog-writer skill.

<!-- Each block looks like above. Newest first. -->

