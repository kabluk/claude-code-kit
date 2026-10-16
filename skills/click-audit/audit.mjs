#!/usr/bin/env node
// Click audit: press every button, check every link.
//
//   node audit.mjs --base http://127.0.0.1:4173 --dist ./dist / /app/
//   node audit.mjs --dist ./dist / /app/          # serves ./dist itself
//
// A button's verdict is by fact, not by intent: navigation, new tab, print,
// changes content, writes state, disabled, or NOTHING. We wait for hydration
// (otherwise the element list on the click page is shorter than on the listing
// page and clicks land on neighbours), address an element by its label and its
// ordinal among same-label elements, catch a new tab and stub window.print.
// A NOTHING verdict is a hypothesis: check it against the code; a choice marked
// only by a class does not change the page text.
//
// Browser: CHROMIUM env var (or --exe) is the Chromium binary; Playwright is
// resolved from the project (cwd), then from NODE_PATH.
import path from 'node:path'
import fs from 'node:fs'
import http from 'node:http'
import { createRequire } from 'node:module'

const argv = process.argv.slice(2)
const flag = (name, def) => {
  const i = argv.indexOf('--' + name)
  return i === -1 ? def : argv[i + 1]
}
if (flag('exe')) process.env.CHROMIUM = flag('exe')
const DIST = path.resolve(flag('dist', 'dist'))
const OUT = flag('out', '')
const VALUED = new Set(['--base', '--dist', '--out', '--exe'])
const PAGES = argv.filter((a, i) => a.startsWith('/') && !VALUED.has(argv[i - 1]))
if (PAGES.length === 0) {
  console.error('usage: audit.mjs [--base http://host:port] [--dist ./dist] [--out report.json] [--exe chromium] /page/ [/page2/ ...]')
  process.exit(2)
}

// --- browser ---------------------------------------------------------------
async function launchChromium() {
  const req = createRequire(path.join(process.cwd(), 'package.json'))
  let pw
  try { pw = req('playwright') } catch {
    try { pw = req('playwright-core') } catch {
      console.error('click-audit: playwright not found (install it in the project or set NODE_PATH)')
      process.exit(2)
    }
  }
  const executablePath = process.env.CHROMIUM || undefined
  return pw.chromium.launch({ executablePath })
}

// --- static server for --dist, with headers from a Cloudflare/Netlify-style _headers file
function parseHeaders(dir) {
  const file = path.join(dir, '_headers')
  if (!fs.existsSync(file)) return []
  const rules = []
  let cur = null
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    if (!/^\s/.test(line)) { cur = { pattern: line.trim(), headers: [] }; rules.push(cur); continue }
    const m = line.trim().match(/^([^:]+):\s*(.*)$/)
    if (cur && m) cur.headers.push([m[1].trim(), m[2]])
  }
  return rules
}
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml', '.woff2': 'font/woff2' }
async function siteFrom() {
  if (flag('base')) return { base: new URL(flag('base')).origin, close: async () => {} }
  if (!fs.existsSync(DIST)) { console.error(`click-audit: no --base and ${DIST} does not exist`); process.exit(2) }
  const rules = parseHeaders(DIST)
  const match = (pattern, p) => {
    const re = new RegExp('^' + pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$')
    return re.test(p)
  }
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    let file = path.join(DIST, p)
    if (!file.startsWith(DIST)) { res.writeHead(403).end(); return }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
    else if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html'
    let status = 200
    if (!fs.existsSync(file)) { status = 404; file = path.join(DIST, '404.html') }
    for (const r of rules) if (match(r.pattern, p)) for (const [k, v] of r.headers) res.setHeader(k, v)
    if (!fs.existsSync(file)) { res.writeHead(404).end('not found'); return }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream')
    res.writeHead(status)
    fs.createReadStream(file).pipe(res)
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) }
}

const site = await siteFrom()
const BASE = site.base

// Hydration + a pass down the page one screen at a time: blocks below the
// first screen are often revealed by an on-intersect animation only, and until
// then they have empty innerText and a click on them hangs until the timeout
// (a dozen false "click failed" findings in one run before this was added).
async function settle(pg) {
  await pg.waitForTimeout(1500)
  await pg.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
    window.scrollTo(0, 0)
  })
  await pg.waitForTimeout(400)
}
const sig = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h }
const internalOk = (href) => {
  try {
    const u = new URL(href, BASE)
    if (u.origin !== BASE) return 'external'
    let p = decodeURIComponent(u.pathname)
    if (p.endsWith('/')) p += 'index.html'
    const f = path.join(DIST, p)
    return fs.existsSync(f) || fs.existsSync(f + '.html') ? 'ok' : 'DEAD'
  } catch { return 'broken href' }
}
const isDead = (l) => l.verdict === 'DEAD' || l.verdict === 'broken href'

