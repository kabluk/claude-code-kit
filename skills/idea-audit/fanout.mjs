#!/usr/bin/env node
// Multi-model adversarial audit of a business/product idea BEFORE anything is built.
//
// Why other models at all: in the postmortem this tool grew from, four model answers largely
// overlapped — and the fifth, alone, produced the two findings that mattered most
// (scope-of-practice risk, GLP-1 market shrinkage). Diversity of priors is the
// product here; one model auditing its own idea inherits its own blind spots.
//
// The models are NOT oracles. They generate attacks and name the cheapest decisive
// test for each. Facts come from running the tests, never from the answers.
//
// Usage:
//   node fanout.mjs <brief.md> [--out=audit] [--models=a,b,c] [--lang=en|ru] [--provider=mock]
// Env:
//   OPENROUTER_API_KEY   one key, many vendors (openrouter.ai)
//   ANTHROPIC_API_KEY    optional; used for the aggregator if present
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const briefPath = args.find(a => !a.startsWith('--'));
const opt = (n, d) => (args.find(a => a.startsWith(`--${n}=`)) ?? `=${d}`).split('=').slice(1).join('=');
if (!briefPath) { console.error('usage: fanout.mjs <brief.md> [--out=audit] [--models=..] [--lang=en|ru] [--provider=mock]'); process.exit(2); }

const brief = readFileSync(briefPath, 'utf8');
const outDir = opt('out', 'audit');
const lang = opt('lang', 'en');
const provider = opt('provider', 'openrouter');
// Model ids drift; on a 404 the script lists live candidates from /models.
const MODELS = opt('models', 'openai/gpt-5.1,google/gemini-3-pro,x-ai/grok-4,deepseek/deepseek-r1').split(',');

const ATTACK_PROMPT = `You are one of several INDEPENDENT auditors of a business idea that has not been built yet.
Your job is NOT to evaluate, score, improve, or encourage. Your job is to attack: list the
assumptions that, if false, kill the idea — and for each, the cheapest test that decides it.

Mandatory checklist. Address every item or state explicitly why it does not apply:
1. DATA SOURCES. For every external data source the idea depends on: have its terms of use
   been read? An unread terms page is NOT permission. Name the clause type that would kill
   reuse (commercial use, redistribution, derivative works, scraping/automated access) and
   whether the restriction could sit in STATUTE rather than the site's terms.
2. HEADLINE METRIC. For the idea's central number (a spread, a volume, a rate): name the
   confounder that would produce the same number WITHOUT the claimed cause.
3. SEGMENTS. If the idea spans several verticals/segments/geographies: aggregate demand
   hides dead segments. Name the segment most likely dead and the per-segment check.
4. STRUCTURAL SHIFT. Name one plausible regulation, platform, or reimbursement change that
   shrinks the market underneath the product, with a concrete current signal if you know one.
5. PAYER ASYMMETRY. Who pays? Check the inversion: do the actors with money have the worst
   data, and the actors with the best data no money?
6. TWO-MINUTE TEST. What does the target user do in two minutes of googling that makes the
   product unnecessary?
7. NAME THE INCUMBENTS. List every existing player you can actually name that already
   serves this need — including small, recent, single-operator and non-English ones, and
   government or association lists. For each: what it is, roughly when it launched, and
   whether it does the same thing or only looks similar. Do NOT reach for the famous brand
   in the category; a well-known name that does not serve this need is a wrong answer, and
   an obscure one that does is the most valuable thing you can return. If you cannot name
   any, say so plainly rather than filling the space.

Rules:
- Every attack MUST carry a decisive test: method, rough cost in USD, days, and a decision
  rule of the form "if RESULT then the idea is dead / must change".
- No opinions without a test. No praise. No suggestions to "validate with users".
- If you hold concrete knowledge the brief seems unaware of (a law, an incident, a market
  fact), put it in novel_info with enough detail to verify from a primary source.

Answer with JSON only, no prose around it:
{"attacks":[{"type":"legal_source|demand|comparability|confounder|market_structure|payer|moat|other",
"claim":"the brief's assumption under attack","why_false":"...",
"test":{"method":"...","est_cost_usd":0,"days":0,"decision_rule":"if X then dead"},
"severity":"kill|wound","novel_info":"optional"}]}`;

const AGGREGATE_PROMPT = `You are aggregating attack lists produced by several independent auditor models
about one business idea. Produce a kill-sheet in ${lang === 'ru' ? 'Russian' : 'English'} (keep technical terms, URLs and quoted clauses verbatim).

Rules, in order of importance:
1. Cluster attacks that target the same assumption. For each cluster record which models
   raised it (independent_sources).
2. NEVER discard a singleton by majority vote. Attacks raised by exactly one model go into
   their own section "Unique — check before dismissing". Empirically the single most
   valuable finding in the exercise this tool grew from came from one model out of five.
3. Rank clusters by: severity (kill first), then cost-of-late-discovery divided by test cost.
4. For each cluster output ONE merged decisive test — the cheapest that decides it.
5. End with "Run today": the top 3 tests, each with method, cost, and decision rule.
   These are the tests that must run BEFORE any code is written.

Output markdown: a ranked table (assumption | severity | sources | test | cost | decision rule),
then the Unique section, then Run today. Nothing else.`;

