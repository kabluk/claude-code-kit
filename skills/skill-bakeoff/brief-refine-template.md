# Round 2 brief: REFINE our existing site, do not redesign it

<!-- Template. Copy into the work folder as BRIEF.md and fill in everything in {braces}.
     Blocks marked "keep" stay unchanged. The {OWNER FEATURES} list names what the owner
     built on purpose: every piece of it stays. -->

<!-- keep -->
The owner rejected round 1: every variant was a different site. He wants
OUR site, as built, made better by your skill. Keep everything that is
there: {OWNER FEATURES: page structure and order, the header with its nav,
any strip or widget the owner added himself, the hero, the main interactive
element with its controls, result panel, charts, tables and FAQ}, all texts
and all numbers. Your job is only the skin and the polish your skill would
apply: typography (families, sizes, weights, line-height, letter-spacing),
colour palette (light theme is what gets judged; do not break dark mode),
spacing and rhythm, borders, radii, shadows, emphasis of the key numbers,
states (hover/focus), small visual details. Stay recognisably the same
product: a user who used it yesterday must recognise it today.

## How

- The built site is in `current/` (static export, read-only). Pages:
  {`current/index.html` (home) and `current/<page>.html` (role)}.
  Source of the components, for class names and structure only (read-only):
  {`<repo>/components/`, `<repo>/app/`} ({the file that holds the CSS
  variables / tokens, e.g. `app/globals.css`: `--brand`, `--ink`, `--muted`,
  `--line`, `--surface`, …, and how they are used, e.g. space-separated RGB
  triplets for Tailwind as `rgb(var(--brand))`}).
  Overriding those variables on `:root` is the cleanest lever; then add
  targeted rules. Tailwind utility class names contain `:` and `/` and must
  be escaped in selectors (`.sm\:text-5xl`).
- Output: `out2/<your-slug>/refine.css` (+ `out2/<your-slug>/fonts/*.woff2`
  if you change fonts; reference them as `url(fonts/x.woff2)`: the file is
  served from your folder). It is injected LAST in `<head>` of our pages.
  CSS only: no markup changes, no JS.
- Fonts: local woff2 only (download as in round 1, check with `file`).
- Check: `node {WORK DIR}/refine-render.mjs out2/<your-slug> {PAGE ARGS}`
  (run from the work folder). It writes every page at 1280 (full page)
  and 390 (first screen + `-390-full.png` whole page) and exits 1 on any
  horizontal overflow or external request. Exit 0 required.
- Baseline (no refine.css) screenshots are in `out/current/` for comparison.
- OPEN the PNGs (both widths, including the -390-full ones) and critique as
  your skill's author would. At least two rounds.
- Touch nothing outside `out2/<your-slug>/`. No git. ~20 minutes.

## Report (max 12 lines)

What you changed and why (by your skill's rules), what you deliberately
kept, render exit code, known weaknesses.
