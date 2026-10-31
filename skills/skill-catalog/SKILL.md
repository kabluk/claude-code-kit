---
name: skill-catalog
description: The map of every skill, subagent and slash command we own, grouped by job (validate an idea, plan, build a site or service, check quality and UX, launch, write for people, access, process). Use at the start of any non-trivial task to pick the right tool before improvising, when starting a new site, service, app or project, when asked "which skill", "what do we have for X", "what tools/skills exist", when a skill listed here is missing from this repo, and when adding, renaming or retiring a skill.
---

# Skill catalog

The owner, after seven repos: skills existed, sessions never offered them.
This file is the single list. The `skill-catalog.sh` SessionStart hook prints
it into every session, marking what this repo lacks, so the offer is injected
rather than remembered (P-16).

## Steps

1. **Match the task to a row.** Read the task, scan the table, pick at most
   two or three rows whose *Reach for it when* fits. Done when you can name
   each one in a sentence.
2. **Say it before doing it, in the start block.** The skills go into the
   `Skills:` part of the start block that `session-focus` defines: one line
   per skill, `` `<name>` — what it does for this task ``, in the task's own
   words, not the catalog's. When a row fits but is marked missing, add
   "(not installed: <install line>)" and continue by hand meanwhile.
3. **Load and follow.** Skills through the Skill tool, agents through the
   Agent tool, commands as `/<name>`. A row is a pointer; its own file holds
   the method.

No row fits and the task will repeat → that is a `harvest` candidate for a
new skill, not a reason to skip the catalog.

## The catalog

Kind: **skill**, **agent** (subagent), **command** (slash command),
**env** (ships with Claude Code / claude.ai, nothing to install).
Source: **kit** = `kabluk/claude-code-kit`, **idea-gates** = `kabluk/idea-gates`,
**lab** = `kabluk/lab` only. An `owner/repo` source is a third-party skill: install it from that public
repository, keep its licence, and do not republish it as ours. A third-party skill
vendored into the kit is **kit** and carries its `LICENSE` and a `NOTICE.md`
(upstream repo, commit, kit changes) in its own folder.

### 1. Idea and validation (before any code)

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `idea-gates` | skill | Any new idea, niche, "is X worth building": six founder-feasibility gates, then market, then red-team, then a verdict. Always first (in `lab` its Russian twin `blue-ocean` takes this place). | idea-gates |
| `blue-ocean` | skill | Same job in Russian with DataForSEO scripts (`gap-scan`, `pain-scan`); used inside `lab`. | lab |
| `idea-audit` | skill | An idea survived the gates; before committing a build week: ToS of data sources, confounders, multi-model kill-tests. | kit |
| `idea-audit` | command | Same audit as a slash command. | kit |
| `niche-finder` | agent | Directory / programmatic-SEO niche discovery and scoring; driven by the commands below. | kit |
| `ideas` | command | 8–12 directory niche ideas for a topic. | kit |
| `discover` | command | Sweep 50–100 niches, keep the top. | kit |
| `expand` | command | 20–50 micro-niches from one base niche. | kit |
| `analyze` | command | Full niche analysis: keywords, SERP, competitors, economics, verdict. | kit |
| `compare` | command | Two niches head to head, one recommendation. | kit |
| `deepdive` | command | `/analyze` plus architecture, schema, URLs, 30-day plan. | kit |
| `deep-research` | env | Multi-source desk research with a narrative report (markets, alternatives, literature). | env |

