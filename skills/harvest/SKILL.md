---
name: harvest
description: Use at the end of every work cycle and before any handoff, whenever the same steps or the same explanation happen a second time, whenever the owner says "again" / "every time" / "one more time", and whenever a lesson is written into DECISIONS. Turns repeats into skills, playbook rules, or CLAUDE.md gotchas, and records the harvest in a cross-project ledger so the next project does not start from zero.
---

# Harvest

The owner, after six projects: "Every one started from scratch, like a blank
sheet. Not once did you suggest turning a repeat into a skill." True. Lessons
went into one project's DECISIONS and died there; the next project never saw
them. Harvest is the duty to turn a repeat into a method.

**A repeat** is one of: the same steps done a second time (in this session, or
known from the HANDOFF/DECISIONS of earlier ones); the same explanation to the
owner a second time; the same request to the owner a second time; a DECISIONS
entry with the word "lesson"; the owner saying "again", "every time", "one more
time".

## Steps

1. **Collect candidates.** Re-read your session from the start (not from
   memory, from facts: commits, this session's DECISIONS, the owner's
   questions). Write each repeat as one line: what repeated, how many times,
   where. Done when the list is empty or every item has a count ≥ 2.
2. **Give each one a home.** Three homes, by the nature of the candidate:
   - **skill** — a procedure with steps, needed in other projects
     (`.claude/skills/<name>/`, following `writing-for-agents`);
   - **playbook rule** — an agreement about how we work
     (`docs/playbook/COLLABORATION.md`, a new P-NN);
   - **project gotcha** — a fact about this repo only
     (`CLAUDE.md` or `HANDOFF.md`, "Gotchas" section).
   A candidate with no home is not a repeat but noise: strike it out.
3. **Write it.** A skill with triggers in its description so it fires on its
   own; a rule with the problem and the agreement; a gotcha with the symptom
   and the fix. Done when the next session of any project will find it
   without the owner's prompting.
4. **Record it in the ledger** [`docs/playbook/HARVEST.md`](../../../docs/playbook/HARVEST.md):
   date, project, what repeated, where it went. The ledger travels with the
   playbook to every repo; that is the cross-project memory.
5. **Offer it to the owner**, one line per candidate, inside the three P-08
   options, not as a separate essay. Done when the owner sees
   "repeat X → skill Y" and can say yes or no.

## When it fires

Not by mood. At three points of the ritual:
- **end of a work cycle** (P-08), before the three options;
- **session handoff** (P-07), before HANDOFF;
- **immediately** when the owner says "again / every time / one more time".

One cycle without candidates is normal. Three cycles in a row without a single
one is suspicious: re-read the session again.

The `stop-cycle.sh` Stop hook looks for a CALL of this skill, not for the work
itself: a ledger entry written without the call still leaves harvest on the
hook's list of missing steps. Call the skill even if the harvest is already
written; you will re-read the steps on the way and not skip step 5.

## What NOT to extract

One-offs. The specifics of a single bug. Anything already in the playbook or a
skill (check `ls .claude/skills` and `grep` COLLABORATION.md: a duplicate is
worse than nothing, because two sources drift apart).
