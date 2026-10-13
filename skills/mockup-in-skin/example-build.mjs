// EXAMPLE for the skill: this is how a four-column comparison of one content page was built
// (21.09.2026). Treat it as a pattern of the recipe, not a script to run as is: the class names,
// section titles and notes below belong to that page; replace them with your product's.
// Three typography variants of one page in the site's real skin.
// Production CSS from dist, production page markup, fonts embedded as data:.
//
//   REPO=/path/to/your-repo PAGE=en/<slug> node example-build.mjs <out-dir>
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
const R = process.env.REPO || '/path/to/your-repo'
const PAGE = process.env.PAGE || 'en/<slug>'
const S = process.argv[2] || './mockups'
mkdirSync(S, { recursive: true })

// the build hashes the CSS name (app-XXXXXXXX.css): find it instead of hard-coding it
const cssFile = readdirSync(`${R}/dist/assets`).find((f) => /^app-.*\.css$/.test(f))
let css = readFileSync(`${R}/dist/assets/${cssFile}`, 'utf8')
for (const f of readdirSync(`${R}/public/fonts`).filter((x) => x.endsWith('.woff2'))) {
  const b64 = readFileSync(`${R}/public/fonts/${f}`).toString('base64')
  css = css.split(`/fonts/${f}`).join(`data:font/woff2;base64,${b64}`)
}

const lang = PAGE.split('/')[0]
let base = readFileSync(`${R}/dist/${PAGE}/index.html`, 'utf8')
base = base.replace(/<script[\s\S]*?<\/script>/g, '')
base = base.replace(/<link rel="modulepreload"[^>]*>/g, '')
base = base.replace(/<link rel="stylesheet"[^>]*>/, `<style>${css}</style>`)
base = base.replace(/<link rel="manifest"[^>]*>/g, '')

// ---------- variant CSS ----------

const V1 = `
/* V1 · one label scale + one vertical rhythm. Not a single line of content changed. */
.v1 .updated-badge, .v1 .cmp-t, .v1 .cmp-sub,
.v1 .next-step .ns-eyebrow, .v1 .rel-label, .v1 .src-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-dim);
  line-height: 1.4;
}
.v1 .body-p, .v1 .blist li, .v1 .box p, .v1 .cmp-col li { line-height: 1.62; }
.v1 .page-h1 { font-size: 28px; line-height: 1.14; margin-bottom: 12px; }
.v1 .lede { font-size: 16px; line-height: 1.55; margin-bottom: 16px; }
.v1 .updated-badge { margin-bottom: 24px; }
.v1 .page-h2 { margin: 32px 0 12px; }
.v1 .box, .v1 .cmp { margin: 20px 0; }
.v1 .blist { margin-bottom: 20px; }
.v1 .blist li { margin-bottom: 12px; }
.v1 .ghost { margin: 8px 0 0; }
.v1 .onward { margin-top: 32px; }
`

