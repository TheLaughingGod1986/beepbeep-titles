# Alt text generation limits

_Started 2026-05-11 10:01 UTC_

---

## User

This is a design ChatGPT came up with for our nAi alt text plugin. We need to look great and have high user engagement, so the user comes back and checks and uses the plugin often. we also have though about restricting users to 5 generations a dat / 50 a month this will need to be taken into account in the design The goal is to:

* increase return usage
* improve retention
* create habit loops
* improve upgrade conversion
* reduce free-plan abuse
* shift user psychology toward ongoing optimisation

⸻

Product Strategy

Current User Behaviour

Current pattern:

1. Install plugin
2. Generate entire media library
3. Exhaust 50 free credits immediately
4. Never return

This creates:

* low retention
* weak product habit
* poor upgrade pressure
* “utility plugin” positioning

⸻

New Behaviour Goal

Desired pattern:

1. Install plugin
2. Scan library
3. Optimise gradually
4. Return regularly
5. Monitor new uploads
6. Enable automation
7. Upgrade for hands-off workflow

⸻

New Free Plan Structure

Free Plan

Limits

* 5 generations per day
* 50 generations per month

Features

* Manual optimisation only
* Limited bulk generation
* Dashboard monitoring
* Missing ALT detection
* Daily usage reset
* Monthly quota reset

Locked Features

* Auto optimise uploads
* Scheduled scans
* Priority processing
* High-volume bulk generation
* Email reports

⸻

Pro Plan Structure

Pro Plan

Features

* Higher monthly quota
* Unlimited daily usage
* Auto optimise uploads
* Scheduled background scans
* Bulk optimisation
* Priority queue
* Email reports
* Agency workflow support

⸻

Core Product Changes

⸻

1. Daily Usage System

New Behaviour

Instead of:

* consuming all credits instantly

Users:

* optimise gradually
* revisit dashboard daily
* build familiarity with product
* repeatedly encounter upgrade prompts

⸻

Backend Requirements

Add Daily Usage Tracking

Need:

* daily_usage_count
* daily_reset_at
* monthly_usage_count
* monthly_reset_at

Preferably derived dynamically from usage_logs.

## Assistant

_[tool: questions_v2]_

I'll design a new dashboard that nudges users toward gradual optimization, daily return visits, and Pro conversion — instead of the "spend everything, leave" pattern. Before I build, a few key questions so I head in the right direction.

## User

Questions answered:
- scope: Full clickable flow incl. onboarding, generation modal, paywall
- variations: Decide for me
- visual_tone: Decide for me
- habit_mechanics: Decide for me
- upgrade_pressure: Decide for me
- credits_framing: Decide for me
- empty_full_state: Decide for me
- automation_position: Decide for me
- brand_assets: Decide for me
- tweaks: Decide for me
- must_have: We currently have a product behaviour problem, not just a UI problem.

The plugin works technically:
- users install it
- users sign up
- users generate ALT text
- some users fully exhaust their free credits

But the product currently behaves psychologically like a:
“one-time cleanup utility”

Instead of:
“ongoing automated SEO workflow”

Current user behaviour:
1. User installs plugin
2. User scans media library
3. User bulk-generates ALT text
4. User uses all free credits immediately
5. User never returns

This means the current UX unintentionally encourages binge usage instead of recurring engagement.

The dashboard currently communicates:
- “fix everything now”
rather than:
- “continuously optimise your site over time”

The result:
- low retention
- weak habit formation
- weak upgrade pressure
- poor recurring engagement

The main strategic problem is:
There is no ongoing reason for users to revisit the plugin after their initial optimisation session.

We now want to reposition the experience around:
- continuous optimisation
- automation
- monitoring
- recurring SEO maintenance
- “set and forget” behaviour

The UX should start feeling more like:
- antivirus software
- SEO monitoring
- automated maintenance
- ongoing optimisation health

And less like:
- a migration tool
- a one-time batch utility

Key behavioural goals:
- encourage daily/weekly return visits
- create ongoing awareness of missing ALT text
- reinforce “your site needs continuous optimisation”
- push users toward automation features
- make the plugin feel alive and active

Important product changes:
- free users limited to 5 generations/day and 50/month
- stronger focus on “new uploads detected”
- daily usage visibility
- monthly optimisation progress
- automation messaging
- future scheduled scans and notifications

