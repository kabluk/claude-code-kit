#!/usr/bin/env bash
# What sits on branches and is not merged into the default branch, across all
# repositories.
#
# WHY. A Stop hook enforcing P-08 was written and then left on a branch in four
# repositories out of eight. For ten days the rule worked almost nowhere, and
# the owner twice in one hour asked why there were no three options. The same
# day a fresh playbook commit was orphaned the same way: the branch was reset to
# origin/main after a merge.
#
# Work on an unmerged branch is invisible: it is not in main, not in CI, not in
# code search, and the next session solves the same task again. This check makes
# it visible with one command.
#
# USAGE:
#   GITHUB_TOKEN=... bash scripts/orphan-branches.sh
#   GITHUB_TOKEN=... OWNER=<github-user-or-org> bash scripts/orphan-branches.sh repo-a repo-b
#
# OWNER defaults to the user the token belongs to. With no repo arguments, all
# non-archived repositories owned by that user are checked.
#
# Prints one line per branch: how far ahead of the default branch it is, how
# many files, how many of them are code (not docs and not markdown), how far
# behind. A branch ahead with code is a candidate to either merge or close
# deliberately; leaving it silently is not an option.

set -u
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
API=https://api.github.com
auth=(-H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json")
OWNER="${OWNER:-$(curl -sS "${auth[@]}" "$API/user" | python3 -c "import sys,json;print(json.load(sys.stdin).get('login',''))")}"
: "${OWNER:?could not determine OWNER; set it explicitly}"

if [ $# -gt 0 ]; then
  repos=("$@")
else
  mapfile -t repos < <(curl -sS "${auth[@]}" "$API/user/repos?per_page=100&affiliation=owner" |
    python3 -c "import sys,json;[print(r['name']) for r in json.load(sys.stdin) if not r.get('archived')]")
fi

printf '%-16s %-44s %6s %6s %6s %8s\n' REPO BRANCH AHEAD FILES CODE BEHIND
found=0
for r in "${repos[@]}"; do
  base=$(curl -sS "${auth[@]}" "$API/repos/$OWNER/$r" |
    python3 -c "import sys,json;print(json.load(sys.stdin).get('default_branch',''))" 2>/dev/null)
  [ -n "$base" ] || { echo "$r: repository not accessible" >&2; continue; }
  mapfile -t branches < <(curl -sS "${auth[@]}" "$API/repos/$OWNER/$r/branches?per_page=100" |
    python3 -c "import sys,json;[print(b['name']) for b in json.load(sys.stdin)]" 2>/dev/null)
  for b in "${branches[@]}"; do
    [ "$b" = "$base" ] && continue
    line=$(curl -sS "${auth[@]}" "$API/repos/$OWNER/$r/compare/$base...$b" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if 'ahead_by' not in d or d['ahead_by'] == 0:
    raise SystemExit
files = [f['filename'] for f in d.get('files', [])]
code = [f for f in files if not f.startswith('docs/') and not f.endswith('.md')]
print(f\"{d['ahead_by']} {len(files)} {len(code)} {d.get('behind_by', 0)}\")
" 2>/dev/null) || continue
    [ -n "$line" ] || continue
    # shellcheck disable=SC2086
    set -- $line
    printf '%-16s %-44s %6s %6s %6s %8s\n' "$r" "$b" "$1" "$2" "$3" "$4"
    found=$((found + 1))
  done
done
echo
echo "branches ahead of the default branch: $found"
echo "A branch ahead with code: merge it or close it deliberately. Work left silently is invisible."
