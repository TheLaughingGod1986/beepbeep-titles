<!--
Platform: X / Twitter
Audience: #WordPress #SEO #a11y communities
Ties to blog post: 2026-07-23-yoast-rank-math-alt-text-missing-but-its-there.md
Format: 1 standalone tweet + 1 four-tweet thread
Product mention: soft, article link at end of thread
NOTE: replace [ARTICLE URL] once the post is published to oppti.dev via blog-sync.
-->

## Standalone tweet (≤280)
"Rank Math says alt text missing." You check — it's right there in the media library. You're both right. WordPress copies alt into the <img> tag once, at insert time. Fix the library later and the post keeps the old empty alt. The plugin reads the page, not the library.

## Thread (4 tweets)

1/4 If Yoast or Rank Math keeps flagging alt text you *know* you added, it's not broken. WordPress stores alt text in two places and they drift apart. Here's the mechanism 🧵

2/4 The media library has the master copy. But inserting an image copies that alt into the <img> tag once — right then. Edit the library afterwards and the already-inserted image keeps its old, empty alt. Your SEO plugin reads the page HTML, so it's reporting the page correctly.

3/4 Fix order that works: get the media library right first (featured images, galleries and WooCommerce products render straight from it), then re-insert or edit the few posts with baked-in empty alt, then clear your cache.

4/4 Full breakdown — the 5 causes and the fix for each: [ARTICLE URL] (I build OpptiAI Alt Text, formerly BeepBeep AI — the media-library fix is where it helps.) #WordPress #a11y #SEO
