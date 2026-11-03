#!/usr/bin/env bash
# PreToolUse hook (matcher "Bash"): refuse shell commands that have already
# broken real sessions, instead of asking the model to remember a sentence in
# CLAUDE.md (P-16: an instruction that has to be remembered will be skipped).
# Exit 2 blocks the call; stderr is the reason Claude reads. Exit 0 allows.
#
# Blocked, each with the incident behind it and what to do instead:
#   pkill-self   `pkill -f PAT`, and `pgrep -f PAT` inside a loop or next to
#                `kill`. PAT is also in the command line of the shell running
#                this very call, so pkill kills that shell (exit 144) together
#                with the commit and push chained after it, and a `pgrep -f`
#                wait loop always finds itself and never ends.
#                Do instead: `cmd & echo $! > x.pid`, later `kill "$(cat x.pid)"`.
#   pipe-gate    a test or ship/deploy command that is not the last stage of a
#                pipeline chained with `&&`: `npm test | grep "Tests " && git
#                commit`, `scripts/ship.sh | tail -1 && ...`. The pipeline's
#                exit code is the filter's, so a red test still commits.
#                Allowed when `set -o pipefail` comes earlier in the command.
#                Do instead: run it alone and check `$?`, or `set -o pipefail;`.
#   stale-main   `git push REMOTE main` (or master, or `main:x`) while the
#                checked-out branch is another one: git pushes the local main,
#                which lags, not HEAD. `HEAD:main` is fine.
#                Do instead: `git push REMOTE HEAD:main`.
#   force-push   `git push --force`, `-f` (also inside `-uf`), `+refspec`.
#                Do instead: merge (`git merge origin/BRANCH`), then push.
#   project      each line of $CLAUDE_PROJECT_DIR/.claude/hooks/guard-patterns.txt:
#                `<extended regex><TAB><reason>`; `#` starts a comment line.
#                A match blocks with that reason. Example line:
#                  prettier[^|;&]*--write	Prettier is not used here; formatting is manual.
#
# Decisions:
# - --force-with-lease stays ALLOWED for any branch except main/master. It
#   refuses to overwrite commits you have not fetched, which covers rebasing
#   your own feature branch before review. On main/master it is blocked like
#   --force: there the lease protects nothing, because every other session
#   builds on main and loses its base the moment it is rewritten.
# - Fail-open on purpose. Bad JSON, a non-Bash tool, a crash in this script,
#   a missing python3, or a git that cannot name the branch: exit 0, silently.
#   A guard that crashes into a block would stop every shell call of the
#   session over a parser bug; a guard that misses one rare command costs what
#   the session cost before the guard existed. Every rule is covered by
#   scripts/bash-guard.test.py instead, including a run with each rule removed.
#
# How commands are read: the command is split into shell words the way bash
# does it, so text inside quotes stays one word and heredoc bodies and
# comments are dropped. `git commit -m "never pkill -f"` and `echo 'npm test |
# tail && x'` are therefore NOT blocked. `bash -c '...'`, `sh -c` and `eval`
# are read recursively; `cd DIR` and `git -C DIR` move the directory the
# branch is read in. Project patterns match the command with quoted text
# blanked out (`""`) and heredoc bodies removed. Limits: commands built at run
# time (`$CMD`, aliases, functions, scripts that run pkill inside) are not
# seen; a `$(...)` inside double quotes is not inspected; `"$(x "y")"`
# nesting can mis-split; `git push` with no refspec is assumed to push the
# current branch. Patterns use Python `re`; POSIX classes like [[:space:]]
# are translated.
#
# Register it in the project's .claude/settings.json (kit-sync installs and
# updates the file and reports "not wired" until this is there; it never edits
# settings.json itself). The path is absolute on purpose: a relative one
# breaks as soon as the session cd's elsewhere, and a missing hook script
# fails open, so the guard would switch off without a word.
#   "PreToolUse": [
#     { "matcher": "Bash",
#       "hooks": [ { "type": "command",
#                    "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/bash-guard.sh\"",
#                    "timeout": 10 } ] }
#   ]
#
# Test: python3 scripts/bash-guard.test.py (BASH_GUARD_HOOK=path tests a copy).
set -u
GUARD_PY=$(cat <<'PY'
import json, os, re, subprocess, sys

ASSIGN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
KEYWORDS = {"if", "then", "else", "elif", "do", "while", "until", "for", "!", "{", "}", "fi", "done"}
WRAPPERS = {"sudo", "env", "nohup", "command", "exec", "nice", "timeout", "stdbuf", "time"}
SHELLS = {"bash", "sh", "zsh", "dash", "ksh"}
GATE_NAME = re.compile(r"(^|[._:-])(tests?|ship|deploy)([._:-]|$)")
RUNNERS = {"vitest", "jest", "pytest", "py.test", "mocha", "tox", "nox", "ava", "tap", "playwright", "cypress"}
PKG = {"npm", "pnpm", "yarn", "bun"}
FILTERS_NOTE = "grep/tail/head/tee/sed/awk/wc"
PROTECTED = {"main", "master"}


def tokenize(s):
    """Shell words and operators. Returns (tokens, blanked_text).
    tokens: ("w", word) | ("o", operator) | ("r", redirection taking a target word)."""
    toks, blank, heredocs = [], [], []
    word = None
    i, n = 0, len(s)

    def end_word():
        nonlocal word
        if word is not None:
            toks.append(("w", "".join(word)))
            word = None

    def add(text):
        nonlocal word
        if word is None:
            word = []
        word.append(text)

    while i < n:
        c = s[i]
        if c == "\\":
            if s[i + 1:i + 2] == "\n":
                i += 2
                continue
            add(s[i + 1:i + 2]); blank.append(s[i:i + 2]); i += 2
            continue
        if c == "'":
            j = s.find("'", i + 1)
            j = n if j < 0 else j
            add(s[i + 1:j]); blank.append("''"); i = j + 1
            continue
        if c == '"':
            j, buf = i + 1, []
            while j < n and s[j] != '"':
                if s[j] == "\\" and j + 1 < n and s[j + 1] in '"\\$`\n':
                    buf.append(s[j + 1]); j += 2
                    continue
                buf.append(s[j]); j += 1
            add("".join(buf)); blank.append('""'); i = j + 1
            continue
        if c == "#" and word is None:
            j = s.find("\n", i)
            i = n if j < 0 else j
            continue
        if c in " \t":
            end_word(); blank.append(c); i += 1
            continue
        if c == "\n":
            end_word(); toks.append(("o", ";")); blank.append("\n"); i += 1
            while heredocs:                      # skip each pending heredoc body
                delim, _ = heredocs.pop(0)
                while i < n:
                    j = s.find("\n", i)
                    line = s[i:] if j < 0 else s[i:j]
                    i = n if j < 0 else j + 1
                    if line.strip() == delim:
                        break
            continue
        if c in "<>" or s.startswith("&>", i):
            if word is not None and "".join(word).isdigit():
                word = None                      # fd number, as in 2>&1
            end_word()
            if s.startswith("<<<", i):
                toks.append(("r", "<<<")); blank.append("<<<"); i += 3
                continue
            if s.startswith("<<", i):
                i += 2
                if s[i:i + 1] == "-":
                    i += 1
                while i < n and s[i] in " \t":
                    i += 1
                m = re.match(r"""(['"]?)([^\s'";&|<>()]+)\1""", s[i:])
                if m:
                    heredocs.append((m.group(2), True)); i += m.end()
                blank.append("<<HEREDOC")
                continue
            j = i + 1
            if j < n and s[j] in ">|&":
                j += 1
            if s[j - 1] == "&" and j < n and (s[j].isdigit() or s[j] == "-"):
                while j < n and (s[j].isdigit() or s[j] == "-"):
                    j += 1                       # >&2: duplicate, no target word
                blank.append(s[i:j]); i = j
                continue
            toks.append(("r", s[i:j])); blank.append(s[i:j]); i = j
            continue
        if c in "&|;":
            end_word()
            two = s[i:i + 2]
            op = two if two in ("&&", "||", "|&", ";;") else c
            toks.append(("o", op)); blank.append(op); i += len(op)
            continue
        if c in "()`" or (c == "$" and s[i + 1:i + 2] == "("):
            end_word()
            if c == "$":
                i += 1
                blank.append("$")
            toks.append(("o", s[i])); blank.append(s[i]); i += 1
            continue
        add(c); blank.append(c); i += 1
    end_word()
    return toks, "".join(blank)


def split_segments(toks):
    """Simple commands as (words, operator that follows)."""
    segs, cur, skip = [], [], False
    for kind, v in toks:
        if kind == "w":
            if skip:
                skip = False
            else:
                cur.append(v)
        elif kind == "r":
            skip = True
        else:
            segs.append((cur, v)); cur = []
    segs.append((cur, ""))
    return segs


def pipelines(segs):
    """[(stages, operator after the pipeline)] skipping closing ) and `."""
    out, cur = [], []
    for k, (words, op) in enumerate(segs):
        if words:
            cur.append((k, words))
        if op in ("|", "|&"):
            continue
        if cur:
            m, nxt = k, op
            while nxt in (")", "`") and m + 1 < len(segs) and not segs[m + 1][0]:
                m += 1; nxt = segs[m][1]
            out.append((cur, nxt))
        cur = []
    return out


def head(words):
    """Words from the real program on: skips keywords, VAR=x, sudo/env/time..."""
    i = 0
    while i < len(words):
        w = words[i]
        if w in KEYWORDS or ASSIGN.match(w):
            i += 1
            continue
        if w in WRAPPERS:
            i += 1
            while i < len(words) and (words[i].startswith("-") or ASSIGN.match(words[i])):
                i += 2 if words[i] in ("-n", "-u", "-g", "-s", "-k") else 1
            if w == "timeout" and i < len(words):
                i += 1                           # the duration
            continue
        break
    return words[i:]


def prog(words):
    h = head(words)
    return (os.path.basename(h[0]) if h else ""), h


def short_flag(args, ch):
    return any(a.startswith("-") and not a.startswith("--") and ch in a[1:] for a in args)


def is_gate(words):
    """A test run or a ship/deploy step: its exit code is what a && trusts."""
    p, h = prog(words)
    if not p:
        return False
    args = [a for a in h[1:] if not a.startswith("-")]
    if p in RUNNERS:
        return True
    if p in ("npx", "bunx", "pnpx"):
        return is_gate(args)
    if p in PKG:
        if not args:
            return False
        if args[0] in ("test", "t", "tst"):
            return True
        if args[0] in ("run", "run-script"):
            return len(args) > 1 and bool(GATE_NAME.search(args[1]))
        if args[0] in ("exec", "dlx", "x"):
            return is_gate(args[1:])
        return p != "npm" and (bool(GATE_NAME.search(args[0])) or is_gate(args))
    if p in ("go", "cargo", "dotnet", "deno", "mix", "swift"):
        return bool(args) and args[0] == "test"
    if p in ("make", "rake", "mvn", "gradle", "gradlew"):
        return any(a in ("test", "check", "deploy", "ship") for a in args)
    if re.fullmatch(r"python[0-9.]*", p):
        if len(h) > 2 and h[1] == "-m":
            return h[2] in ("pytest", "unittest", "tox", "nox")
        return bool(args) and bool(GATE_NAME.search(os.path.basename(args[0])))
    if p in SHELLS or p in ("node", "tsx", "ts-node", "ruby", "perl"):
        if "-c" in h:
            return False                         # read recursively instead
        return bool(args) and bool(GATE_NAME.search(os.path.basename(args[0])))
    if args and args[0] in ("deploy", "ship"):   # wrangler deploy, vercel deploy
        return True
    return bool(GATE_NAME.search(p))


def git_push_args(words):
    """(dir from -C or None, push args) when the words are a git push, else None."""
    p, h = prog(words)
    if p != "git":
        return None
    i, cdir = 1, None
    while i < len(h) and h[i].startswith("-"):
        if h[i] in ("-C", "-c"):
            if h[i] == "-C" and i + 1 < len(h):
                cdir = h[i + 1] if cdir is None else os.path.join(cdir, h[i + 1])
            i += 2
        else:
            i += 1
    if i >= len(h) or h[i] != "push":
        return None
    return cdir, h[i + 1:]


def push_parts(args):
    """(flags, positionals) of git push; drops values of -o/--repo/..."""
    flags, pos, i = [], [], 0
    while i < len(args):
        a = args[i]
        if a in ("-o", "--push-option", "--repo", "--receive-pack", "--exec"):
            i += 2
            continue
        if a == "--":
            pos += args[i + 1:]
            break
        (flags if a.startswith("-") else pos).append(a)
        i += 1
    return flags, pos


def branch(d):
    try:
        r = subprocess.run(["git", "-C", d, "rev-parse", "--abbrev-ref", "HEAD"],
                           capture_output=True, text=True, timeout=5)
    except Exception:
        return None
    return r.stdout.strip() if r.returncode == 0 and r.stdout.strip() else None


def short_ref(r):
    r = r.lstrip("+")
    return r[len("refs/heads/"):] if r.startswith("refs/heads/") else r


PKILL = ("pkill-self: `{}` matches its own shell. The pattern is also in the command line of the "
         "bash process running this call, so pkill kills that shell (exit 144) together with "
         "everything chained after it, and a `pgrep -f` wait loop always finds itself. "
         "Do instead: start the process with `cmd & echo $! > /tmp/NAME.pid`, stop it with "
         "`kill \"$(cat /tmp/NAME.pid)\"`; wait on that pid, not on a pattern.")
PIPE = ("pipe-gate: `{}` runs in a pipeline chained with `{}`. A pipeline's exit code is its LAST "
        "command's (" + FILTERS_NOTE + "), so a red test or a failed ship/deploy still lets the next "
        "step run. Do instead: run it on its own and check the code "
        "(`npm test > /tmp/t.log 2>&1; echo $?`, then read the log), or put `set -o pipefail;` "
        "at the start of the same command.")
STALE = ("stale-main: `git push ... {ref}` from branch `{cur}` pushes your LOCAL {src}, which lags "
         "behind, not the commit you are on. Do instead: `git push <remote> HEAD:{dst}` "
         "(and `HEAD:{cur}` to update the branch itself).")
FORCE = ("force-push: `{}` rewrites shared history; other sessions and people lose the commits "
         "they built on. Do instead: `git fetch` and `git merge origin/<branch>`, then a normal "
         "push. (`--force-with-lease` is allowed on branches other than main/master.)")


def posix_classes(rx):
    for name, py in (("alnum", "a-zA-Z0-9"), ("alpha", "a-zA-Z"), ("digit", "0-9"),
                     ("upper", "A-Z"), ("lower", "a-z"), ("space", r" \t\n\r\f\v"),
                     ("blank", r" \t"), ("xdigit", "0-9A-Fa-f"), ("word", r"\w"),
                     ("punct", r"!-/:-@\[-`{-~")):
        rx = rx.replace("[:%s:]" % name, py)
    return rx


def project_patterns(root):
    out = []
    try:
        lines = open(os.path.join(root, ".claude", "hooks", "guard-patterns.txt"),
                     encoding="utf-8").read().splitlines()
    except Exception:
        return out
    for line in lines:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        pat, _, reason = line.partition("\t")
        try:
            out.append((re.compile(posix_classes(pat.strip())),
                        reason.strip() or "matches project pattern " + pat.strip()))
        except re.error:
            continue                             # a broken line is skipped, not fatal
    return out


def analyze(cmd, cwd, patterns, depth=0):
    reasons = []
    toks, blanked = tokenize(cmd)
    segs = split_segments(toks)
    progs = [prog(w)[0] for w, _ in segs]
    looping = any(w and w[0] in ("while", "until", "for") for w, _ in segs)

    # Project patterns (blanked text: quoted strings and heredoc bodies removed).
    for rx, why in patterns:
        if rx.search(blanked):
            reasons.append("project rule (.claude/hooks/guard-patterns.txt): " + why)

    d = cwd
    for k, (words, _) in enumerate(segs):
        p, h = prog(words)
        if not p:
            continue
        # cd moves the directory git is asked about.
        if p == "cd" and len(h) > 1 and not h[1].startswith("-"):
            d = os.path.join(d, os.path.expanduser(h[1]))
        # Shell strings run by bash -c / sh -c / eval: read them too.
        if depth < 3 and p in SHELLS and "-c" in h:
            i = h.index("-c")
            if i + 1 < len(h):
                reasons += analyze(h[i + 1], d, patterns, depth + 1)
        if depth < 3 and p == "eval" and len(h) > 1:
            reasons += analyze(" ".join(h[1:]), d, patterns, depth + 1)
        # pkill-self
        if p == "pkill" and (short_flag(h[1:], "f") or "--full" in h):
            reasons.append(PKILL.format(" ".join(h)))
        if p == "pgrep" and (short_flag(h[1:], "f") or "--full" in h) and (looping or "kill" in progs):
            reasons.append(PKILL.format(" ".join(h)))
        # git push: force-push and stale-main
        gp = git_push_args(words)
        if gp:
            cdir, args = gp
            gd = os.path.join(d, os.path.expanduser(cdir)) if cdir else d
            flags, pos = push_parts(args)
            refs = pos[1:]
            hard = ("--force" in flags or short_flag(flags, "f")
                    or any(r.startswith("+") for r in refs))
            lease = any(f.startswith("--force-with-lease") for f in flags)
            if hard:
                reasons.append(FORCE.format(" ".join(h)))
            src_main = [r for r in refs if short_ref(r.split(":")[0]) in PROTECTED]
            if src_main or (lease and not hard):
                cur = branch(gd)
                for r in src_main:
                    src = short_ref(r.split(":")[0])
                    dst = short_ref(r.split(":")[-1]) or src
                    if cur is not None and cur != src:
                        reasons.append(STALE.format(ref=r, cur=cur, src=src, dst=dst))
                if lease and not hard:
                    dsts = [short_ref(r.split(":")[-1]) for r in refs] if refs else [cur]
                    if any(x in PROTECTED for x in dsts):
                        reasons.append(FORCE.format(" ".join(h)))

    # pipe-gate
    seg_pipefail = []
    pf = False
    for words, _ in segs:
        p, h = prog(words)
        if p == "set" and "pipefail" in h:
            pf = "+o" not in h
        seg_pipefail.append(pf)
    for stages, op in pipelines(segs):
        if op != "&&" or len(stages) < 2:
            continue
        k0 = stages[0][0]
        if k0 > 0 and seg_pipefail[k0 - 1]:
            continue
        for _, words in stages[:-1]:
            if is_gate(words):
                reasons.append(PIPE.format(" ".join(head(words)), op))
                break
    return reasons


def main():
    try:
        ev = json.load(sys.stdin)
        if ev.get("tool_name", "Bash") != "Bash":
            return 0
        cmd = (ev.get("tool_input") or {}).get("command")
        if not isinstance(cmd, str) or not cmd.strip():
            return 0
        cwd = ev.get("cwd") or os.getcwd()
        root = os.environ.get("CLAUDE_PROJECT_DIR") or cwd
        reasons = analyze(cmd, cwd, project_patterns(root))
    except Exception:
        return 0                                 # fail-open: see the header
    if not reasons:
        return 0
    seen = []
    for r in reasons:
        if r not in seen:
            seen.append(r)
    sys.stderr.write("bash-guard blocked this command (hooks/bash-guard.sh):\n- "
                     + "\n- ".join(seen)
                     + "\nRewrite the command as shown; do not reshape it to slip past the check.\n")
    return 2


sys.exit(main())
PY
)
python3 -c "$GUARD_PY"
