// Shots of one variant: node render.mjs <variant folder> [page[:scroll] ...]
// Default: home:scroll search. The folder holds <page>.html.
// Writes <page>-1280.png (scroll = the whole page up to 3200 px, otherwise a 1280×800 screen) and
// <page>-390.png (a 390×844 screen, as on a phone). Prints texts that stick out sideways
// (the getBoundingClientRect edge, not scrollWidth) and external requests. Exit 1 if there are any.
import { resolve, dirname, join } from 'node:path'
import { createRequire } from 'node:module'
let m
// local playwright first, then the global one next to node (createRequire also honours NODE_PATH)
try { m = await import('playwright') } catch { m = createRequire(join(dirname(process.execPath), '..', 'lib', 'node_modules', 'x.js'))('playwright') }
const chromium = m.chromium ?? m.default?.chromium
const dir = resolve(process.argv[2] || '.')
const pages = (process.argv.length > 3 ? process.argv.slice(3) : ['home:scroll', 'search']).map((p) => p.split(':'))
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const b = await chromium.launch(await import('node:fs').then((fs) => (fs.existsSync(exe) ? { executablePath: exe } : {})))
let bad = 0
for (const [page, mode] of pages) for (const [w, h, mob] of [[1280, 800, false], [390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob, reducedMotion: 'reduce' })
  const ext = []
  await ctx.route(/^https?:\/\//, (r) => { ext.push(r.request().url()); r.abort() })
  const pg = await ctx.newPage()
  await pg.goto('file://' + dir + '/' + page + '.html', { waitUntil: 'load' })
  await pg.evaluate(() => document.fonts.ready)
  await pg.waitForTimeout(400)
  const over = await pg.evaluate((W) => [...document.querySelectorAll('body *')].filter((e) => {
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e)
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && (r.right > W + 1 || r.left < -1) && e.closest('[data-allow-overflow]') === null && e.innerText?.trim()
  }).slice(0, 8).map((e) => `${e.tagName}.${e.className} right=${Math.round(e.getBoundingClientRect().right)}`), w)
  const full = mode === 'scroll' && !mob
  const H = full ? Math.min(3200, await pg.evaluate(() => document.documentElement.scrollHeight)) : h
  await pg.screenshot({ path: `${dir}/${page}-${w}.png`, clip: { x: 0, y: 0, width: w, height: H }, fullPage: full })
  console.log(`${page}-${w}: height ${H}${over.length ? ' OVERFLOW ' + over.join(' | ') : ''}${ext.length ? ' EXTERNAL ' + ext.slice(0, 3).join(' ') : ''}`)
  if (over.length || ext.length) bad = 1
  await ctx.close()
}
await b.close()
process.exit(bad)
