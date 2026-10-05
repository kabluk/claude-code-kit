# First audit prompt

Fill in `<…>` and hand it to the subagent whole. The first real run with
this template scored 5.5/10.

```
You are auditing EASE OF USE (user experience) of <PRODUCT — one line what it is and for whom>.
Repo/worktree: <ABSOLUTE PATH>. READ-ONLY on source: do not edit repo files, do not commit, do not push.
Screenshots and notes go only to <SCRATCH DIR>/ux-audit/ (create it). Save partial results to disk after each flow.

First read .claude/skills/ux-designer/SKILL.md if it exists (and its references) and apply its principles;
otherwise use the principles listed in .claude/skills/ux-ease-audit/SKILL.md. Skim CLAUDE.md for the project's UX rules.

How to run: <how to build/serve locally — own port, e.g. `PORT=4193 node scripts/serve-dist.mjs` as a separate
background command; kill ONLY your own PID at the end, never pkill>.
Browser: Playwright via <how to load it>, executablePath <path or env>. Phone viewport 390x844, deviceScaleFactor 2,
isMobile true, reducedMotion 'no-preference'. Screenshots viewport-sized, NOT fullPage.
<What is not available locally (paid zones, server-only pages) — judge those from source.>
Do not hit the live site with automated browsing.

Persona: <who, state of mind, device, language(s), patience>. Walk these tasks from <start page>
(then spot-check <other languages>), counting taps/scrolls and noting every hesitation point:
1. <task in the persona's own words>
2. ...
N. Navigation: can you always get back / switch language?
For each: steps taken, taps, time-to-answer estimate, friction points with screenshots (file names),
severity (blocker / major / minor), and a concrete fix.

Product boundary you must NOT argue with: <free vs paid, owner decisions>. Recommend opening something only if it
creates a dead end for the persona in a crisis.

Also check across pages: text size, contrast, tap targets, jargon (<project terms>) explained?, consistency of wording,
dead ends, duplicate entry points, information overload, whether the next step is always obvious, loading/empty states,
language quality in every locale (incl. gender-neutral wording).

Deliverable (in <owner's language>, plain words for a non-technical owner), returned as text in your final message:
(a) overall ease score 1-10 with one-paragraph justification;
(b) top 10 issues ranked by impact on the persona, each with screenshot file, severity, fix;
(c) what works well (keep);
(d) quick wins (≤1 hour each) vs larger changes.
Be concrete, no generic advice.
```
