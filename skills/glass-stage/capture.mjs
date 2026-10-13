#!/usr/bin/env node
// Real product screens for the stage's phones + recompressing kie.ai images to WebP.
//
//   node capture.mjs screens <out-dir> <name>=<url>[#selector] ...   → <name>.webp (546 px, like a 390×844 phone screen)
//   node capture.mjs webp <out-dir> <file.png|jpg>=<width> ...       → the same name as .webp at that width
//
// Capture from the BUILT product (a local preview server), in its dark theme.
// #selector scrolls to the block that should be visible in the phone.
// A paid screen: run with MOCK='<glob>=<json>' so the API response is replaced, as for a buyer.
// PROXY=curl: the page's external https requests (map, CDN, fonts) go through curl;
// the cloud environment's Chromium does not reach outside on its own, and a map screen comes out blank.
// Chromium itself makes the WebP (canvas.toDataURL): no sharp/Pillow needed.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'

let pw
try { pw = await import('playwright') } catch { pw = createRequire(path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'x.js'))('playwright') }
const chromium = pw.chromium ?? pw.default?.chromium
const CLOUD = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const exe = process.env.CHROMIUM || (existsSync(CLOUD) ? CLOUD : undefined)
const [, , mode, out, ...items] = process.argv
if (!mode || !out || !items.length) { console.error('usage: capture.mjs screens|webp <out-dir> <items…>'); process.exit(2) }
mkdirSync(out, { recursive: true })
// WebGL through swiftshader: without it a MapLibre map does not render headless
const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })

async function toWebp(buf, width, q = 0.8, mime = 'image/png') {
  const page = await browser.newPage()
  const data = await page.evaluate(async ([b64, width, q, mime]) => {
    const img = new Image(); img.src = `data:${mime};base64,${b64}`; await img.decode()
    const c = document.createElement('canvas'); c.width = width; c.height = Math.round((img.naturalHeight * width) / img.naturalWidth)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/webp', q)
  }, [buf.toString('base64'), width, q, mime])
  await page.close()
  return Buffer.from(data.split(',')[1], 'base64')
}

if (mode === 'screens') {
  const [mockGlob, mockBody] = (process.env.MOCK || '').split(/=(.*)/s)
  for (const it of items) {
    const [name, rawUrl] = it.split(/=(.*)/s)
    const [url, sel] = rawUrl.split('#')
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.4, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    if (process.env.PROXY === 'curl') await page.route(/^https:\/\//, (r) => {
      // --compressed is required: vector tiles arrive gzipped, otherwise MapLibre cannot parse them
      try {
        const raw = execFileSync('curl', ['-sS', '-L', '--compressed', '-m', '30', '-w', '\n%{http_code}|%{content_type}', r.request().url()], { maxBuffer: 1 << 26 })
        const t = raw.lastIndexOf(10); const [code, type] = raw.subarray(t + 1).toString().split('|')
        r.fulfill({ status: Number(code) || 200, contentType: type || 'application/octet-stream', body: raw.subarray(0, t), headers: { 'access-control-allow-origin': '*' } })
      } catch { r.abort() }
    })
    if (mockGlob) await page.route(mockGlob, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: mockBody }))
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    if (sel) await page.evaluate((s) => { const el = document.querySelector(s); if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - 90, behavior: 'instant' }) }, sel)
    await page.waitForTimeout(400)
    const buf = await toWebp(await page.screenshot(), 546, 0.78)
    writeFileSync(`${out}/${name}.webp`, buf)
    console.log(`${name}.webp ${(buf.length / 1024).toFixed(0)} KB`)
    await ctx.close()
  }
} else if (mode === 'webp') {
  for (const it of items) {
    const [file, w] = it.split('=')
    const mime = /\.jpe?g$/i.test(file) ? 'image/jpeg' : 'image/png'
    const buf = await toWebp(readFileSync(file), Number(w) || 1600, 0.8, mime)
    const name = path.basename(file).replace(/\.\w+$/, '.webp')
    writeFileSync(`${out}/${name}`, buf)
    console.log(`${name} ${(buf.length / 1024).toFixed(0)} KB`)
  }
}
await browser.close()