const V2 = `
/* V2 · V1 + structure: the title as one block, a page index, callouts of one kind, three lists of different kinds. */
.v2 .updated-badge, .v2 .cmp-t, .v2 .cmp-sub,
.v2 .next-step .ns-eyebrow, .v2 .rel-label, .v2 .src-label, .v2 .vx-lab {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-dim);
  line-height: 1.4;
}
.v2 .body-p, .v2 .blist li, .v2 .box p, .v2 .cmp-col li { line-height: 1.62; }
.v2 .page-h1 { font-size: 28px; line-height: 1.14; margin-bottom: 12px; }
.v2 .lede { font-size: 16px; line-height: 1.55; color: var(--color-ink); margin-bottom: 14px; }
.v2 .updated-badge { margin: 0 0 18px; padding-bottom: 18px; border-bottom: 1px solid var(--color-line); }
.v2 .page-h2 { margin: 32px 0 12px; }
.v2 .blist { margin-bottom: 20px; }

/* page index */
.v2 .vx-idx { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 26px; }
.v2 .vx-idx .vx-lab { width: 100%; margin-bottom: 2px; }
.v2 .vx-idx a {
  font-size: 13.5px; text-decoration: none; color: var(--color-ink);
  border: 1px solid var(--color-line); border-radius: 999px; padding: 7px 12px;
  background: var(--color-panel);
}

/* callouts of one kind: colour in the rule and heading, no background fill */
.v2 .box { background: var(--color-panel); border-left-width: 3px; margin: 20px 0; padding: 16px 18px; }
.v2 .box.r, .v2 .box.y, .v2 .box.g { background: var(--color-panel); }
.v2 .box h3 { font-size: 15.5px; margin-bottom: 8px; }

/* three lists in a row: three different kinds */
.v2 .vx-l1 { counter-reset: st; margin-bottom: 22px; }
.v2 .vx-l1 li { padding-left: 34px; counter-increment: st; margin-bottom: 14px; }
.v2 .vx-l1 li::before {
  content: counter(st, decimal-leading-zero);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em;
  color: var(--color-blue); background: none; width: auto; height: auto;
  top: 2px; left: 0;
}
.v2 .vx-l2 li { padding-left: 26px; }
.v2 .vx-l2 li::before {
  content: '✓'; color: var(--color-green); background: none;
  width: auto; height: auto; top: 0; left: 0; font-size: 14px;
}
.v2 .vx-l3 li { padding-left: 26px; }
.v2 .vx-l3 li::before {
  content: '?'; color: var(--color-blue); background: none; font-weight: 700;
  width: auto; height: auto; top: 0; left: 0; font-size: 14px;
}
.v2 .ghost { display: block; text-align: center; margin: 8px 0 0; padding: 14px 18px; }
`

const V3 = `
/* V3 · V2 + a template for every page: one font in labels, a modular scale, numbered sections. */
.v3 .updated-badge, .v3 .cmp-t, .v3 .cmp-sub,
.v3 .next-step .ns-eyebrow, .v3 .rel-label, .v3 .src-label, .v3 .vx-lab {
  font-family: var(--font-sans);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-dim);
  line-height: 1.4;
}
/* monospace stays only where it means something */
.v3 code, .v3 .terms dt, .v3 .src-ext { font-family: var(--font-mono); }

.v3 .page-h1 { font-size: 30px; line-height: 1.12; letter-spacing: -0.021em; margin-bottom: 12px; }
.v3 .lede { font-size: 16.5px; line-height: 1.5; color: var(--color-ink); margin-bottom: 14px; }
.v3 .updated-badge { margin: 0 0 18px; padding-bottom: 18px; border-bottom: 1px solid var(--color-line); }
.v3 .body-p, .v3 .blist li, .v3 .box p, .v3 .cmp-col li { font-size: 15px; line-height: 1.65; }
.v3 .page-h2 { font-size: 20px; margin: 36px 0 14px; }
.v3 .blist { margin-bottom: 22px; }

/* numbered sections: the reader sees where they are */
.v3 main { counter-reset: sec; }
.v3 .page-h2 { counter-increment: sec; }
.v3 .page-h2::before {
  content: counter(sec, decimal-leading-zero);
  display: block;
  font-family: var(--font-sans); font-size: 11.5px; font-weight: 600;
  letter-spacing: 0.07em; color: var(--color-blue); margin-bottom: 6px;
}

.v3 .vx-idx { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 0 0 28px; }
.v3 .vx-idx .vx-lab { width: 100%; margin-bottom: 2px; }
.v3 .vx-idx a {
  font-size: 14px; text-decoration: none; color: var(--color-ink);
  border: 1px solid var(--color-line); border-radius: 999px; padding: 8px 13px;
  background: var(--color-panel);
}

.v3 .box { background: var(--color-panel); border-left-width: 3px; margin: 22px 0; padding: 17px 19px; border-radius: 0 14px 14px 0; }
.v3 .box.r, .v3 .box.y, .v3 .box.g { background: var(--color-panel); }
.v3 .box h3 { font-size: 16px; margin-bottom: 8px; }

.v3 .cmp { margin: 22px 0; }
.v3 .cmp-col { border-radius: 14px; padding: 16px 17px; }

.v3 .vx-l1 { counter-reset: st; margin-bottom: 24px; }
.v3 .vx-l1 li { padding-left: 34px; counter-increment: st; margin-bottom: 14px; }
.v3 .vx-l1 li::before {
  content: counter(st, decimal-leading-zero);
  font-family: var(--font-sans); font-size: 11.5px; font-weight: 600; letter-spacing: 0.07em;
  color: var(--color-blue); background: none; width: auto; height: auto; top: 3px; left: 0;
}
.v3 .vx-l2 li { padding-left: 26px; }
.v3 .vx-l2 li::before { content: '✓'; color: var(--color-green); background: none; width: auto; height: auto; top: 0; left: 0; font-size: 14px; }
.v3 .vx-l3 li { padding-left: 26px; }
.v3 .vx-l3 li::before { content: '?'; color: var(--color-blue); font-weight: 700; background: none; width: auto; height: auto; top: 0; left: 0; font-size: 14px; }

.v3 .ghost { display: block; text-align: center; margin: 10px 0 0; padding: 15px 18px; font-size: 14.5px; }
.v3 .next-step { border-radius: 18px; padding: 20px 22px; }
.v3 .foot { font-size: 14.5px; }
`

