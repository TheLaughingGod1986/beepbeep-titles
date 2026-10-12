#!/usr/bin/env python3
"""Generate WordPress.org banner + icon assets for OpptiAI Titles."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".wordpress-org"
ASSETS = ROOT / "assets"
# Prefer the OpptiAI marketing mark from oppti.dev; fall back to sibling Alt Text WP.org icon.
BRAND_ICON = Path("/Users/ben/code/web/oppti.dev/public/images/brand/opptiai-avatar.png")
ALT_ICON = Path(
    "/Users/ben/code/web/plugin-builds/wporg-beepbeep-ai-alt-text-generator/assets/icon-256x256.png"
)

# Brand palette aligned with OpptiAI / Alt Text WP.org assets
PURPLE = (107, 90, 205)  # #6B5ACD
PURPLE_DARK = (72, 55, 168)
PURPLE_SOFT = (232, 228, 250)
INK = (36, 36, 48)
MUTED = (90, 90, 110)
WHITE = (255, 255, 255)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def load_icon(size: int) -> Image.Image:
    src = BRAND_ICON if BRAND_ICON.exists() else ALT_ICON
    if not src.exists():
        raise FileNotFoundError(f"No OpptiAI brand icon found at {BRAND_ICON} or {ALT_ICON}")
    img = Image.open(src).convert("RGBA")
    return img.resize((size, size), Image.Resampling.LANCZOS)


def rounded_rect(draw: ImageDraw.ImageDraw, box, radius: int, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def make_banner(width: int, height: int, path: Path) -> None:
    img = Image.new("RGB", (width, height), WHITE)
    draw = ImageDraw.Draw(img)

    # Soft lavender gradient background
    for y in range(height):
        t = y / max(height - 1, 1)
        r = int(248 + (PURPLE_SOFT[0] - 248) * t * 0.55)
        g = int(248 + (PURPLE_SOFT[1] - 248) * t * 0.55)
        b = int(255 + (PURPLE_SOFT[2] - 255) * t * 0.35)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Decorative soft orb (right)
    orb = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    orb_draw = ImageDraw.Draw(orb)
    ox = int(width * 0.78)
    oy = int(height * 0.45)
    oradius = int(height * 0.55)
    orb_draw.ellipse(
        [ox - oradius, oy - oradius, ox + oradius, oy + oradius],
        fill=(*PURPLE, 28),
    )
    img = Image.alpha_composite(img.convert("RGBA"), orb).convert("RGB")
    draw = ImageDraw.Draw(img)

    scale = width / 1544
    pad = int(72 * scale)
    icon_size = int(72 * scale)
    icon = load_icon(icon_size)
    img.paste(icon, (pad, pad), icon)

    title_font = font(int(34 * scale), bold=True)
    tag_font = font(int(18 * scale), bold=False)
    h1_font = font(int(58 * scale), bold=True)
    h2_font = font(int(58 * scale), bold=True)
    sub_font = font(int(24 * scale), bold=False)

    text_x = pad + icon_size + int(18 * scale)
    draw.text((text_x, pad + int(4 * scale)), "OPPTIAI TITLES", fill=INK, font=title_font)
    draw.text(
        (text_x, pad + int(40 * scale)),
        "AI SEO for WordPress",
        fill=PURPLE,
        font=tag_font,
    )

    left = pad
    top = pad + icon_size + int(36 * scale)
    draw.text((left, top), "Better title tags.", fill=PURPLE, font=h1_font)
    draw.text((left, top + int(68 * scale)), "Better meta descriptions.", fill=INK, font=h2_font)
    draw.text(
        (left, top + int(148 * scale)),
        "AI-generated SEO titles & meta descriptions for WordPress.",
        fill=MUTED,
        font=sub_font,
    )

    # Right-side UI mock card
    card_w = int(520 * scale)
    card_h = int(320 * scale)
    card_x = width - pad - card_w
    card_y = int((height - card_h) / 2)
    card = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(card)
    # soft shadow
    for i, alpha in enumerate((18, 12, 6)):
        inset = i * 3
        cdraw.rounded_rectangle(
            [
                card_x - inset,
                card_y + 8 + inset,
                card_x + card_w + inset,
                card_y + card_h + 14 + inset,
            ],
            radius=int(24 * scale),
            fill=(80, 70, 140, alpha),
        )
    cdraw.rounded_rectangle(
        [card_x, card_y, card_x + card_w, card_y + card_h],
        radius=int(22 * scale),
        fill=(255, 255, 255, 245),
    )

    # Mini score ring
    cx, cy = card_x + int(110 * scale), card_y + int(120 * scale)
    r = int(58 * scale)
    cdraw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*PURPLE_SOFT, 255), width=int(10 * scale))
    cdraw.arc(
        [cx - r, cy - r, cx + r, cy + r],
        start=-90,
        end=140,
        fill=(*PURPLE, 255),
        width=int(10 * scale),
    )
    score_font = font(int(36 * scale), bold=True)
    label_font = font(int(14 * scale), bold=False)
    # center score text
    st = "72"
    bbox = cdraw.textbbox((0, 0), st, font=score_font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    cdraw.text((cx - tw / 2, cy - th / 2 - int(6 * scale)), st, fill=INK, font=score_font)
    cdraw.text((cx - int(38 * scale), cy + int(22 * scale)), "SEO health", fill=MUTED, font=label_font)

    # Meta preview lines
    line_x = card_x + int(210 * scale)
    line_y = card_y + int(70 * scale)
    row_font = font(int(16 * scale), bold=True)
    small = font(int(13 * scale), bold=False)
    cdraw.text((line_x, line_y), "SEO title", fill=MUTED, font=small)
    cdraw.rounded_rectangle(
        [line_x, line_y + int(22 * scale), line_x + int(260 * scale), line_y + int(52 * scale)],
        radius=8,
        fill=(*PURPLE_SOFT, 255),
    )
    cdraw.text(
        (line_x + 12, line_y + int(28 * scale)),
        "AI Title Generator for WordPress",
        fill=PURPLE_DARK,
        font=row_font,
    )

    cdraw.text((line_x, line_y + int(78 * scale)), "Meta description", fill=MUTED, font=small)
    cdraw.rounded_rectangle(
        [line_x, line_y + int(100 * scale), line_x + int(260 * scale), line_y + int(160 * scale)],
        radius=8,
        fill=(244, 244, 250, 255),
    )
    cdraw.text(
        (line_x + 12, line_y + int(112 * scale)),
        "Generate search-ready titles",
        fill=INK,
        font=small,
    )
    cdraw.text(
        (line_x + 12, line_y + int(132 * scale)),
        "and meta descriptions in bulk.",
        fill=INK,
        font=small,
    )

    # check chip
    chip_y = card_y + card_h - int(48 * scale)
    cdraw.ellipse(
        [card_x + int(28 * scale), chip_y, card_x + int(48 * scale), chip_y + int(20 * scale)],
        fill=(*PURPLE, 255),
    )
    cdraw.text(
        (card_x + int(56 * scale), chip_y + 1),
        "Works with Yoast SEO & Rank Math",
        fill=PURPLE_DARK,
        font=small,
    )

    img = Image.alpha_composite(img.convert("RGBA"), card).convert("RGB")
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"Wrote {path} ({width}x{height})")


def make_icons() -> None:
    src = load_icon(512)
    for size in (256, 128):
        out = OUT / f"icon-{size}x{size}.png"
        icon = src.resize((size, size), Image.Resampling.LANCZOS)
        # Ensure opaque PNG preferred by WP.org
        bg = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        bg.paste(icon, (0, 0), icon)
        bg.save(out, "PNG", optimize=True)
        print(f"Wrote {out}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)
    for width, height, name in (
        (1544, 500, "banner-1544x500.png"),
        (772, 250, "banner-772x250.png"),
    ):
        make_banner(width, height, OUT / name)
        (ASSETS / name).write_bytes((OUT / name).read_bytes())
        print(f"Synced {ASSETS / name}")
    make_icons()
    for size in (256, 128):
        name = f"icon-{size}x{size}.png"
        (ASSETS / name).write_bytes((OUT / name).read_bytes())
        print(f"Synced {ASSETS / name}")


if __name__ == "__main__":
    main()
