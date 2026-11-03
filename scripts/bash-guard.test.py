#!/usr/bin/env python3
"""Test for the bash-guard PreToolUse hook: every rule must be able to block,
and the commands that only MENTION a rule (commit messages, echo, heredocs)
must pass.

Each row is a command and the expected verdict: "block:<rule>" (exit 2 and
the rule name in stderr) or "allow" (exit 0, no stderr). Branch rows run in a
throwaway git repo that sits on a feature branch, or on main.

Gate discipline: comment out one rule in a copy of the hook, point
BASH_GUARD_HOOK at the copy, and the rows of that rule must fail.

Run: python3 scripts/bash-guard.test.py
(or python3 .claude/scripts/bash-guard.test.py once installed)
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
HOOK = os.environ.get("BASH_GUARD_HOOK") or os.path.join(HERE, "..", "hooks", "bash-guard.sh")

failures: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    detail = " ".join(detail.split()) if not ok else ""
    print(f"{'PASS' if ok else 'FAIL'} {name}" + (f" — {detail}" if detail else ""))
    if not ok:
        failures.append(name)


def git(d: str, *args: str) -> None:
    subprocess.run(["git", "-C", d, *args], check=True, capture_output=True)


def repo(on: str) -> str:
    """A repo with main and feature; HEAD on `on`."""
    d = tempfile.mkdtemp()
    git(d, "init", "-q", "-b", "main")
    git(d, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "init")
    git(d, "branch", "feature")
    git(d, "checkout", "-q", on)
    return d


def run(command: str, cwd: str, project: str | None = None, raw: str | None = None) -> tuple[int, str]:
    env = {k: v for k, v in os.environ.items() if k != "CLAUDE_PROJECT_DIR"}
    if project:
        env["CLAUDE_PROJECT_DIR"] = project
    payload = raw if raw is not None else json.dumps(
        {"tool_name": "Bash", "tool_input": {"command": command}, "cwd": cwd})
    p = subprocess.run(["bash", HOOK], input=payload, capture_output=True, text=True, timeout=20, env=env)
    return p.returncode, p.stderr


FEATURE = repo("feature")
MAIN = repo("main")
PROJECT = tempfile.mkdtemp()
os.makedirs(os.path.join(PROJECT, ".claude", "hooks"))
with open(os.path.join(PROJECT, ".claude", "hooks", "guard-patterns.txt"), "w") as f:
    f.write("# project rules\n\n"
            "prettier[^|;&]*--write\tPrettier is not used in this repo; formatting is manual.\n"
            "(^|[[:space:]])rm[[:space:]]+-rf[[:space:]]+/($|[[:space:]])\tNever wipe the root.\n"
            "([unclosed\tbroken line, skipped\n")

# (command, expected, cwd)
CASES = [
    # pkill-self
    ('pkill -f "next start"', "block:pkill-self", FEATURE),
    ("pkill -fx node-server", "block:pkill-self", FEATURE),
    ("sudo pkill --full vite; git commit -am wip && git push", "block:pkill-self", FEATURE),
    ("while pgrep -f 'npm run dev'; do sleep 1; done", "block:pkill-self", FEATURE),
    ("kill $(pgrep -f server.js)", "block:pkill-self", FEATURE),
    ("bash -c 'pkill -f serve'", "block:pkill-self", FEATURE),
    ("pkill node", "allow", FEATURE),
    ("pgrep -fa node", "allow", FEATURE),
    ('kill "$(cat /tmp/srv.pid)"', "allow", FEATURE),
    ('git commit -m "never use pkill -f in scripts"', "allow", FEATURE),
    ("echo 'pkill -f x kills itself'", "allow", FEATURE),
    ("cat > notes.md <<'EOF'\n# Gotchas\npkill -f server; git push -f\nEOF\ngit add notes.md", "allow", FEATURE),
    ("git commit -m 'wip; pkill -f vite'", "allow", FEATURE),
    ("ls # pkill -f x", "allow", FEATURE),
    # pipe-gate
    ('npm test | grep "Tests " && git commit -m x', "block:pipe-gate", FEATURE),
    ("pnpm test 2>&1 | tail -3 && git push", "block:pipe-gate", FEATURE),
    ("yarn test | tee log && echo ok", "block:pipe-gate", FEATURE),
    ("npm run test:unit | tail -1 && git commit -m x", "block:pipe-gate", FEATURE),
    ("npx vitest run | tail -5 && git commit -m x", "block:pipe-gate", FEATURE),
    ("npx jest | grep passed && echo green", "block:pipe-gate", FEATURE),
    ("pytest -q | tail -1 && git commit -m x", "block:pipe-gate", FEATURE),
    ("python3 -m pytest | tail -2 && make release", "block:pipe-gate", FEATURE),
    ("python3 scripts/context_monitor.test.py | tail -1 && git commit -m x", "block:pipe-gate", FEATURE),
    ('scripts/ship.sh "claude/x" /path | tail -1 && ./notify.sh shipped', "block:pipe-gate", FEATURE),
    ("bash scripts/deploy.sh | tail -1 && echo done", "block:pipe-gate", FEATURE),
    ("npm run deploy | grep -q Uploaded && echo live", "block:pipe-gate", FEATURE),
    ("cd app && npm test | tail -1 && git commit -m x", "block:pipe-gate", FEATURE),
    ("set -o pipefail; npm test | tail -1 && git commit -m x", "allow", FEATURE),
    ("set -euo pipefail\npytest | tail -1 && git commit -m x", "allow", FEATURE),
    ("npm test > /tmp/t.log 2>&1; echo $?", "allow", FEATURE),
    ("npm test && git commit -m x", "allow", FEATURE),
    ("npm test | tail -20", "allow", FEATURE),
    ("pytest | tail -5 || true", "allow", FEATURE),
    ("git log | grep ship && echo found", "allow", FEATURE),
    ("cat deploy.log | grep error && echo bad", "allow", FEATURE),
    ("npm ci | tail -1 && npm test", "allow", FEATURE),
    ('git commit -m "npm test | grep Tests && git commit was the bug"', "allow", FEATURE),
    ('git commit -m "wip; npm test | tail -1 && push"', "allow", FEATURE),
    # stale-main (HEAD on feature)
    ("git push origin main", "block:stale-main", FEATURE),
    ("git push -u origin master", "block:stale-main", FEATURE),
    ("git push origin main:main", "block:stale-main", FEATURE),
    ("git push origin main && git push origin HEAD:feature", "block:stale-main", FEATURE),
    ("git push origin HEAD:main && git push origin HEAD:feature", "allow", FEATURE),
    ("git push origin feature", "allow", FEATURE),
    ("git push origin main", "allow", MAIN),
    (f"cd {MAIN} && git push origin main", "allow", FEATURE),
    (f"git -C {FEATURE} push origin main", "block:stale-main", MAIN),
    ('git commit -m "use git push origin main"', "allow", FEATURE),
    ("git push origin main", "allow", tempfile.gettempdir()),   # not a repo: fail-open
    # force-push
    ("git push --force origin feature", "block:force-push", FEATURE),
    ("git push -f", "block:force-push", FEATURE),
    ("git push -uf origin feature", "block:force-push", FEATURE),
    ("git push origin +feature", "block:force-push", FEATURE),
    ("git push --force-with-lease origin HEAD:main", "block:force-push", FEATURE),
    ("git push --force-with-lease", "block:force-push", MAIN),
    ("git push --force-with-lease origin feature", "allow", FEATURE),
    ("git push --force-with-lease", "allow", FEATURE),
    ('echo "git push --force is banned"', "allow", FEATURE),
    ("git push -u origin feature", "allow", FEATURE),
]

PROJECT_CASES = [
    ("npx prettier --write .", "block:Prettier is not used"),
    ("rm -rf /", "block:Never wipe the root"),
    ("rm -rf ./build", "allow"),
    ('git commit -m "do not run prettier --write"', "allow"),
    ("npx prettier --check .", "allow"),
]

for cmd, want, cwd in CASES:
    code, err = run(cmd, cwd)
    label = cmd.replace("\n", "\\n")
    if want == "allow":
        check(f"allow  {label}", code == 0 and not err.strip(), f"exit {code} {err.strip()[:120]}")
    else:
        rule = want.split(":", 1)[1]
        check(f"block  {label}", code == 2 and f"{rule}:" in err, f"exit {code} {err.strip()[:120]}")

for cmd, want in PROJECT_CASES:
    code, err = run(cmd, FEATURE, project=PROJECT)
    if want == "allow":
        check(f"allow  [project] {cmd}", code == 0 and not err.strip(), f"exit {code} {err.strip()[:120]}")
    else:
        why = want.split(":", 1)[1]
        check(f"block  [project] {cmd}", code == 2 and why in err, f"exit {code} {err.strip()[:120]}")

# Fail-open: anything the hook cannot read is allowed, silently.
for name, raw in [("broken JSON", "{not json"), ("empty input", ""),
                  ("other tool", json.dumps({"tool_name": "Edit", "tool_input": {"command": "pkill -f x"}})),
                  ("no command", json.dumps({"tool_name": "Bash", "tool_input": {}}))]:
    code, err = run("", FEATURE, raw=raw)
    check(f"allow  fail-open: {name}", code == 0 and not err.strip(), f"exit {code} {err.strip()[:120]}")

total = len(CASES) + len(PROJECT_CASES) + 4
print(f"\n{total - len(failures)}/{total} passed")
sys.exit(1 if failures else 0)
