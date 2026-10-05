---
name: ux-ease-audit
description: Rates how easy a website or app is to use through the eyes of a concrete persona — tasks walked on foot, taps and time to an answer, dead ends, a 1–10 score, top problems with fixes; a re-run compares against the previous score. Use when the owner asks to "rate the UX", for a "UX re-audit", "how easy is it to use", "usability", "where will a person get stuck", or after a batch of UX fixes before release.
---

# UX ease audit

The owner liked "the way it rates usability" after two runs (5.5 → 6.5 out of
10). The value is not in a list of principles but in the audit **walking the
tasks in the shoes of a specific person** and pricing each one: taps, scrolls,
seconds, the point of hesitation. The report must contain no generic advice.

## Steps

1. **Collect the inputs** (from the code, CLAUDE.md, decisions; do not ask the
   owner for what is already in the repo):
   - **persona**: who, in what state of mind, on what device, which language
     and how much patience. Example: an older first-time visitor on a phone,
     stressed, with weak English, who needs an urgent appointment;
   - **5–7 tasks** for this persona, phrased in their words ("find the
     nearest open clinic", "my child is sick, who do I call"), plus a task
     "understand what is free and what is paid" and a task "go back / switch
     language";
   - **the product boundary** the audit does NOT challenge (paid/free, owner
     decisions), otherwise the report turns into "open everything up";
   - the project's local UX rules (minimum font size, tap target, "no dead
     buttons").
   Done when all of this can be filled into the prompt template.

2. **Run the auditor as a subagent** (`general-purpose`, in the background)
   from the template [PROMPT-FIRST.md](PROMPT-FIRST.md) for a first run, or
   [PROMPT-REAUDIT.md](PROMPT-REAUDIT.md) for a re-run after fixes. A subagent
   rather than yourself: fresh eyes without knowing "how it was meant", and
   raw Playwright output does not clog the main context. The auditor only
   reads: it does not edit code and does not commit.

3. **Check the report before showing it to the owner.** Every problem has a
   screenshot, a severity (blocker / major / minor) and a concrete fix. Mark an
   item that contradicts an owner decision rather than dropping it silently.
   Re-check at least one "breakage" yourself: the auditor makes mistakes too.

4. **Show the owner a short version**: the score and the change from last
   time, the 3–5 main problems in plain words, the forks that need their
   decision (as a question with options), quick fixes separate from large
   ones. Save the score and date to project memory (`docs/project/` or
   HANDOFF): the next run compares against it.

5. **After fixes**, a re-run with PROMPT-REAUDIT: a table "fix works / partly /
   broken", old problems "closed / open", a new score. Two scores in a row by
   the same method are the only honest way to say "it got better".

## Principles the auditor judges by

If the project has a `ux-designer` skill, the auditor reads its SKILL.md.
Without it, the minimum:

- the next step on every screen is obvious; a dead end (a page with no way
  forward, a button into a paywall for a person in trouble) is a blocker;
- anything urgent is reachable from the first screen, the action button sits
  above the explanation;
- body text ≥ 16 px, tap target ≥ 44 px, contrast per WCAG AA;
- a disabled button with no explanation is a defect; a button with no result
  is a defect;
- jargon (form codes, system names) is explained on first appearance;
- one name for one action everywhere ("Sign in", not three variants);
- neutral gender and polite wording in translations, every language checked;
- one navigation for the whole product; back and language switch always available;
- adjacent tap targets do not overlap: check `elementFromPoint` on the second
  line of a wrapping link (an address above a phone number dialled the number).

## Pitfalls

- Screenshots at phone-screen size (390x844), **not `fullPage`**: a sticky
  bottom bar on a long image is drawn in the middle and looks like a breakage.
- `reducedMotion: 'no-preference'`: with `reduce` the auditor will not see
  blocks that stay invisible because of an entrance animation.
- Use your own server port and kill only your own PID: other sessions work in
  the repo too.
- Paid areas that do not run locally are judged from source, not declared
  "broken".
- The sandbox may forbid writing the report to a file: ask for it as text.
