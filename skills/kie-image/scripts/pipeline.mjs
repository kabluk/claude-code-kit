#!/usr/bin/env node
// Image generation through kie.ai from reference photos: upload refs → createTask → poll recordInfo → download.
// The key comes only from KIE_API_KEY in the environment; it is never written to files, logs or the repository.
//
//   node pipeline.mjs --models                                   → the model table
//   node pipeline.mjs --model <id> --refs <dir|file,file> --template <txt> --character <json> [options]
//   node pipeline.mjs --model <id> --refs <sheet,photo,…> --template <scene.txt> --character <json> --scene "<text>" --tag <name>
//   node pipeline.mjs --model <id> --refs <dir> --prompt "<text>" [options]
//
// Options:
//   --out <dir>        where results go (default out/)
//   --runs <n>         independent tasks of the same request, in parallel (default 1)
//   --scene "<text>"   fills {{SCENE}} in the template (scene mode: one shot of the character)
//   --tag <name>       output file prefix (default: character file name + model)
//   --set key=value    extra field into `input` (aspect_ratio=3:4, resolution=2K, …); repeatable
//   --field <name>     override the model's photo field; --max <n> its reference limit
//   --dry              print the request that would be sent, with placeholders for uploads; no key, no network
//
// kie.ai answers HTTP 200 even on errors: the real status is body.code (200 = ok), the reason is body.msg.
// Network goes through curl: node fetch in the cloud environment ignores the session proxy without
// NODE_USE_ENV_PROXY=1; curl always uses it and verifies TLS itself.
import { readFileSync, readdirSync, statSync, mkdirSync, mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, basename, extname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

// field: where the model takes reference photos; max: how many it accepts.
// Each model names the field differently; a wrong name is not an error, the photos are silently ignored
// and the result is a stranger. When kie.ai adds or renames a model, check its page on kie.ai/docs.
// score: ArcFace similarity to the refs' centroid in the 2026-10-25/26 run (see SKILL.md → Models).
const MODELS = {
  'wan/2-7-image-pro':                  { field: 'image_urls', max: 4, score: '0.69–0.79', note: 'leader; 4 sheets per call' },
  'gpt-image-2-image-to-image':         { field: 'input_urls', max: 16, score: '0.67', note: 'second' },
  'gpt-image-2-5-flare-image-to-image': { field: 'input_urls', max: 16, score: '0.62', note: 'third' },
  'nano-banana-pro':                    { field: 'image_input', max: 8, score: '0.10', note: 'do not use for likeness' },
  'flux-2/pro-image-to-image':          { field: 'input_urls', max: 8, score: '—', note: 'HTTP 500 twice' },
}

const args = process.argv.slice(2)
const opt = { set: {} }
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  const val = () => { const v = args[++i]; if (v === undefined) die(`${a} needs a value`); return v }
  if (a === '--models') opt.models = true
  else if (a === '--dry') opt.dry = true
  else if (a === '--set') { const [k, ...v] = val().split('='); opt.set[k] = v.join('=') }
  else if (a.startsWith('--')) opt[a.slice(2)] = val()
  else die(`unexpected argument: ${a}`)
}

function die(msg, code = 2) { console.error(msg); process.exit(code) }

if (opt.models) {
  for (const [id, m] of Object.entries(MODELS)) console.log(`${id.padEnd(36)} ${m.field.padEnd(22)} max ${String(m.max).padEnd(3)} score ${m.score.padEnd(10)} ${m.note}`)
  process.exit(0)
}

const model = MODELS[opt.model]
if (!opt.model) die('--model is required (see --models)')
if (!model && !opt.field) die(`unknown model "${opt.model}": add it to MODELS or pass --field <name> --max <n>`)
const field = opt.field || model.field
const max = Number(opt.max || model?.max || 1)
const outDir = opt.out || 'out'
const runs = Number(opt.runs || 1)

// --- refs ---------------------------------------------------------------
const IMG = /\.(jpe?g|png|webp)$/i
if (!opt.refs) die('--refs is required: a folder or a comma-separated list of photos')
let refs = opt.refs.split(',').flatMap((p) =>
  existsSync(p) && statSync(p).isDirectory() ? readdirSync(p).filter((f) => IMG.test(f)).sort().map((f) => join(p, f)) : [p])
for (const r of refs) if (!existsSync(r)) die(`no such reference: ${r}`)
if (!refs.length) die(`no images in ${opt.refs}`)
if (refs.length > max) { console.error(`${opt.model} takes ${max} references; using the first ${max} of ${refs.length}`); refs = refs.slice(0, max) }

// Photos of a real person and what is generated from them stay out of git history.
// Inside a git work tree, refs and out must be ignored before anything is read or written.
// git answers for a path that does not exist yet, so the check runs before out/ is created.
const existing = (p) => { while (!existsSync(p)) p = resolve(p, '..'); return p }
function inGitTree(p) {
  try { execFileSync('git', ['-C', existing(p), 'rev-parse', '--is-inside-work-tree'], { stdio: 'pipe' }); return true } catch { return false }
}
function ignored(p) {
  try { execFileSync('git', ['-C', existing(p), 'check-ignore', '-q', join(resolve(p), 'any.png')], { stdio: 'pipe' }); return true } catch { return false }
}
for (const p of new Set([...refs.map((r) => resolve(r, '..')), resolve(outDir)])) {
  if (inGitTree(p) && !ignored(p)) die(`${p} is inside a git repository and not ignored: add refs/ and out/ to .gitignore first`)
}

