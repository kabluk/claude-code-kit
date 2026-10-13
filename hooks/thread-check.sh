#!/usr/bin/env bash
# UserPromptSubmit hook (session-focus skill): before every owner message,
# repeat the session's thread so a new request is checked against it instead
# of silently pulling a second goal into the session (P-16: inject, do not
# rely on memory).
#
# The thread lives in the transcript, not in a file: the last assistant line
# starting with "Thread:" or "Тема сессии:" (bold allowed). That keeps it
# per session, needs no cleanup, and survives compaction because the
# transcript file keeps every message. Plain stdout is added to the context.
set -u
IN=$(cat)
python3 - "$IN" <<'PY'
import json, re, sys
try:
    ev = json.loads(sys.argv[1])
except Exception:
    sys.exit(0)
path = ev.get("transcript_path") or ""
try:
    lines = open(path, encoding="utf-8").read().splitlines()
except Exception:
    lines = []

MARK = re.compile(r"^\s*(?:\*\*)?(?:Thread|Тема сессии):(?:\*\*)?\s*(.+?)\s*$", re.M)
thread = None
for l in lines:
    try:
        r = json.loads(l)
    except Exception:
        continue
    if r.get("type") != "assistant":
        continue
    c = (r.get("message") or {}).get("content")
    texts = [c] if isinstance(c, str) else [b.get("text", "") for b in c or [] if isinstance(b, dict) and b.get("type") == "text"]
    for t in texts:
        for m in MARK.finditer(t):
            thread = m.group(1)

if thread:
    print(f"Session thread: {thread}\n"
          "Check this message against it (session-focus): same thread or a step it needs -> do it; "
          "a short aside with no file change -> answer, then return to the thread; "
          "a different goal, repo or question -> do not start it, offer: new session with a ready prompt / "
          "switch thread deliberately / park in INBOX.")
else:
    print("No session thread named yet. In your first reply that does work, add the line "
          "'**Thread:** <goal> · <repo> · done when <result>' ('**Тема сессии:** …' in Russian), "
          "per the session-focus skill.")
PY
exit 0
