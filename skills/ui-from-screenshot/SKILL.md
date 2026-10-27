---
name: ui-from-screenshot
description: Use when asked to reproduce a UI from a screenshot or design image 1:1 as code (React/Tailwind or plain HTML), or to compare a rendered page against a reference image. Measures the reference in pixels, builds the page with self-hosted fonts and explicit widths, then runs a Playwright + pixelmatch loop until the diff image shows only font rasterization.
---

# UI from screenshot

Born from building two pages (a Chinese-language app screen and a landing
page with a photo) from screenshots without a generator: 5 iterations to
9.5 % and 8.5 % pixel mismatch, the remainder being font rasterization. An
external service (screenshot-to-code) is not needed: it requires LLM keys, and
its output gets refined by this same loop anyway.

The comparison script is [`compare.mjs`](compare.mjs); two measuring scripts
sit next to it, [`contrast.mjs`](contrast.mjs) (text over a photo) and
[`scale-audit.mjs`](scale-audit.mjs) (type scale and tap targets across the
site). They take dependencies from the project: `npm i -D playwright pngjs
pixelmatch`. The browser is found by [`browser.mjs`](browser.mjs): the
`CHROMIUM` variable (or `--exe`), else the browser your Playwright expects,
else the newest Chromium in a Playwright cache (`~/.cache/ms-playwright`,
`/opt/pw-browsers` in a cloud session, …), else an error saying what to
install.

## Steps

1. **Reference in the repo.** `refs/<name>.png`, print its size (PIL /
   `identify`). The reference is the source of coordinates, not "roughly like
   the picture". Done when the width and height in px are known.
2. **Measure, do not estimate.** From the reference, write down in px: column
   edges, top/bottom of every block, icon centres, line spacing (distance
   between baselines), radii, line thicknesses. Take colours from flat fills
   (`getpixel` on the background, not on text: anti-aliasing lies). Done when
   every block has x, y, w, h.
3. **Self-host the fonts.** Download OFL fonts from google/fonts
   (`raw.githubusercontent.com/google/fonts/main/ofl/<family>/…`),
   `@font-face` with `font-display: block`, binaries in `.gitignore` plus a
   download script. For CJK, `Noto Sans SC` (variable, 17 MB); for Latin,
   `Inter`. The sandbox's system font (WenQuanYi) has different glyph widths
   and breaks line wrapping. Done when `document.fonts.ready` in Playwright
   returns the required families.
4. **Build with explicit sizes.** Tailwind arbitrary values in px
   (`w-[238px]`, `leading-[28px]`, `mt-[46px]`), palette and families in
   `tailwind.config`, icons from `lucide-react` by meaning. Line breaks are
   set by the column width: N characters x font size is the width in px,
   otherwise lines wrap differently and everything below shifts. Done when
   every block from step 2 has its own x/y/w/h in code.
5. **Comparison loop, up to 5 iterations.**
   ```bash
   node .claude/skills/ui-from-screenshot/compare.mjs \
     --ref refs/<name>.png --url http://127.0.0.1:5173/?page=<name>
   ```
   A phone or retina screenshot is 2x/3x: add `--dsf 2` (or 3) so the
   viewport is the reference size divided by it. `--fail <pct>` turns the
   run into a gate (exit 1 above that mismatch).
   Look at the diff image, not just the percentage: clusters mean a shift
   (padding/gap), a wrap (width), a colour (token) or a font size. The 3x4
   grid in the output says exactly where. Fix exactly what is visible, commit
   every iteration. Done when only glyph outlines (rasterization) remain on
   the diff; the number is then usually 8–10 % and does not drop further
   without the original's exact font.
6. **Show both.** A side-by-side (original | render) via PIL, sent to the
   user, plus an "iteration → %" table. Done when the user sees the images,
   not just numbers.

## Options for the owner: overrides, not commits

A request like "make it smaller", "bigger", "more compact" names neither the
axis nor the amount: the owner said "shrink the header", got a change to its
height AND to the column width, and sent it back with "I did not mean the
width". So show the options BEFORE the change, not after a follow-up
question: three numbers instead of one interpretation.

When the owner asks "give me three options of how it would look", do not
commit three states of the CSS. Render the options on top of the built
`dist`: one script, an object `{A, B, C}` with numbers (font sizes,
paddings), `page.addStyleTag` per option, a screenshot plus a measurement
(block height, line contrast). Only the chosen one is committed. Done when
every option has a picture AND a number (height, contrast), not "I think this
looks better".

## Text over a photo or a gradient

