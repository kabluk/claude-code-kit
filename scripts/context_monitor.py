#!/usr/bin/env python3
"""Claude Code UserPromptSubmit hook: watches how full the context window is.

Why: a long session degrades unnoticed. The model starts losing early
agreements before anyone notices, and "let's continue" turns into "let's
redo". The goal is to warn ahead of time and hand over a ready prompt for a
new session.

How it is measured: by fact, not by heuristic. Claude Code writes the session
transcript as JSONL, and EVERY model response carries the real API usage:

    usage.input_tokens + usage.cache_read_input_tokens
      + usage.cache_creation_input_tokens

That is exactly how much context went into the last request. We read the last
such record: no counting characters, no guessing from the file size (the file
size lies: it accumulates the WHOLE history, including what the harness has
already folded away with auto-compaction and what was truncated in tool output).

Cost: the transcript grows to tens of MB, so the file is read FROM THE END in
blocks until the first (that is, the latest) usage record is found. A full
parse of a 9 MB file on every turn would cost more than it is worth.

The default limit is 1,000,000 tokens, because a live turn of ~740k was
observed (so the window is at least that large). Override it with the
CONTEXT_LIMIT_TOKENS environment variable without touching code: if the model
or plan changes, you change one value outside, not the logic here.

Optional: set CONTEXT_HANDOFF_CHECK to a command (for example
"npm install && npm test") and the handoff prompt will tell the next session to
run it as an environment check.

The hook stays silent until it is really getting tight: a warning on every turn
quickly teaches everyone to ignore it, and then it will not work when needed.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

# Share of the window after which it is time to wrap up / hand over.
NOTICE_AT = 0.70
HANDOFF_AT = 0.85
DEFAULT_LIMIT = 1_000_000

# How many bytes from the end of the transcript to read per attempt. Usage
# records are large (they hold the full model response), but long tool results
# can sit between them, so the window widens if nothing was found the first time.
TAIL_CHUNKS = (256_000, 1_024_000, 4_096_000)


def last_usage(path: str) -> dict | None:
    """The last usage record in the transcript, reading the file from the end."""
    try:
        size = os.path.getsize(path)
    except OSError:
        return None

    for chunk in TAIL_CHUNKS:
        try:
            with open(path, "rb") as f:
                start = max(0, size - chunk)
                f.seek(start)
                data = f.read()
        except OSError:
            return None

        # The first line is almost certainly cut in the middle: drop it,
        # unless we are reading the whole file from the very beginning.
        lines = data.split(b"\n")
        if start > 0:
            lines = lines[1:]

        for raw in reversed(lines):
            if b'"usage"' not in raw:
                continue
            try:
                rec = json.loads(raw.decode("utf-8", "replace"))
            except Exception:
                continue
            usage = (rec.get("message") or {}).get("usage")
            if isinstance(usage, dict) and (
                "input_tokens" in usage or "cache_read_input_tokens" in usage
            ):
                return usage

        if start == 0:  # read the whole file, nothing left to widen
            break
    return None


def context_tokens(usage: dict) -> int:
    return (
        int(usage.get("input_tokens") or 0)
        + int(usage.get("cache_read_input_tokens") or 0)
        + int(usage.get("cache_creation_input_tokens") or 0)
    )


def git(*args: str) -> str:
    """A short git query; an empty string instead of an exception, because the
    hook must never fail just because there is no repository."""
    try:
        out = subprocess.run(
            ["git", *args], capture_output=True, text=True, timeout=2, cwd=os.getcwd()
        )
        return out.stdout.strip() if out.returncode == 0 else ""
    except Exception:
        return ""


def handoff_prompt() -> str:
    """A prompt for the new session, built from the ACTUAL repository state.

    It opens with a /project-orchestrator call: EVERY new session should start
    with the orchestrator rather than reading files one by one by hand. The
    orchestrator reads HANDOFF.md/STATUS.md in its own Step 1, so "read the
    files first, then call the orchestrator" was a redundant step. After that
    comes a pointer to HANDOFF.md, not a retelling: a retelling is stale the
    moment it is written, a pointer is not (single source of truth).
    """
    branch = git("rev-parse", "--abbrev-ref", "HEAD") or "<current branch>"
    toplevel = git("rev-parse", "--show-toplevel")
    project = os.path.basename(toplevel) if toplevel else "this project"
    head = git("log", "-1", "--pretty=%h %s")
    dirty = git("status", "--porcelain")
    env_check = (os.environ.get("CONTEXT_HANDOFF_CHECK") or "").strip()

    lines = [
        "/project-orchestrator Continue the " + project + " project (branch " + branch + ").",
        "Read docs/project/HANDOFF.md and STATUS.md yourself in your Step 1 — I am",
        "not retelling them here so this prompt cannot go stale. Pick the next",
        "unblocked node from GRAPH.yaml (or the TASK below, if one is given",
        "explicitly), run it through /task-loop, update the handoff at the end of",
        "the iteration.",
    ]
    if env_check:
        lines += ["", "Environment check: " + env_check]
    lines += [
        "",
        "TASK: <write the task if there is a specific one — otherwise the orchestrator continues along the graph>",
    ]
    if head:
        lines += ["", "Last commit of the previous session: " + head]
    if dirty:
        lines += [
            "",
            "WARNING: the previous session left uncommitted changes "
            f"({len(dirty.splitlines())} files) — check git status before starting work.",
        ]
    return "\n".join(lines)


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    path = payload.get("transcript_path") or ""
    if not path or not os.path.exists(path):
        return 0

    usage = last_usage(path)
    if not usage:
        return 0

    used = context_tokens(usage)
    try:
        limit = int(os.environ.get("CONTEXT_LIMIT_TOKENS") or DEFAULT_LIMIT)
    except ValueError:
        limit = DEFAULT_LIMIT
    if limit <= 0:
        return 0

    share = used / limit
    if share < NOTICE_AT:
        return 0  # silent: a warning on every turn devalues itself

    pct = round(share * 100)
    used_k = round(used / 1000)
    limit_k = round(limit / 1000)

    if share >= HANDOFF_AT:
        visible = (
            f"⚠ Context {pct}% ({used_k}k of {limit_k}k). "
            "Time to start a new session — the handoff prompt is ready, see the reply."
        )
        context = (
            "CONTEXT_MONITOR: HANDOFF_NOW\n"
            f"used_tokens={used}\nlimit_tokens={limit}\nshare={pct}%\n"
            "\nThe session context is almost exhausted. In THIS reply you MUST:\n"
            "1) finish/commit the current piece of work, or say honestly that it is not finished;\n"
            "2) make sure docs/project/{STATUS,HANDOFF}.md reflect the facts;\n"
            "3) tell the owner it is time to start a new session and show the prompt below\n"
            "   IN FULL, ready to copy (in a code block, nothing cut).\n"
            "Do not start a new large task in this session.\n"
            "\n--- PROMPT FOR THE NEW SESSION ---\n" + handoff_prompt()
        )
    else:
        visible = (
            f"Context {pct}% ({used_k}k of {limit_k}k) — "
            "time to wrap up the current node, not to start a large one."
        )
        context = (
            "CONTEXT_MONITOR: WRAP_UP\n"
            f"used_tokens={used}\nlimit_tokens={limit}\nshare={pct}%\n"
            "\nThe context is more than "
            f"{int(NOTICE_AT * 100)}% full. Take the current node to a commit and update\n"
            "docs/project/{STATUS,HANDOFF}.md. Do not start a large new task in this\n"
            "session — suggest the owner starts it in a new one.\n"
            "Mention the context fill to the owner in ONE line, without panic."
        )

    print(
        json.dumps(
            {
                "systemMessage": visible,
                "hookSpecificOutput": {
                    "hookEventName": "UserPromptSubmit",
                    "additionalContext": context,
                },
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
