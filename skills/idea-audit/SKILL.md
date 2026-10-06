---
name: idea-audit
description: Adversarial audit of a business/product idea at the research stage, BEFORE any build. Runs deterministic gates (data-source terms, confounders, per-segment demand) plus a multi-model fan-out that generates kill-tests, and refuses to let the project proceed until the top kill-tests have actually run. Use when evaluating a niche, before committing to a build week, after /analyze or /deepdive, or when someone says "let's just get to the code". Triggers include idea validation, kill-test, ToS check, data source legality, niche audit, pre-build audit.
---

# Idea Audit — kill it before you build it

Born from a specific failure. A directory product was designed around licence
verification via a national licensing register; four weeks in, someone read the register's terms — commercial
and derivative reuse prohibited. The schema had the source as an enum value, three
verifications were already collected, and the moat feature lost its largest states.
Every step of that was checkable on day one for $0. Separately: the product's
headline metric (a 4.4x price spread) lived for a month with an obvious untested
confounder (mobile vs in-clinic delivery), and a 3-vertical expansion shipped
before per-vertical demand was measured — two of three verticals were dead on
measurement.

This skill is that postmortem, made mechanical. Two layers: gates you (the agent)
run yourself with primary sources, and a fan-out to OTHER models whose different
priors catch what you and the idea's author share as blind spots.

## Protocol

### 0. Write the brief

One file, `audit/brief.md`. Must contain: the product in 3 sentences; every
external data source it depends on (name + URL); the headline metric and where it
came from; the segments/verticals; who pays. If you cannot fill a field, that is
already a finding — write UNKNOWN, do not improvise.

### 1. Deterministic gates — run these yourself, no LLM opinions

**Gate A. Source terms.** For EVERY data source in the brief: fetch its terms of
use / data policy and read it. Grep targets: commercial, resale, redistribute,
derivative, download, copy, scraping, automated. Statuses: PERMISSIVE (quote the
granting sentence + URL), RESTRICTED (quote the prohibiting sentence + URL),
UNCLEAR (no terms located — **an unread or missing terms page is NOT permission**).
Check statute as well as contract where the source is governmental: Arizona's
restriction (A.R.S. s. 39-121.03) sits in public-records law and reaches data
bought from third parties, treble damages. A DNS check can shortcut families of
sources (e.g. many state board sites resolving to one shared provider → one family of terms).
**No build step may depend on a source that is not PERMISSIVE with a quote.**

**Gate B. Headline metric vs confounder.** Name the confounder that would produce
the metric without the claimed cause, then run the split NOW if the data exists.
The delivery-model split that decided a comparator's fate was one query against
data already collected. If the split cannot run yet, the metric is UNVERIFIED in
every doc that cites it.

**Gate C. Per-segment demand.** Never accept aggregate volume for a multi-segment
idea. Measure each segment separately (DataForSEO: ~$0.14 covered 101 niches).
Watch synonym-grouping inflation: Google Ads folds synonyms into one volume —
dedupe before summing.

**Gate D. Payer asymmetry.** Who pays, and do they have the data? The inversion to
look for: actors with money publish the worst data (chains, 33 and 70 locations,
zero rosters), actors with the best data have no money (one-room independents).
If monetization points at the actor with nothing to gain from the product, say so.

### 1b. Seal your own predictions first

Before reading a single model answer, write what you expect them to find, to a file,
and do not open it until the fan-out is done. Without this you cannot tell whether the
models earned their cost or merely confirmed what you already knew — hindsight makes
every finding look predicted. In the first real run this scored honestly: 9 of 10 sealed
predictions were raised by at least one model, the models produced 3 findings the sealed
list did not contain, and the sealed list held 1 finding all five models missed.

### 2. Fan-out — other models, adversarial prompt

Run `fanout.mjs`, which sits next to this SKILL.md — resolve its directory from
wherever this skill was loaded (`~/.claude/skills/idea-audit/` when installed for the
user, `.claude/skills/idea-audit/` when installed per project):

```
node <this-skill-dir>/fanout.mjs audit/brief.md --out=audit [--models=...] [--lang=en|ru]
```

Needs `OPENROUTER_API_KEY` (one key, all vendors; `ANTHROPIC_API_KEY` optional for
the aggregator). `--provider=mock` proves the pipeline offline. Cost of a live run:
roughly $0.10–0.50 with 4 mid-tier models, a few dollars with frontier ones.

Why this exists at all: the models are prior-generators, not fact sources. In the
originating exercise, answers 1–4 mostly overlapped; answer 5 alone carried the two
most consequential findings. Hence two aggregation rules baked into the prompt:
convergence across models raises priority, but **singletons are never voted away** —
they get their own section. Every `novel_info` claim a model makes must be verified
against a primary source before it is repeated anywhere; models flatter and models
hallucinate, which is why the fan-out asks for attacks with decisive tests, never
for scores.

### 3. The kill-sheet is a contract

`audit/kill-sheet.md` ends with "Run today" — the top 3 decisive tests. The rule
this whole skill exists to enforce: **no schema, no code, no build week until those
tests have run and their results are recorded** in the project's DECISIONS file,
each as "we tested X on DATE, result Y, therefore Z". A test that cannot be run
today gets a date and an owner, and the assumption it guards is marked UNVERIFIED
wherever it is used.