The dashboard should communicate:
- current optimisation status
- ongoing monitoring
- remaining opportunities
- future uploads needing optimisation
- automation benefits

The desired emotional outcome:
Users should feel:
“This plugin continuously protects and improves my site.”

NOT:
“I already finished using this.”

Design direction:
- premium SaaS feel
- calm confidence
- automation-first
- clean hierarchy
- proactive system status
- lightweight operational dashboard
- no clutter or “toolbox” feeling

The long-term product positioning is evolving toward:
“Automated image SEO for WordPress”
rather than:
“AI ALT text generator”

## Assistant

_[tool: update_todos]_

_[tool: copy_starter_component]_

_[tool: write_file]_

_[tool: write_file]_

I've got it. Building a premium "automated SEO monitoring" feel — calm confidence, antivirus-style system status, with habit hooks (daily queue, streak, new-upload alerts) and contextual upgrade pressure. Single hi-fi clickable prototype with Tweaks for plan/state/screen.

Design system declaration: **type** = Geist + Geist Mono (modern but not Inter); **palette** = warm off-white surfaces, deep neutral text, confident indigo primary, muted health greens/ambers; **motif** = pulse dots, monospace numerics, calm cards with subtle borders rather than heavy shadows.

_[tool: write_file]_

_[tool: str_replace_edit]_

_[tool: write_file]_

_[tool: snip]_

_[tool: snip]_

_[tool: update_todos]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: grep]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Built — a continuous "automated image SEO monitoring" experience for nAi, repositioned away from one-time cleanup utility.

**Habit + retention mechanics baked in:**
- **Today's queue** — pre-selected 5 images frames the daily allowance as bite-sized work, not a cap
- **Streak counter** with a 7-day calendar — skips show as red, builds loss aversion
- **"New uploads since last visit"** badge — gives a reason to come back
- **Health score ring** that ticks up over time, not a "100% done" checkmark
- **Monitoring panel** with live pulse dots — feels alive even when idle
- **Activity timeline** + 30-day heatmap — shows ongoing work, not a finished project

**Contextual upgrade pressure:**
- Daily-limit, monthly-limit, auto-feature, bulk, and schedule paywalls each with tailored copy
- Free auto-toggle hits paywall; pro shows live "Active" pulse
- Usage card surfaces warning state past 50% monthly

**Full clickable flow:**
- 3-step onboarding with animated library scan
- Generation drawer with live AI streaming + per-image edit/regenerate
- Plan-comparison paywall with trigger-aware copy

**Tweak to explore states:** Free/Pro, fresh/mid/nearly-done library, streak length, replay onboarding/paywall/drawer, jump between Dashboard / ALT Library / Activity / Automation / Settings.

## User

Verifier agent check completed

## Assistant

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

Fixed — buttons now use `white-space: nowrap` so primary CTAs no longer wrap at 1280px.

## User



## Assistant

_[tool: snip]_

_[tool: update_todos]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: update_todos]_

_[tool: done]_

Applied the feedback: Today's Queue is now the visual hero up top with bigger thumbs, "today's pass" framing, a 90-second commitment line, and streak badge. Health card now leads with momentum (today / this week / 30-day gain) instead of the discouraging backlog total. Daily-cap copy is softer throughout — "back tomorrow for more," "refills in 8h," "no rush." Activity feed kept to concrete, traceable events only. Dashboard density reduced by removing the standalone Monitoring card and pairing Usage with Streak.

## User



## Assistant

_[tool: snip]_

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

Toned down: StreakCard is now a compact "consistency" strip (no flame, no big numerical hero, no green/red blocks — just small day cells). Activity feed swapped to specific, traceable events (Astra theme update, WooCommerce products, blog post title). Today's pass copy reframed as "hand-picked" rather than "to keep your streak."

## User



## Assistant

_[tool: read_file]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: grep]_

_[tool: snip]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: done]_

Aggressive cut applied: Health is now a single ring + trend line + sparkline (3 metrics removed). The mid-row Uploads card is gone. Activity feed shows 3 items with a "Show 3 more" expand. Streak/Usage cards replaced by a quiet borderless bottom strip — three label/value pairs on a hairline, no flame, no box.

## User



## Assistant

_[tool: snip]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

