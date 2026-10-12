---
name: skill-catalog
description: The map of every skill, subagent and slash command we own, grouped by job (validate an idea, plan, build a site or service, check quality and UX, launch, access, process). Use at the start of any non-trivial task to pick the right tool before improvising, when starting a new site, service, app or project, when asked "which skill", "what do we have for X", "what tools/skills exist", when a skill listed here is missing from this repo, and when adding, renaming or retiring a skill.
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
2. **Say it before doing it.** One line to the owner: "Using `<name>` for
   <reason>." When a row fits but is marked missing, give the install line
   below as the first line and continue by hand meanwhile.
3. **Load and follow.** Skills through the Skill tool, agents through the
   Agent tool, commands as `/<name>`. A row is a pointer; its own file holds
   the method.

No row fits and the task will repeat → that is a `harvest` candidate for a
new skill, not a reason to skip the catalog.

## The catalog

Kind: **skill**, **agent** (subagent), **command** (slash command),
**env** (ships with Claude Code / claude.ai, nothing to install).
Source: **kit** = `kabluk/claude-code-kit`, **idea-gates** = `kabluk/idea-gates`,
**lab** = `kabluk/lab` only.

### 1. Idea and validation (before any code)

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `idea-gates` | skill | Any new idea, niche, "is X worth building": six founder-feasibility gates, then market, then red-team, then a verdict. Always first. | idea-gates |
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
| `project-orchestrator` | command | A large project: split work by role, keep memory in `docs/project/`, resume a project in a new session. | kit |
| `workflow-graph` | command | Many tasks with dependencies: build `docs/project/GRAPH.yaml`. | kit |
| `task-loop` | command | Execute one GRAPH node in a bounded implement–verify–fix loop. | kit |
| `roadmap` | command | Directory build plan with milestones, KPIs, monetization timeline. | kit |

### 3. Build a site, service or app

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `premium-saas-claude-code` | skill | Starting or structuring a SaaS, dashboard or web app that must not look AI-generic: IA, design system, components. | kit |
| `ui-from-screenshot` | skill | Reproduce a screenshot or design 1:1 as code, with a Playwright pixel-diff loop. | kit |
| `frontend-engineer` | agent | UI, client state, accessibility, API integration. | kit |
| `backend-engineer` | agent | Server logic, APIs, integrations, background jobs. | kit |
| `data-engineer` | agent | Data model, migrations, queries, analytics events, ETL. | kit |
| `devops-engineer` | agent | CI/CD, containers, infra, deploy, observability. | kit |
| `context-memory-engineering` | skill | Building an agent or LLM pipeline: what goes into one call vs. what persists. | kit |
| `claude-api` | env | Any code that calls Claude / the Anthropic SDK: models, pricing, caching, tools. | env |
| `artifact-design` | env | A one-off page, report or prototype published as an Artifact. | env |
| `dataviz` | env | Any chart, dashboard or KPI tile. | env |

### 4. Quality, UX and review

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `gate` | skill | After fixing a bug or data defect: a test that fails with the fix mutated away, checked live. | kit |
| `qa-engineer` | agent | Test strategy, acceptance criteria, regression audit after implementation. | kit |
| `ux-ease-audit` | skill | "Rate the UX", "where will people get stuck", a re-audit before release: persona, tasks, 1–10 score. | kit |
| `external-review` | skill | An outside opinion from other LLMs on a product or idea; pasted-back reviews to verify. | kit |
| `code-review` | env | Review a diff or PR for correctness bugs. | env |
| `security-review` | env | Security pass over pending changes. | env |
| `simplify` | env | Cleanup of changed code: reuse, simplification, efficiency. | env |

### 5. Launch and growth

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `growth-strategist` | agent | Positioning, launch plan, marketing experiments, content, growth metrics — once goal and audience are defined. | kit |

### 6. Access, credentials and environment

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `secrets-and-buttons` | skill | A task needs a token, a workflow fails silently, or the next step is an owner-only button. | kit |
| `session-start-hook` | env | Setting a repo up for cloud sessions (deps, tests, linters at start). | env |
| `update-config` | env | Hooks, permissions, env vars in `settings.json`. | env |

### 7. Process, memory and writing for agents

| Name | Kind | Reach for it when | Source |
|---|---|---|---|
| `skill-catalog` | skill | This list: picking a tool, adding or retiring one. | kit |
| `harvest` | skill | End of every cycle, before handoff, whenever something repeats: turn it into a skill, rule or gotcha. | kit |
| `writing-for-agents` | skill | Creating or editing any skill, `CLAUDE.md` or `AGENTS.md`. | kit |
| `skill-creator` | env | Evals and description tuning for a skill that triggers badly. | env |
| `task-profiler` | command | Choose Haiku / Sonnet / Opus for a request by complexity and risk. | kit |
| `next-step-coach` | command | 2–3 next steps plus one web-dev term to learn, after a finished task. | kit |
| `caveman` | skill | Terse output mode to save tokens. | kit |

## Install a missing one

Cloud sessions don't follow symlinks; copy.

```bash
# from kit (skill, agent or command NAME):
git clone --depth 1 https://github.com/kabluk/claude-code-kit /tmp/kit
cp -r /tmp/kit/skills/NAME .claude/skills/        # skill
cp /tmp/kit/agents/NAME.md .claude/agents/        # agent
cp /tmp/kit/commands/NAME.md .claude/commands/    # command
# idea-gates lives in its own repo:
git clone https://github.com/kabluk/idea-gates .claude/skills/idea-gates
```

Copies drift. Before editing a copy in a project, check whether the kit
version is newer; fix in the kit first, then copy out.

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

- launch checklist for a new site (domain, analytics, sitemap, Search Console, legal pages);
- technical / on-page SEO audit of a live site;
- product analytics setup (events, funnels) beyond the `data-engineer` role.
