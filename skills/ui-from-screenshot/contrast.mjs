#!/usr/bin/env node
// Contrast of text over a photo, a gradient or a semi-transparent tint.
//
// A "text colour vs background colour" scanner lies on such a backdrop: the
// background is not uniform, and an average over the block hides the dark patch
// of the photo where the line actually drowns. This script takes the real
// rectangles of the text LINES (Range.getClientRects, not the element's bounding
// box), hides the text, captures the background and finds the darkest pixel in
// each rectangle: the worst case exactly where the letters sit.
//
//   node contrast.mjs --url http://127.0.0.1:4173/ \
//     --area .hero [--hide .hero-text] --widths 360,390,430 \
//     --text '.hero h1=#0b2545' --text '.hero .lead=#4f6480' [--min 4.5] [--exe chrome]
//
// --area   element whose box is captured (default body)
// --hide   selector hidden before the capture (default: the --text selectors)
// --text   '<selector>=#rrggbb', repeatable; the colour is the text colour you ship
// --min    optional: exit 1 when the worst ratio is below it
// WCAG AA: 4.5 for normal text, 3.0 for large text (>=24px, or >=18.66px bold).
// The darkest-pixel search assumes dark text on a light backdrop; for light text
// on a dark photo, swap it to the brightest pixel (see `pick` below).
// Playwright is resolved from the project; browser lookup is in browser.mjs.
import { launchChromium } from './browser.mjs'

const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? def : args[i + 1]
}
const all = (name) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []))

const url = opt('url')
const area = opt('area', 'body')
const hide = opt('hide', null)
const widths = opt('widths', '390').split(',').map(Number)
const min = opt('min', null)
const targets = all('text').map((s) => {
  const i = s.lastIndexOf('=')
  return { sel: s.slice(0, i), color: s.slice(i + 1) }
})
if (opt('exe')) process.env.CHROMIUM = opt('exe')

if (!url || targets.length === 0 || targets.some((t) => !/^#[0-9a-f]{6}$/i.test(t.color))) {
  console.error('usage: contrast.mjs --url <page> --text "<selector>=#rrggbb" [--text ...] [--area sel] [--hide sel] [--widths 360,390] [--min 4.5] [--exe chrome]')
  process.exit(2)
}

const lin = (v) => {
  v /= 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const lumHex = (h) => {
  const n = parseInt(h.slice(1), 16)
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
}
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

const browser = await launchChromium()
let worstOverall = Infinity

for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  const rects = await page.evaluate((targets) => {
    const out = []
    for (const { sel, color } of targets) {
      document.querySelectorAll(sel).forEach((el) => {
        const r = new Range()
        r.selectNodeContents(el)
        for (const b of r.getClientRects()) {
          if (b.width > 4 && b.height > 4) out.push({ sel, color, x: b.x, y: b.y, w: b.width, h: b.height })
        }
      })
    }
    return out
  }, targets)

  const box = await page.locator(area).first().boundingBox()
  if (!box) {
    console.error(`area ${area} not found at width ${width}`)
    process.exitCode = 1
    await ctx.close()
    continue
  }
  if (rects.length === 0) console.error(`no text lines matched at width ${width}: check the --text selectors`)

  await page.addStyleTag({ content: `${hide ?? targets.map((t) => t.sel).join(',')}{visibility:hidden !important}` })
  await page.waitForTimeout(300)
  const shot = await page.screenshot({ clip: box })

  const worst = await page.evaluate(
    async ({ b64, rects, ox, oy }) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + b64
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const g = c.getContext('2d')
      g.drawImage(img, 0, 0)
      const d = g.getImageData(0, 0, c.width, c.height).data
      const lin = (v) => {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      }
      const pick = (a, b) => Math.min(a, b) // darkest pixel = worst case for dark text
      const res = {}
      for (const r of rects) {
        const x0 = Math.max(0, Math.round(r.x - ox))
        const y0 = Math.max(0, Math.round(r.y - oy))
        const x1 = Math.min(c.width, Math.round(r.x - ox + r.w))
        const y1 = Math.min(c.height, Math.round(r.y - oy + r.h))
        let L = null
        for (let y = y0; y < y1; y++)
          for (let x = x0; x < x1; x++) {
            const i = (y * c.width + x) * 4
            const l = 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2])
            L = L === null ? l : pick(L, l)
          }
        if (L === null) continue // line outside the captured area
        const k = r.sel + '|' + r.color
        if (!(k in res) || pick(L, res[k]) === L) res[k] = L
      }
      return res
    },
    { b64: shot.toString('base64'), rects, ox: box.x, oy: box.y },
  )

  console.log(`--- width ${width}`)
  for (const [k, L] of Object.entries(worst)) {
    const [sel, color] = k.split('|')
    const cr = ratio(lumHex(color), L)
    if (cr < worstOverall) worstOverall = cr
    console.log(`  ${sel.padEnd(20)} ${color}  background ${L.toFixed(3)}  contrast ${cr.toFixed(2)}`)
  }
  await ctx.close()
}

await browser.close()
console.log(`worst contrast: ${worstOverall.toFixed(2)}`)
if (min !== null && worstOverall < Number(min)) {
  console.log(`FAIL: below --min ${min}`)
  process.exit(1)
}
