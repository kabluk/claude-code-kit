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
2. **Probe capability, not presence.** For each token, make one read-only
   request per capability you need and print yes/no with the provider's
   response code. For Cloudflare, for example: `GET /user/tokens/verify`
   (alive), list D1 databases, list Workers scripts, list zones, one
   analytics query. Never print the token itself. Done when every required
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
3. **The assistant can merge a PR itself**: the integration has that right.
   Done when the owner has no clicks left after the merge.

## Diagnosing a secret: shape, not content

The value is never printed, in any form: logs are visible to everyone with
repo access. Print the length, line count, first character, presence of
braces, and what the provider answered. That was enough to find, in three
runs, the lost first `{` line in a Search Console key.

## Codes already decoded

| provider | response | means | do |
|---|---|---|---|
| Cloudflare | `10000 Authentication error` | the token cannot do this: dead OR lacking the permission; it does not tell which | a probe shows what exactly it can do |
| Cloudflare | `7403 account not authorized` | the token is alive, no permission for this service | edit the permissions of the same token |
| Cloudflare | `9109` on `/zones` | cannot see the zone | needs `Zone:Read` on the zone |
| Cloudflare GraphQL | `time range wider than 4w4d` | window > 32 days | narrow it to 30 |
| Google | `403 API has not been used in project N` | the API is not enabled | one Enable button via the link in the error |
| Google | `403`/`404` on a Search Console resource after enabling the API | the service account was not added as a user | Search Console → Users → add the service account's `…iam.gserviceaccount.com` address, Restricted |
| Search Console key | `Unexpected non-whitespace character after JSON` | extra text around the JSON in the secret, or a lost brace | parse defensively: trim, strip wrapping quotes, unescape `\n`, restore a missing outer brace |
| GitHub | `403 Resource not accessible by integration` on dispatches | the assistant cannot press buttons | remove the button: push trigger |
