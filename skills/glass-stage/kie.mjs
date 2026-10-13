#!/usr/bin/env node
// Stage images through kie.ai (Nano Banana): backgrounds, ring, aurora, 3D icons, a mark redrawn from a reference.
// The key comes only from KIE_API_KEY in the environment; it is never written to files, logs or the repository.
//
//   node kie.mjs <out-dir> <palette> set                      → bg-wide, bg-tall, ring, aurora
//   node kie.mjs <out-dir> <palette> icon <name> "<subject>"   → a 3D glass icon
//   node kie.mjs <out-dir> <palette> ref <name> <file.png> "<task>"  → redraw from a reference
//   node kie.mjs <out-dir> <palette> raw <name> <aspect> "<prompt>"
//   node kie.mjs - - credit                                     → remaining credits
//
// Network goes through curl: node fetch in the cloud environment does not use the session proxy without
// NODE_USE_ENV_PROXY=1; curl always does and verifies TLS itself.
import { readFileSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { PROMPTS } from './prompts.mjs'

const KEY = process.env.KIE_API_KEY
if (!KEY) { console.error('KIE_API_KEY is not set: put the key into an environment variable (not into chat, not into a file)'); process.exit(2) }
const [, , outDir, palName, mode, ...rest] = process.argv
const curl = (args, t = 60) => execFileSync('curl', ['-sS', '-m', String(t), ...args], { encoding: 'utf8', maxBuffer: 1 << 26 })
// The header goes to curl through a private temp file (-H @file), not argv: argv is visible to every
// user on the machine in the process list. The file is 0600 and removed on exit.
const hdrDir = mkdtempSync(join(tmpdir(), 'kie-'))
const hdrFile = join(hdrDir, 'auth')
writeFileSync(hdrFile, `Authorization: Bearer ${KEY}\n`, { mode: 0o600 })
process.on('exit', () => rmSync(hdrDir, { recursive: true, force: true }))
const auth = ['-H', `@${hdrFile}`]
if (mode === 'credit') { console.log(curl([...auth, 'https://api.kie.ai/api/v1/chat/credit'])); process.exit(0) }

const PAL = JSON.parse(readFileSync(new URL('./palettes.json', import.meta.url), 'utf8'))[palName]
if (!PAL) { console.error(`no palette "${palName}" in palettes.json`); process.exit(2) }
mkdirSync(outDir, { recursive: true })
const W = PAL.words
const fill = (s) => s.replace(/\{(bg|a|b|hint)\}/g, (_, k) => W[k])

function uploadVia(file) {
  // curl reads the body from stdin: the base64 of a large image does not fit into arguments
  const b64 = readFileSync(file).toString('base64')
  const body = JSON.stringify({ base64Data: `data:image/png;base64,${b64}`, uploadPath: 'glass-stage', fileName: file.split('/').pop() })
  const out = execFileSync('curl', ['-sS', '-m', '120', ...auth, '-H', 'Content-Type: application/json', '--data-binary', '@-', 'https://kieai.redpandaai.co/api/file-base64-upload'], { input: body, encoding: 'utf8' })
  const r = JSON.parse(out)
  const url = r?.data?.downloadUrl || r?.data?.fileUrl
  if (!url) throw new Error(`upload: ${out.slice(0, 200)}`)
  return url
}

async function run(name, prompt, aspect, ref) {
  const input = ref ? { prompt, image_urls: [ref], output_format: 'png', image_size: aspect } : { prompt, output_format: 'png', image_size: aspect, aspect_ratio: aspect }
  const model = ref ? 'google/nano-banana-edit' : 'google/nano-banana'
  const created = JSON.parse(execFileSync('curl', ['-sS', '-m', '60', ...auth, '-H', 'Content-Type: application/json', '--data-binary', '@-', 'https://api.kie.ai/api/v1/jobs/createTask'], { input: JSON.stringify({ model, input }), encoding: 'utf8' }))
  const id = created?.data?.taskId
  if (!id) throw new Error(`${name}: createTask ${JSON.stringify(created).slice(0, 200)}`)
  for (let i = 0; i < 80; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const q = JSON.parse(curl([...auth, `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${id}`]))
    const st = q?.data?.state
    if (st === 'success') {
      const url = JSON.parse(q.data.resultJson || '{}').resultUrls?.[0]
      // the model returns JPEG even with output_format png, so the extension comes from the response
      const ext = (url.split('?')[0].match(/\.(png|jpe?g|webp)$/i)?.[1] || 'png').toLowerCase()
      const file = `${outDir}/${name}.${ext}`
      execFileSync('curl', ['-sS', '-m', '120', '-o', file, url])
      console.log(`${name}: ${file}`)
      return file
    }
    if (st === 'fail') throw new Error(`${name}: ${q.data.failMsg}`)
  }
  throw new Error(`${name}: timeout`)
}

const jobs = []
if (mode === 'set') for (const k of ['bg-wide', 'bg-tall', 'ring', 'aurora']) jobs.push([k, fill(PROMPTS[k].text), PROMPTS[k].aspect])
else if (mode === 'icon') { const [name, subject] = rest; jobs.push([name, `${subject}, ${fill(PROMPTS.icon.text)}`, '1:1']) }
else if (mode === 'raw') { const [name, aspect, prompt] = rest; jobs.push([name, fill(prompt), aspect]) }
else if (mode === 'ref') { const [name, file, task] = rest; jobs.push([name, `${fill(task)} ${PROMPTS.keep.text}`, '1:1', uploadVia(file)]) }
else { console.error('mode: set | icon | ref | raw | credit'); process.exit(2) }
// in parallel: kie.ai holds the queue; one after another would take N times longer
const res = await Promise.allSettled(jobs.map(([n, p, a, r]) => run(n, p, a, r)))
for (const r of res) if (r.status === 'rejected') console.error(String(r.reason))
process.exitCode = res.some((r) => r.status === 'rejected') ? 1 : 0