const INIT = `window.__printed = false; window.print = () => { window.__printed = true }`
const LIST = `Array.from(document.querySelectorAll('button, summary'))`

const browser = await launchChromium()
const report = []

for (const route of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })
  await ctx.addInitScript(INIT)
  const page = await ctx.newPage()
  await page.goto(BASE + route, { waitUntil: 'networkidle' })
  await settle(page)

  const items = await page.evaluate((listSrc) => {
    // eslint-disable-next-line no-eval
    const els = eval(listSrc)
    const seen = {}
    return els.map((el) => {
      const label = (el.getAttribute('aria-label') || el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 44)
      seen[label] = (seen[label] || 0) + 1
      const r = el.getBoundingClientRect()
      return { label, nth: seen[label] - 1, tag: el.tagName.toLowerCase(), disabled: !!el.disabled, hidden: (r.width === 0 && r.height === 0) || (el.checkVisibility ? !el.checkVisibility({ visibilityProperty: true }) : false) }
    })
  }, LIST)

  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]')).map((a) => ({
      label: (a.innerText || a.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 44),
      href: a.getAttribute('href'),
      target: a.getAttribute('target') || '',
    })))
  const linkRows = links.map((l) => ({
    ...l,
    verdict: l.href.startsWith('tel:') || l.href.startsWith('mailto:') ? 'protocol' : internalOk(l.href),
  }))

  const rows = []
  for (const b of items) {
    if (b.hidden) continue
    if (b.disabled) { rows.push({ ...b, verdict: 'disabled (empty field is expected)' }); continue }
    const p2 = await ctx.newPage()
    await p2.goto(BASE + route, { waitUntil: 'networkidle' })
    await settle(p2)
    const before = await p2.evaluate(() => ({ url: location.href, text: document.body.innerText, ls: JSON.stringify(localStorage) }))
    let popup = null
    p2.once('popup', (pg) => { popup = pg })
    let err = ''
    try {
      const h = await p2.evaluateHandle(({ listSrc, label, nth }) => {
        // eslint-disable-next-line no-eval
        const els = eval(listSrc)
        const m = els.filter((el) => ((el.getAttribute('aria-label') || el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 44)) === label)
        const el = m[nth]
        if (el) el.scrollIntoView({ block: 'center' })
        return el
      }, { listSrc: LIST, label: b.label, nth: b.nth })
      const el = h.asElement()
      if (!el) throw new Error('element not found by label')
      await el.click({ timeout: 4000 })
      await p2.waitForTimeout(900)
    } catch (e) { err = String(e.message).split('\n')[0].slice(0, 80) }
    const after = await p2.evaluate(() => ({ url: location.href, text: document.body.innerText, ls: JSON.stringify(localStorage), printed: window.__printed }))
    let verdict
    if (err) verdict = 'click failed: ' + err
    else if (popup) verdict = 'new tab: ' + popup.url()
    else if (after.printed) verdict = 'print'
    else if (before.url !== after.url) verdict = 'navigates: ' + new URL(after.url).pathname
    else if (sig(before.text) !== sig(after.text)) verdict = 'changes content'
    else if (before.ls !== after.ls) verdict = 'writes state'
    else verdict = 'NOTHING'
    rows.push({ ...b, verdict })
    await p2.close()
  }

  report.push({ route, links: linkRows, buttons: rows })
  await ctx.close()
  console.log(`\n=== ${route}`)
  const dead = linkRows.filter(isDead)
  console.log(`links ${linkRows.length} · external ${linkRows.filter((l) => l.verdict === 'external').length} · dead ${dead.length}`)
  dead.forEach((l) => console.log(`  DEAD: ${l.label} -> ${l.href}`))
  for (const r of rows) console.log(`  ${r.verdict.padEnd(34)} | ${r.label}`)
}

await browser.close()
await site.close()
if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 2))
// Exit code: a dead internal link is an error. NOTHING on a button is a
// hypothesis (see SKILL.md, false findings), so it is only printed.
const deadTotal = report.reduce((n, r) => n + r.links.filter(isDead).length, 0)
const nothing = report.reduce((n, r) => n + r.buttons.filter((b) => b.verdict === 'NOTHING').length, 0)
console.log(`\nclick-audit: dead links ${deadTotal}, NOTHING buttons ${nothing} (verify by hand)`)
process.exit(deadTotal ? 1 : 0)
