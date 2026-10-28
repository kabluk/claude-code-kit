#!/usr/bin/env bash
# Sync a project's .claude/{skills,agents,commands} with this kit.
#
#   bash kit-sync.sh status            [project-dir]
#   bash kit-sync.sh update [--overwrite-referenced] [project-dir]
#   bash kit-sync.sh install ITEM...|all  (project dir: $CLAUDE_PROJECT_DIR or cwd)
#   bash kit-sync.sh diff ITEM         [project-dir]
#
#   status  (default) every kit item: same / differs / missing / kept;
#           plus project-only items. Changes nothing.
#   update  overwrites every differing item with the kit version, except
#           those listed in <project>/.claude/kit-local; refreshes
#           .claude/hooks/{skill-catalog,thread-check}.sh when present. Installs nothing new.
#           status and update list files inside a skill that the kit lacks
#           (update deletes them); update holds back a skill with a
#           referenced extra file (below) unless --overwrite-referenced.
#   install copies missing items in (e.g. skills/site-launch agents/qa-engineer),
#           or every missing item with 'all'.
#   diff    shows project-vs-kit diff for one item, e.g. skills/harvest.
#
# .claude/kit-local lists items a project changed on purpose (a translation,
# a template-wide rewrite), one per line: "skills/harvest  # why". Kept items
# are reported, never overwritten. Fix shared behaviour in the kit first.
#
# Referenced extra file: a file in a project skill that the kit copy lacks and
# that project code outside .claude/ names by path (e.g. a workflow running
# .claude/skills/secrets-and-buttons/probe-local.sh). status and update warn
# about it, kept or not, because an overwrite would delete it and break that
# code. Move such a file out of .claude/ or upstream it into the kit.
#
# From a project:  git clone --depth 1 https://github.com/kabluk/claude-code-kit /tmp/kit
#                  bash /tmp/kit/scripts/kit-sync.sh status
set -u
kit="$(cd "$(dirname "$0")/.." && pwd)"
cmd="${1:-status}"
want=""
force_refs=0
if [ "$cmd" = update ] && [ "${2:-}" = --overwrite-referenced ]; then force_refs=1; set -- "$1" "${@:3}"; fi
case "$cmd" in status|update) proj="${2:-${CLAUDE_PROJECT_DIR:-$PWD}}" ;;
  install) shift; [ $# -gt 0 ] || { echo "install needs items or 'all'"; exit 2; }; want=" $* "; proj="${CLAUDE_PROJECT_DIR:-$PWD}" ;;
  diff) item="${2:?diff needs an item, e.g. skills/harvest}"; proj="${3:-${CLAUDE_PROJECT_DIR:-$PWD}}" ;;
  *) sed -n '2,32p' "$0"; exit 2 ;;
esac
proj="$(cd "$proj" && pwd)"
dst="$proj/.claude"
[ "$(cd "$proj" && pwd)" != "$kit" ] || { echo "run it on a project, not on the kit itself"; exit 2; }

kept() { [ -f "$dst/kit-local" ] && grep -qE "^[[:space:]]*$1([[:space:]]|#|$)" "$dst/kit-local"; }
src_of() { case "$1" in skills/*) echo "$kit/$1" ;; *) echo "$kit/$1.md" ;; esac; }
dst_of() { case "$1" in skills/*) echo "$dst/$1" ;; *) echo "$dst/$1.md" ;; esac; }

# Files inside a project skill that the kit copy lacks (update deletes them),
# one per line as "file<TAB>paths outside .claude/ that name it" (may be empty).
extras() {
  local d="$dst/$1" rel hits
  [ -d "$d" ] || return 0
  (cd "$d" && find . -type f | sed 's#^\./##' | sort) | while IFS= read -r rel; do
    [ -e "$kit/$1/$rel" ] && continue
    hits=$(grep -rlF --exclude-dir=.git --exclude-dir=.claude --exclude-dir=node_modules \
      ".claude/$1/$rel" "$proj" 2>/dev/null | sed "s#^$proj/##" | head -3 | paste -sd ' ' -)
    printf '%s\t%s\n' "$rel" "$hits"
  done
}

if [ "$cmd" = diff ]; then
  diff -ru "$(dst_of "$item")" "$(src_of "$item")"; exit 0
fi

items=$(cd "$kit" && { ls -d skills/*/ | sed 's#/$##'; ls agents/*.md commands/*.md | sed 's#\.md$##'; })
n_same=0; n_diff=0; n_miss=0; n_kept=0; n_held=0; changed=0
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
  ext=""
  case "$it" in skills/*) [ "$state" = missing ] || ext=$(extras "$it") ;; esac
  refs=$(printf '%s\n' "$ext" | awk -F'\t' '$2 != ""')
  [ -z "$refs" ] || printf '%s\n' "$refs" | sed "s#^\([^\t]*\)\t#warning  $it: project-only file used outside .claude/: \1 <- #"
  held=0
  if [ -n "$refs" ] && [ "$cmd" = update ] && [ "$state" = differs ] && [ "$force_refs" -eq 0 ]; then held=1; fi
  if [ "$state" = differs ] && [ "$held" -eq 0 ]; then
    printf '%s\n' "$ext" | awk -F'\t' -v pre="    $( [ "$cmd" = update ] && echo deleted || echo "update deletes" )  .claude/$it/" \
      '$1 != "" && $2 == "" { print pre $1 }'
  fi
  if [ "$held" -eq 1 ]; then
    echo "held  $it  (update would delete it; upstream the file, move it, or pass --overwrite-referenced)"
    n_held=$((n_held + 1)); continue
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

# Generic hooks the kit owns outright (project hooks like session-start.sh are left alone).
for hk in skill-catalog.sh thread-check.sh; do
  h="$dst/hooks/$hk"
  if [ -f "$h" ] && ! cmp -s "$h" "$kit/hooks/$hk"; then
    if [ "$cmd" = update ]; then cp "$kit/hooks/$hk" "$h"; echo "updated  hooks/$hk"; changed=$((changed + 1))
    else echo "differs  hooks/$hk"; fi
  fi
done

echo
echo "same: $n_same  differs: $n_diff  missing: $n_miss  kept (kit-local): $n_kept"
[ "$n_held" -eq 0 ] || echo "held (referenced extra file): $n_held"
if [ "$cmd" = status ]; then
  [ "$n_diff" -eq 0 ] || echo "differs: run 'update' after listing deliberate differences in .claude/kit-local"
  [ "$n_miss" -eq 0 ] || echo "missing: 'install ITEM...' for what this repo needs, or 'install all'"
else
  echo "changed: $changed — review with git diff, then commit"
fi
exit 0