async function callOpenRouter(model, system, user, temperature) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY is not set');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, temperature, messages: [
      { role: 'system', content: system }, { role: 'user', content: user }] }),
  });
  if (r.status === 404 || r.status === 400) {
    const live = await fetch('https://openrouter.ai/api/v1/models').then(x => x.json()).catch(() => null);
    const family = model.split('/')[1]?.split('-')[0] ?? model;
    const near = live?.data?.map(m => m.id).filter(id => id.includes(family)).slice(0, 8) ?? [];
    throw new Error(`model ${model} rejected (${r.status}). Live ids matching "${family}": ${near.join(', ') || 'none'}`);
  }
  if (!r.ok) throw new Error(`${model}: HTTP ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.choices[0].message.content;
}

async function callAnthropic(system, user) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 8000, system,
      messages: [{ role: 'user', content: user }] }),
  });
  if (!r.ok) throw new Error(`anthropic: HTTP ${r.status} ${await r.text()}`);
  return (await r.json()).content.map(b => b.text ?? '').join('');
}

// Mock provider: proves the pipeline (fan-out, JSON extraction, aggregation input
// assembly) without spending a cent or leaking a brief. Not a substitute for a run.
const MOCK = {
  'mock/a': { attacks: [
    { type: 'legal_source', claim: 'registry data is reusable', why_false: 'terms never read', test: { method: 'fetch ToS, grep commercial/derivative/scraping', est_cost_usd: 0, days: 0, decision_rule: 'if prohibition clause found then source is dead' }, severity: 'kill' },
    { type: 'confounder', claim: 'price spread means comparison value', why_false: 'delivery model may explain spread', test: { method: 'split observed prices by delivery model', est_cost_usd: 0, days: 1, decision_rule: 'if spread <2x within one model then comparator is dead' }, severity: 'kill' } ] },
  'mock/b': { attacks: [
    { type: 'legal_source', claim: 'registry data is reusable', why_false: 'statute may restrict even purchased data', test: { method: 'read state public-records statute', est_cost_usd: 0, days: 1, decision_rule: 'if commercial-purpose regime exists then state is dead' }, severity: 'kill' },
    { type: 'market_structure', claim: 'cash market persists', why_false: 'reimbursement change absorbs it', test: { method: 'search current coverage news', est_cost_usd: 0, days: 0, decision_rule: 'if coverage announced then re-model demand' }, severity: 'wound', novel_info: 'only this model raised it' } ] },
};

function extractJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no JSON object in model output');
  return JSON.parse(m[0]);
}

mkdirSync(outDir, { recursive: true });
const results = [];
for (const model of (provider === 'mock' ? Object.keys(MOCK) : MODELS)) {
  process.stderr.write(`→ ${model}\n`);
  try {
    const raw = provider === 'mock'
      ? JSON.stringify(MOCK[model])
      : await callOpenRouter(model, ATTACK_PROMPT, brief, 0.7);
    const parsed = extractJson(raw);
    if (!Array.isArray(parsed.attacks)) throw new Error('JSON has no attacks[]');
    writeFileSync(join(outDir, `${model.replace(/[/:]/g, '_')}.json`), JSON.stringify(parsed, null, 1));
    results.push({ model, ...parsed });
    process.stderr.write(`  ${parsed.attacks.length} attacks\n`);
  } catch (e) {
    // A failed auditor is recorded, never silently skipped: three answers that
    // agree are not "consensus of four" if the fourth just errored out.
    writeFileSync(join(outDir, `${model.replace(/[/:]/g, '_')}.ERROR.txt`), String(e));
    results.push({ model, error: String(e) });
    process.stderr.write(`  FAILED: ${e.message ?? e}\n`);
  }
}

const okCount = results.filter(r => !r.error).length;
if (okCount === 0) { console.error('every auditor failed — nothing to aggregate'); process.exit(1); }

const aggInput = `IDEA BRIEF:\n${brief}\n\nAUDITOR OUTPUTS (${okCount} ok, ${results.length - okCount} failed — failures listed so you can say the audit was partial):\n` +
  results.map(r => `--- ${r.model} ---\n${r.error ? `FAILED: ${r.error}` : JSON.stringify(r.attacks, null, 1)}`).join('\n');

process.stderr.write('→ aggregate\n');
const sheet = provider === 'mock'
  ? `# Kill-sheet (mock)\n\n${results.flatMap(r => r.attacks ?? []).length} attacks from ${okCount} mock auditors; aggregation prompt assembled (${aggInput.length} chars). Live run needs OPENROUTER_API_KEY.`
  : process.env.ANTHROPIC_API_KEY
    ? await callAnthropic(AGGREGATE_PROMPT, aggInput)
    : await callOpenRouter('anthropic/claude-sonnet-5', AGGREGATE_PROMPT, aggInput, 0.2);

writeFileSync(join(outDir, 'kill-sheet.md'), sheet + '\n');
console.log(`kill-sheet: ${join(outDir, 'kill-sheet.md')} (${okCount}/${results.length} auditors ok)`);
