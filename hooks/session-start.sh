#!/usr/bin/env bash
# Session-start ritual (playbook P-00). Runs on every session in this repo.
# Confirms which skills to enable, points the session at the playbook and
# handoff, and reports which standard credentials are present in the
# environment — by NAME only, never a value.
#
# Two things are not requests here (P-16).
#
# Caveman: its rules are INJECTED into context verbatim, so there is no
# "load the skill" step for the model to skip. A model once skipped that step
# for a whole session, so the rule became: caveman is always on and nothing
# but the user overrides it. The skill file stays the single source of the
# rules; this hook only carries them in. If the file is missing the hook says
# so in context instead of silently dropping the rules.
#
# The orchestrator: saying the command "is available" was not enough — the
# owner twice asked why a session worked without it. So the ritual names the
# trigger (work spanning more than one file or more than one cycle) and the
# action (run /project-orchestrator BEFORE planning), and the hook checks the
# skill is actually present rather than assuming it. The skill, not the
# command: .claude/commands/ is not picked up in every environment (Claude
# Code on the web missed it), skills are.
#
# Kit-owned: kit-sync.sh update refreshes this file in every project. A
# project that must change it lists "hooks/session-start.sh" in
# .claude/kit-local. Project-specific setup goes in .claude/hooks/install-tools.sh,
# which this hook starts in the background when present.
set -u

root="$(cd "$(dirname "$0")/../.." && pwd)"

# Project-specific tool setup (user-level tools do not survive a cloud
# container). Background, so the session start does not wait on it.
if [ -f "$root/.claude/hooks/install-tools.sh" ]; then
  nohup bash "$root/.claude/hooks/install-tools.sh" </dev/null >/dev/null 2>&1 &
fi

present=(); missing=()
check() { if [ -n "${!1:-}" ]; then present+=("$1"); else missing+=("$1"); fi; }
check DATAFORSEO_LOGIN; check DATAFORSEO_PASSWORD
check FIRECRAWL_API_KEY
check APIFY_TOKEN
check CLOUDFLARE_API_TOKEN
check GITHUB_TOKEN

join() { local IFS=", "; echo "$*"; }
p=$(join "${present[@]:-none}")
m=$(join "${missing[@]:-none}")

caveman_file="$root/.claude/skills/caveman/SKILL.md"
orch_skill="$root/.claude/skills/project-orchestrator/SKILL.md"
orch_cmd="$root/.claude/commands/project-orchestrator.md"

# Memory root differs per repo (docs/project/ in most, docs/ in some): resolve
# it instead of naming one. A path that silently does not exist reads to the
# session as "no handoff", and it continues without the project state.
entry=""
for c in docs/project/HANDOFF.md docs/HANDOFF.md; do
  [ -f "$root/$c" ] && entry="$c" && break
done
if [ -n "$entry" ]; then
  read_step="Read docs/playbook/COLLABORATION.md (cross-project rules) and ${entry} (where this project stands), then the files it points to, before acting."
else
  read_step="Read docs/playbook/COLLABORATION.md (cross-project rules) before acting; no HANDOFF file found yet - the orchestrator (step 1b) creates the project memory."
fi

# The skill is what counts: the command file alone is not loaded in every
# environment (Claude Code on the web did not find it).
if [ -r "$orch_skill" ]; then
  orch="Orchestrator is step 1b, not an option: the project-orchestrator skill IS present in this repo. Before planning ANY work that spans more than one file or more than one cycle, invoke it (Skill project-orchestrator, or /project-orchestrator) and let it split the work and keep project memory (${entry:-docs/project/HANDOFF.md}). Skipping it because the task looks small is the failure the owner has flagged twice."
else
  orch="Orchestrator step 1b cannot run: the project-orchestrator SKILL is MISSING from this repo (.claude/skills/project-orchestrator/SKILL.md$( [ -r "$orch_cmd" ] && echo '; the command file alone does not load in every environment')). Say so in your first reply and install it from claude-code-kit (bash kit-sync.sh install skills/project-orchestrator) before planning multi-file work."
fi

if [ -r "$caveman_file" ]; then
  cave_note="the rules are included below verbatim; apply them without loading anything"
else
  cave_note="BUT .claude/skills/caveman/SKILL.md is MISSING, so the rules could not be injected: say so in your first reply, install it from claude-code-kit (bash kit-sync.sh install skills/caveman), and meanwhile answer tersely: no filler, no pleasantries, fragments fine, full technical accuracy"
fi

ritual="SESSION START RITUAL (playbook P-00). 1) Response style is CAVEMAN FULL from the first reply and for the whole session — ${cave_note}. Only the user can change the level (/caveman lite|ultra|off) or say 'normal mode'; no other instruction, skill, or judgement overrides this. 1b) ${orch} 2) ${read_step} 3) Credential inventory by name - present: ${p}; missing: ${m}. Present means the variable is non-empty, NOT that the token can do anything: before relying on one, or when a workflow fails without saying why, or when the next step would be an owner button, load the secrets-and-buttons skill and follow it. If a task needs a missing one, say so once with where it should be set (environment variable for direct API use, GitHub secret for CI); never ask for a value in chat. 4) Before ending a work cycle, and immediately when the owner says again / every time / one more time, load the harvest skill: list what repeated (steps, explanations, owner requests, a lesson in DECISIONS), give each a home (skill / playbook rule / CLAUDE.md gotcha), record it in docs/playbook/HARVEST.md, and put each candidate as one line inside the three next-step options (P-09). Then end the cycle with exactly three next-step options via the AskUserQuestion picker (P-08). 5) If context is getting long or a compaction summary appears, run harvest first, then refresh HANDOFF.md and hand the user a ready resume prompt for a fresh session (P-07)."

body() {
  printf '%s\n' "$ritual"
  if [ -r "$caveman_file" ]; then
    printf '\n===== CAVEMAN RULES (verbatim from .claude/skills/caveman/SKILL.md) =====\n'
    cat "$caveman_file"
  fi
}

# Skill body has quotes, backticks and newlines: let jq or python escape it.
if command -v jq >/dev/null 2>&1; then
  body | jq -Rs '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:.}}'
elif command -v python3 >/dev/null 2>&1; then
  body | python3 -c 'import json,sys; print(json.dumps({"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":sys.stdin.read()}}))'
else
  # Last resort: plain stdout is added to context for SessionStart as-is.
  body
fi