### 2. Product and planning

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `product-lead` | agent | Goal, users, requirements, scope, success criteria. | kit |
| `software-architect` | agent | Module boundaries, contracts, cross-cutting technical decisions. | kit |
| `project-orchestrator` | skill | Start of a product session: restore state from `docs/project/` (HANDOFF, STATUS, DECISIONS), split work across roles, keep project memory. The skill form of the command below. | kit |
| `to-questionnaire` | skill | A decision you cannot answer yourself: turn it into a questionnaire someone else (a client, a partner) fills in. | mattpocock/skills |
| `project-orchestrator` | command | A large project: split work by role, keep memory in `docs/project/`, resume a project in a new session. | kit |
| `workflow-graph` | command | Many tasks with dependencies: build `docs/project/GRAPH.yaml`. | kit |
| `task-loop` | command | Execute one GRAPH node in a bounded implement–verify–fix loop. | kit |
| `roadmap` | command | Directory build plan with milestones, KPIs, monetization timeline. | kit |
| `repo-scout` | skill | Profile every project, then every two days GitHub repos gaining stars matched to each one, README-verified, with one concrete use per pick: "trending repos for our projects", set up or retune the scout. | kit |
| `spec-driven-development` | skill | A feature or project with no written spec yet: objective, commands, structure, boundaries and tests, in gated phases with a human review at each (spec, plan, tasks, implement). Hands over to the two skills below. | kit |
| `planning-and-task-breakdown` | skill | A spec exists and the work must be split into ordered, verifiable tasks with dependencies and acceptance criteria; also when a task feels too big to start. | kit |

### 3. Build a site, service or app

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `premium-saas-claude-code` | skill | Starting or structuring a SaaS, dashboard or web app that must not look AI-generic: IA, design system, components. | kit |
| `ui-from-screenshot` | skill | Reproduce a screenshot or design 1:1 as code, with a Playwright pixel-diff loop; contrast over photos and a type/tap-target scale audit. | kit |
| `frontend-engineer` | agent | UI, client state, accessibility, API integration. | kit |
| `backend-engineer` | agent | Server logic, APIs, integrations, background jobs. | kit |
| `data-engineer` | agent | Data model, migrations, queries, analytics events, ETL. | kit |
| `devops-engineer` | agent | CI/CD, containers, infra, deploy, observability. | kit |
| `context-memory-engineering` | skill | Building an agent or LLM pipeline: what goes into one call vs. what persists. | kit |
| `glass-stage` | skill | A dark premium hero or landing "like Linear / Stripe": real product screens in phones, glass, glow, floating cards, kie.ai backgrounds and 3D icons. | kit |
| `kie-image` | skill | One person or character kept consistent from reference photos through kie.ai: character sheet, AI model or influencer from a reference; picks the model by a measured ArcFace score and checks the layout by eye. | kit |
| `mockup-in-skin` | skill | Show interface options built from the product's own files, not a page drawn from scratch: "show three variants", "that is not our design". | kit |
| `skill-bakeoff` | skill | Blind comparison of design skills on one product: each draws the same pages from scratch on real data; the owner picks by screenshots. | kit |
| `claude-api` | env | Any code that calls Claude / the Anthropic SDK: models, pricing, caching, tools. | env |
| `artifact-design` | env | A one-off page, report or prototype published as an Artifact. | env |
| `dataviz` | env | Any chart, dashboard or KPI tile. | env |
| `antislop-ui` | skill | Building or reviewing a page or app UI and it must not look generated: a list of generic AI visual patterns (gradients, glass, bento, template layout, invented stats), each with the fix. Needs a `DESIGN.md` for direction; it filters, it does not design. | kit |
| `antislop-layoutmobile` | skill | A layout has to reflow from phone to desktop: breakpoints, scale, grids, overflow, tap targets, checked against the same anti-template rules. | kit |
| `frontend-design` | skill | Building a new UI or reshaping an existing one and it needs a deliberate visual direction (aesthetic, typography, layout) rather than template defaults; wins over `redesign-existing-projects` where they disagree. Vendored from anthropics/skills, unmodified. | kit |
| `redesign-existing-projects` | skill | Upgrading an existing site or app in place: scan the stack, audit generic AI patterns and missing states, fix without a rewrite. Local rules for real clients: content and photos from the client (visible `[no data: …]` markers, labelled empty frames), fonts and colours from their brand. Vendored from Leonxlnx/taste-skill. | kit |
| `incremental-implementation` | skill | Any change that touches more than one file: build in thin slices, test and commit each, never a big-bang diff. | kit |

