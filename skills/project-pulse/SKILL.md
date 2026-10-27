---
name: project-pulse
description: Give a project a pulse — daily metrics collected into the repository and a weekly Routine analyst that sends the owner a diagnosis and actions.
disable-model-invocation: true
---

# Project Pulse

The pulse is two layers of automation that replace "the owner sends dashboard
screenshots" with "the project measures itself and proposes a move". It was
born in a live product; this skill is the portable template for any project.

Two layers, each with its own carrier:

1. **Collection**: a machine, daily, no AI. A workflow fetches metrics over
   APIs and COMMITS the day's line to `data/metrics/daily.ndjson` in the
   repository. The repository is the memory: any session reads the numbers
   with no tokens and no screenshots. Secrets live in GitHub Secrets, never in
   chat (playbook P-01).
2. **Analyst**: a Routine once a week. A session reads the accumulated file
   plus the project's BACKLOG and HANDOFF and sends the owner a digest under
   the contract in [`DIGEST.md`](DIGEST.md): numbers → diagnosis → actions →
   a ready PR for the top safe action.

## Gotcha: a fresh-session Routine HAS NO repository, and no prompt can fix that

A Routine with `create_new_session_on_fire` starts a fresh session with no
sources: no files, no Actions API, no GitHub tools. That session has no
`add_repo`/`register_repo_root` either: advice to "call them as the first
step" asked for something that does not exist, and every run for a month
ended with the same "no access to the repository".

The fix is in the binding, not the prompt:

1. `create_session` with the repository's `source_url`: a persistent host
   session where the repository is already checked out, with GitHub tools and
   push rights. Verify it OBSERVABLY, not from its description: have it push
   a test branch and read the latest workflow run. A host that got stuck
   (a question left hanging, a probe branch still checked out) is not
   repaired in place: archive it, start a new one from a `main` that already
   carries the fixes, and rebind the Routines to it.
2. Create the Routine with that session's `persistent_session_id`: every run
   continues it instead of starting an empty one. `update_trigger` does not
   change the binding: delete the old Routine and create a new one.
3. The prompt starts with a sync, not with a clone: first `git status
   --porcelain`; if it prints anything, stop and report the uncommitted files
   instead of discarding them. Only on a clean tree: `git checkout main &&
   git fetch && git reset --hard origin/main`.
4. The repository's hooks run in the host session too, and nobody is there.
   A Stop hook that demands AskUserQuestion hangs the session forever: the
   Routine prompt starts with the marker `[[unattended]]`, and the hook stays
   silent when it sees it. The marker arrives through TWO channels, as a plain
   string or as a notification body inside a ReadNotifications tool_result;
   the hook must see both, and is verified against a transcript of the
   channel the prompt actually travels by in production. The marker counts
   only when it arrived after the last real owner message; a marker quoted
   inside tool output (a trigger listing printed as JSON) does not, so the
   owner's own sessions keep their checks.
5. A Routine bound to a persistent session has NO completion notifications
   (the server rejects them). The delivery channel is a comment on a GitHub
   issue (the "log"): the owner gets an email, and the assistant needs no new
   tool.
6. A Routine stores no MCP connectors: at run time the session may have no
   `mcp__github__*`. The prompt gives a REST fallback via `curl` with
   `GITHUB_TOKEN` from the environment (runs, logs, comment, PR, merge).

Test delivery with a ONE-SHOT Routine on the same `persistent_session_id`
(`run_once_at` a couple of minutes out, prompt "leave a comment on the
issue"), not with `fire_trigger`: a manual fire starts a fresh session with no
sources (the `session_id` in the server's reply is not the host's) and
silently reproduces the very breakage you are fixing (verified: two fires in a
row missed).

## Setting up the pulse on a project (invoking the skill)

Invoked in a project without a pulse: set up both layers. Done when the
workflow is verified by a run or a dry simulation of the edge cases, the
Routine is created and visible in the list, and everything is recorded in the
project's memory.

1. **Collector.** Pick 3–7 metrics the project can fetch cheaply over an API
   every day (traffic, infrastructure cost, conversions, queue: whatever
   actually moves THIS project's decisions; a metric with no possible action
   behind it is ballast). Write a daily workflow:
   - a line only for a COMPLETE previous day; a re-run does not duplicate
     (grep for the date before appending);
   - an unavailable source is a warning and nulls in the line, never a
     failure of the other metrics;
   - commit the metrics with `if: always()`: the day that broke a threshold is
     exactly the day that must not be lost; push with `pull --rebase`;
   - alarm thresholds: a breach = a red run = an email to the owner the same
     day, not on Monday;
   - the bash -e trap: `[ test ] && assignment` fails the step when the test
     is false; use `if` only;
   - a source with publication lag (Google Search Console returns numbers
     after ~2–3 days): store the data date INSIDE that source's field in the
     line rather than substituting it for the line's date; fetch "today minus
     lag", not "yesterday". Headless access to Search Console is a service
     account (a JWT signed with RS256 needs no dependencies).
   - a source that back-fills late (Search Console again): a daily line is a
     snapshot taken once and never rewritten, so a late day stays a zero
     forever (in the origin project two days of impressions were lost this
     way). Add a weekly workflow that commits a range report for the last 28
     days (`data/metrics/gsc-range.md`) on the evening before the analyst
     runs, with margin for cron delays; `DIGEST.md` treats it as the primary
     source for that metric and falls back to the daily lines when it is
     missing or older than 8 days.
   Run the edge cases (zeros, nulls, a repeated run) through real bash/jq
   before committing.
2. **Analyst.** First the host session with the repository (`create_session`,
   `source_url`), then the Routine on it (`create_trigger`,
   `persistent_session_id`, weekly); delivery is a comment on the log issue,
   see the gotcha above. Prompt: read `data/metrics/daily.ndjson`,
   `docs/project/BACKLOG.md`, `docs/project/HANDOFF.md` and
   `.claude/skills/project-pulse/DIGEST.md` of this repository, and act under
   the DIGEST contract. Write the project's constants into the prompt: plan
   limits and prices, known periodic peaks ("the re-upload on even Sundays is
   normal"), the metrics file name.
3. **Memory.** Record the decision in the project's DECISIONS (with the
   Routine id in the text), the owner's actions (tokens, permissions) in
   BACKLOG with the link on the first line, and a line about the pulse in
   HANDOFF.

## Moving it to another project

Copy the `.claude/skills/project-pulse/` folder into the project's repository,
open a session there and invoke `/project-pulse`. Step 1 adapts to the
project's metric sources; steps 2–3 are the same everywhere.

The owner does NOT create keys again; they are reused, and the owner's part
for a new project is ~2 minutes:

- A Cloudflare analytics token (Account Analytics:Read + Zone:Read + Zone
  Analytics:Read on All zones) covers every site in the account: the owner
  pastes THE SAME token as a secret into the new repository.
- One Google service account serves every project: the owner adds its email
  as a user in the new site's Search Console (restricted permission is enough)
  and pastes THE SAME JSON as a secret into the new repository.

Keys live only in GitHub Secrets (write-only); the assistant neither stores
them nor carries them between repositories, so the two secret pastes are
always the owner's. If the repositories move into a GitHub organization, the
secrets are set once for the whole organization and this part disappears.
