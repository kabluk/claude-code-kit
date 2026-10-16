# Brief: {N} pages for {PROJECT}, designed from scratch by ONE design skill

<!-- Template. Copy into the work folder as BRIEF.md and fill in everything in {braces}.
     Leave the blocks marked "keep" unchanged: the comparability of the variants rests on them. -->

<!-- keep -->
You are testing how one specific UI/design skill designs a real product. Follow
THAT skill's own process and taste (read its SKILL.md and the references it
points to; obey its rules, anti-patterns, checklists). Do NOT copy the
product's current look ({CURRENT LOOK IN ONE LINE}) — propose your own
direction that the skill would choose for this product. The owner will compare
several skills by these pages and pick the one he likes best, so make it the
skill's best work, not a safe average.

## Product

{What it is, who uses it, what they decide on it, tone. 4–6 lines.}

All data must come from `{DATA FILE}.json` (real data from the product).
Never invent entities, prices, ratings, reviews, counts, testimonials or logos.
{Rules for missing values: what to show when a field is empty.}

## Page 1 — `{key}.html` ({role})

{What the page must contain, which data keys feed it, whether it scrolls.}

## Page 2 — `{key}.html` ({role})

{Same. Name the product's main element explicitly if the owner did
("THE MAP IS THE MAIN ELEMENT"). For an app-like screen: desktop 1280×800
fills the viewport without page scroll; mobile 390×844 keeps the main element
dominant (e.g. bottom sheet).}

<!-- optional: map block, if a page shows a map. Basemaps from make-map.mjs. -->
Map basemap images (real OpenStreetMap data, rendered with MapLibre from CARTO
styles) in `../../map/`: `{name}-{positron,voyager,dark}-{wide,tall}.png`
(wide = 1600×1000 CSS px, tall = 700×1200, both at 1.5x). Bounds of each image
and `meta.js` (Web Mercator `pos(lat,lng,bounds)` → left%/top%) are in
`../../map/{name}-map.json`. Place markers with it and verify by eye that
coastal points land on the coast. You may tint the image with CSS. Always show
"© OpenStreetMap contributors © CARTO" on the map.

<!-- keep -->
## Hard technical rules

- Output folder: `out/<your-slug>/` inside the work folder. Put the pages and
  any local assets there.
- Static HTML + CSS (+ small inline JS if needed). NO external requests at
  render time: no CDN, no Google Fonts link, no remote images. Fonts: download
  woff2 with `curl -sSL --compressed -o out/<slug>/fonts/x.woff2 <url>` (the
  CSS at `https://fonts.googleapis.com/css2?family=...` fetched with a browser
  User-Agent returns woff2 URLs) and use @font-face locally; check each file
  with `file`. Icons: inline SVG.
- Embed the data you need into the HTML. The page must render from `file://`.
- Check with `node {SKILL DIR}/render.mjs <your folder> {PAGE ARGS}`: it writes
  `<page>-1280.png` and `<page>-390.png` and exits 1 if any text sticks out
  horizontally or any external request is attempted. Exit 0 required.
- OPEN every PNG with the Read tool and critique it as that skill's author
  would: alignment, hierarchy, contrast, placement, nothing clipped or
  overlapping. At least two critique-and-fix rounds.
- Touch nothing outside your output folder. No git operations.
- Time-box: about 25 minutes of work. Save files early and rewrite in place:
  what is on disk is your result if you are interrupted.

## Report (max 15 lines)

Slug, which SKILL.md files you followed, the design direction in one line
(palette, type, layout idea), what the skill's process made you do differently
from a generic design, render.mjs exit code, known weaknesses, and any data
quirks you found.