The background under a line is not uniform, so "text colour vs background
colour" lies here: the average over the block hides the dark patch of the
photo where the line drowns. Measure the worst case exactly under the
letters: [`contrast.mjs`](contrast.mjs) takes the rectangles of the LINES
(`Range.getClientRects`, not the element's bounding box), hides the text,
captures the background and finds the darkest pixel in each rectangle.

```bash
node .claude/skills/ui-from-screenshot/contrast.mjs \
  --url http://127.0.0.1:4173/ --area .hero --hide .hero-text \
  --widths 360,390,430 --text '.hero h1=#0b2545' --text '.hero .lead=#4f6480' --min 4.5
```

Threshold: AA 4.5 for normal text, 3.0 for large (>=24px, or >=18.66px
bold). Small muted text (the secondary colour) is the first to fail: over a
photo it needs a background lighter than 0.83 relative luminance, which is
almost a solid fill. Hence the technique: build the scrim from two gradients,
a vertical one that seals the zone of small text and a horizontal one that
leaves the photo visible where only the large heading sits. Done when every
measured line is above its threshold and you can still see the picture.

## Type norms (so it is not "huge heading + tiny text")

Even without a reference, keep checkable proportions. A modular scale, step
1.2–1.33:

| Role | Desktop | Mobile | line-height |
|---|---|---|---|
| Body / captions | 16px | 15–16px | 1.5–1.6 |
| Hero subheading (lead) | 20px | 18px | ~1.55 |
| Section heading (H2/H3) | 24–32px | 20–24px | 1.15–1.3 |
| Display heading (hero) | 48–64px | 32–40px | 1.0–1.1 |
| Eyebrow label (caps) | 11–13px | — | + letter-spacing 0.12–0.2em |

- **Hero to subheading is about 3:1, not 4:1 or more.** 60/20 is fine; a
  72px heading over 17px lead text crushed the text and was sent back.
- One scale for the whole page: 16 → 20 → 24 → 32 → hero; no stray
  15.5 / 21 / 26 off the scale. On mobile every size drops one step.
- A body line is 60–75 characters (`max-width ~42rem`); headings get a tight
  line-height and tracking of −0.01…−0.02em.
- When one page changes scale, the rest of the site must follow, or the two
  look like different products side by side. Start from a number:
  `node .claude/skills/ui-from-screenshot/scale-audit.mjs --base <url> / /about/`
  lists text below 14px, clipped text and tap targets below 44px at 390px
  (`--min-font`, `--min-target`, `--width` change the floors). Small
  monospace or all-caps labels may stay small: they are labels, not prose.

## Responsive norms (any device)

Check three widths, not "looks fine": **390 / 768 / 1440**, and at each:
- no horizontal scroll (`scrollWidth === clientWidth`);
- multi-column grids collapse to one column by 390; tap targets ≥ 44px;
  inputs are not wider than the screen;
- content does not span the whole monitor: a centred wrapper of
  `max-width ~1180px`, body text at 42rem.
Take a reference/screenshot per width (`refs/home-390.png`,
`home-768.png`, `home-1440.png`) and run them one by one.

## Limits (mixed-language or photo mockups)

- **Mixed-language mockup** (an English header over Russian body text): no
  single-language page will match the text. Compare against the matching
  language (`--url …/en/`), judge layout and scale rather than text, and do
  not chase the percentage to zero: it is bounded by the language difference,
  not by the layout.
- **Photo vs illustration.** If the mockup uses a photo and the project
  draws SVG illustrations instead, pixel-for-pixel is impossible by
  construction: compare composition and typography, and name the remainder
  out loud.
- **The reference is the owner's truth.** Do not "improve" your layout away
  from it: a discrepancy is either fixed or named out loud as forced.

## Pitfalls, each cost an iteration

- **Flex stretches.** A sidebar inside `flex` got the height of the whole
  section. Use `self-start`.
- **Narrow columns in the original are a width, not a mistake.** A heading
  that wraps onto three lines of 2 CJK characters is reproduced with
  `w-[95px]`, not "whatever looks nicer".
- **Heavy display font.** Archivo Black is wider than Inter Black at the same
  cap height; match by line width in the reference, not by name.
- **Photo and background are crops from the reference.** Put them in
  `public/img/`. Paint over baked-in text in the crop: copy a neighbouring
  area of the same brightness (compare `ImageStat.mean`), then apply
  `GaussianBlur` at the patch edge. Whatever stays baked in (handwriting over
  a photo) is named in the report, not passed off as text.
- **A screenshot reference can be cropped at the bottom.** Viewport =
  reference size, `clip` instead of `fullPage`, otherwise pixelmatch fails
  on a size mismatch.
- **Playwright in a cloud session.** A global Playwright install and its
  Chromium build may already sit in `/opt/pw-browsers`; install the same
  Playwright version in the project, without `playwright install`. If the
  versions differ, `browser.mjs` falls back to the newest cached Chromium;
  do not hardcode a `chromium-<rev>` path in a script.

## If asked to stand up screenshot-to-code

It only works with `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`
(one is enough) and `REPLICATE_API_KEY` (not `_TOKEN`); there is no CLI,
generation goes through the `generate-code` WebSocket. In a cloud sandbox
Docker needs a manual `dockerd`, the proxy CA inside the images (`COPY
ca-bundle.crt` + `NODE_EXTRA_CA_CERTS` / `SSL_CERT_FILE`), and `network: host`
at build time; `apt` through the proxy returns `405 Method Not Allowed`, so
make `apt-get` steps optional. The upstream frontend Dockerfile expects
`yarn.lock`, while the repo uses `pnpm`. Without keys the service is useless:
go to the steps above.