// ---------- markup changes ----------

// one title per <h2 class="page-h2"> on the page, in order
const TITLES = ['Section 1', 'Section 2', 'Section 3', 'Section 4', 'Section 5']

// a stale phrase found on the live page (it pointed to a feature that had been removed):
// every variant drops it, and the live site gets the same fix in every language
const STALE = ' — <phrase pointing to a removed feature>'
const fixStale = (d) => d.replace(STALE, '')

function structure(d) {
  let i = 0
  d = d.replace(/<h2 class="page-h2">/g, () => `<h2 class="page-h2" id="s${++i}">`)
  const idx =
    `<nav class="vx-idx"><span class="vx-lab">On this page</span>` +
    TITLES.map((t, k) => `<a href="#s${k + 1}">${t}</a>`).join('') +
    `</nav>`
  d = d.replace(/(<p class="updated-badge">[\s\S]*?<\/p>)/, `$1${idx}`)
  let j = 0
  d = d.replace(/<ul class="blist">/g, () => `<ul class="blist vx-l${++j}">`)
  return d
}

function doc(cls, extraCss, transform) {
  let d = base.replace(`<html lang="${lang}"`, `<html lang="${lang}" class="${cls}"`)
  if (extraCss) d = d.replace('</head>', `<style>${extraCss}</style></head>`)
  if (transform) d = transform(d)
  return d
}

const docs = [
  { t: 'Now · live site', d: doc('v0') },
  { t: 'Variant 1 · one label scale', d: doc('v1', V1, fixStale) },
  { t: 'Variant 2 · + structure', d: doc('v2', V2, (x) => structure(fixStale(x))) },
  { t: 'Variant 3 · + a template for every page', d: doc('v3', V3, (x) => structure(fixStale(x))) },
]

for (const [i, x] of docs.entries()) writeFileSync(`${S}/page-${i}.html`, x.d)

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

// the measurements below are the ones taken from the original page: re-measure yours
const NOTES = [
  ['Caps labels', '6 different: 10 / 10.5 / 11 px, tracking 0.08–0.18em', 'one: 11 px, 0.1em, mono', 'same', 'one: 11.5 px, 0.07em, the text sans; mono only for code and terms'],
  ['Title and lede', '27 / 15 px, grey lede', '28 / 16, lede lighter by rhythm', '28 / 16, ink lede, rule under the date', '30 / 16.5, modular scale, rule'],
  ['Body', '14.5 px, line height 1.5', '14.5 / 1.62', '14.5 / 1.62', '15 / 1.65'],
  ['Block rhythm', '16 / 18 / 28: three different gaps', 'one step: 20 / 32', 'one step: 20 / 32', 'one step: 22 / 36'],
  ['Callouts', 'three tones, the red one filled', 'unchanged', 'one card, colour in the rule and heading', 'same + radius 14'],
  ['Three lists in a row', 'all alike, dashes', 'unchanged', '01–05 · checkmarks · questions', 'same'],
  ['In-page navigation', 'none', 'none', 'pill index at the top', 'index + section numbers 01–05'],
  ['Content edits', '—', 'one (a dead reference removed)', 'one', 'one'],
  ['Where it lives', '—', 'global.css, ~25 lines', 'global.css ~70 lines + 3 markup edits on the page', 'global.css ~90 lines, fits every page type'],
]