### 4. Quality, UX and review

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `gate` | skill | After fixing a bug or data defect, when writing any test, CI gate or check script, and before saying "green" or "done" (also after a subagent reports success): a gate that fails with the fix mutated away, an honest exit code, checked live. | kit |
| `diagnosing-bugs` | skill | A hard bug or a performance regression: "debug this", something broken, throwing, failing or slow. | mattpocock/skills |
| `click-audit` | skill | "Do all the buttons work?": clicks every control on the listed pages, checks every link, classifies what each one actually did. | kit |
| `ux-designer` | skill | UX/UI principles for building or critiquing: accessibility (WCAG, EAA), microcopy, forms, navigation, onboarding, i18n, design systems. | szilu/ux-designer-skill |
| `ux-signoff-loop` | skill | "Make it beautiful", "check it like a UX designer", or a big UI change: an independent reviewer against fixed rule sets, fix, repeat until sign-off. | kit |
| `qa-engineer` | agent | Test strategy, acceptance criteria, regression audit after implementation. | kit |
| `ux-ease-audit` | skill | "Rate the UX", "where will people get stuck", a re-audit before release: persona, tasks, 1–10 score. | kit |
| `external-review` | skill | An outside opinion from other LLMs on a product or idea; pasted-back reviews to verify. | kit |
| `code-review` | env | Review a diff or PR for correctness bugs. | env |
| `security-review` | env | Security pass over pending changes. | env |
| `simplify` | env | Cleanup of changed code: reuse, simplification, efficiency. | env |
| `antislop-human` | skill | Checking a UI works for different eyes, hands and setups: contrast (ships `contrast-check.py`), keyboard, focus, states. | kit |
| `test-driven-development` | skill | Implementing logic or fixing a bug: red, green, refactor; a bug fix starts with a test that fails. Complements `gate`, which checks that a guard can fail. | kit |
| `constraint-driven-development` | skill | Before an autonomous or long agent run: write the quality bar (floors for tests, types, accessibility, security) as a contract and add a check that stops the agent from lowering it. Ships `scripts/quality-gate.mjs` for semgrep and axe reports. | kit |
| `doubt-driven-development` | skill | In flight, on a non-trivial decision: a fresh-context agent cross-examines it before it stands. Not a replacement for `code-review`, which judges a finished diff. | kit |
| `performance-optimization` | skill | A speed requirement or a suspected regression (slow queries, payload size, Core Web Vitals): measure first, then fix. | kit |
| `security-and-hardening` | skill | Building input handling, auth, uploads, secrets or integrations: security as a build step. `security-review` (env) judges pending changes; this one shapes the code before. | kit |

### 5. Launch and growth

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `site-launch` | skill | Before opening a new site to traffic, moving domain or host, "nothing in Google" or empty analytics: live check, analytics event, Search Console, legal, forms, monitoring. | kit |
| `project-pulse` | skill | Give a live project a pulse: daily metrics committed to the repo and a weekly analyst routine that sends the owner a diagnosis and actions. | kit |
| `growth-strategist` | agent | Positioning, launch plan, marketing experiments, content, growth metrics — once goal and audience are defined. | kit |
| `product-marketing` | skill | First marketing step in a project: write `.agents/product-marketing.md` (ICP, positioning, customer language, voice) that the marketing skills below read. | kit |
| `marketing-plan` | skill | A 12-month go-to-market or growth plan by AARRR fitted to the real budget and team, or "is this market big enough" (TAM/SAM/SOM). | kit |
| `marketing-ideas` | skill | Stuck on how to market something: 139 tactics filtered to stage, budget and team. | kit |
| `co-marketing` | skill | Growth through partner companies: who shares our audience, which joint campaign to run with them. | kit |
| `community-marketing` | skill | Word of mouth through a community or ambassadors (Telegram, Discord, forum): design, seed, run it. | kit |
| `referrals` | skill | Users or partners should bring users: referral or affiliate programme, review campaign, replies to bad reviews. | kit |
| `free-tools` | skill | A free calculator, generator or checker as a lead and traffic magnet: whether to build one, which, how to judge it. | kit |

