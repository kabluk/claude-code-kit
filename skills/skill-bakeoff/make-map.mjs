// A real map basemap for mock-ups: node make-map.mjs <folder> <name> <west,south,east,north>
// MapLibre + CARTO vector styles (positron, voyager, dark-matter), no key needed. CARTO raster
// tiles answer "API KEY REQUIRED", hence GL. The cloud environment's Chromium does not
// reach external HTTPS, so every page request goes through curl (curl verifies TLS);
// `--compressed` is required: without it .mvt arrive gzipped and MapLibre says "Unable to parse the tile".
// Output: <name>-<style>-{wide,tall}.png (1600×1000 and 700×1200 CSS px at 1.5x) and <name>-map.json
// with the bounds of each image and the marker formula pos(lat,lng,bounds) → left%/top%.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { createRequire } from 'node:module'
let m
// local playwright first, then the global one next to node (createRequire also honours NODE_PATH)
try { m = await import('playwright') } catch { m = createRequire(join(dirname(process.execPath), '..', 'lib', 'node_modules', 'x.js'))('playwright') }
const chromium = m.chromium ?? m.default?.chromium
const [dirArg, name, bboxArg] = process.argv.slice(2)
if (!dirArg || !name || !bboxArg) { console.error('usage: node make-map.mjs <dir> <name> <west,south,east,north>'); process.exit(2) }
const DIR = resolve(dirArg) + '/'
const [west, south, east, north] = bboxArg.split(',').map(Number)
mkdirSync(DIR, { recursive: true })
const STYLES = { positron: 'positron-gl-style', voyager: 'voyager-gl-style', dark: 'dark-matter-gl-style' }
const SHAPES = { wide: [1600, 1000], tall: [700, 1200] }
const cache = new Map()
function fetchViaCurl(url) {
  if (cache.has(url)) return cache.get(url)
  const body = execFileSync('curl', ['-sS', '-L', '--compressed', '-m', '30', '-A', 'design-mock/1.0', '-w', '\n%{http_code}|%{content_type}', url], { maxBuffer: 1 << 26 })
  const tail = body.lastIndexOf(10)
  const [code, type] = body.subarray(tail + 1).toString().split('|')
  const r = { status: Number(code) || 200, contentType: type || 'application/octet-stream', body: body.subarray(0, tail) }
  cache.set(url, r)
  return r
}
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const b = await chromium.launch({ ...(existsSync(exe) ? { executablePath: exe } : {}), args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
const meta = { attribution: '© OpenStreetMap contributors © CARTO', images: {} }
for (const [style, gl] of Object.entries(STYLES)) for (const [shape, [w, h]] of Object.entries(SHAPES)) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1.5 })
  await ctx.route(/^https:\/\//, (route) => { try { const r = fetchViaCurl(route.request().url()); route.fulfill({ status: r.status, contentType: r.contentType, body: r.body, headers: { 'access-control-allow-origin': '*' } }) } catch { route.abort() } })
  const pg = await ctx.newPage()
  pg.on('console', (c) => { if (/maperr/.test(c.text())) console.log(c.text().slice(0, 200)) })
  await pg.setContent(`<!doctype html><link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"><style>html,body,#m{margin:0;width:100%;height:100%}.maplibregl-ctrl-attrib,.maplibregl-ctrl-logo{display:none}</style><div id="m"></div>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>window.map=new maplibregl.Map({container:'m',style:'https://basemaps.cartocdn.com/gl/${gl}/style.json',bounds:[[${west},${south}],[${east},${north}]],fitBoundsOptions:{padding:30},attributionControl:false,preserveDrawingBuffer:true,interactive:false});
map.on('error',e=>console.log('maperr',e.error&&e.error.message));map.on('idle',()=>{window.done=true})</script>`)
  await pg.waitForFunction('window.done === true', null, { timeout: 120000 })
  const bounds = await pg.evaluate(() => { const g = map.getBounds(); return { west: g.getWest(), east: g.getEast(), north: g.getNorth(), south: g.getSouth(), zoom: map.getZoom() } })
  const file = `${name}-${style}-${shape}.png`
  await pg.screenshot({ path: DIR + file })
  meta.images[file] = { size_css_px: [w, h], ...bounds }
  console.log(file, bounds.zoom.toFixed(2))
  await ctx.close()
}
await b.close()
meta.howto = 'Web Mercator. For image with bounds {west,east,north,south}: left% = (lng-west)/(east-west)*100; top% = (mercY(north)-mercY(lat))/(mercY(north)-mercY(south))*100, where mercY(lat)=ln(tan(pi/4+lat*pi/360)). Always show the attribution on the map.'
meta.js = 'const mercY=a=>Math.log(Math.tan(Math.PI/4+a*Math.PI/360));const pos=(lat,lng,b)=>({left:(lng-b.west)/(b.east-b.west)*100,top:(mercY(b.north)-mercY(lat))/(mercY(b.north)-mercY(b.south))*100});'
writeFileSync(DIR + name + '-map.json', JSON.stringify(meta, null, 1))
