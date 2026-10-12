#!/usr/bin/env bash
# Sync a project's .claude/{skills,agents,commands} with this kit.
#
#   bash kit-sync.sh status            [project-dir]
#   bash kit-sync.sh update            [project-dir]
#   bash kit-sync.sh install ITEM...|all  (project dir: $CLAUDE_PROJECT_DIR or cwd)
#   bash kit-sync.sh diff ITEM         [project-dir]
#
#   status  (default) every kit item: same / differs / missing / kept;
#           plus project-only items. Changes nothing.
#   update  overwrites every differing item with the kit version, except
#           those listed in <project>/.claude/kit-local; refreshes
#           .claude/hooks/skill-catalog.sh when present. Installs nothing new.
#   install copies missing items in (e.g. skills/site-launch agents/qa-engineer),
#           or every missing item with 'all'.
#   diff    shows project-vs-kit diff for one item, e.g. skills/harvest.
#
# .claude/kit-local lists items a project changed on purpose (a translation,
# a template-wide rewrite), one per line: "skills/harvest  # why". Kept items
# are reported, never overwritten. Fix shared behaviour in the kit first.
#
# From a project:  git clone --depth 1 https://github.com/kabluk/claude-code-kit /tmp/kit
#                  bash /tmp/kit/scripts/kit-sync.sh status
set -u
kit="$(cd "$(dirname "$0")/.." && pwd)"
cmd="${1:-status}"
want=""
case "$cmd" in status|update) proj="${2:-${CLAUDE_PROJECT_DIR:-$PWD}}" ;;
  install) shift; [ $# -gt 0 ] || { echo "install needs items or 'all'"; exit 2; }; want=" $* "; proj="${CLAUDE_PROJECT_DIR:-$PWD}" ;;
  diff) item="${2:?diff needs an item, e.g. skills/harvest}"; proj="${3:-${CLAUDE_PROJECT_DIR:-$PWD}}" ;;
  *) sed -n '2,25p' "$0"; exit 2 ;;
esac
dst="$proj/.claude"
[ "$(cd "$proj" && pwd)" != "$kit" ] || { echo "run it on a project, not on the kit itself"; exit 2; }

kept() { [ -f "$dst/kit-local" ] && grep -qE "^[[:space:]]*$1([[:space:]]|#|$)" "$dst/kit-local"; }
src_of() { case "$1" in skills/*) echo "$kit/$1" ;; *) echo "$kit/$1.md" ;; esac; }
dst_of() { case "$1" in skills/*) echo "$dst/$1" ;; *) echo "$dst/$1.md" ;; esac; }

if [ "$cmd" = diff ]; then
  diff -ru "$(dst_of "$item")" "$(src_of "$item")"; exit 0
fi

items=$(cd "$kit" && { ls -d skills/*/ | sed 's#/$##'; ls agents/*.md commands/*.md | sed 's#\.md$##'; })
n_same=0; n_diff=0; n_miss=0; n_kept=0; changed=0
for it in $items; do
  s=$(src_of "$it"); d=$(dst_of "$it")
  if [ ! -e "$d" ]; then
    state=missing; n_miss=$((n_miss + 1))
  elif diff -rq "$d" "$s" >/dev/null; then
    n_same=$((n_same + 1)); continue
  elif kept "$it"; then
    state=kept; n_kept=$((n_kept + 1))
  else
    state=differs; n_diff=$((n_diff + 1))
  fi
  if { [ "$cmd" = update ] && [ "$state" = differs ]; } ||
     { [ "$cmd" = install ] && [ "$state" = missing ] && { [ "$want" = " all " ] || [[ "$want" == *" $it "* ]]; }; }; then
    mkdir -p "$(dirname "$d")"
    rm -rf "$d"; cp -r "$s" "$d"; changed=$((changed + 1))
    echo "$( [ "$state" = missing ] && echo installed || echo updated )  $it"
  else
    echo "$state  $it"
  fi
done

for k in skills agents commands; do
  for p in "$dst/$k"/*; do
    [ -e "$p" ] || continue
    it="$k/$(basename "$p" .md)"
    [ -e "$(src_of "$it")" ] || echo "project-only  $it"
  done
done

h="$dst/hooks/skill-catalog.sh"
if [ -f "$h" ] && ! cmp -s "$h" "$kit/hooks/skill-catalog.sh"; then
  if [ "$cmd" = update ]; then cp "$kit/hooks/skill-catalog.sh" "$h"; echo "updated  hooks/skill-catalog.sh"; changed=$((changed + 1))
  else echo "differs  hooks/skill-catalog.sh"; fi
fi

echo
echo "same: $n_same  differs: $n_diff  missing: $n_miss  kept (kit-local): $n_kept"
if [ "$cmd" = status ]; then
  [ "$n_diff" -eq 0 ] || echo "differs: run 'update' after listing deliberate differences in .claude/kit-local"
  [ "$n_miss" -eq 0 ] || echo "missing: 'install ITEM...' for what this repo needs, or 'install all'"
else
  echo "changed: $changed — review with git diff, then commit"
fi
exit 0
