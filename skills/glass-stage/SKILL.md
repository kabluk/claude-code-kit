---
name: glass-stage
description: 'A dark premium hero and page "like Linear / Stripe": real product screens in phones with depth, glass, light and glow behind, floating cards, kie.ai backgrounds and 3D icons, in any colour palette. Use when the owner asks to make a site or landing look premium, expensive or "beautiful", "like Linear / Stripe", wants floating elements, glow, glass, a dark theme with light, real product screens instead of icon diagrams, or kie.ai backgrounds; also when re-skinning that look in another palette.'
---

# glass-stage

A stage lifted from a product's "Night" design: the one the owner accepted
after rejecting eight SVG diagrams ("cheap") and five checklist "redesigns".
Its strength is **the product as the picture**: real screens, light and glass,
not illustrations drawn in code.

Skill files (all paths relative to the skill folder):

| File | What it is |
|---|---|
| `palettes.json` | palettes: `--gs-*` tokens and colour words for prompts |
| `stage.css` | the whole stage and the glass, `--gs-*` tokens only |
| `prompts.mjs` | the kie.ai prompts that made it to production |
| `kie.mjs` | generates backgrounds, ring, aurora, icons, a mark redrawn from a reference |
| `capture.mjs` | captures product screens and recompresses images to WebP |
| `demo.mjs` | a check page in a palette: shots at 1280/390 and a "sticks out sideways" probe |

## Steps

1. **Palette.** Take an entry from `palettes.json` or add one on the same
   pattern: ten colours and four `words` (background, accent A, accent B,
   faint hint). The words are English and descriptive ("emerald green"), no hex.
   Done when the entry exists and `node demo.mjs <palette> <out>` draws the hero without images.
2. **Product screens.** `node capture.mjs screens <dir> front=<url> left=<url>#<selector> right=<url>`
   from the built preview, in the product's own dark theme. If the page pulls a map, a CDN or
   external fonts, run with `PROXY=curl` (otherwise the screen comes out blank in the cloud
   environment). Three screens that show the substance: the object (a card), the process
   (steps), the result. A paid screen runs with `MOCK='**/api/status=<json>'`. Done when every
   screen shows live data, not placeholders, and every file is under 120 KB.
3. **Light from kie.ai**, if the environment has `KIE_API_KEY` (the key comes from the
   environment only: never into chat, files or commits; a key pasted into chat gets rotated
   by the owner).
   `node kie.mjs <dir> <palette> set` → `bg-wide`, `bg-tall`, `ring`, `aurora`;
   icons: `icon <name> "<subject>"`; the mark in a new material: `ref <name> <mark.png> "<task>"`.
   Recompress: `node capture.mjs webp <dir> bg-wide.jpg=1600 bg-tall.jpg=768 ring.jpg=720 aurora.jpg=1400` (icons 480).
   Without a key the stage uses the CSS glow from `stage.css`: that is a working option, not a placeholder.
   Done when you have opened EVERY image and none has text, digits, frames or stray objects,
   and the WebP files are saved into the product repository (a branch + README): the
   scratchpad disappears with the session, and every frame costs money.
4. **Show before porting.** `node demo.mjs <palette> <out> --screens <dir> --art <dir> --font <woff2> --title … --accent … --chips "b|small;…"`
   Exit code 0 (nothing sticks out). Show the owner 1280 and 390 next to what
   exists now (the `mockup-in-skin` skill). Done when the owner has chosen.
5. **Port into the product.** `stage.css` + the stage markup (`demo.mjs` assembles it).
   Floating card captions are real strings and data from the product. The stage is
   `aria-hidden="true"`: the text beside it carries the meaning. The dark theme reaches
   ALL product screens, otherwise a light page after a dark hero looks like a bug (in the
   original project: a generator for `night.css` plus hand finishing).
6. **Check the product.** Done when, at 390 and 1280 alike:
   - the edge of every text element is inside the viewport (`getBoundingClientRect`,
     not `scrollWidth`: a section with `overflow: clip` hides what sticks out);
   - no light blocks on dark pages (a screenshot + a background probe);
   - images are your own (`img-src 'self'`), WebP, first-screen weight within budget;
   - `prefers-reduced-motion` stops the floating, print stays light;
   - the phone screens are recaptured if the pages they were taken from changed.

## Stage rules

- One composition, one light source: the glow sits behind the main thing (phones,
  mark, prices), soft and diffuse, never a hard neon outline.
