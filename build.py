#!/usr/bin/env python3
"""
Generates index.html for english_shakespeare_site from three plain-text
sources, keeping the visual template completely separate from content:

  order.txt   — the ONLY place site order lives. Renumber/reorder plays
                by editing this file, then rerun this script. Nothing
                else needs to change.
  tales.txt   — one block per play: its tales.txt number (used to find
                that play's images), pull-quote, and synopsis paragraphs.
  images.txt  — one-paragraph "Image A" / "Image B" scene summaries,
                used as alt text for images/<N>A.* and <N>B.* (extension
                resolved on disk — all converted to .webp during the
                pre-launch performance pass; img_filename() doesn't
                assume an extension so this stays correct either way).

Per-slab left/right image side and dark/alt background are computed
purely from a play's POSITION in order.txt (odd = image-left + dark,
even = image-right + alt) — never hand-set per play — so reordering
order.txt and rerunning this script is the only step needed to
re-alternate every slab correctly.

Usage: python3 build.py
"""
import re
from pathlib import Path

SITE = Path(__file__).parent
IMG_DIR = SITE / "images"

def img_filename(number: int, side: str) -> str:
    """Resolve the real file extension on disk rather than assuming one,
    so the generator never silently emits a broken <img src> — matters
    because the source images weren't all the same format originally
    (a couple were .jpeg before the WebP conversion), and protects
    against the same thing happening again in the future."""
    matches = sorted(IMG_DIR.glob(f"{number}{side}.*"))
    if not matches:
        raise SystemExit(f"ERROR — no image file for {number}{side} in {IMG_DIR}")
    return matches[0].name

# ── 1. Parse tales.txt ──────────────────────────────────────────────
tales_raw = (SITE / "tales.txt").read_text(encoding="utf-8")
blocks = re.split(r"\n#{10,}\n", tales_raw)

tales = {}  # UPPER(title) -> {number, quote, paragraphs}
for block in blocks:
    m_num = re.search(r"Top small header:\s*Play (\d+) of \d+", block)
    m_title = re.search(r"Main title in CAPS and BOLD:\s*(.+)", block)
    m_quote = re.search(r"Sub-header in small, quotes and italics:\s*(.+)", block)
    m_text = re.search(r"Main text:\s*(.+)", block, re.DOTALL)
    if not (m_num and m_title and m_quote and m_text):
        continue
    number = int(m_num.group(1))
    title = m_title.group(1).strip()
    quote = m_quote.group(1).strip()
    # "Main text: <first para...>" continues until the next blank-line-
    # separated paragraph break; split remaining raw text on blank lines.
    paragraphs = [p.strip().replace("\n", " ") for p in m_text.group(1).strip().split("\n\n")]
    paragraphs = [re.sub(r"\s+", " ", p) for p in paragraphs if p.strip()]
    tales[title.upper()] = {"number": number, "quote": quote, "paragraphs": paragraphs}

# ── 2. Parse order.txt ──────────────────────────────────────────────
order_raw = (SITE / "order.txt").read_text(encoding="utf-8")
order = []
for line in order_raw.splitlines():
    m = re.match(r"\s*\d+\.\s*(.+)", line)
    if m:
        order.append(m.group(1).strip())

# ── 3. Parse images.txt (per-number Image A / Image B summaries) ───
images_raw = (SITE / "images.txt").read_text(encoding="utf-8")
img_blocks = re.split(r"\n(?=Play \d+ — )", images_raw)
img_summaries = {}  # (number, 'A'|'B') -> one-line summary
for block in img_blocks:
    m_head = re.match(r"Play (\d+) — .+ \(Image ([AB])\)", block)
    m_sum = re.search(r"Summary:\s*(.+?)\nPrompt:", block, re.DOTALL)
    if m_head and m_sum:
        num = int(m_head.group(1))
        side = m_head.group(2)
        summary = re.sub(r"\s+", " ", m_sum.group(1).strip())
        img_summaries[(num, side)] = summary

# ── 4. Verify every order.txt title resolves in tales.txt ──────────
missing = [t for t in order if t.upper() not in tales]
if missing:
    raise SystemExit(f"ERROR — titles in order.txt not found in tales.txt: {missing}")

