#!/usr/bin/env python3
"""Test for the context_monitor hook: a check must be able to fail.

Rule: a gate that has never gone red is unproven. Every threshold here is
checked with a synthetic transcript with a GIVEN token count (silent / warning /
handoff), plus the cases where the hook must stay silent (no transcript,
broken JSON, no usage).

Run: python3 scripts/context_monitor.test.py
(or python3 .claude/scripts/context_monitor.test.py once installed)
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
HOOK = os.path.join(HERE, "context_monitor.py")

failures: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"{'PASS' if ok else 'FAIL'} {name}" + (f" — {detail}" if detail else ""))
    if not ok:
        failures.append(name)


def transcript(cache_read: int, *, valid: bool = True, with_usage: bool = True) -> str:
    """A synthetic transcript: a few lines, the last one carries usage."""
    fd, path = tempfile.mkstemp(suffix=".jsonl")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        # Noise before the target record: in a real transcript, large tool
        # results sit between usage records.
        for i in range(5):
            f.write(json.dumps({"type": "user", "message": {"content": "x" * 500, "n": i}}) + "\n")
        if not valid:
            f.write('{"message": {"usage": {BROKEN\n')
        elif with_usage:
            f.write(
                json.dumps(
                    {
                        "type": "assistant",
                        "message": {
                            "usage": {
                                "input_tokens": 10,
                                "cache_read_input_tokens": cache_read,
                                "cache_creation_input_tokens": 0,
                                "output_tokens": 100,
                            }
                        },
                    }
                )
                + "\n"
            )
        else:
            f.write(json.dumps({"type": "assistant", "message": {"content": "no usage here"}}) + "\n")
    return path


def run(transcript_path: str, limit: str = "1000000", env_check: str = "") -> tuple[str, dict | None]:
    env = {**os.environ, "CONTEXT_LIMIT_TOKENS": limit, "CONTEXT_HANDOFF_CHECK": env_check}
    proc = subprocess.run(
        [sys.executable, HOOK],
        input=json.dumps({"prompt": "continue", "transcript_path": transcript_path}),
        capture_output=True,
        text=True,
        timeout=10,
        env=env,
    )
    out = proc.stdout.strip()
    if not out:
        return "", None
    try:
        return out, json.loads(out)
    except Exception:
        return out, None


MARKER = "--- PROMPT FOR THE NEW SESSION ---"

# --- Thresholds -------------------------------------------------------------
p = transcript(400_000)  # 40%: silent
raw, _ = run(p)
check("40% context: hook is silent (no noise on every turn)", raw == "", f"stdout={raw[:60]!r}")
os.unlink(p)

p = transcript(750_000)  # 75%: warning
raw, obj = run(p)
ctx = (obj or {}).get("hookSpecificOutput", {}).get("additionalContext", "")
check("75% context: WRAP_UP warning", "CONTEXT_MONITOR: WRAP_UP" in ctx)
check("75%: percentage shown to the owner", "75%" in (obj or {}).get("systemMessage", ""))
check("75%: does NOT hand out the handoff prompt too early", MARKER not in ctx)
os.unlink(p)

p = transcript(900_000)  # 90%: handoff
raw, obj = run(p, env_check="npm install && npm test")
ctx = (obj or {}).get("hookSpecificOutput", {}).get("additionalContext", "")
check("90% context: HANDOFF_NOW", "CONTEXT_MONITOR: HANDOFF_NOW" in ctx)
check("90%: prompt for the new session is handed out", MARKER in ctx)
check("90%: prompt points to HANDOFF.md instead of retelling it", "HANDOFF.md" in ctx)
check("90%: prompt includes the environment check when configured", "npm install && npm test" in ctx)
# Every new session must START with the orchestrator, not with reading files by
# hand. Checked literally: the first line of the prompt AFTER the marker, not
# just "mentioned somewhere in the text" (a weak check would not catch a
# regression where the call slid down or disappeared).
body = ctx.split(MARKER + "\n", 1)[1] if MARKER in ctx else ""
check(
    "90%: prompt OPENS with a /project-orchestrator call",
    body.startswith("/project-orchestrator"),
    f"got={body[:60]!r}",
)
os.unlink(p)

p = transcript(900_000)
raw, obj = run(p)
ctx = (obj or {}).get("hookSpecificOutput", {}).get("additionalContext", "")
check("90% without CONTEXT_HANDOFF_CHECK: no environment-check line", "Environment check:" not in ctx)
os.unlink(p)

# --- Threshold boundary -----------------------------------------------------
# MIND the arithmetic: transcript() also adds input_tokens=10, and the hook sums
# the three fields: 699_989 + 10 = 699_999, i.e. one short. The first version of
# this test passed 699_999 and went red: the sum came to 700_009 and the
# threshold was legitimately crossed. The bug was in the test, not the hook;
# kept here explicitly, because "the check fooled itself" is only caught by
# counting like this.
p = transcript(699_989)  # sum is exactly 699_999
raw, _ = run(p)
check("70% threshold: 699_999 tokens is still silent", raw == "", f"stdout={raw[:60]!r}")
os.unlink(p)

p = transcript(699_990)  # sum is exactly 700_000
raw, obj = run(p)
check("70% threshold: exactly 700_000 speaks up", raw != "")
os.unlink(p)

# --- Fault tolerance: the hook must never break a turn ----------------------
raw, _ = run("/nonexistent/transcript.jsonl")
check("no transcript file: hook is silent, does not crash", raw == "")

p = transcript(900_000, valid=False)
raw, _ = run(p)
check("broken JSON in transcript: hook is silent, does not crash", raw == "")
os.unlink(p)

p = transcript(900_000, with_usage=False)
raw, _ = run(p)
check("no usage record: hook is silent", raw == "")
os.unlink(p)

p = transcript(900_000)
raw, _ = run(p, limit="0")
check("CONTEXT_LIMIT_TOKENS=0: hook is silent, no division by zero", raw == "")
raw, obj = run(p, limit="not-a-number")
check("CONTEXT_LIMIT_TOKENS garbage: falls back to default, no crash", (obj or {}) != {})
os.unlink(p)

# --- Configurable limit -----------------------------------------------------
p = transcript(180_000)
raw, _ = run(p, limit="1000000")
check("180k with a 1M limit: silent", raw == "")
raw, obj = run(p, limit="200000")
ctx = (obj or {}).get("hookSpecificOutput", {}).get("additionalContext", "")
check("180k with a 200k limit: HANDOFF_NOW (the limit really is configurable)", "HANDOFF_NOW" in ctx)
os.unlink(p)

print()
if failures:
    print(f"{len(failures)} FAILED: " + ", ".join(failures))
    sys.exit(1)
print("ALL PASS")
