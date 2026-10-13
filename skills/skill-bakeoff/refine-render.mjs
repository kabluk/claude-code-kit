// node refine-render.mjs <variant dir with refine.css> [key=/url ...]  — renders OUR built site (the `current/` folder next to
// this script) with that refine.css injected last in <head>. Pages default to home=/ ; pass one key=/url per page,
// e.g. home=/ calculator=/payment-calculator.
// Writes <key>-1280.png (full page, max 3200), <key>-390.png (first screen) and <key>-390-full.png (whole phone page,
// max 4000) for every page. Exit 1 on horizontal overflow or external requests.
// OVERFLOW_IGNORE: selectors whose content may legitimately run past the edge (default: [data-allow-overflow],nav);
// add the site's own scrolling strips, e.g. OVERFLOW_IGNORE='[data-allow-overflow],nav,.ticker'.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
let m
// local playwright first, then the global one next to node (createRequire also honours NODE_PATH)
try { m = await import('playwright') } catch { m = createRequire(path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'x.js'))('playwright') }
const chromium = m.chromium ?? m.default.chromium
const here = path.dirname(new URL(import.meta.url).pathname)
const root = path.join(here, 'current'), dir = path.resolve(process.argv[2] || '.')
const pages = (process.argv.length > 3 ? process.argv.slice(3) : ['home=/']).map((p) => p.split(/=(.*)/s).slice(0, 2))
const ignore = process.env.OVERFLOW_IGNORE || '[data-allow-overflow],nav'
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain' }
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); let base = root
  if (p.startsWith('/__refine/')) { base = dir; p = p.slice('/__refine'.length) }
  if (p.endsWith('/')) p += 'index'
  let f = path.join(base, p); if (!path.extname(f)) f += '.html'
  if (!f.startsWith(base) || !fs.existsSync(f)) { r.writeHead(404); return r.end() }
  let body = fs.readFileSync(f)
  if (f.endsWith('.html') && base === root) body = Buffer.from(body.toString().replace('</head>', '<link rel="stylesheet" href="/__refine/refine.css?' + Date.now() + '"></head>'))
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(body)
}).listen(0)
const port = srv.address().port, B = `http://127.0.0.1:${port}`
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const b = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {})
let bad = 0
for (const [key, url] of pages) for (const [w, h, mob] of [[1280, 800, false], [390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob, reducedMotion: 'reduce' })
  const ext = []; await ctx.route(/^https?:\/\//, (r) => r.request().url().startsWith(B) ? r.continue() : (ext.push(r.request().url()), r.abort()))
  const pg = await ctx.newPage(); await pg.goto(B + url, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(500)
  const over = await pg.evaluate(([W, ign]) => [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e)
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && (r.right > W + 1 || r.left < -1) && !e.closest(ign) && e.innerText?.trim() }).slice(0, 6).map((e) => `${e.tagName}.${String(e.className).slice(0, 40)} right=${Math.round(e.getBoundingClientRect().right)}`), [w, ignore])
  const sw = await pg.evaluate(() => document.documentElement.scrollWidth)
  const full = Math.min(mob ? 4000 : 3200, await pg.evaluate(() => document.documentElement.scrollHeight))
  if (mob) { await pg.screenshot({ path: `${dir}/${key}-390.png` }); await pg.screenshot({ path: `${dir}/${key}-390-full.png`, fullPage: true, clip: { x: 0, y: 0, width: w, height: full } }) }
  else await pg.screenshot({ path: `${dir}/${key}-1280.png`, fullPage: true, clip: { x: 0, y: 0, width: w, height: full } })
  console.log(`${key}-${w}: height ${full} scrollWidth ${sw}${over.length ? ' OVERFLOW ' + over.join(' | ') : ''}${ext.length ? ' EXTERNAL ' + ext.slice(0, 3).join(' ') : ''}`)
  if (over.length || ext.length || sw > w + 1) bad = 1
  await ctx.close()
}
await b.close(); srv.close(); process.exit(bad)