// --- prompt -------------------------------------------------------------
let prompt = opt.prompt
if (!prompt) {
  if (!opt.template || !opt.character) die('give --prompt, or --template and --character')
  const vars = JSON.parse(readFileSync(opt.character, 'utf8'))
  if (opt.scene) vars.SCENE = opt.scene
  prompt = readFileSync(opt.template, 'utf8').replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? String(vars[k]).trim() : m))
  const left = prompt.match(/\{\{\w+\}\}/g)
  if (left) die(`${opt.character} has no value for ${[...new Set(left)].join(', ')}`)
}
prompt = prompt.trim()

const slug = (s) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
const tag = opt.tag ? slug(opt.tag) : `${slug(opt.character ? basename(opt.character, '.json') : 'prompt')}-${slug(opt.model)}`
const request = (urls) => ({ model: opt.model, input: { prompt, [field]: urls, ...opt.set } })

if (opt.dry) {
  console.log(JSON.stringify(request(refs.map((r) => `<upload:${basename(r)}>`)), null, 2))
  console.error(`dry run: ${refs.length} refs → ${field}, ${runs} run(s), results would go to ${outDir}/${tag}-*`)
  process.exit(0)
}

// --- network ------------------------------------------------------------
const KEY = process.env.KIE_API_KEY
if (!KEY) die('KIE_API_KEY is not set: put the key into an environment variable (not into chat, not into a file)')
// The header goes to curl through a private temp file (-H @file), not argv: argv is visible in the process list.
const hdrDir = mkdtempSync(join(tmpdir(), 'kie-'))
const hdrFile = join(hdrDir, 'auth')
writeFileSync(hdrFile, `Authorization: Bearer ${KEY}\n`, { mode: 0o600 })
process.on('exit', () => rmSync(hdrDir, { recursive: true, force: true }))
const auth = ['-H', `@${hdrFile}`]

function call(url, body, timeout = 60) {
  const a = ['-sS', '-m', String(timeout), ...auth]
  if (body !== undefined) a.push('-H', 'Content-Type: application/json', '--data-binary', '@-')
  const out = execFileSync('curl', [...a, url], { input: body === undefined ? undefined : JSON.stringify(body), encoding: 'utf8', maxBuffer: 1 << 26 })
  let r
  try { r = JSON.parse(out) } catch { throw new Error(`${url}: not JSON: ${out.slice(0, 200)}`) }
  if (r.code !== 200) throw new Error(`${url}: code ${r.code} ${r.msg || ''}`.trim())
  return r.data
}

// Free, the file lives 24 h on kie.ai's side: enough for one session, not a place to keep refs.
function upload(file) {
  const mime = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.webp': 'webp' }[extname(file).toLowerCase()]
  const b64 = readFileSync(file).toString('base64')
  const d = call('https://kieai.redpandaai.co/api/file-base64-upload',
    { base64Data: `data:image/${mime};base64,${b64}`, uploadPath: 'kie-image', fileName: basename(file) }, 120)
  const url = d?.downloadUrl || d?.fileUrl
  if (!url) throw new Error(`upload ${file}: no URL in answer`)
  return url
}

async function task(urls, run) {
  const id = call('https://api.kie.ai/api/v1/jobs/createTask', request(urls))?.taskId
  if (!id) throw new Error(`run ${run}: createTask returned no taskId`)
  console.error(`run ${run}: task ${id}`)
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const d = call(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${id}`)
    if (d.state === 'fail') throw new Error(`run ${run}: ${d.failCode || ''} ${d.failMsg || 'failed'}`)
    if (d.state !== 'success') continue
    const result = JSON.parse(d.resultJson || '{}').resultUrls || []
    if (!result.length) throw new Error(`run ${run}: success without resultUrls`)
    const files = result.map((u, k) => {
      // models return JPEG even when asked for PNG: the extension comes from the URL
      const ext = (u.split('?')[0].match(/\.(png|jpe?g|webp)$/i)?.[1] || 'png').toLowerCase()
      const file = join(outDir, `${tag}-${run}-${k + 1}.${ext}`)
      execFileSync('curl', ['-sS', '-m', '180', '-o', file, u])
      return file
    })
    writeFileSync(join(outDir, `${tag}-${run}.json`), JSON.stringify({ model: opt.model, taskId: id, field, refs: refs.map((r) => basename(r)), set: opt.set, prompt, files, at: new Date().toISOString() }, null, 2))
    return files
  }
  throw new Error(`run ${run}: timeout after 10 min (task ${id})`)
}

const credit = () => { try { return Number(call('https://api.kie.ai/api/v1/chat/credit')) } catch { return NaN } }

mkdirSync(outDir, { recursive: true })
const before = credit()
const urls = refs.map(upload)
// in parallel: kie.ai holds the queue; one after another would take N times longer
const res = await Promise.allSettled(Array.from({ length: runs }, (_, i) => task(urls, i + 1)))
for (const r of res) r.status === 'fulfilled' ? r.value.forEach((f) => console.log(f)) : console.error(String(r.reason.message || r.reason))
// the balance is per account: this is the whole batch (and anything else spending at the same time), not per run
const spent = before - credit()
if (Number.isFinite(spent)) console.error(`credits spent by this batch of ${runs}: ${spent}`)
process.exitCode = res.some((r) => r.status === 'rejected') ? 1 : 0
