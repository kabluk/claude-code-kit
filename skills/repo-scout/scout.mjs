#!/usr/bin/env node
// Finds GitHub repositories gaining stars now and ranks them against your project profiles.
//
//   node scout.mjs <profiles.json> <state.json> <out-digest.md> [--days 30] [--top 3] [--dry]
//
// profiles.json: { "projects": [ { "name", "repo", "stage", "keywords": [...], "queries": [...] } ] }
//   queries are GitHub search qualifiers without dates, e.g. "topic:astro", "cloudflare workers in:description".
// state.json: written by this script (created when missing): star snapshots and what was already recommended,
//   so the next run shows stars gained since the last one and does not repeat a pick for 30 days.
// Output: a Markdown digest with candidates per project, for the agent to verify and annotate.
// Network goes through curl (it honours the session proxy and verifies TLS). GITHUB_TOKEN, when set, raises the
// search limit from 10 to 30 requests a minute; it is passed through a 0600 temp header file, never argv.
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const [profilesPath, statePath, outPath, ...rest] = process.argv.slice(2)
if (!profilesPath || !statePath || !outPath) { console.error('usage: node scout.mjs <profiles.json> <state.json> <out.md> [--days 30] [--top 3] [--dry]'); process.exit(2) }
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d }
const DAYS = Number(opt('--days', 30)), TOP = Number(opt('--top', 3)), DRY = rest.includes('--dry')

const hdrDir = mkdtempSync(join(tmpdir(), 'scout-'))
process.on('exit', () => rmSync(hdrDir, { recursive: true, force: true }))
const hdrFile = join(hdrDir, 'h')
writeFileSync(hdrFile, 'Accept: application/vnd.github+json\nX-GitHub-Api-Version: 2022-11-28\nUser-Agent: repo-scout\n' +
  (process.env.GITHUB_TOKEN ? `Authorization: Bearer ${process.env.GITHUB_TOKEN}\n` : ''), { mode: 0o600 })
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
const gh = q => {
  const url = 'https://api.github.com/search/repositories?' + new URLSearchParams({ q, sort: 'stars', order: 'desc', per_page: '30' })
  const out = execFileSync('curl', ['-sS', '-m', '30', '-H', `@${hdrFile}`, url], { encoding: 'utf8', maxBuffer: 1 << 25 })
  const j = JSON.parse(out)
  if (!j.items) throw new Error(`search failed for "${q}": ${(j.message || out).slice(0, 200)}`)
  sleep(process.env.GITHUB_TOKEN ? 2200 : 6500)   // stay under the search rate limit
  return j.items
}

const profiles = JSON.parse(readFileSync(profilesPath, 'utf8')).projects
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : { runs: [], repos: {} }
const now = new Date(), today = now.toISOString().slice(0, 10)
const since = new Date(now - DAYS * 864e5).toISOString().slice(0, 10)
const pushed = new Date(now - 7 * 864e5).toISOString().slice(0, 10)
const lastRun = state.runs.at(-1)
const daysSinceLast = lastRun ? Math.max(1, (now - new Date(lastRun)) / 864e5) : null

// 1. Collect candidates: young repos climbing fast, and established ones pushed this week.
const pool = new Map()
for (const p of profiles) for (const q of p.queries || []) {
  for (const extra of [`created:>${since} stars:>40`, `pushed:>${pushed} stars:>500`]) {
    let items = []
    try { items = gh(`${q} ${extra} fork:false archived:false`) } catch (e) { console.error(String(e.message || e)); continue }
    for (const r of items) pool.set(r.full_name, r)
  }
}

// 2. Score each candidate against each project.
const words = s => (s || '').toLowerCase().split(/[^a-z0-9+#.-]+/).filter(w => w.length > 1)
const recentlyPicked = name => { const t = state.repos[name]?.recommendedAt; return t && (now - new Date(t)) / 864e5 < 30 }
const picks = new Map(profiles.map(p => [p.name, []]))
for (const r of pool.values()) {
  const tokens = new Set([...(r.topics || []), ...words(r.name), ...words(r.description), (r.language || '').toLowerCase()])
  const prev = state.repos[r.full_name]?.stars
  const gained = prev != null ? r.stargazers_count - prev : null
  const perDay = gained != null && daysSinceLast ? gained / daysSinceLast : null
  const ageDays = Math.max(1, (now - new Date(r.created_at)) / 864e5)
  const velocity = perDay ?? r.stargazers_count / ageDays      // first sighting: average stars per day since creation
  for (const p of profiles) {
    const kw = (p.keywords || []).map(k => k.toLowerCase())
    const hit = kw.filter(k => k.includes(' ') ? (r.description || '').toLowerCase().includes(k) : tokens.has(k))
    if (!hit.length || recentlyPicked(r.full_name)) continue
    const score = hit.length * 3 + Math.log10(1 + r.stargazers_count) + Math.min(5, Math.log2(1 + velocity))
    picks.get(p.name).push({ r, hit, gained, velocity, score })
  }
  state.repos[r.full_name] = { ...(state.repos[r.full_name] || {}), stars: r.stargazers_count, seenAt: today }
}

// 3. Write the digest of candidates; the agent verifies each one before the owner sees it.
const fmt = x => {
  const r = x.r, delta = x.gained != null ? ` (+${x.gained} since last run)` : ` (new; ~${Math.round(x.velocity)}/day since creation)`
  return `- [${r.full_name}](${r.html_url}) ★${r.stargazers_count}${delta} · ${r.language || '—'} · ${r.license?.spdx_id || 'no licence'} · pushed ${r.pushed_at.slice(0, 10)}\n` +
    `  ${(r.description || '').replace(/\s+/g, ' ').slice(0, 200)}\n  matched: ${x.hit.join(', ')} · score ${x.score.toFixed(1)}\n  verdict: _to verify_`
}
let md = `# Repo scout — ${today}\n\nCandidates found: ${pool.size}. Window: created after ${since}, or pushed after ${pushed} with 500+ stars.` +
  (lastRun ? ` Star deltas since ${lastRun.slice(0, 10)}.` : ' First run: no star deltas yet.') + '\n'
for (const p of profiles) {
  const list = picks.get(p.name).sort((a, b) => b.score - a.score).slice(0, TOP)
  md += `\n## ${p.name} (${p.stage || 'stage?'})\n\n` + (list.length ? list.map(fmt).join('\n') : '- nothing new that matches') + '\n'
  if (!DRY) for (const x of list) state.repos[x.r.full_name].recommendedAt = today
}
writeFileSync(outPath, md)
if (!DRY) { state.runs.push(now.toISOString()); writeFileSync(statePath, JSON.stringify(state, null, 1) + '\n') }
console.log(`repo-scout: ${pool.size} candidates, digest ${outPath}${DRY ? ' (dry: state not written)' : ''}`)
