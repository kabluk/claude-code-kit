---
name: gate
description: 'Use after fixing any bug or data-quality defect, before committing it, whenever a test, CI gate or check script is written, and before saying "green" or "done" (including after a subagent reports success). Turns a fix into a gate that can actually fail: the test reads the rule from the code rather than restating it, the gate is run with the fix mutated away before it is trusted, the check returns an honest exit code, and the change is checked at the level where the bug shows (browser, live site) rather than only typechecked.'
---

# Gate

Born on a day with five fixes, each with a test, and every test had to be
proven by hand. Twice a plausible rule killed real data (a large city's
records, a small town's records); once `astro check` let a variable be used
before its declaration — a 500 on every hub page, caught only by a live
render. The lesson: **a gate that has not been tested by a real failure is not
a mechanism but a hope.**

A second project hit the same class six times in six weeks: a trigger that
read a different input than the check, a scripted `str.replace` that silently
replaced nothing, a 200 response carrying an HTML page instead of data,
`| grep` swallowing a red test, page width at 360px slipping past every gate,
conflict markers reaching `main`. Steps 6–7, the mutation script and "A
report is not state" come from there.

## Steps

1. **The test reads the rule FROM the code.** The test extracts the
   expression, threshold or regex from the source (`readFileSync` + regex, or
   import the function); it does not restate a copy. A copy stays green when
   the code is already broken. Done when changing the rule in code also
   changes the test's behaviour.
2. **Real data in the fixture.** Pairs taken from production, with names: not
   "a=1" but "ACME FREIGHT 138 481 / 129 131", "RELIABLE TRANSPORT 2 099 979 / 2".
   A separate test for every case the rule nearly killed, with a comment on
   why it exists for that one specific object.
3. **Mutation before trust.** Remove the fix (restore the old rule, drop the
   condition) and run the test. Done when it **fails**, and the case that
   fails is exactly the one it was written for. A test that is green on the
   mutant is not a gate. Restore the fix, run again: green.
   Mechanics — `bash .claude/skills/gate/mutate.sh <file> '<before>' '<broken>'
   -- <check command…>`: it first runs the check unmutated (must be green),
   replaces exactly one occurrence, runs the check, and restores the file
   itself. Exit 0 — the gate is real; 1 — green on the mutant (fake gate);
   2 — the mutation did not apply (the string is not found exactly once), the
   check was already red before the mutation, or a bad call.
   By hand, restore from a copy (`cp file "$TMP/"` before mutating, `cp`
   back), never `git checkout file`: an uncommitted fix goes away together
   with the mutation (happened twice), and git cannot restore a new file at
   all. For external data the mutant is a bad input: a maintenance HTML page
   served with status 200, an empty render, a 404 (a rate feed where
   "something parsed" produced a prime rate of 400 %).
4. **Live render, not just typecheck.** For pages: a local database seeded
   with edge cases, a `dev` server, `curl` the route, check the HTML for
   order / presence / `noindex`. Typecheck does not see declaration order in
   frontmatter, TDZ, an empty result instead of an error.
   Done when the server response shows both the fixed thing and what must not
   have changed (counters, untouched records).
5. **Nobody is lost.** For filters and sorts: the number of records in equals
   the number out. Demote — yes; hide — no.
6. **An honest exit code.** A pipeline's exit code is the last command's:
   `npm test | grep "Tests " && git commit` commits on a red test (it shipped
   a red deploy). Before anything that writes (`git add`, commit, push,
   deploy) chain only with `&&` or run under `set -euo pipefail`, never `;`
   (conflict markers reached `main` because a resolver script failed and the
   `git add` after `;` ran anyway). A "this must not exist" check has to fail
   by itself: `! grep -rn '^<<<<<<<' …`. Editing a file by script — assert
   the searched text was found exactly once (an `str.replace` that matched
   nothing killed a run halfway through).
7. **The level where the bug shows.** typecheck → test → build → browser
   (phone 360px, dark theme, WebKit for Safari) → live site after deploy.
   What is visible to the eye is caught by a browser or a screenshot, not by
   `tsc`: four calculators wider than 360px and "6 bags × 4 = 22" were seen by
   no gate. Put the gate at the level where the bug was noticed.
8. **In CI.** `npm test` (or equivalent) in the workflow, with a comment on
   which class of regression it catches and why types and the build cannot see it.

## What counts as proof

| claim | proof |
|---|---|
| "the test catches the regression" | fails on the mutant, green on the fix |
| "the rule does not hit real data" | a production counterexample in the fixture, with a test on it |
| "the page works" | a dev-server response with the expected string, not `0 errors` |
| "the failure handler works" | an injected failure (a stubbed command), visible error text |
| "nothing is lost" | count(in) == count(out) in a test |
| "the gate fails on the error" | `mutate.sh` returned 0 |
| "deployed" | `curl` of the live site shows the new string, not "workflow success" |
| "the operation went through" | the key the writer itself records (`meta`, schema version, hash), not page text |

## A report is not state

A subagent's or orchestrator's "done", or a green CI tick, is a claim. The
fact is `git ls-remote` of the branches that matter, the deploy run's status,
and `curl` of the live site (twice an orchestrator's report did not match the
repository). In the report to the owner keep three outcomes apart: "could not
check", "no data", "works" (P-13) — a timeout and an empty response are not
"ok".

## The recovery path is checked separately

Collecting data and BACKFILLING after the source is fixed are different paths,
and the second breaks more quietly. Three cases in one project: a failure
handler never tested by a failure; deduplication that kept a source fix from
reaching the stored records; deduplication that measured richness at the top
level and did not see enrichment inside a field. Each time collection worked
and recovery stayed silent.

The gate for any accumulator: after fixing the source, run AGAIN on an
existing record and prove the new data landed. A "no poorer than before"
condition is checked on the very pair of rows the rule was written for, not on
an invented one.

## A funnel is checked from its entry, not its exit

A verdict on a layer's value from its OUTPUT (impressions, clicks, sales) is
worth nothing until the stages before it are checked. Three cases in three
days: five outside models said "cut the geo layer" without a single number; a
"geo is zero" read from a sample truncated by a limit; a second "geo is zero"
at full coverage — while the geo hubs were not in the index at all, because
their sitemap returned 500. The number was right; the conclusion was not.

Before judging by output, measure each stage separately and name first the one
that is zero: the page is served (`curl`, status and time) → the sitemap is
read by the search engine (Search Console sitemaps: errors, last read date) →
pages are in the index (`site:` on the live results, a SERP API) →
impressions → clicks. A layer whose zero stage comes before impressions is not
judged by impressions — fix the stage first.

## A rule is read along the data path, not by name

A gate on workflow secrets in its first version looked for the secret's name
(`-z "$ANALYTICS_TOKEN"`) and blamed a watchdog that did have the check —
under the name of the variable the secret was bound to (`CF_TOKEN`). The same
miss that killed the city records: a plausible rule on the FORM of a name
instead of the substance.

Ask not "what is it called" but "where does the value arrive": for a secret,
the variable name from the binding; for a page, the header that actually goes
out in the response; for a query, the rows it actually reads. The error was
caught by running the gate on the real repository, not by reading: run a gate
on the whole corpus at once, not only on the example it was written for.

## A self-check asks the source of truth, not the markup

A step that asks "did the operation go through?" (a data swap, a migration, a
deploy) reads what the operation itself writes — a `meta` key, a schema
version, a hash — taken from the writer's code, not from HTML and not from an
error text. Page text changes without the check knowing (twice a check died
silently, and the second time it reported a success as a failure), and a cache
serves yesterday. After a "lost response", consult the source after every
failure, or retries hit a database that is already updated. Gate: a test takes
the key from the writer's code and requires it in the checker's code.

## One rule in two languages — one gate on one fixture

When a rule lives both as a function (the page) and as SQL (the sitemap, a
precomputed table, a loader), the two drift apart silently. The gate runs BOTH
forms over one fixture table and requires a row-by-row match, with a single
source module (city statistics computed in code ↔ the precomputed stats table;
a "thin page" predicate ↔ its SQL twin). A source-text check ("the page
imports the rule") is a second test, not a replacement for the first.

## What a gate does not replace

Measuring production BEFORE the rule (P-03): a gate protects what was found,
it does not search. The big-city records were saved not by a test: the test
was written after a measurement showed 6 169 of them.
