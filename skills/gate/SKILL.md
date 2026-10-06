---
name: gate
description: "Use after fixing any bug or data-quality defect, before committing it, and whenever a test is written to guard a fix. Turns a fix into a gate that can actually fail: the test reads the rule from the code rather than restating it, the gate is run with the fix mutated away before it is trusted, and the change is rendered live rather than only typechecked."
---

# Gate

Born on a day with five fixes, each with a test, and every test had to be
proven by hand. Twice a plausible rule killed real data (a large city's
records, a small town's records); once `astro check` let a variable be used
before its declaration — a 500 on every hub page, caught only by a live
render. The lesson: **a gate that has not been tested by a real failure is not
a mechanism but a hope.**

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
4. **Live render, not just typecheck.** For pages: a local database seeded
   with edge cases, a `dev` server, `curl` the route, check the HTML for
   order / presence / `noindex`. Typecheck does not see declaration order in
   frontmatter, TDZ, an empty result instead of an error.
   Done when the server response shows both the fixed thing and what must not
   have changed (counters, untouched records).
5. **Nobody is lost.** For filters and sorts: the number of records in equals
   the number out. Demote — yes; hide — no.
6. **In CI.** `npm test` (or equivalent) in the workflow, with a comment on
   which class of regression it catches and why types and the build cannot see it.

## What counts as proof

| claim | proof |
|---|---|
| "the test catches the regression" | fails on the mutant, green on the fix |
| "the rule does not hit real data" | a production counterexample in the fixture, with a test on it |
| "the page works" | a dev-server response with the expected string, not `0 errors` |
| "the failure handler works" | an injected failure (a stubbed command), visible error text |
| "nothing is lost" | count(in) == count(out) in a test |

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

## What a gate does not replace

Measuring production BEFORE the rule (P-03): a gate protects what was found,
it does not search. The big-city records were saved not by a test: the test
was written after a measurement showed 6 169 of them.
