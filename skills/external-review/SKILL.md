---
name: external-review
description: Use when the owner wants an outside opinion on the product from other LLMs, pastes back one or more such reviews, or asks what to do with them. Prepares a fact-loaded prompt, verifies every checkable claim against the live product before acting, and keeps a per-model table so agreement and contradiction are visible.
---

# External review

Born from a real review round: five models, and of five checkable claims four
turned out false, while the single true one was worth more than all the rest
combined. The skill holds two disciplines: a prompt with real numbers and
explicit exclusions, and **an outside audit is a set of hypotheses until each
one is checked with your own tool**.

## Preparing the prompt — steps

1. **Collect FACTS from the live product, not from memory.** Every number is
   checked today: counters from the home page, traffic from the metrics sheet,
   the snapshot date from its stamp, revenue from BACKLOG. A stale number is
   worse than a missing one: the model will build a conclusion on it and will
   not warn you.
2. **Click every URL in the "open these pages" block.** The first run of one
   review shipped a hub URL that returned 404; two models built "hubs are
   broken" and "tear out the geo layer" on it. Done when every URL returns 200.
3. **Write the exclusions explicitly** (what the product will NEVER do),
   otherwise half the answer goes to ideas already rejected.
4. **Fill in [`PROMPT.md`](PROMPT.md)**: placeholders are in `{{…}}`. The
   shape of the prompt does not change: rank everything, name what to kill,
   every piece of advice comes with an assumption and a one-week test, stock
   advice is banned by name. Hand it to the owner whole, to paste without edits.

## A reply arrived — steps

1. **Split statements into checkable claims and judgements.** Checkable: about
   a specific page, number, link, behaviour. Judgement: about priority,
   monetization, what to kill.
2. **Check every checkable claim with your own tool** (curl against
   production, a script over a sample, a data query). Done when each has a
   verdict: confirmed / exaggerated (with a measurement) / not confirmed.
   Typical false ones: "the page returns 500" (their crawler hit bot
   protection), "the list is all placeholders" (measured: 0 of 200), "there
   is no date" (there is).
3. **Confirmed findings go into work immediately**; do not wait for other
   models to agree: a measured fact does not become truer with a second opinion.
4. **Judgements go into a "who said what" table** by question: priority #1,
   first dollar, what to kill, contradictions. Agreement from ≥ 3 of 4 is a
   signal; a single mention is a hypothesis; **mutually exclusive views are
   settled by a measurement, not by a third model**.
5. **What not to do even on unanimous advice:** anything irreversible (tear
   out a layer, delete pages) without a single number on what it brings in.
   Unanimity about a priority says nothing about being right in the details.
6. **Record it** in `docs/project/domains/review-<month>.md`: attribution
   (which model), verdicts, the table, what was rejected and why. Items go to
   BACKLOG; rejected ideas go to DECISIONS with the reason.

## How this differs from "just asking"

Without step 2 of the first part, the model spends its answer on a mistake in
the prompt. Without step 2 of the second part, a day of work goes into 4 false
findings out of 5.