def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def smart_quote(s: str) -> str:
    """Convert the tales.txt straight-quoted pull-quote line into curly quotes."""
    s = esc(s)
    # First and last straight double-quote in the line become curly.
    s = re.sub(r'"', '“', s, count=1)
    s = s[::-1].replace('"', '”', 1)[::-1]
    return s

# ── 5. Build one <section> per play ─────────────────────────────────
SLAB_TEMPLATE = """
        <!-- ═══ PLAY {i} — {title_plain} ═══ -->
        <section class="slab {bg_class} slab-full" id="play-{i}">
            <div class="slab-inner slab-inner-full {side_class}">
                <div class="slab-image slab-image-duo">
                    <div class="scene-frame reveal-a">
                        <img src="images/{file_a}"
                             alt="{alt_a}"
                             width="941" height="1672"
                             loading="lazy">
                    </div>
                    <div class="scene-frame reveal-b">
                        <img src="images/{file_b}"
                             alt="{alt_b}"
                             width="941" height="1672"
                             loading="lazy">
                    </div>
                </div>
                <div class="slab-text">
                    <span class="section-label">Play {i} of {total}</span>
                    <h2 class="play-title">{title_html}</h2>
                    <p class="play-quote">{quote}</p>
{paragraphs}
                    <div class="btn-red-group">
                        <a href="#contact" class="btn-red">Learn English Using {title_html} &mdash; Begin Today</a>
                    </div>
                </div>
            </div>
        </section>
"""

slabs = []
total = len(order)
for i, title in enumerate(order, start=1):
    entry = tales[title.upper()]
    num = entry["number"]
    is_odd = (i % 2 == 1)
    bg_class = "slab-dark" if is_odd else "slab-alt"
    side_class = "slab-image-left" if is_odd else "slab-image-right"

    alt_a = esc(img_summaries.get((num, "A"), f"A scene from {title}"))
    alt_b = esc(img_summaries.get((num, "B"), f"A second scene from {title}"))
    file_a = img_filename(num, "A")
    file_b = img_filename(num, "B")

    paras = entry["paragraphs"]
    para_html_lines = []
    for j, p in enumerate(paras):
        cls = ' class="pull-quote"' if j == len(paras) - 1 else ""
        para_html_lines.append(f"                    <p{cls}>{esc(p)}</p>")
    paragraphs_html = "\n".join(para_html_lines)

    slabs.append(SLAB_TEMPLATE.format(
        i=i, total=total,
        title_plain=title,
        title_html=esc(title),
        bg_class=bg_class,
        side_class=side_class,
        file_a=file_a, file_b=file_b,
        alt_a=alt_a, alt_b=alt_b,
        quote=smart_quote(entry["quote"]),
        paragraphs=paragraphs_html,
    ))

plays_html = "\n".join(slabs)

# ── 6. Build the "jump to a play" nav grids (desktop dropdown + mobile
#      drawer) from the same order.txt sequence — so a reorder updates
#      the jump-menus and the slabs together, from one edit. ─────────
nav_links = [f'<a href="#play-{i}" role="menuitem">{esc(title)}</a>' for i, title in enumerate(order, start=1)]
nav_grid_html = "\n                            ".join(nav_links)

mobile_nav_links = [f'<a href="#play-{i}">{esc(title)}</a>' for i, title in enumerate(order, start=1)]
mobile_nav_grid_html = "\n            ".join(mobile_nav_links)

# ── 7. Splice into the page shell ───────────────────────────────────
shell = (SITE / "shell.html").read_text(encoding="utf-8")
out = shell.replace("<!-- PLAYS_GO_HERE -->", plays_html.strip())
out = out.replace("<!-- PLAYS_NAV_GRID -->", nav_grid_html)
out = out.replace("<!-- PLAYS_MOBILE_NAV_GRID -->", mobile_nav_grid_html)
(SITE / "index.html").write_text(out, encoding="utf-8")
print(f"Wrote index.html — {total} plays, order.txt is the single source of truth for sequence.")
