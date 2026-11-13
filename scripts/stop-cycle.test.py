"""Tests for hooks/stop-cycle.sh: when a finished work cycle is blocked.

    python3 scripts/stop-cycle.test.py

Each case writes a small transcript (JSONL, the shape Claude Code writes),
feeds the hook its Stop event, and checks whether it blocks. The unattended
cases are the reason this file exists: a Routine prompt marked [[unattended]]
must not be asked for AskUserQuestion, or the session waits for nobody.
"""
import json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
HOOK = os.environ.get("STOP_CYCLE_HOOK", os.path.join(HERE, "..", "hooks", "stop-cycle.sh"))
if not os.path.exists(HOOK):  # copy installed in a project: .claude/scripts next to .claude/hooks
    HOOK = os.path.join(HERE, "..", "hooks", "stop-cycle.sh")


def user(text, meta=False):
    r = {"type": "user", "message": {"role": "user", "content": text}}
    if meta:
        r["isMeta"] = True
    return r


def tool_use(name, inp):
    return {"type": "assistant", "message": {"role": "assistant",
            "content": [{"type": "tool_use", "id": "t", "name": name, "input": inp}]}}


def tool_result(text):
    return {"type": "user", "message": {"role": "user",
            "content": [{"type": "tool_result", "tool_use_id": "t", "content": text}]}}


COMMIT = tool_use("Bash", {"command": "git commit -m x && git push origin HEAD"})
ASK = tool_use("AskUserQuestion", {"questions": []})
NOTE = "--- Notification 1 of 1 · id: a · origin: scheduled trigger ---\n"

CASES = [
    # (name, transcript, expect_block)
    ("owner asked, cycle committed, no options", [user("fix it"), COMMIT], True),
    ("owner asked, cycle committed, options given", [user("fix it"), COMMIT, ASK], False),
    ("question answered, nothing committed", [user("what is X?")], False),
    ("unattended prompt as opening string", [user("[[unattended]] weekly run"), COMMIT], False),
    ("unattended marker after leading spaces", [user("  [[unattended]] run"), COMMIT], False),
    ("unattended via ReadNotifications body",
     [user("earlier owner chat"), tool_result("Exactly 1 notification\n\n" + NOTE + "[[unattended]] nightly run\n"), COMMIT], False),
    ("marker quoted in tool output, not a delivery",
     [user("list my tasks"), tool_result('{"prompt": "[[unattended]] nightly run"}'), COMMIT], True),
    ("marker mid-line in a notification, not at its start",
     [user("hi"), tool_result(NOTE + "see [[unattended]] later\n"), COMMIT], True),
    ("owner wrote after the unattended run", [user("[[unattended]] run"), COMMIT, user("now fix this"), COMMIT], True),
    ("meta message after marker does not end unattended mode",
     [user("[[unattended]] run"), user("<system note>", meta=True), COMMIT], False),
]


def run(transcript, active=False):
    with tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False) as f:
        for r in transcript:
            f.write(json.dumps(r) + "\n")
        path = f.name
    ev = {"transcript_path": path, "stop_hook_active": active}
    out = subprocess.run(["bash", HOOK], input=json.dumps(ev), capture_output=True, text=True)
    os.unlink(path)
    return '"decision": "block"' in out.stdout


fails = 0
for name, tr, expect in CASES:
    got = run(tr)
    ok = got == expect
    fails += not ok
    print(("ok  " if ok else "FAIL"), name, "->", "block" if got else "allow")
# the loop guard: a second pass never blocks
if run([user("fix it"), COMMIT], active=True):
    print("FAIL loop guard"); fails += 1
total = len(CASES) + 1
print(f"{total - fails}/{total} passed")
sys.exit(1 if fails else 0)
