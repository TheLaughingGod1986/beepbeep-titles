# Yoast or Rank Math Says Alt Text Is Missing But It's There

> **Meta:** Yoast or Rank Math says alt text is missing but it's there? Why your SEO plugin flags images that have it — and how to fix it properly.

> **Quick summary**
> - Why Yoast and Rank Math report missing alt text on images that clearly have it in your media library.
> - A quick way to tell which of the five common causes you're actually hitting, and the fix for each.
> - Most useful for: WordPress site owners and SEO folks who keep seeing the "images should have alt attributes" warning and can't work out why.

You added alt text to the image. You can see it in the media library. And yet Yoast or Rank Math still flags **alt text is missing but it's there** — the same warning, every time you open the post. Before you decide the plugin is broken, it's worth knowing that in almost every case it's reporting the truth: the alt text you set and the alt text on the page are two different things, stored in two different places.

This post explains why that happens, how to check which version of the problem you have, and how to fix it so the warning goes away and stays away.

## Why Yoast or Rank Math says alt text is missing when it's there

Here's the part almost nobody explains. WordPress stores alt text in two separate places:

1. **The media library** — a field on the image attachment itself (`_wp_attachment_image_alt` under the hood). This is the "master" copy.
2. **The post content** — the actual `<img alt="...">` tag that gets written into a specific post or page when you insert the image.

When you insert an image into a post, WordPress *copies* the media-library alt text into that `<img>` tag at that moment. After that, the two are disconnected. If you go back and improve the alt text in the media library later, the image already sitting in your post keeps the old, often empty, alt attribute.

Yoast and Rank Math analyse the **post content** — the HTML of the page — not your media library. So when they say alt text is missing, they're reading the `<img>` tag on the page and finding `alt=""`. They're right about the page. You're right about the media library. You're both looking at different copies.

That single mechanism explains most cases. The rest are variations on it.

### 1. You fixed the media library after inserting the image

This is the most common one. The image was inserted into the post before it had alt text, so the content has `alt=""`. You added alt text in the media library afterwards. The post never got the update, because insertion is a one-time copy.

### 2. The image is decorative and correctly has empty alt

WCAG says purely decorative images — dividers, background flourishes, a stock photo that adds nothing informational — should have an **empty** alt attribute (`alt=""`) so screen readers skip them. That's correct accessibility practice, but a naive SEO check can flag it as "missing." If Rank Math or Yoast is warning you about a decorative image, the warning is arguably wrong and the empty alt is right.

### 3. A page builder, slider or gallery is rendering the image

Elementor, Divi, and many slider and gallery plugins render images through their own templates. Some pull alt text from the media library, some pull from a different field (title, caption, or a custom field), and some output no alt attribute at all. If the builder isn't wired to output the media-library alt, the rendered page has no alt — regardless of what you typed into the library.

### 4. It's a CSS background image

If an image is set as a CSS `background-image` — common for hero sections and section backgrounds in themes and builders — there is no `<img>` tag and no alt attribute at all. Background images are treated as decorative by definition. An SEO audit that counts these as "missing alt" is misreading the markup; the fix is to use a real `<img>` for anything that carries meaning.

### 5. The analysis is stale or cached

Yoast and Rank Math cache their content analysis. A page cache or CDN can also serve an older version of the page to the crawler. If you genuinely fixed the alt text but the warning persists, you may be looking at a stale result. Re-saving the post and clearing your cache rules this out in about thirty seconds.

## How to check which one you actually have

Don't guess — look at the rendered HTML. It takes a minute and tells you exactly which cause you're dealing with.

1. Open the published page (not the editor) in your browser.
2. Right-click the image in question and choose **Inspect**, or view the page source.
3. Find the `<img>` tag and read its `alt` attribute.
4. Compare what you see to the media library:
   - `alt=""` or no `alt` at all, but the media library has text → you're hitting cause **1** (fix the source, re-insert the image).
   - `alt=""` on a genuinely decorative image → cause **2** (correct — tell your SEO plugin to ignore it if it lets you).
   - No `<img>` tag at all, it's a `background-image` in the CSS → cause **4**.
   - The alt is there in the HTML but the warning persists → cause **5** (stale cache).
   - The image is output by a builder or slider widget with no alt → cause **3**.

Once you know which one it is, the fix is straightforward.

## How to fix missing alt text that isn't really missing

### Fix the source of truth first