const table =
  `<table><thead><tr><th>What</th><th>Now</th><th>Variant 1</th><th>Variant 2</th><th>Variant 3</th></tr></thead><tbody>` +
  NOTES.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`).join('') +
  `</tbody></table>`

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Three typography variants</title>
<style>
  :root { --bg:#f6f7f9; --card:#fff; --ink:#14171a; --dim:#5b6570; --line:#e3e7ec; --blue:#1857c4; }
  :root:not([data-theme="light"]) { color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#0f1214; --card:#161a1e; --ink:#eef1f4; --dim:#9aa4ae; --line:#2a3138; --blue:#7aa6ff; } }
  :root[data-theme="dark"] { --bg:#0f1214; --card:#161a1e; --ink:#eef1f4; --dim:#9aa4ae; --line:#2a3138; --blue:#7aa6ff; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
    font: 15px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .wrap { max-width: 1760px; margin: 0 auto; padding: 28px 16px 56px; }
  h1 { font-size: 26px; margin: 0 0 6px; letter-spacing: -.02em; }
  .sub { color: var(--dim); margin: 0 0 24px; max-width: 70ch; }
  .cols { display: grid; grid-template-columns: repeat(4, 400px); gap: 16px; overflow-x: auto; padding-bottom: 10px; }
  @media (max-width: 900px) { .cols { grid-template-columns: repeat(4, 340px); } }
  .col { background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
  .cap { padding: 12px 14px; border-bottom: 1px solid var(--line); font-weight: 600; font-size: 14px; }
  .cap small { display:block; font-weight: 400; color: var(--dim); font-size: 12.5px; margin-top: 2px; }
  iframe { display:block; width: 100%; height: 1500px; border: 0; background:#fff; }
  table { border-collapse: collapse; width: 100%; margin-top: 30px; font-size: 14px; background: var(--card);
    border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
  thead th { background: color-mix(in srgb, var(--blue) 8%, transparent); font-size: 13px; }
  tbody th { font-weight: 600; width: 160px; }
  tr:last-child th, tr:last-child td { border-bottom: 0; }
  .why { margin-top: 30px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; }
  .why h2 { font-size: 17px; margin: 0 0 8px; }
  .why p { margin: 0 0 8px; color: var(--dim); }
  .why b { color: var(--ink); }
  @media (max-width: 720px) { .wrap { padding: 20px 16px 40px; } }
</style></head>
<body><div class="wrap">
<h1>Three typography variants of one page</h1>
<p class="sub">The header, palette and page markup are the same as on the live site: the production CSS from the build and the production HTML of the page. Only the type scale, spacing and kinds of blocks change. Scroll the columns sideways.</p>
<div class="cols">
${docs.map((x) => `<div class="col"><div class="cap">${x.t.split(' · ')[0]}<small>${x.t.split(' · ')[1] ?? ''}</small></div><iframe srcdoc="${esc(x.d)}" title="${x.t}" loading="lazy"></iframe></div>`).join('\n')}
</div>
${table}
<div class="why">
<h2>Why the fonts feel inconsistent</h2>
<p>It is not the number of fonts: there are two (a sans for text, a mono for labels). It is that <b>the caps label on this page is drawn in six different ways</b>: the update date 10.5 px with 0.08em tracking, the comparison heading 10.5 / 0.14em, the column caption 10.5 / 0.08em, "Next step" 10 / 0.18em, "More on this" 11 / 0.14em, the sources caption 10 / 0.16em. The eye reads this as six different fonts on one screen.</p>
<p>Second, rhythm: the gaps between blocks run 16, 18, 22, 26, 28 and 36 px with no common step, and three lists in a row are drawn with the same dash, so the page reads as one long ribbon.</p>
<p>Along the way an error in the text turned up: one line ended with a reference to a feature that had been removed. All three variants drop the phrase; on the live site it has to go in every language.</p>
</div>
</div></body></html>`

writeFileSync(`${S}/variants.html`, page)
console.log('done:', page.length, 'characters; columns', docs.length)