### 6. Writing and copywriting

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `humanizer` | skill | A draft for people (post, email, landing copy, reply) reads as AI-written: rewrite it in the writer's voice without changing the facts; the pattern list explains why each tell reads as AI. | kit |
| `stop-slop` | skill | Writing or reviewing any prose for people and you want a short checklist: banned phrases and structures, a quick "does this sound like AI" pass before it goes out. | kit |
| `antislop` | skill | The core filter and usage modes for the `antislop-*` skills; load it first for any UI or copy work that must not read as AI-made. Its first-run wizard offers to write a pointer block into the project's `CLAUDE.md`: say no if the kit already routes there. | kit |
| `antislop-copywriting` | skill | Landing-page, product and UI copy: empty AI vocabulary, invented specifics, rule-of-three and staccato rhythm. Overlaps `stop-slop` and `humanizer`; use it for marketing and UI text, those two for prose and rewrites. | kit |
| `antislop-code` | skill | Code comments written by AI: remove the generic ones, keep the useful ones, never touch the code. | kit |

### 7. Access, credentials and environment

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `secrets-and-buttons` | skill | A task needs a token, a workflow fails silently, or the next step is an owner-only button; `probe-cloudflare.sh` asks the provider what a token can do. | kit |
| `session-start-hook` | env | Setting a repo up for cloud sessions (deps, tests, linters at start). | env |
| `update-config` | env | Hooks, permissions, env vars in `settings.json`. | env |

### 8. Process, memory and writing for agents

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `session-focus` | skill | Every session: name its thread first; each file change checked against the map of homes; another goal or repo goes to a new session with a ready prompt; every step ends with three routed options. | kit |
| `skill-catalog` | skill | This list: picking a tool, adding or retiring one. | kit |
| `harvest` | skill | End of every cycle, before handoff, whenever something repeats: turn it into a skill, rule or gotcha. | kit |
| `portfolio-audit` | skill | "What is going on across all repos", lost lessons or rules, unmerged branches, skills drifted from the kit; the weekly backup run; before rolling a playbook, hook or skill change out to several repos. | kit |
| `writing-for-agents` | skill | Creating or editing any skill, `CLAUDE.md` or `AGENTS.md`. | kit |
| `skill-creator` | env | Evals and description tuning for a skill that triggers badly. | env |
| `wait-what` | skill | The owner did not follow the last message: stop and re-pitch it plainly. | mattpocock/skills |
| `task-profiler` | command | Choose Haiku / Sonnet / Opus for a request by complexity and risk. | kit |
| `next-step-coach` | command | 2–3 next steps plus one web-dev term to learn, after a finished task. | kit |
| `caveman` | skill | Terse output mode to save tokens. | kit |

## Install a missing one

Cloud sessions don't follow symlinks; copy. `scripts/kit-sync.sh` in the kit
does it and shows what drifted:

```bash
git clone --depth 1 https://github.com/kabluk/claude-code-kit /tmp/kit
bash /tmp/kit/scripts/kit-sync.sh status                 # same / differs / missing / kept
bash /tmp/kit/scripts/kit-sync.sh install skills/NAME    # or agents/NAME, commands/NAME, or all
bash /tmp/kit/scripts/kit-sync.sh update                 # bring differing copies up to the kit
# idea-gates lives in its own repo:
git clone https://github.com/kabluk/idea-gates .claude/skills/idea-gates
# a third-party skill (source owner/repo), with its LICENSE:
git clone --depth 1 https://github.com/OWNER/REPO /tmp/src
cp -r /tmp/src/skills/NAME .claude/skills/   # path inside the repo may differ
```

A copy changed on purpose (a translation, a template rewrite) goes in
`.claude/kit-local` with the reason; `update` leaves it alone. Shared
behaviour gets fixed in the kit first, then copied out.

## Add, rename or retire a skill

1. Write it in the kit (`skills/`, `agents/` or `commands/`) through
   `writing-for-agents`; the description carries the triggers.
2. Add its row to the right section above: one line, what job and when.
   No section fits → add a section rather than stretching one.
3. Run `bash scripts/check-catalog.sh` (CI runs it too): it fails when a
   kit skill, agent or command has no row, or a `kit` row has no file.
4. Record it in `docs/playbook/HARVEST.md` if it came from a repeat.

Done when the next session of any repo sees the row at start-up without
being told.

## Known gaps

Jobs that recur with no tool yet — `harvest` candidates, not tools to
invent ahead of a real repeat:

- technical / on-page SEO audit of a live site;
- product analytics setup (events, funnels) beyond the `data-engineer` role.