- Depth is three layers: the front phone nearer (`translateZ`), the side ones further
  and darker (`brightness .8–.85`); on a phone two remain.
- Glass is one formula for the whole page (`.gs-glass`); a highlighted card is
  `.gs-glass-on`. An icon in a section is `.gs-ic-glow`, a glow in its own colour.
- Cards float 7 px over 7 s with shifted phases; more makes people seasick.
- The palette colour is an accent, not a fill: on working screens (map, list) the map
  base is neutral, cards are white or neutral-dark, the accent only on the selected item,
  the primary button and the active filter (as Airbnb, Kiwi, Tripadvisor, KAYAK and Turo
  do; Mobbin, 07.10). A fully dark palette is for the hero stage only.
- Labels in a column: `width: fit-content; max-width: 100%`; `max-content`
  bloats the column on a long string (ru/es).

## Lessons

The skill is alive: after every use, add what broke or worked unexpectedly here,
with the date and the project. A lesson that had to be repeated twice moves into
the rules above or into the code itself.

- 26.09 · project A · a hex in the prompt (`#1264f5`) was written into the image
  as text → colour in words only (`palettes.json → words`).
- 26.09 · project A · a background without "no frames, no borders, no rounded
  rectangles" came back with a card-frame in the centre → the words live in `prompts.mjs`.
- 26.09 · project A · the owner called SVG illustrations and Pollinations "awful,
  cheap"; he accepted only real product screens with light.
- 28.09 · project A · text-to-image drew an ordinary mouse cursor instead of our
  arrow → redraw the mark only from a reference (`kie.mjs ref`).
- 28.09 · project A · the model filled the reference's transparent corners with white →
  `keep` gained "fill the whole canvas…"; if it is still white, crop to the tile.
- 28.09 · project A · `output_format: png` returned a JPEG → the extension is taken from the response.
- 29.09 · skill · at 390 px floating cards with a long caption stuck out past the
  edge → on a phone they wrap and get `max-width: min(250px, 68vw)`; the aurora behind
  the cards is dimmed to `.45`, otherwise its bands cut through the lines.
- 02.10 · project B · the site takes fonts and Material icons from Google Fonts, and
  the cloud environment's Chromium does not open external HTTPS → the screen captures
  show words ("water_drop") instead of icons. Before `capture.mjs`, download the CSS and
  woff2 with curl into a copy of the build and rewrite the `<link>` to local files. Demo
  texts are parameters: `--lang --cta --cta2 --cards --icons`.
- 02.10 · project B · three palettes for medicine/prices: `saline`, `amber-navy`,
  `vitamin`. The stage changes only the hero: if the rest of the site is light, porting
  means a dark theme on every page (step 5), which is a separate large job.
- 02.10 · project B · the kie.ai ring in warm palettes (amber, coral) at
  `opacity .95` reads as a planet and competes with the screens → `demo.mjs
  --ring-opacity .45`; when porting, the same value on `.gs-ring`.
- 06.10 · project B · the stage over a light OpenDesign system: a new palette
  `forest-lime` (forest + the same lime as the site's button). Lime is a light accent,
  and white text on the button was unreadable → the `--gs-on-a` token / `onA` field in
  the palette. A brand font at weight 900 was clipped by `font-weight:200 800` → range
  100–900 and `--h1-weight`. A screen with a MapLibre map came out blank →
  `capture.mjs` with `PROXY=curl` (curl `--compressed` + swiftshader).
- 06.10 · project B · showing "the stage inside the real page": the demo hero is pasted
  in place of the site's hero, the demo's rules (`h1`, `.sec`, `.card`) are scoped into
  `.gs-hero`, the file sits next to the build and is opened over http: from `file://` the
  site's fonts do not load (CORS), and the screenshot lies about the font.
- 06.10 · project B · the skill applied for the first time not to a hero but to a working
  screen (a map page, three structures A/B/C): one `glass.css` + a copy of `map.js` with a
  dark CARTO dark-matter base recoloured to the palette, over the real build. A headless
  Chromium trap: `backdrop-filter: blur` above ~12 px is not drawn at all, so in the
  screenshot the glass "disappears" though it is there in a real browser. For screenshots
  keep 12 px or check in a real browser. The lime of the selected marker is the screen's
  only light source.
- 07.10 · project B · the owner: "why is everything green?": the first version of the map
  screen recoloured the base and the panels into forest too. Redone as three solutions
  (light / contrast / graphite); the "palette is an accent" rule was raised into "Stage rules".
