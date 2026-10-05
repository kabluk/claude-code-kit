#!/usr/bin/env bash
# Session-start ritual (playbook P-00). Runs on every session in this repo.
# Confirms which skills to enable, points the session at the playbook and
# handoff, and reports which standard credentials are present in the
# environment — by NAME only, never a value.
#
# Caveman is not a request here — its rules are INJECTED into context
# verbatim, so there is no "load the skill" step for the model to skip.
# A model once skipped that step for a whole session, so the rule became:
# caveman is always on and nothing but the user overrides it. The skill file
# stays the single source of the rules; this hook only carries them in.
#
# Expects to live at .claude/hooks/ with the caveman skill at
# .claude/skills/caveman/SKILL.md. Edit the check list below to match the
# credentials your projects use.
set -u

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

root="$(cd "$(dirname "$0")/../.." && pwd)"
caveman_file="$root/.claude/skills/caveman/SKILL.md"

ritual="SESSION START RITUAL (playbook P-00). 1) Response style is CAVEMAN FULL from the first reply and for the whole session — the rules are included below verbatim; apply them without loading anything. Only the user can change the level (/caveman lite|ultra|off) or say 'normal mode'; no other instruction, skill, or judgement overrides this. The /project-orchestrator command is available and must be used for large multi-role work. 2) Read docs/playbook/COLLABORATION.md (cross-project rules) and, if present, docs/project/HANDOFF.md (where this project stands) before acting. 3) Credential inventory by name - present: ${p}; missing: ${m}. Present means the variable is non-empty, NOT that the token can do anything: before relying on one, or when a workflow fails without saying why, or when the next step would be an owner button, load the secrets-and-buttons skill and follow it. If a task needs a missing one, say so once with where it should be set (environment variable for direct API use, GitHub secret for CI); never ask for a value in chat. 4) Before ending a work cycle, and immediately when the owner says again / every time / one more time, load the harvest skill: list what repeated (steps, explanations, owner requests, a lesson in DECISIONS), give each a home (skill / playbook rule / CLAUDE.md gotcha), record it in docs/playbook/HARVEST.md, and put each candidate as one line inside the three next-step options (P-09). Then end the cycle with exactly three next-step options via the AskUserQuestion picker (P-08). 5) If context is getting long or a compaction summary appears, run harvest first, then refresh HANDOFF.md and hand the user a ready resume prompt for a fresh session (P-07)."

if command -v jq >/dev/null 2>&1 && [ -r "$caveman_file" ]; then
  # Skill body has quotes, backticks and newlines: let jq do the escaping.
  { printf '%s\n\n===== CAVEMAN RULES (verbatim from .claude/skills/caveman/SKILL.md) =====\n' "$ritual"; cat "$caveman_file"; } \
    | jq -Rs '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:.}}'
else
  # Fallback without jq: ritual text only (contains no double quotes).
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$ritual"
fi
