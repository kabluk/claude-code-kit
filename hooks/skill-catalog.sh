#!/usr/bin/env bash
# SessionStart hook: prints the skill catalog (skills/skill-catalog/SKILL.md)
# as a compact index, marking every row this repo does not have installed,
# so each session can offer the right tool instead of improvising (P-16).
# Plain stdout is added to the session's context. Works both inside a
# project (.claude/skills/...) and in the kit itself (skills/...).
set -u

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
if [ -f "$root/.claude/skills/skill-catalog/SKILL.md" ]; then
  base="$root/.claude"
elif [ -f "$root/skills/skill-catalog/SKILL.md" ]; then
  base="$root"
else
  exit 0
fi
catalog="$base/skills/skill-catalog/SKILL.md"

installed() { # kind name
  case "$1" in
    skill)   [ -f "$base/skills/$2/SKILL.md" ] ;;
    agent)   [ -f "$base/agents/$2.md" ] ;;
    command) [ -f "$base/commands/$2.md" ] ;;
    *)       return 0 ;;
  esac
}

echo "## Skill catalog (skill-catalog skill; [missing] = not installed in this repo)"
echo "Before a non-trivial task, match it to a row and say which tool you will use."
echo "A fitting row marked [missing]: give the install line from the skill-catalog skill first."
missing=0
while IFS= read -r line; do
  case "$line" in
    '### '*) echo; echo "${line#\#\#\# }:" ;;
    '| `'*)
      IFS='|' read -r _ name kind when source _ <<<"$line"
      name=$(echo "$name" | tr -d '` '); kind=$(echo "$kind" | tr -d ' ')
      when=$(echo "$when" | sed 's/^ *//; s/ *$//'); source=$(echo "$source" | tr -d ' ')
      mark=""
      if ! installed "$kind" "$name"; then mark=" [missing, from $source]"; missing=$((missing + 1)); fi
      echo "- $name ($kind)$mark — $when"
      ;;
  esac
done < <(sed -n '/^## The catalog/,/^## Install/p' "$catalog")
echo
echo "Missing here: $missing. Full table, install lines and how to add a skill: the skill-catalog skill."
exit 0
