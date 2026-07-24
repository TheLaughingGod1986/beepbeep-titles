<!--
Platform: LinkedIn
Audience: WordPress developers, SEO professionals, agency owners
Suggested post time: Tue–Thu morning
Length: ~1,050 characters
Ties to blog post: 2026-07-23-yoast-rank-math-alt-text-missing-but-its-there.md
Product mention: soft, single line at end
Angle: the "you're both right, different copies" insight — pure education, article link
NOTE: replace [ARTICLE URL] once the post is published to oppti.dev via blog-sync.
-->

Rank Math says your alt text is missing. You open the media library — it's right there. Who's wrong?

Neither of you. WordPress stores alt text in two places, and they quietly drift apart.

The media library holds the master copy. But when you insert an image into a post, WordPress copies that alt text into the <img> tag once — at that moment. Improve the alt text later and the image already in your post keeps its old, empty version. Yoast and Rank Math analyse the page HTML, not your library. So they're reporting the page correctly, and you're reading the library correctly. Two different copies.

That one mechanism explains most "missing but it's there" warnings. The rest are usually decorative images with a correct empty alt, a page builder that doesn't output the attribute, or a stale cache.

The fix order that actually works: get the media library right first (it's what featured images, galleries and WooCommerce products render from), then re-insert or edit the few posts with baked-in empty alt, then clear the cache.

Full diagnosis and fixes: [ARTICLE URL]

If your SEO plugin keeps flagging alt text you know you added — which cause is it for you?

(I build OpptiAI Alt Text, formerly BeepBeep AI — disclosing the conflict of interest.)

#WordPress #SEO #WooCommerce #WebAccessibility