Every fix starts with the media library being correct. If the attachment itself has no alt text — or has generic filler like "image1" or "DSC_0042" — nothing downstream can be right. Getting the master copy accurate and descriptive fixes featured images, galleries, and WooCommerce product images immediately, because those render straight from the attachment at page-load time. It also means every *future* insertion of that image carries good alt text automatically.

This is the tedious part at scale — a few hundred images is hours of manual typing — and it's where an alt text plugin earns its place. **OpptiAI Alt Text** (formerly BeepBeep AI) scans your media library, flags every image with missing, empty, or generic alt text, generates a description for each, and lets you review and approve before it saves anything back. Nothing is written until you've looked at it, which matters when the alternative is trusting a machine with copy that's about to be public. *Disclosing that I built it.* If you want the full process for clearing a backlog, I wrote it up in [how to bulk add alt text to WordPress images](2026-07-23-how-to-bulk-add-alt-text-to-wordpress-images.md).

One honest limitation, because it's the whole point of this post: fixing the media library corrects the master copy and everything that renders from it live — but it does **not** rewrite an `alt=""` that's already hard-coded into an old post's content. For those, keep reading.

### Fix images already embedded in post content

For an image already sitting in a post with an empty alt, the media-library fix won't touch that specific tag. You have three options:

1. **Re-insert the image.** Delete the image block and add it again from the media library. WordPress copies the now-correct alt text into the fresh `<img>` tag. Best for a handful of posts.
2. **Edit the alt in the block directly.** In the Gutenberg image block, the alt text field is in the block sidebar. Type it there — this edits the content copy, which is what Yoast and Rank Math read.
3. **Search-and-replace at the database level.** For large sites with the same images repeated across many posts, a search-replace tool (like the WP-CLI `search-replace` command or a reputable plugin) can update the content copies in bulk. Back up first, and be precise with your match — this touches post content directly.

### Handle decorative images correctly

If the image is genuinely decorative, an empty `alt=""` is the *right* answer, not a bug. Leave it empty so screen readers skip it. If your SEO plugin lets you mark an image as decorative or exclude it from the check, do that. Don't add keyword-stuffed alt text to a divider just to silence a warning — that actively hurts the screen-reader experience the attribute exists to serve.

### Clear the cache and re-run the analysis

Once the HTML is correct, re-save the post, clear your page cache and CDN, and refresh the Yoast or Rank Math analysis. If the warning was stale, it clears here. If it doesn't, go back to the Inspect step — the page HTML is still telling you something.

## Frequently Asked Questions

### Why does Rank Math say alt text is missing when I added it?

Because Rank Math reads the alt attribute in your post's HTML, not the alt field in your media library. WordPress copies the media-library alt into the image tag only at the moment you insert the image. If you added or changed the alt text afterwards, the image already in the post still has its original (often empty) alt. Fix it by editing the alt in the block or re-inserting the image, then clear your cache and re-run the analysis.

### Does empty alt text hurt SEO or accessibility?

For a decorative image, no — an empty `alt=""` is correct, and it's what screen readers expect so they can skip images that carry no information. For an image that conveys meaning, empty alt is a genuine miss: search engines get no context and screen-reader users get nothing. The skill is telling the two apart, which is exactly the judgement a good review step is for.

### Will an alt text plugin fix images already in my posts?

It depends on how the plugin works, so check before you rely on it. Most alt text plugins, including OpptiAI Alt Text, write to the media library attachment — which fixes featured images, galleries, WooCommerce product images, and every future insertion, but does not retroactively rewrite alt attributes hard-coded into existing post content. For those, you re-insert the image, edit the block, or run a content search-replace. Fixing the media library first is still the right starting point, because it's the copy everything else is generated from.

## Get your media library right first

The warning is annoying, but it's usually pointing at something real: your page HTML and your media library have drifted apart. Get the media library accurate and descriptive, fix the handful of posts with baked-in empty alt, and the warning has nothing left to flag.

If the tedious part is the several hundred images with no usable alt text, OpptiAI Alt Text is free to try — 10 generations with no account needed — and every suggestion goes through a review step before it's saved, so you decide what lands on your site. You can [find it on WordPress.org](https://wordpress.org/plugins/beepbeep-ai-alt-text-generator/) and run it against your own library to see the output before committing to anything. For choosing between tools, here's an honest [comparison of AI alt text options for WordPress](2026-07-23-alttext-ai-alternative-wordpress.md).

*Disclosure: I'm Benjamin, the developer of OpptiAI Alt Text. I've kept the fixes tool-agnostic — most of this post applies whether or not you ever install it. Verify current features on the plugin page, since they change over time.*
