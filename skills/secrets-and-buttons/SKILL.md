---
name: secrets-and-buttons
description: Use when a task needs a credential (API token, key, secret), when a workflow or deploy fails without printing why, or when the next step would be a button only the owner can press. Probes what a token can actually do, reads provider error codes, makes failures visible under bash -e, and replaces owner buttons with push triggers.
---

# Secrets and buttons

Born on a day when one pitfall fired three times and the owner twice asked
"why so many tokens". The skill exists so that the next session of any
project does not go round the same circle. Ships together with
`project-orchestrator`.

Four facts, each of which cost a day:

- **Present ≠ usable.** The session-start hook says "the token is there",
  which only means a non-empty variable. One token in the environment was
  "active" and could not see a single account. You can rely only on a **probe**.
- **Secrets are one-way.** Nobody reads GitHub Secrets and environment
  variables back, including the assistant and the logs. That is protection:
  the key will not leak into the chat. You cannot "pick a suitable one from
  the existing ones"; you can ask the provider what each one can do.
- **`bash -e` + a bare assignment = silent death.**
  `OUT=$(failing command)` kills the step before `echo`; nothing reaches the
  log. That is how a snapshot swap, a watchdog and a deploy failed three
  times in a row.
- **The assistant has no buttons.** `workflow_dispatch` →
  `403 Resource not accessible by integration`. A button is not handed over;
  it is removed.

## A token is needed — steps

1. **Name it and find it.** The variable or secret name; where it lives (the
   environment if you call the API from a terminal; a GitHub Secret if a
   workflow does the work). Never ask for the value in chat.
2. **Probe capability, not presence.** For Cloudflare, use
   [`probe-cloudflare.sh`](probe-cloudflare.sh): for each variable name it
   prints the value's shape (length, stray characters) and "alive / account /
   D1 / Workers / zone / analytics" as yes/no with the provider's code. For
   another provider, the same principle: one read-only request per capability
   you need. Never print the token itself. Done when every required
   permission has a provider answer, not an assumption.
3. **Read the asymmetry honestly.** A successful read does not prove Edit
   permission; a failed one does disprove it. The audit reliably says "this
   one will not do" and only suggests "this one will".
4. **Something is missing: one owner action, link on the first line.** The
   exact permission list (`Account > Workers Scripts > Edit`), the exact
   secret name, a link to the page where it is created and to the page where
   it is pasted. Done when the owner can do it from a phone, reading nothing
   but the link and the list.
5. **Record it.** In the project's `CLAUDE.md`, "Keys and services" section:
   name, where it lives, what it can do (per the probe), date of the probe.
   The next session reads this instead of asking.

**How many tokens is right.** Two: a narrow one for automation (the most
frequent and "dumbest" consumer) and a wider one for deploys. A third appears
only if the provider splits permissions by level (for Cloudflare, analytics
lives on the zone, not the account). Merging into one is possible: less setup,
but the blast radius becomes the whole service; that is the owner's decision,
not the assistant's.

**Running the probe in CI.** A secret that lives only in GitHub Secrets is
probed by a small read-only workflow: the step's `env:` maps each secret to a
variable of the same name, plus `ACCOUNT` and `SITE_DOMAIN`, and runs
`bash <path-to-skill>/probe-cloudflare.sh NAME_1 NAME_2`. Triggers: `push`
with `paths:` on the workflow and the probe script (a merge runs it), a weekly
`schedule` (a secret can vanish, expire or be reissued silently, and the
first sign is otherwise a failed cron a day later), and `workflow_dispatch`.
Keep the repo-specific part to secret names; the logic stays in the skill so
copies do not drift.

## "I replaced it" is a hypothesis

The owner said "replaced the token, pressed deploy", and the run failed with
the same code as with the dead token. Only a probe found the cause: the new
value had gone into the assistant's environment variable (where the probe
showed D1 = yes, Workers = yes), while the GitHub secret with the same name
stayed old (account: no, code 9109). It was the second such case that week
(the first: "the token is in place", but empty).

