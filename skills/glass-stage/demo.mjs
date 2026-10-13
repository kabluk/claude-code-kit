#!/usr/bin/env node
// Checks the stage before porting it into the product: builds a hero page from stage.css in the
// chosen palette, shoots desktop 1280 and phone 390, and measures whether anything sticks out sideways.
//
//   node demo.mjs <palette> <out-dir> [--screens dir] [--art dir] [--font file.woff2]
//                 [--title "…"] [--accent "…"] [--lead "…"] [--chips "a|b;c|d;e|f"]
//                 [--eyebrow …] [--cta …] [--cta2 …] [--cards "t|p;t|p;t|p"] [--lang ru] [--icons "✓;☎;◆"] [--ring-opacity .5] [--h1-weight 900]
//
// --screens: front.webp, left.webp, right.webp (product screens, capture.mjs screens)
// --art:     bg-wide.*, bg-tall.*, ring.*, aurora.* (kie.mjs set); without them, the CSS glow
// Output: <out>/demo-<palette>.html, -1280.png, -390.png; exit code 1 if text sticks out past the edge.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

let pw
try { pw = await import('playwright') } catch { pw = createRequire(path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'x.js'))('playwright') }
const chromium = pw.chromium ?? pw.default?.chromium
const CLOUD = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const exe = process.env.CHROMIUM || (existsSync(CLOUD) ? CLOUD : undefined)

const [, , palName, out, ...rest] = process.argv
const opt = {}
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, '')] = rest[i + 1]
const HERE = new URL('.', import.meta.url).pathname
const P = JSON.parse(readFileSync(HERE + 'palettes.json', 'utf8'))[palName]
if (!P || !out) { console.error('usage: demo.mjs <palette> <out-dir> [...]'); process.exit(2) }
mkdirSync(out, { recursive: true })

const uri = (f) => `data:image/${/\.jpe?g$/i.test(f) ? 'jpeg' : /\.png$/i.test(f) ? 'png' : 'webp'};base64,${readFileSync(f).toString('base64')}`
const find = (dir, base) => { if (!dir || !existsSync(dir)) return null; const f = readdirSync(dir).find((x) => x.replace(/\.\w+$/, '') === base); return f ? path.join(dir, f) : null }
const art = (k) => { const f = find(opt.art, k); return f ? `url("${uri(f)}")` : 'none' }
const scr = (k) => { const f = find(opt.screens, k); return f ? `<img src="${uri(f)}" alt="">` : `<div style="aspect-ratio:390/844;background:linear-gradient(180deg,${P.panel},${P.bg});display:grid;place-items:center;color:${P.mute};font:600 13px system-ui">screen ${k}</div>` }
const font = opt.font ? `@font-face{font-family:Brand;src:url(${uri(opt.font)}) format('woff2');font-weight:100 900}` : ''
const [i1, i2, i3] = (opt.icons || '✓;☎;◆').split(';')
const [c1, c2, c3] = (opt.chips || 'Updated today|Source: official website;Call|+1 (555) 010-2030;120+ places|nationwide').split(';').map((x) => x.split('|'))

