# HARVEST — ledger of extracted methods

Cross-project memory. Every repeat that became a skill, a rule or a gotcha is
recorded here: date, project, what repeated, where it went. It travels with the
playbook to every repo; the canonical copy lives wherever your playbook's
canonical copy lives. Filled in by the `harvest` skill (P-09).

Line format: `date | project | repeat (how many times) → home`.

Start your own ledger below. The entries under "Examples" are anonymised entries
from the ledger this toolkit grew out of; they show the level of detail that makes
an entry useful, and where each of the kit's skills and rules came from. Delete them
once you have your own.

## Examples

- project-a | a bare `X=$(cmd)` under `bash -e` killed a step silently
  (3 times: snapshot swap, watchdog, deploy) → skill `secrets-and-buttons`.
- project-a | "the token is there" from the hook ≠ the token is usable; the
  question "why so many tokens" (2 times) → skill `secrets-and-buttons`
  (capability probe), playbook P-01b.
- project-a | an owner button the assistant cannot press (403 on workflow
  dispatches, 3 requests in a day) → rule in `secrets-and-buttons`: the button is
  removed with a push trigger, not handed over.
- project-a | the model skipped "turn on caveman" for a whole session → the hook
  injects the rules verbatim, there is no step; P-00, P-06.
- project-a | a plausible rule based on the SHAPE of a name killed real data
  (2 times); an unverified calculation produced a meaningless number (2 times)
  → P-03 strengthened: measure live production BEFORE the commit, mutate the test
  BEFORE trusting the gate → skill `gate`.
- project-a | a product review by other LLMs was done by hand twice; 4 of 5
  checkable claims were false → skill `external-review` (PROMPT.md with
  placeholders + verification steps + per-model table).
- project-a | lessons went into DECISIONS and died; in 6 projects not one offer
  to extract a skill → skill `harvest`, this ledger, P-09.
- project-b | the test was wrong, the code was right (3 times) → rule P-10
  "print what was computed before writing assertions".
- project-b | trying candidates from memory 0/26; changing the method
  (SERP → the source's own domain → rendered read) 4/5 → rule P-11 "change the
  method, not the effort".
- project-b | a gate opened by itself twice, and a "20 URLs" counter nearly forced
  a page the plan's gate did not allow → rule P-12 "data opens a gate, not a hand".
- project-b | a scheduled `cron` looked dead but was alive with a ~4 h shift →
  gotcha in HANDOFF: GitHub schedules drift, look at runs over days, not hours.
- project-b | the "check trigger" read raw text while the comparison read cleaned
  lines; a source reported "no data" although the render never ran → rule P-13
  "the check's trigger reads the same input as the check itself", plus telling
  "could not read" apart from "no data".
- project-b | a long crawl outlived its shell, `pkill -f` twice killed its own
  command (`exit 144`), and "the build has hung for twenty minutes" turned out to
  be twenty-three seconds by `date` → rule P-14 "cut into pieces, read the time
  from the clock, kill by PID".
- project-b | three times our own assumption slipped in between the source and
  the answer → rule P-15: a derived number is labelled ours, checked against a
  published total, and stays a slider.
- all repos | "the orchestrator is available and should be used" is a reminder
  phrasing, skipped twice → rule P-16 "an instruction that has to be remembered
  will be skipped": content into context, or trigger and action as a ritual step,
  plus a check that the thing exists.
- rollout | several clones sat in detached HEAD, and `git push origin HEAD` failed
  with "The <src> part of the refspec is a commit object": not a permissions
  problem but a missing branch. Fix: `git fetch origin main && git checkout -f -B
  main origin/main`, then edit and push. Rollout ritual: check
  `git branch --show-current` in every clone first.

## Open candidates

A repeat was noticed, but its home is not built yet. The next session that meets
the same repeat builds it.

- **`portfolio-audit`** — many repos, foreign merges, monorepo copies. Done once;
  extract it the second time.

## Ledger

<!-- date | project | repeat (count) → home -->
