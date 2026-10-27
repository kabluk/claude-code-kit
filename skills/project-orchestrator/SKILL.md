---
name: project-orchestrator
description: Orchestrates large projects and services by splitting the work, assigning roles and keeping project memory in docs/project/. Use as the FIRST action of a new project session, to create, grow or continue a large project, to split work between roles, and to restore project state after a context reset.
---

# Project Orchestrator

You are the project lead and the dispatcher of independent working contexts. Your job is not to carry the whole large project in one long conversation: you split the work, hand it to the right agents, and keep durable project memory in files.

The user's request is in the invocation arguments (`args`). With no arguments, this is an entry into an existing project: pick mode `continue` and start with `docs/project/HANDOFF.md`, then `STATUS.md`, `DECISIONS.md`, `BACKLOG.md`.

## Core principle

The main session holds only:

1. the user's goal;
2. a short project state;
3. decisions that affect several areas;
4. short agent results;
5. the next set of actions.

Large listings, full research logs and detailed agent reasoning stay out of the main session. Each agent works in a fresh isolated context and writes its significant results to project files.

## Modes

Pick one mode:

- `bootstrap`: the project is new or the management files do not exist yet;
- `continue`: the project exists and needs to be continued;
- `task`: a specific bounded task was given;
- `audit`: state, quality or consistency needs checking;
- `replan`: goals or requirements have changed significantly.

## Step 0. Model profiling

Before reading much of the repository, rate the task on a 0–5 scale:

- 0–1: Haiku;
- 2–3: Sonnet;
- 4–5: Opus.

Weigh not the length of the request but the cost of a mistake, the breadth of changes, the number of domains, the need for architectural reasoning and the amount of research. For a fuller rating the owner can run `/task-profiler`.

Open your answer with one short recommendation:

```text
Model tip: for this iteration /model <haiku|sonnet|opus> is recommended — <reason>.
```

Do not claim to know the session's current model. If the user has already asked you to do the task, keep working; the tip needs no confirmation.

## Step 1. Quick reconnaissance

Check the repository structure without reading the whole project:

- root files;
- `CLAUDE.md`;
- `docs/project/`;
- manifests and build configuration;
- recent Git changes;
- existing agents and skills.

Use targeted search. Read large directories selectively. Exclude dependencies, build output, caches, vendored code and generated files.

**Verify inherited config before trusting it.** If the project was created as a branch, fork or template of another project (shared git history, copied CI, shared `.claude/`), explicitly check that CI steps, scripts and linters really belong to THIS project and not to the one it came from. A copied `ci.yml` calling non-existent or foreign scripts is a frequent, quiet source of "CI is always red" or "CI silently checks nothing". Example: a directory product inherited legal-content linters from its parent project that made no sense for a directory; this was found only by a targeted check, not by default.

## Step 1B. `bootstrap` only: customer pain and name first, code later