const ringCss = opt['ring-opacity'] ? `.gs-ring{opacity:${opt['ring-opacity']}}` : ''
const vars = `${ringCss}:root{--gs-bg:${P.bg};--gs-bg2:${P.bg2};--gs-panel:${P.panel};--gs-ink:${P.ink};--gs-mute:${P.mute};--gs-a:${P.a};--gs-a-soft:${P.aSoft};--gs-b:${P.b};--gs-b-soft:${P.bSoft};--gs-hi:${P.hi};--gs-hi2:${P.hi2};--gs-ok:${P.ok};${P.onA ? `--gs-on-a:${P.onA};` : ''}--gs-bg-wide:${art('bg-wide')};--gs-bg-tall:${art('bg-tall')};--gs-ring:${art('ring')};--gs-aurora:${art('aurora')}}`
const phone = (pos, k) => `<div class="gs-phone gs-${pos}"><div class="gs-screen"><div class="gs-sb"><b>9:41</b><i></i><span class="gs-sb-r"><em></em><em></em><em></em><u></u></span></div>${scr(k)}</div></div>`
const html = `<!doctype html><html lang="${opt.lang || 'en'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>glass-stage · ${palName}</title>
<style>${font}${readFileSync(HERE + 'stage.css', 'utf8')}${vars}
*{box-sizing:border-box}body{margin:0;font-family:${opt.font ? 'Brand,' : ''}system-ui,-apple-system,'Segoe UI',sans-serif}
.wrap{max-width:1200px;margin:0 auto;padding:0 20px}.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:32px;align-items:center;padding-block:72px 64px;position:relative;z-index:1}
h1{font-size:clamp(38px,5vw,60px);line-height:1.04;letter-spacing:-.035em;margin:18px 0 0;font-weight:${opt['h1-weight'] || 800};color:#fff}h1 span{display:block}
.gs-lead{font-size:19px;line-height:1.5;margin:20px 0 28px;max-width:34ch}.ctas{display:flex;gap:12px;flex-wrap:wrap}
.sec{padding:72px 0}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.card{padding:24px}.card h3{margin:14px 0 6px;color:#fff}.card p{margin:0;color:var(--gs-mute)}
@media (max-width:999px){.grid{grid-template-columns:1fr;padding-block:40px 24px}.cards{grid-template-columns:1fr}}</style>
<body class="gs-page"><section class="gs-hero"><div class="gs-grain"></div><div class="gs-lines"></div><div class="gs-fade"></div>
<div class="wrap grid"><div class="gs-copy"><span class="gs-eyebrow">${opt.eyebrow || 'New product'}</span>
<h1>${opt.title || 'Everything that matters,'}<span class="gs-grad">${opt.accent || 'on one screen'}</span></h1>
<p class="gs-lead">${opt.lead || 'Real product screens with depth, glass and light instead of icon diagrams.'}</p>
<div class="ctas"><a class="gs-btn" href="#">${opt.cta || 'Get started'}</a><a class="gs-btn gs-btn-ghost" href="#">${opt.cta2 || 'How it works'}</a></div></div>
<div class="gs-stage"><div class="gs-floor"></div><div class="gs-ring"></div><div class="gs-scene">${phone('left', 'left')}${phone('right', 'right')}${phone('front', 'front')}</div>
<div class="gs-chip gs-c1"><span class="gs-ci gs-ci-a">${i1}</span><span><b>${c1[0]}</b><small>${c1[1]}</small></span></div>
<div class="gs-chip gs-c2"><span class="gs-ci gs-ci-ok">${i2}</span><span><b>${c2[0]}</b><small>${c2[1]}</small></span></div>
<div class="gs-chip gs-c3"><span class="gs-ci gs-ci-b">${i3}</span><span><b>${c3[0]}</b><small>${c3[1]}</small></span></div></div></div></section>
<section class="sec gs-aurora-host"><div class="gs-aurora"></div><div class="wrap cards">${(opt.cards || 'Find|Card glass is one formula for the whole page.;Contact|Card glass is one formula for the whole page.;Prepare|Card glass is one formula for the whole page.').split(';').map((c, i) => { const [t, p] = c.split('|'); return `<div class="card gs-glass${i === 1 ? ' gs-glass-on' : ''}"><span class="gs-ic-glow" style="color:${[P.aSoft, P.bSoft, P.ok][i % 3]};display:inline-block;width:22px;height:22px;border-radius:7px;background:currentColor"></span><h3>${t}</h3><p>${p}</p></div>` }).join('')}</div></section></body></html>`
const file = `${out}/demo-${palName}.html`
writeFileSync(file, html)

const b = await chromium.launch(exe ? { executablePath: exe } : {})
let bad = 0
for (const [w, h, mob] of [[1280, 820, false], [390, 1500, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob, reducedMotion: 'reduce' })
  const pg = await ctx.newPage()
  await pg.goto('file://' + path.resolve(file)); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300)
  // the edge of EVERY text element: sections with overflow:clip hide overflow from scrollWidth
  const over = await pg.evaluate(() => [...document.querySelectorAll('.gs-copy *, .gs-chip, .card *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1) }).map((e) => `${e.className || e.tagName} ${Math.round(e.getBoundingClientRect().right)}`))
  if (over.length) { bad++; console.log(`${w}px sticks out:`, over.slice(0, 4).join(' | ')) }
  await pg.screenshot({ path: `${out}/demo-${palName}-${w}.png` })
  await ctx.close()
}
await b.close()
console.log(`${file}\n${bad ? 'OVERFLOW' : 'ok'}: ${out}/demo-${palName}-1280.png, -390.png`)
process.exitCode = bad ? 1 : 0