Refinements applied: softened "Needs attention" → "Improving steadily," shrank the health donut substantially (64px ring, smaller score), tightened vertical rhythm (~15% less padding throughout the column), and toned down the Pro card (plain surface instead of blue gradient).

## User

i feel this section could be cleaner

## Assistant

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

Cleaner Today's Pass applied: removed the awkward streak pill from the header (it's in the bottom strip), demoted the quota counter to small muted text, square thumb tiles via aspect-ratio, and removed the redundant "~90 seconds" footer line.

## User

takes up to much room, need a better solution

## Assistant

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

Switched the queue tiles to compact horizontal rows — small 44px thumb with the filename and page beside it, so the section stays the same height whether there's 2 or 5 items.

## User

Still a few improvements left

1. The “Today’s pass” card still has slightly too much empty vertical space

Only a little.

Specifically:
the bottom CTA row feels detached.

You could:

* reduce bottom padding ~16px
* move CTA area closer to image items

Small refinement.

⸻

2. The health card graph is too isolated

Right now the graph feels decorative rather than informative.

It’s floating too far right.

Options:

* shrink it
* move closer to text
* or replace with a tiny 7-day sparkline with labels

At the moment it slightly breaks the balance.

⸻

3. The Pro card is close, but not fully integrated yet

It’s much better now.

But it still feels:
“marketing panel”
rather than:
“upgrade state.”

You are VERY close though.

Long-term:
the ideal state is:
the Pro card feels like unlocking continuity,
not buying software.

Subtle difference.

⸻

4. The bottom metrics row is now excellent

Do not overdesign this.

It’s working because it’s understated.

That restraint is helping the dashboard feel premium.

A lot of founders ruin this stage by adding:

* charts
* gradients
* animated counters
* gamification overload

## Assistant

_[tool: grep]_

_[tool: snip]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: done]_

Today's Pass CTA row tightened, sparkline shrunk to a 56×16 inline element next to the trend text, and Pro card reframed around "Stop visiting. Stay covered." with a softer "Continue with Pro" CTA.

## User

this has become worse

## Assistant

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: done]_

Removed the inline sparkline.

## User

Still a few refinements left

1. “Continue with Pro” may not be the best CTA

Because they are not currently “in Pro.”

You might test:

* “Automate with Pro”
* “Turn on autopilot”
* “Keep your site covered”
* “Enable full automation”

“Continue with Pro” sounds subscription-management oriented.

Slightly less emotionally compelling.

⸻

2. The activity feed can become even more intelligent

You are VERY close to a killer feature here.

Long-term:
you should surface:

* detected regressions
* recently fixed pages
* image SEO improvements
* page-specific gains
* uploads awaiting review

This can become:
“AI site maintenance timeline.”

That’s powerful.

⸻

3. The health score may eventually need deeper meaning

Right now:
60 is fine visually.

But eventually users will ask:
“What does 60 actually mean?”

Later you’ll probably need:

* trend explanations
* benchmark bands
* score breakdown

Not urgent yet.

Just future roadmap.

Strategically, this now makes sense

Honestly:
this is the first version where the business model and UX fully align.

Previously:
the UX was trying to maximise generation usage.

But your business actually needs:

* retention
* repeat visits
* habit
* eventual automation upgrade

Now the UI supports exactly that.

That’s a major milestone.

The most important insight

You are no longer building:
“an AI tool.”

You are building:
“an SEO maintenance operating layer.”

That is a much bigger and more durable category.

And importantly:
normal WordPress users understand this category immediately.

They already understand:

* security plugins
* backups
* uptime monitoring
* SEO monitoring

Now you’re positioning:
image SEO maintenance

into the same mental model.

That is strategically very smart.

## Assistant

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

CTA updated to "Turn on autopilot · $9/mo."

## User



## Assistant

_[tool: str_replace_edit]_

## User



## Assistant

## User

continue

## Assistant

_[tool: grep]_

The file is in the prior known-good state — Today's Pass card has its CTA footer, HealthCard is compact without a sparkline, "Turn on autopilot" CTA is in place. Nothing further to change unless you'd like more refinements.

## User

can we move the cta into the cta bellow to the right

## Assistant

_[tool: read_file]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

Moved — Today's Pass card no longer has the gray footer strip; "Start today's pass" now sits on the right side of the Image SEO Health card.

