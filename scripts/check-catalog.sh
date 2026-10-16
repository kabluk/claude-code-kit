#!/usr/bin/env bash
# Fails when the skill catalog drifts from the kit: a skill, agent or command
# without a row in skills/skill-catalog/SKILL.md, or a `kit` row without a file.
set -u
cd "$(dirname "$0")/.." || exit 1
catalog=skills/skill-catalog/SKILL.md
fail=0

rows=$(grep -E '^\| `' "$catalog")
has_row() { grep -qE "^\| \`$1\` \| $2 \|" <<<"$rows"; }

for d in skills/*/; do n=$(basename "$d"); has_row "$n" skill || { echo "no catalog row: skill $n"; fail=1; }; done
for f in agents/*.md; do n=$(basename "$f" .md); has_row "$n" agent || { echo "no catalog row: agent $n"; fail=1; }; done
for f in commands/*.md; do n=$(basename "$f" .md); has_row "$n" command || { echo "no catalog row: command $n"; fail=1; }; done

while IFS='|' read -r _ name kind _ source _; do
  name=$(echo "$name" | tr -d '` '); kind=$(echo "$kind" | tr -d ' '); source=$(echo "$source" | tr -d ' ')
  [ "$source" = kit ] || continue
  case "$kind" in
    skill)   p="skills/$name/SKILL.md" ;;
    agent)   p="agents/$name.md" ;;
    command) p="commands/$name.md" ;;
    *)       echo "unknown kind '$kind' for $name"; fail=1; continue ;;
  esac
  [ -f "$p" ] || { echo "catalog row without file: $p"; fail=1; }
done <<<"$rows"

[ "$fail" -eq 0 ] && echo "catalog OK: $(wc -l <<<"$rows") rows"
exit "$fail"
