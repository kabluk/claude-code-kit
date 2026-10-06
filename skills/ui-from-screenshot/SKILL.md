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

The comparison script is [`compare.mjs`](compare.mjs). It takes dependencies
from the project: `npm i -D playwright pngjs pixelmatch`; Chromium must be
installed (`npx playwright install chromium`; in a cloud session it is
usually already in `/opt/pw-browsers`).

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
   Look at the diff image, not just the percentage: clusters mean a shift
   (padding/gap), a wrap (width), a colour (token) or a font size. The 3x4
   grid in the output says exactly where. Fix exactly what is visible, commit
   every iteration. Done when only glyph outlines (rasterization) remain on
   the diff; the number is then usually 8–10 % and does not drop further
   without the original's exact font.
6. **Show both.** A side-by-side (original | render) via PIL, sent to the
   user, plus an "iteration → %" table. Done when the user sees the images,
   not just numbers.

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
  Playwright version in the project, without `playwright install`.

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
