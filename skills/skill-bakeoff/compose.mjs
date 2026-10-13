// Pictures for the owner: node compose.mjs <bakeoff.json>
// For every skill and page: monitor 1280 on the left, phone 390 on the right, number and title on top.
// Reads <work>/out/<slug>/<page>-{1280,390}.png, writes <work>/final/NN-<slug>-<page>.jpg.
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { createRequire } from 'node:module'
let m
// local playwright first, then the global one next to node (createRequire also honours NODE_PATH)
try { m = await import('playwright') } catch { m = createRequire(join(dirname(process.execPath), '..', 'lib', 'node_modules', 'x.js'))('playwright') }
const chromium = m.chromium ?? m.default?.chromium
const cfgPath = resolve(process.argv[2] || 'bakeoff.json')
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'))
const W = resolve(dirname(cfgPath), cfg.work || '.') + '/'
mkdirSync(W + 'final', { recursive: true })
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const b = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {})
const uri = (f) => `data:image/png;base64,${readFileSync(f).toString('base64')}`
let n = 0, missing = 0
for (const s of cfg.skills) for (const p of cfg.pages) {
  n++
  const dsk = `${W}out/${s.slug}/${p.key}-1280.png`, mob = `${W}out/${s.slug}/${p.key}-390.png`
  if (!existsSync(dsk) || !existsSync(mob)) { console.log('MISSING', s.slug, p.key); missing++; continue }
  const deskH = p.scroll ? (p.desktopHeight || 1700) : 800
  const html = `<body style="margin:0;background:#e9e9ec;font-family:system-ui,sans-serif">
  <div style="padding:22px 28px 6px;font:800 30px system-ui;color:#111">${n}. ${s.title}<span style="font-weight:500;color:#555;font-size:22px"> — ${p.label}</span></div>
  <div style="display:flex;gap:28px;align-items:flex-start;padding:16px 28px 28px">
    <div style="width:1280px;height:${deskH}px;overflow:hidden;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.18);background:#fff"><img src="${uri(dsk)}" style="width:1280px;display:block"></div>
    <div style="width:390px;height:844px;overflow:hidden;border-radius:36px;border:10px solid #111;box-shadow:0 8px 30px rgba(0,0,0,.25);background:#fff"><img src="${uri(mob)}" style="width:390px;display:block"></div>
  </div></body>`
  const pg = await b.newPage({ viewport: { width: 1280 + 390 + 20 + 28 * 3, height: 600 } })
  await pg.setContent(html); await pg.waitForTimeout(300)
  const out = `${W}final/${String(n).padStart(2, '0')}-${s.slug}-${p.key}.jpg`
  await pg.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 86 })
  await pg.close()
  console.log(out.split('/').pop())
}
await b.close()
process.exit(missing ? 1 : 0)
