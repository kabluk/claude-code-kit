#!/usr/bin/env bash
# Stop hook: do not let a work cycle end without a harvest and three options
# (playbook P-08/P-09).
#
# Why. In one session of 102 replies the owner noticed three next-step options
# had been offered only 8 times. The rule lived only in the ritual text, and
# text can be skipped, exactly as the caveman step was skipped. Same cure:
# do not ask the model to remember; check it mechanically.
#
# What counts as a WORK CYCLE: since the owner's last text message, the
# assistant made a commit, a push or merged a PR. Answering a question with
# no changes is not a cycle, and the hook stays silent.
#
# Loop guard: when stop_hook_active is set we exit at once — we block exactly
# once, after that the model decides.
set -u
IN=$(cat)
python3 - "$IN" <<'PY'
import json, sys
try:
    ev = json.loads(sys.argv[1])
except Exception:
    sys.exit(0)                      # could not parse input: do not interfere
if ev.get("stop_hook_active"):
    sys.exit(0)                      # second pass: do not loop
path = ev.get("transcript_path") or ""
try:
    lines = open(path, encoding="utf-8").read().splitlines()
except Exception:
    sys.exit(0)                      # no transcript: do not interfere

# Index of the owner's last TEXT message: the cycle starts there.
start = 0
for i, l in enumerate(lines):
    try:
        r = json.loads(l)
    except Exception:
        continue
    m = r.get("message") or {}
    if r.get("type") == "user" and isinstance(m.get("content"), str):
        start = i

worked = asked = harvested = False
WORK = ("git commit", "git push", "merge_pull_request")
for l in lines[start:]:
    try:
        r = json.loads(l)
    except Exception:
        continue
    c = (r.get("message") or {}).get("content")
    if not isinstance(c, list):
        continue
    for b in c:
        if not (isinstance(b, dict) and b.get("type") == "tool_use"):
            continue
        name = b.get("name") or ""
        inp = b.get("input") or {}
        if name == "AskUserQuestion":
            asked = True
        if name == "Skill" and inp.get("skill") == "harvest":
            harvested = True
        if name == "mcp__github__merge_pull_request":
            worked = True
        if name == "Bash" and any(w in (inp.get("command") or "") for w in WORK):
            worked = True

if worked and not asked:
    need = [] if harvested else ["the `harvest` skill (P-09): what repeated, where it went, an entry in docs/playbook/HARVEST.md"]
    need.append("three next-step options via AskUserQuestion (P-08)")
    print(json.dumps({
        "decision": "block",
        "reason": "The work cycle is over (there were commits/merges), but not done yet: "
                  + "; ".join(need)
                  + ". Do it now, then finish."
    }))
PY
