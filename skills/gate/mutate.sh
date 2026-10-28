#!/usr/bin/env bash
# Mutation probe for a gate (skill gate, step 3): breaks the code with one
# replacement, runs the check, expects it to go red, and restores the file.
#
#   bash .claude/skills/gate/mutate.sh <file> '<before>' '<broken>' -- <check command...>
#
# Exit code: 0 — the gate is real (the check went red on the mutant);
#            1 — fake gate (the check is green on broken code);
#            2 — nothing proven: bad call, missing file, the check is already
#                red before the mutation, or '<before>' does not occur exactly once.
# The file is restored from a copy (not git), so an uncommitted fix survives.
set -uo pipefail
[ $# -ge 5 ] && [ "$4" = "--" ] || { echo "usage: mutate.sh <file> <before> <broken> -- <check...>" >&2; exit 2; }
f=$1 old=$2 new=$3; shift 4
[ -f "$f" ] || { echo "mutate: no such file: $f" >&2; exit 2; }
log=$(mktemp)
# Baseline: a check that is red without the mutation proves nothing
# (a typo in the command, exit 127, would otherwise read as "gate is real").
if ! "$@" >"$log" 2>&1; then
  echo "mutate: the check is already red BEFORE the mutation — fix it first" >&2
  tail -n 20 "$log" >&2
  rm -f "$log"
  exit 2
fi
bak=$(mktemp)
cp -p "$f" "$bak" || { rm -f "$bak" "$log"; exit 2; }
trap 'cp -p "$bak" "$f"; rm -f "$bak" "$log"' EXIT
trap 'exit 130' INT TERM
python3 - "$f" "$old" "$new" <<'PY' || exit 2
import sys
p, old, new = sys.argv[1:]
s = open(p, encoding="utf-8").read()
n = s.count(old)
if n != 1:
    sys.exit(f"mutate: '{old}' occurs {n} times in {p}, need exactly 1")
open(p, "w", encoding="utf-8").write(s.replace(old, new))
PY
"$@" >"$log" 2>&1
rc=$?
if [ "$rc" -eq 0 ]; then
  echo "FAKE GATE: the check is green on broken code ($f: '$old' -> '$new')"
  tail -n 20 "$log"
  exit 1
fi
echo "OK: the check went red on the mutant (exit $rc), $f restored"