Re-run the audit when scope changes (a new vertical, a new data source, a new
payer) — the expansion is exactly when the last audit's answers expire.

### 4. What survives — and where the fight is

The kill-sheet buries. This step is where you exhaust the alternative, and it is not
optional: an audit that only kills is half-built. It protects you from a bad build and
tells you nothing about where to stand, which leaves the author with a demolished idea
and no next move — the state in which people go and build the demolished thing anyway.

Same evidentiary bar as every step above. A surviving position needs a named gap and a
measurable condition, not encouragement. **You may not list a survivor you cannot attach a
number to**, and the number goes in the same "Run today" contract as the kill-tests.

For each thing still standing after the attacks, write:
- what remains true once every kill-test has landed;
- who already occupies that ground — reuse the incumbents named in checklist item 7, and
  say plainly if one of them is already doing it;
- what the platform vendor will structurally never do. Do not plan to move a vendor.
  Vendors ship plumbing and serve the average; they accept your data, they do not fix it,
  and they have no opinion about your specific catalog. That asymmetry, not a feature gap,
  is where a durable position sits;
- the precedent, if there is one, with its numbers;
- the conditions that must hold, each with the cheapest test that decides it.

The precedent worth internalising, because it inverts the intuition that a free automatic
platform feature closes a market: Google Merchant Center has accepted free product feeds
for two decades, and on top of that free automatic pipe sits Feedonomics (acquired by
BigCommerce for roughly $145M), Productsup ($71M Series B, two trillion products a month
for 900+ brands), DataFeedWatch and Channable. None competes with Google. The free pipe
created the category, because accepting data and making it correct are different jobs and
the platform only does the first.

## What the first run actually produced

Five models, ~57 attacks, on a live product (an accessibility-compliance directory). Kept as calibration, because the
pattern is what justifies the protocol's shape:

- **The gates beat the models five times.** The most-cited attack — "your catalog is an
  unlicensed derivative database", raised by three models, one recommending $2,500 of
  counsel — was refuted in one query against our own data: 722 distinct source hosts,
  85% pointing at the vendor's own site, largest third-party concentration 1.3% against
  the model's own ≥25% threshold. Another model's "you have hardcoded constants"
  prescription was already implemented in the codebase. A quoted terms page and a query
  over your own data beat model consensus every time.
- **Verifying an attack beat the attack.** Chasing a wrong claim about inconsistent
  numbers found that 20 countries and 69 catalog records had no pages at all. Checking a
  competitor claim found the measurement error that hid it: the SERP check had tested
  buy-intent queries while the competitor ranked on the informational queries the funnel
  actually starts from.
- **Two models flatly contradicted each other** on the single most load-bearing fact
  (whether EAA fines have been issued). Only a primary source settled it — and the answer,
  zero fines EU-wide with private competitor warning letters driving the real urgency,
  changed who the buyer is.
- **Attacks saturate before test design does.** By the fifth answer no new attack
  surface appeared — every cluster had several independent sources. The sixth answer
  still improved four *tests*: renewal rather than first payment as the payer signal;
  vendor response time as a supply-quality check; sequencing a cheap SERP screen before
  an expensive one rather than treating them as alternatives; and fixing an LLM layer
  architecturally (structured finding → reviewed templates, model rewrites and
  translates but never determines a legal result) instead of by disclaimer. So stop
  fanning out when attacks repeat, but read late answers for how they would run the
  tests you already have.
- **The singletons carried the run.** The two most consequential findings each came from
  exactly one model out of five, and the fifth model alone caught a risk the other four
  missed. Majority voting would have deleted both. This is why the aggregation rule is
  what it is.

## Measured against a commercial idea-validation tool

The same pre-audit brief for a project whose answers we already knew, given to a paid
60-second "test your idea, get proof" service. It scored 1 partial hit of 12 known
findings, cited nothing, invented a market size and an LTV comparison, named a famous
competitor the brief had explicitly ruled out, and returned *VC Scorecard 59 | Viable*.

Two of its findings pointed backwards: it listed the project's licence-verification moat
as a strength (the register's terms make it unusable) and its weakest vertical as a
growth opportunity (a 1.8x price spread with nothing to compare). Both landed in a
section headed **"YOUR LEVERAGE POINTS — build on these strengths."** That is the
mechanism, not bad luck: a section that must be filled with strengths gets filled with
strengths whether they exist or not. It is why this skill's prompt forbids praise and
scores, and asks only for attacks carrying decisive tests. A 59/100 is unfalsifiable and
tells nobody what to do on Monday; "invoice 100 vendors, card on file only, <10 paying →
the model is dead" is both.

The one thing worth taking from it: its competitor section had the right shape. This
skill reached competitors only obliquely through the two-minute test, which found a
direct competitor once, indirectly. Checklist item 7 now asks for them by name, warns
against reaching for the famous brand, and asks for an honest "none" over a filled space.

## What this skill is not

Not a scoring rubric, not market-size estimation, not a substitute for reading a
primary source. If the fan-out and the gates disagree, the gates win: a quoted
terms page beats four models' consensus every time.