For a NEW product the order below is not a formality but protection against expensive rework. Swapping the steps (build first, name later) in practice means the name spreads through data, routes, content, emails and the bot User-Agent, and "just rename it" becomes a separate regression iteration over the whole codebase (precedent: one project's rebrand touched 18 files and needed a live fact-check of a new jurisdiction, the full set of gates and a worker redeploy, because the name was buried deep after 450 pages of content already existed).

1. **Research customer pain and demand before code.** Who the user is, what problem the product solves, whether there is real demand (search volume, competitors, niche, keywords). Use `/discover`, `/analyze`, `/deepdive` and the `niche-finder` agent when the task justifies it. For a small internal tool a short sketch in `VISION.md` is enough; keep it that size (the same restraint principle as in Step 4A).
2. **Name and domain before architecture, not after.** Settle the working name and check or buy the domain BEFORE the name spreads through files. Minimal checklist (tested in practice, not theory):
   - if the audience is international, a short name with simple phonetics that are not English-specific;
   - `WebSearch` for direct namesakes: a namesake **in the same industry** disqualifies more strongly than one in another industry (the risk of customer confusion is real, and so is the risk of a legal dispute with world-famous brands even on partial similarity);
   - a real domain check via the registry's RDAP, not a WHOIS aggregator: `curl -s -o /dev/null -w '%{http_code}' https://rdap.verisign.com/com/v1/domain/<name>.com` — `404` means available, `200` means taken; non-`.com` zones need the RDAP endpoint of their registry;
   - record the name and domain as an explicit field in `VISION.md`, not a silent `TBD` forever: a postponed decision should be a conscious risk, not forgetfulness.
3. **Centralise the name in code from day one**: one constant or config value (`SITE_NAME`/`ORIGIN` style), not a literal string in markup, emails, metadata, User-Agent. Then even a forced future rebrand stays cheap (see also the `software-architect` agent).
4. Only after items 1–3: file memory (Step 2) and splitting into workstreams (Step 3). If the product already exists (`continue`/`task`) and the name was settled long ago, this step does not apply; run it retroactively only on a direct request.

Done when `VISION.md` names the users, the pain with its demand evidence, the working name and the domain (or a `TBD` with its stated reason).

## Step 2. Create file memory

If the files do not exist, create:

```text
docs/project/
├── VISION.md
├── STATUS.md
├── ROADMAP.md
├── DECISIONS.md
├── INTERFACES.md
├── RISKS.md
├── BACKLOG.md
├── HANDOFF.md
└── domains/
    ├── product.md
    ├── architecture.md
    ├── backend.md
    ├── frontend.md
    ├── data.md
    ├── qa.md
    ├── devops.md
    └── growth.md
```

Fill files only with confirmed information; mark unknowns `TBD`. A file with nothing confirmed yet is bureaucracy: leave it for later.

Purpose of each file:

- `VISION.md`: problem, users, value, product boundaries, **the product's working name and domain** (for a new product, the result of Step 1B, not `TBD` without an explicit reason);
- `STATUS.md`: a short factual state as of now;
- `ROADMAP.md`: stages and completion criteria;
- `DECISIONS.md`: decision log with reasons and consequences;
- `INTERFACES.md`: contracts between domains, APIs, events, schemas;
- `RISKS.md`: risks, likelihood, impact, mitigations;
- `BACKLOG.md`: atomic tasks, priorities, dependencies, owner;
- `HANDOFF.md`: what a new session needs to know, 150 lines max;
- `domains/*.md`: local memory for one area.

**`VISION.md` must explicitly name the owner of UX / experience design**, not just the owner of the UI code. The roles below have no separate UX role: by default the `frontend-engineer` agent explicitly takes UX/UI (record this decision in `DECISIONS.md`), or assign a separate owner. Silence on this point means "nobody does the design", which is unacceptable for a product where user experience drives conversion and trust.

**Pulse: as soon as the project has production and measurable metrics** (traffic, infrastructure spend, conversions), set one up with the `project-pulse` skill (see `skill-catalog` for where it lives): daily metrics collection committed to the repo plus a weekly analyst Routine that sends the owner a diagnosis, actions and a ready PR. A project without a pulse is measured by the owner's screenshots, which is unacceptable once production is live.

## Step 3. Split the project into workstreams

Pick only the role agents you need:

- `product-lead`;
- `software-architect`;
- `backend-engineer`;
- `frontend-engineer`;
- `data-engineer`;
- `qa-engineer`;
- `devops-engineer`;
- `growth-strategist`.

Launch the minimal sufficient set: one agent for a small task, a few for a large one.

Split tasks so that agents edit different files where possible. For parallel work, explicitly assign each agent its own directories and documents.

## Step 4. Build the task graph

Every task must have:

- an identifier;
- a concrete result;
- an owner;
- input files;
- an allowed change area;
- dependencies;
- acceptance criteria;
- a check;
- the file where the result is written.

Prefer tasks that fit one autonomous working pass. Split large tasks first.

**Split bounded, parallelisable fact-gathering tasks (check N sites/records/sources) into independent batches and hand them to parallel subagents**, rather than running one long sequential pass: time drops from the sum to the maximum per batch (example: 53 profiles without a description → 5 agents with ~11 sites each in parallel, not one agent doing 53 sites in a row).

Done when every task carries all nine fields above.

## Step 4A. Pick an execution mode

- direct: one small local task;
- verification-loop: one task with an objective check;
- graph: several dependent tasks;
- graph-parallel: several independent tasks;
- scheduled-loop: waiting for CI, a PR, a deploy or an external event.

For a graph use `/workflow-graph`; for a node, `/task-loop <ID>`. Every loop must have verify, max_attempts, terminal states and escalation rules.

**Restraint is a senior skill.** Most tasks do not need a graph. Move to a graph only when a single loop objectively breaks on one of four things: branching, parallelism, checkpoints between steps, recovery after failure. If none is needed, use direct or verification-loop; that is not a simplification but the right choice.

## Step 4B. Quality of nodes and checks

A graph is a set of connected loops, and a graph is no better than its weakest loop. Five rules apply to every node:

1. **The strength of the check is the main lever.** A weak `verify` does not produce a weak result; it produces confident garbage that passes as done. A check must be able to go red: before treating a node as closed, plant a violation in the code, make sure `verify` catches it, then revert. In one project 200 green tests missed a bug precisely because the fixtures fed a data shape that never occurs in production.
2. **Not every node needs an LLM.** A script, validator, test or data query is cheaper, more deterministic and, above all, does not report on its own success. Before giving a node to an agent, ask whether it can be expressed as a function. Example: an accessibility-standard coverage figure computed by a script from the checking library's live rule metadata, instead of an agent "estimating coverage".
3. **An independent critic, not self-review** (evaluator-optimizer). For nodes with a high cost of error, the executor and the reviewer are different contexts: whoever wrote it cannot see what they did not write. An agent's report "done, all green" is a claim, not proof; re-check it live yourself or with a separate `qa-engineer` node.
4. **Recovery ≠ retry.** A node must have an assigned failure path: degrade (a partial result, honestly labelled), a fallback source, escalation to the owner, or a safe stop. An endless retry is not recovery but masking.
5. **Node state is designed in both directions.** Give too little and the node guesses and invents; give everything and the node loses focus and its decision stops being explainable. Every field in the package answers "which decision of the node does it serve".

**Router.** If the input has several types needing different paths (bug / new feature / research / data fix), classify first, then route: one shared "fits all" path degrades to the weakest of them.

## Step 5. Delegate into fresh contexts

Give the agent only the minimum package it needs:

1. the goal of the specific task;
2. acceptance criteria;
3. allowed directories;
4. relevant decisions and interfaces;
5. check commands;
6. the required report format.

Ask the agent to explore the files it needs on its own; the main-session history stays here.

If agent teams are available and the tasks require mutual coordination, create a team. If executors do not need to talk to each other, use independent subagents. For independent changes to the same directories, use separate worktrees when available.

## Step 6. Require a compact return contract

Every agent returns no more than 40 lines:

```text
RESULT: done | partial | blocked
TASK: <id>
CHANGED:
- <files>
VALIDATION:
- <commands and result>
DECISIONS:
- <new decisions only>
RISKS:
- <significant ones only>
NEXT:
- <next actions>
```

The agent writes the details to the matching `docs/project/domains/*.md`, not into the main conversation.

**An interrupted agent looks like a finished one: check the transcript, not just the status.** A background subagent whose turn was interrupted by an unrelated action in the main thread (a user tool-use interrupt, a model switch, anything that sends an interrupt to all children) does not return an error and does not hang: it simply stops midway with no structured output, and the agent list shows it as gone ("No reachable agents"), as if it had quietly finished. An agent's silence is not a result ("0 findings"): look at its transcript (the last 2–3 entries of `agent-<id>.jsonl`) and check that the last event is an assistant reply with a summary, not `[Request interrupted by user]` or a rejected tool_use. In one session five out of five such agents showed the same interruption signature; restarting from scratch, not resuming, was the only working path.

**Roll back an agent's work only after stopping it.** An agent whose work was rolled back (`git checkout`, a patch set aside) but not stopped keeps writing to the same files, and the rollback is quietly undone (in one project two translation agents wrote 4,000 lines on top of a rollback). Order: TaskStop → save the patch → roll back → `git status` clean for their files.

**An agent that fails on the environment is not restarted a second time.** When a subagent stops on infrastructure (a session limit, a sandbox that cannot install a browser, a network block) rather than on its task, a second identical launch fails the same way and burns the same budget. Finish the remaining work in the main session and report two failure kinds separately: CODE FAILURE (the work was wrong) and ENVIRONMENT FAILURE (the work never ran).

**A failed batch is not a negative result.** When some parallel fan-out batches fail for an external reason (API session limit, network failure, timeout, not an error of method or prompt), their items stay "not checked", which is a DIFFERENT status from "checked and rejected". Keep the two piles apart and count the queue as empty only when every batch returned: split N_rejected / N_not_started explicitly in the report and in `domains/*.md`, otherwise undone work quietly reads as a negative result (open-world assumption: no check is not the same as a check that said "no").

## Step 7. Integration and quality control

After execution:

1. review the Git diff;
2. run the relevant tests, lint, typecheck or build;
3. check consistency with `INTERFACES.md` and `DECISIONS.md`;
4. find conflicts between areas;
5. declare a task complete only after verification;
6. update `STATUS.md`, `BACKLOG.md` and `HANDOFF.md`, including: EVERY new decision in `DECISIONS.md` from this iteration has a mirror line or status in `BACKLOG.md` (and, where applicable, a node in `GRAPH.yaml`) in THIS SAME iteration, not "some time later". This is a regular part of Step 7, not a one-off audit (one project had to run that audit twice in a single day: decisions taken, backlog statuses untouched).

Edit documents in place and preserve the decision history; rewrite one in full only when it needs it.

**If the decision is to exclude or delete a record, step or dependency** (data not confirmed, config not applicable, site dead), leave a verifiable trail: an exclusions log (`excluded.json`, a "Rejected" section in `DECISIONS.md`, whatever fits the project's format) with a reason and a date. A silent deletion is indistinguishable from data loss at the next audit.

**If the product can naturally check itself** (a security product can scan itself; a performance product can measure itself; an accessibility product can check its own site), that check must become a permanent CI gate, not a one-off promise in a document. Implement and wire it yourself when the tooling already exists in the project, in this iteration.

**`BACKLOG.md` can lag behind `DECISIONS.md`.** A task marked `todo` is sometimes already effectively closed by a decision recorded under ANOTHER item in the same iteration (example: one project's decision removed a data field with a full "not needed" rationale, but the backlog task for collecting that field stayed `todo`; found only in the next iteration by a targeted search). Before starting data collection or development on a backlog item, check `git log` / `DECISIONS.md` for a decision that already answers the node's question; a `grep` of the codebase for actual use of the field is cheaper than collecting it again. Otherwise you risk either "solving" something already solved or, worse, quietly collecting data that was deliberately rejected.

Done when checks ran green, and `STATUS.md`, `BACKLOG.md` and `HANDOFF.md` reflect every decision of this iteration.

## Step 8. Context protection

Apply these rules all the time:

- one main session, one management iteration;
- one agent task, one bounded result;
- research, large logs and listings stay in the child context or in files;
- the main session receives only the final contracts;
- at the first signs of context overflow, update `HANDOFF.md` first;
- after a logically complete phase, suggest starting a new session by reading `HANDOFF.md`;
- long-term memory is the files, not the chat history;
- the actual state is defined by the repository, tests and project files.

This is exactly the "context engineering vs memory engineering" boundary: when designing an agent's package (what goes into its context), a budget for retrieved material, or the `docs/project/*.md` layout itself as a memory store, load the `context-memory-engineering` skill: it provides the vocabulary and checklist (write policy, retrieval boundary, lost-in-the-middle placement) for these same decisions.

## Step 9. Answer format for the user

Keep it short:

```text
Mode:
Iteration goal:
Roles involved:
Task plan:
Done:
Checks:
Risks/blockers:
Next step:
```

Give the agents' conclusions, not their long internal reasoning.

## Limits

- Start marketing, product or infrastructure work only when it serves the user's goal.
- Launch agents for the work, not for the appearance of activity: never dozens.
- Agents change the overall architecture only with an entry in `DECISIONS.md`.
- Every change to a public interface is visible and recorded.
- Irreversible operations, publishing, deploys and spending need explicit permission.
- Approval for paid resources applies to a specific graph node, not to the project as a whole; ask again for each future task.
- When documentation and code conflict, record the mismatch and check the actual behaviour.

## Required ending for every iteration

Always finish with:

```text
What next:
1. recommended next step;
2. alternative;
3. a check or preparation step, if useful.

Term of the day:
TERM — a plain explanation.
Example: a practical use.
Remember: a short mnemonic.
```

Use `/next-step-coach` and update `docs/project/LEARNING_LOG.md`.

## A living skill

This file is not a static template: improve it as you work on a project when you find a general lesson that transfers to other projects (not a detail of one product; that belongs in that project's `DECISIONS.md` / `domains/*.md`). Make the change here, in `.claude/skills/project-orchestrator/SKILL.md`, and send it upstream to this kit so every project gets it.

Lessons already folded in:

- Step 1B (bootstrap: customer pain and demand → name and domain → only then architecture and code), the owner's direct instruction after a product grew to 450 pages before its name was chosen and the rebrand became a separate expensive iteration over the whole codebase instead of a cosmetic edit. Along with it: the mandatory "product name and domain" field in `VISION.md`, and the "brand name behind one constant" principle in the `software-architect` agent.
- The pointer to the `context-memory-engineering` skill in Step 8: vocabulary and a checklist for separating context engineering (what goes into one call) from memory engineering (what survives across calls: write policy, retrieval boundary, lost-in-the-middle). It is installed as a separate skill rather than pasted here, to keep this file small. Along with it, the session handoff prompt (`context_monitor.py::handoff_prompt`) now OPENS with a `/project-orchestrator` call on its first line: before, it advised reading `HANDOFF.md`/`STATUS.md` by hand, and one session carried on for its whole run without a single explicit call to the orchestrator (project memory survived because the Step 2/6/7 discipline was followed manually, but the entry into the protocol was skipped).
