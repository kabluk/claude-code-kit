#!/usr/bin/env node
// Type-scale and tap-target audit for the rest of a site: where text is smaller
// than the floor, where it is cut off with an ellipsis, and where a link or button
// is shorter than a comfortable tap target. Run it after changing the type scale of
// one page, so the next pages start from a number instead of from eyeballing.
//
//   node scale-audit.mjs [--base http://127.0.0.1:4173] [--width 390] \
//     [--min-font 14] [--min-target 44] [--exe chrome] / /about/ /pricing/
//
// --base is also read from the BASE env var. Prints, per page: font sizes below
// --min-font grouped by size and class (with counts), clipped text, and links or
// buttons with visible text whose height is below --min-target. Small monospace or
// all-caps labels may legitimately stay small; judge those, do not bump them blindly.
// Playwright is resolved from the project; browser lookup is in browser.mjs.
import { launchChromium } from './browser.mjs'

const argv = process.argv.slice(2)
const flag = (name, def) => {
  const i = argv.indexOf('--' + name)
  return i === -1 ? def : argv[i + 1]
}
const VALUED = new Set(['--base', '--width', '--min-font', '--min-target', '--exe'])
const PAGES = argv.filter((a, i) => a.startsWith('/') && !VALUED.has(argv[i - 1]))
if (PAGES.length === 0) {
  console.error('usage: scale-audit.mjs [--base http://host:port] [--width 390] [--min-font 14] [--min-target 44] [--exe chrome] /page/ [/page2/ ...]')
  process.exit(2)
}
const BASE = (flag('base', process.env.BASE) || 'http://127.0.0.1:4173').replace(/\/$/, '')
const WIDTH = Number(flag('width', 390))
const MIN_FONT = Number(flag('min-font', 14))
const MIN_TARGET = Number(flag('min-target', 44))
if (flag('exe')) process.env.CHROMIUM = flag('exe')

const b = await launchChromium()
const ctx = await b.newContext({ viewport: { width: WIDTH, height: 844 }, reducedMotion: 'no-preference' })
const p = await ctx.newPage()
for (const route of PAGES) {
  await p.goto(BASE + route, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1000)
  const r = await p.evaluate(({ MIN_FONT, MIN_TARGET }) => {
    const small = new Map()
    const clipped = []
    const tiny = []
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) continue
      const text = (el.textContent || '').trim()
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
      const size = parseFloat(cs.fontSize)
      if (own && size < MIN_FONT) {
        const cls = typeof el.className === 'string' && el.className ? el.className : el.tagName.toLowerCase()
        const key = `${size}px · ${cls}`
        small.set(key, (small.get(key) || 0) + 1)
      }
      if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) clipped.push(text.slice(0, 40))
      if ((el.tagName === 'A' || el.tagName === 'BUTTON') && rect.height > 0 && rect.height < MIN_TARGET && text.length > 0)
        tiny.push(`${Math.round(rect.height)}px · ${text.slice(0, 32)}`)
    }
    return { small: [...small.entries()].sort((a, b) => b[1] - a[1]), clipped, tiny }
  }, { MIN_FONT, MIN_TARGET })
  console.log(`\n=== ${route}  (width ${WIDTH})`)
  console.log(`  text below ${MIN_FONT}px: ${r.small.length ? '' : 'none'}`)
  r.small.forEach(([k, n]) => console.log(`    ${n}x ${k}`))
  if (r.clipped.length) console.log('  clipped:', r.clipped.join(' | '))
  if (r.tiny.length) console.log(`  tap target < ${MIN_TARGET}px:`, [...new Set(r.tiny)].slice(0, 12).join(' | '))
}
await b.close()
