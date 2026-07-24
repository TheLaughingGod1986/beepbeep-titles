# BeepBeep — Fix Plan & Weekly Cadence

*Created 23 July 2026. Companion to competitive-brief-2026-07-23.md.*

## The one-line strategy
Own the position **"review before it goes live"** (human-approved AI alt text), win non-technical WordPress + accessibility buyers with a genuinely free tier, and compound with owned oppti.dev content. Don't fight AltText.ai on breadth or Alt Magic on raw speed — you'll lose both.

## Fix plan — close the gaps

### Priority 1 — Social proof (the #1 blocker)
0 reviews / <10 installs is what kills conversions before features ever matter.
- Ask every real trial user for an honest WordPress.org review. Target 5–10 in the next 4–6 weeks.
- Add a gentle in-plugin review prompt *after* a successful bulk generation (you already have review-banner UI — reuse it).
- Seed a few installs through the community work you're already doing (helpful forum presence → profile → plugin).

### Priority 2 — Remove the "unknown" objections (this week)
- Publish a plain **pricing table** on the plugin page and oppti.dev. Buyers skip tools with hidden pricing.
- Confirm and state **AVIF/SVG (and HEIC)** support. If supported, add to the plugin page; a user asked for AVIF this month. If not, put it on the public roadmap.
- Rewrite the plugin **headline + first screenshot caption** around the review gate and no-signup trial, not generic "AI alt text."

### Priority 3 — Decide the AI-key story (2–4 weeks)
You're managed-OpenAI-only; the closest free competitor sells "bring your own key, no lock-in." Pick a lane:
- **Option A:** add an optional BYO-key / Anthropic path for developers, or
- **Option B:** commit hard to "no key, no setup, no surprise bills" and message managed-simplicity as the feature.
Don't sit in the middle — that's where you look worse than both.

### Priority 4 — Agency features (roadmap)
- WP-CLI support (requested on a competitor's forum; the dev-favourite plugin ships it).
- Multi-site / bulk-across-sites story for agencies.
- Quantify speed if it's competitive; stay quiet on it if it isn't.

## Content plan — the compounding play
Owned oppti.dev posts are your only dofollow, rankable asset. Cadence: **1 post/week**, alternating WordPress-general and WooCommerce-specific, via the `beepbeep-blog-writer` skill.
- ✅ Done: "How to bulk add alt text to WordPress images" and "BeepBeep vs AltText.ai: a free alternative."
- Next up (high-demand, seen recurring in forums):
  1. "Rank Math / Yoast says alt text is missing but it's there — why, and how to fix it."
  2. "WooCommerce product images missing alt text: the SEO fix."
  3. "Why review-before-publish matters for accessible alt text" (owns your angle).
- Each post → drop the *article* link (not the plugin) into relevant SE/Reddit answers where a resource is welcome.

## Social plan
Via `beepbeep-social-writer`, using the review-gate angle already drafted:
- LinkedIn 2–3/week (Benjamin's voice, closing question).
- X daily-ish (tips + periodic thread).
- Reddit only where genuinely helpful.
Start by posting the two drafts already in `/social/`.

## Weekly cadence (every Thursday)
| # | Task | How | Owner |
|---|---|---|---|
| 1 | **Outreach brief** | existing `beepbeep-weekly-outreach` scheduled task → Gmail draft | automated |
| 2 | **Competitor watch** | new `beepbeep-weekly-competitor-watch` scheduled task → Gmail draft (diffs installs/pricing/reviews/features vs last week) | automated |
| 3 | **1 blog post** | run `beepbeep-blog-writer`, then `beepbeep-blog-sync` to publish | you (15 min to review) |
| 4 | **2–3 social posts** | run `beepbeep-social-writer`, post from `/social/` | you |
| 5 | **Review chase** | ask 1–2 recent users for a WordPress.org review | you |

Two of the five are now fully automated to your inbox. The other three are ~30–45 min of review/post work a week.

## Monthly check (first Thursday)
- Read the month's competitor-watch diffs together: any pricing/feature shift that changes the brief?
- Refresh `competitive-brief-*.md` if a competitor made a real move.
- Check review count + install trend against the Priority-1 goal.

## How to know it's working (leading indicators)
- Reviews: 0 → 5 → 10.
- Installs: <10 → trending up week over week.
- oppti.dev: comparison + how-to posts starting to rank for long-tail terms ("AltText.ai alternative", "bulk alt text WordPress").
- Referral traffic from forum/social answers (watch analytics for oppti.dev referrers).
