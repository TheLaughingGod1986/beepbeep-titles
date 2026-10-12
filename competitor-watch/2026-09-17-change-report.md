# BeepBeep competitor watch — 17 September 2026

Week 7. Quietest week yet on the tracked three — no releases from AltText.ai, Alt Magic or us. Two things actually moved, and one of them is a new name.

## 1. Week-over-week changes

**AltText.ai — no change.** Still 1.10.38 (2 Sep), 20,000+ installs, 4.7 from 36 reviews, newest review still Dec 2025. Re-fetched the full pricing table: byte-identical, no free-tier or plan movement. Forum silent ~6 months.

**AI Alt Text Generator — first new review in 11 months.** Steffen Voss (@kaffeeringe), 11 Sep, 5 stars. Count 5 → 6, rating holds 4.8. The content matters more than the count: he praises the managed service for removing the need to buy tokens, and puts a public number on the paid tier — roughly €25 for 3,000 images a year, which he calls fair. That's ~0.8 cents/image against AltText.ai's 2–5 cents. Reads as 2.7.0 converting a real user. No release, no new forum threads.

**Alt Magic — no change.** 1.8.3, 2,000+, 5.0 from 19 reviews. Last week's positioning rewrite is unchanged, so treat it as their settled position rather than an edit in flight.

**OpptiAI Alt Text (us) — no release**; first quiet week after 4.6.132–135. Still fewer than 10 installs, zero reviews at seven weeks. Tested-up-to still 7.0.4.

## 2. Opportunities

Thinnest week of the watch — nothing new worth chasing. No frustrated-user, crash or "looking for an alternative" threads anywhere in the tracked set or the alt-text tag.

The wpprup "exclude words" thread has gone cold — 20 days, no movement. 2.7.0 shipped the fix they asked for and the vendor has since banked a fresh 5-star. Recommend dropping it from the watch; it was our best lead and the window has closed.
https://wordpress.org/support/topic/existing-alt-text-exclude-words/

The neo Rename bulk-action thread is dead too — third week with no vendor reply, but the reporter is happily using neo Alt.
https://wordpress.org/support/topic/write-image-alt-text-with-ai-bulk-action-not-working/

## 3. Threats

**New entrant: AltGenix AI Image SEO** (`altgenix-ai-image-seo`, by Abdul Kabeer). 30+ installs, 5.0 from 1 review, v1.2.1 shipped ~14 Sep, tested to 7.1. Bring-your-own key across four providers — Gemini, OpenAI, Claude and DeepSeek — plus AI renaming, titles and captions, and a filename-only mode that makes no AI calls at all. No vendor account, so effectively free to run. The changelog is unusually serious for something this small (per-image locks, provider-aware payload limits, downscaling before upload, non-destructive renames). And it matches neoWP's cadence: a user asked for DeepSeek on the forum on 11 Sep, the author committed within 14 hours, having already shipped an earlier request from the same user. Second vendor in the tag now doing same-week request-to-ship. Still tiny, but growing faster than we are.
https://wordpress.org/support/topic/ai-provider-for-deepseek/

**Pricing pressure.** The AI Alt Text Generator review makes ~€25/3,000-images-a-year public and credible. Cheap managed credits are becoming the visible norm, which squeezes the space between AltText.ai's premium and the free BYO-key tier we don't play in.

**Tested-up-to, fifth week flagged.** Alt Magic, AI Alt Text Generator, neo Alt and now AltGenix are all at 7.1. We're at 7.0.4, level only with AltText.ai — and their 20,000-site incumbency absorbs that penalty in a way ours doesn't.

## 4. Recommended action

**Bump tested-up-to to 7.1 and ship it this week.** It's a one-line readme change, it's been flagged five weeks running, a competitor's own user told that vendor unprompted that lagging WP compatibility hurts adoption, and we're now the only plugin in the tracked set still behind without the install base to absorb it.

Then put the week's remaining effort into getting the first review, not the next feature. Zero reviews at seven weeks is now a bigger structural problem than any capability gap — AltGenix has 30+ installs and a review; we have neither. Review-and-approve is still genuinely unmatched in the tracked set, but nobody can see it working until someone says so on the listing.

---
*Sources: WP.org plugin and support pages for alttext-ai, ai-alt-text-generator, alt-magic-ai-powered-alt-texts, altgenix-ai-image-seo, beepbeep-ai-alt-text-generator; alttext.ai/pricing; the alt-text topic tag. Reddit and Stack Exchange not fetched (blocked in this environment). WP.org pages are edge-cached, so absolute dates were taken from changelog, forum and review timestamps rather than the "1 week ago" labels.*