Rule: after any "replaced / added / updated", first probe by the secret's
NAME in the place where the consumer reads it (for a workflow, the GitHub
secret, not the session environment), and only then the button. The probe
prints the value's shape (length, stray characters) and whether the token
sees our account; that separates "pasted badly", "wrong account" and "not
updated". If one key lives under one name in two places, record the mismatch
in the "Keys and services" table with the probe date of each place.

## The result of a manual step is checked by a machine, not by "done?"

Three times in two days the owner's manual action in someone else's dashboard
came out different from the plan: the token value went into an environment
variable instead of a GitHub secret; "New secret" with an existing name was
refused while the owner believed it was saved; during a cleanup the working
cron token was deleted instead of the dead one. Each time the assistant
learned this not from the owner but from the probe, and once only because the
audit happened to still query the name being deleted.

Hence two rules. **First:** after any "done", run the probe, not the next
substantive step; merging a change to the probe file triggers it by itself
(the `paths` trigger), so it costs the owner zero actions. **Second, for
renames and cleanups:** while the operation is in progress, the probe queries
BOTH names, old and new. The old one is dropped from the probe only after a
run where the old name answers "no secret" and the new one answers "alive"
with the needed permissions. Dropping it earlier blinds you exactly when a
mistake is most likely. Better still, keep the dead names in an explicit
"must be absent" check, so a secret that comes back, or was never deleted,
shows up as a warning instead of disappearing from view.

## A secret with this name already exists

GitHub will not create a secret over an existing name: "New secret" answers
`a secret with the same name already exists`, and the Update button lives
inside the secret's row and is hard to find from a phone. The owner hit this
twice in one day and believed the new value was saved while the secret still
held the old one.

Workaround: do not fight the form, change the name. A new secret
`<NAME>_V2`, the workflow reads it, the audit queries BOTH names until the
owner deletes the old one. The assistant does the rename in a commit; the
owner is left with one field. As a bonus, the old name becomes visible
evidence that a dead token still sits in the repository.

## It failed without a reason — steps

1. **Find the bare assignment** from a command that can fail: `X=$(cmd)`.
   Under `set -e` (the GitHub Actions default) that is the cause of the empty log.
2. **Wrap it so the error prints first:**
   ```bash
   if ! OUT=$(cmd 2>&1); then
     echo "$OUT"                      # the tool's response first
     echo "::error::what this means and what to do, with a link"
     exit 1
   fi
   ```
3. **Prove the handler with a real failure.** Extract the step from the YAML,
   substitute a stub command that fails, run it under `bash -e`. Done when the
   output shows the error text and the hint: a handler not tested by a failure
   is not a mechanism but a hope.

## Next comes an owner button — steps

1. **Deploy = merge.** `on: push: branches: [main]` with `paths-ignore` for
   paths bots commit to (manifests, metrics), documentation and `.github/**`
   (editing a workflow does not change code). Protection stays the same:
   typecheck → migrations → rollout → smoke test.
2. **A collector checks itself:** `on: push: paths:` on its own file and
   scripts. A key fix is verified by the same merge, not overnight.
   When a run is needed NOW and dispatch is closed: merge a real change that
   falls inside that workflow's `paths`. This twice produced a fresh collector
   run in one day. Not an empty commit to trigger it: it fixes nothing and
   lies to the history; find the change in the very file the run is needed for.
3. **The assistant can merge a PR itself**: the integration has that right.
   Done when the owner has no clicks left after the merge.

## Data behind a CI secret: a read-only workflow, not a guess

The secret lives only in GitHub Secrets (a Search Console key, an analytics
token), and the answer to the owner's question sits behind it. Do not
reconstruct the answer from saved rows and do not ask the owner to "look in
the dashboard": write a one-off read-only workflow with a push trigger on its
own paths (`paths:` on the workflow itself and its script) plus
`workflow_dispatch`, and put the result in `$GITHUB_STEP_SUMMARY`. A merge to
`main` runs it by itself; the log is read from the session. Worked twice (a
token audit and a Search Console date-range report).

