# Re-audit prompt

Same method, plus a comparison. Without the list of fixes made and the old
problems the auditor cannot say what is closed, so list them concretely.
The first real re-run with this template moved the score from 5.5 to 6.5.

```
Re-audit EASE OF USE of <PRODUCT> after a round of fixes, and compare with the previous audit (score <X>/10, <date>).
Repo/worktree: <PATH>. READ-ONLY: do not edit repo files, do not commit or push.
Return your report as text in your final message. Screenshots go to <SCRATCH DIR>/ux-audit<N>/.

Read first: .claude/skills/ux-designer/SKILL.md if present (else principles in .claude/skills/ux-ease-audit/SKILL.md);
CLAUDE.md UX rules.

Run: <same serving/browser instructions as the first audit: own port, own PID, phone 390x844, reducedMotion
'no-preference', viewport screenshots only, what is judged from source>.

Current product boundary (owner decisions): <…>. Judge UX within it.

Fixes made since the previous audit (verify each actually works and note side effects):
1. <fix>
2. ...

Previous top issues to re-check: <list from the previous report>.

Persona and tasks (same as before): <persona>; tasks: <same list>. Count taps/scrolls, time-to-answer.

Report (in <owner's language>, plain language for a non-technical owner):
(a) new ease score 1–10 vs <X>, with justification;
(b) table of the fixes: works / partly / broken, with evidence;
(c) previous top issues: resolved / still open;
(d) new top 8 issues ranked by impact on the persona, each with screenshot file name, severity, concrete fix;
(e) quick wins vs larger changes. Be concrete.
```