## "I think I pasted it": two requests and the neighbours

The owner: "I think I put the Stripe secrets into Cloudflare, check". The
answer took a minute and was "no", but only because the provider was asked,
not memory.

1. **The script's secret list.**
   `GET /accounts/<account_id>/workers/scripts/<name>/secrets` prints names
   without values. Empty is not yet a verdict: for a worker built in versions
   from the dashboard, bindings live on the version.
2. **The deployed version's bindings.**
   `GET …/workers/scripts/<name>/deployments` → version id →
   `GET …/workers/scripts/<name>/versions/<id>` and look at
   `resources.bindings`: `secret_text`, `plain_text`, `d1`, `assets` are
   visible by name. A single `assets` binding means there are no secrets at all.
3. **Neighbouring projects.** The owner may have pasted into another service
   of the same account: `GET …/workers/scripts` and `GET …/pages/projects`.
   Give the owner the list instead of guessing; an account often holds several
   workers and Pages projects with similar names.

The answer to the owner is always "the provider says this", with a date. The
secret's value is never requested or printed in any form; check the live
site's behaviour, not the string.

## GitHub from the session: 403 on push and 404 on the repo are two different answers

A probe of three requests, not guessing: `GET /user` with the same token
(200: the token is alive), `GET /repos/{owner}/{repo}` (404 with a live token:
the Claude GitHub App installation does not cover the repository), and the
session's repository list (what the app can see at all). Token alive, repo
missing from the list: the owner fixes it with one link,
https://github.com/apps/claude/installations/select_target (add the
repository to the installation). Reconnecting the account does not help here:
that is about the token, not the set of repositories. Meanwhile hand
unpushed commits to the owner as `git format-patch`, so the work does not
depend on the outcome.

## Diagnosing a secret: shape, not content

The value is never printed, in any form: logs are visible to everyone with
repo access. Print the length, line count, first character, presence of
braces, characters outside the expected alphabet, and what the provider
answered. That was enough to find, in three runs, the lost first `{` line in
a Search Console key, and a stray newline from a phone paste that made a
brand-new Cloudflare token fail with the same `10000` as a dead one.

## Codes already decoded

| provider | response | means | do |
|---|---|---|---|
| Cloudflare | `10000 Authentication error` | the token cannot do this: dead OR lacking the permission OR a stray character in the pasted value OR a token on another account; it does not tell which | the probe's shape and account columns separate the cases |
| Cloudflare | `7403 account not authorized` | the token is alive, no permission for this service | edit the permissions of the same token |
| Cloudflare | `9109` on `/zones` | cannot see the zone | needs `Zone:Read` on the zone |
| Cloudflare | `success: true` with an empty `result` on `/zones?name=` | the token does not see the zone; this is not "yes" | count the zones in `result`, not the `success` flag |
| Cloudflare GraphQL | `time range wider than 4w4d` | window > 32 days | narrow it to 30 |
| Google | `403 API has not been used in project N` | the API is not enabled | one Enable button via the link in the error |
| Google | `403`/`404` on a Search Console resource after enabling the API | the service account was not added as a user | Search Console → Users → add the service account's `…iam.gserviceaccount.com` address, Restricted |
| Search Console key | `Unexpected non-whitespace character after JSON` | extra text around the JSON in the secret, or a lost brace | parse defensively: trim, strip wrapping quotes, unescape `\n`, restore a missing outer brace |
| GitHub | `403 Resource not accessible by integration` on dispatches | the assistant cannot press buttons | remove the button: push trigger |
| GitHub | `a secret with the same name already exists` | "New secret" cannot overwrite | a `<NAME>_V2` secret, see above |
| GitHub | `404` on `/repos/{owner}/{repo}` with `/user` = 200 | the app installation does not cover the repo | owner adds it at the installation link above |
