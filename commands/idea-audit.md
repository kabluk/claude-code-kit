---
description: Adversarial pre-build audit — deterministic gates plus multi-model kill-tests. Run before committing to any build.
argument-hint: "[idea description or path to brief]"
---

Load the **idea-audit** skill (`.claude/skills/idea-audit/SKILL.md`) and execute its
protocol for: $ARGUMENTS

Order matters: write `audit/brief.md` first; run the four deterministic gates
yourself against primary sources (source terms, confounder split, per-segment
demand, payer asymmetry); only then run `fanout.mjs` for the multi-model pass;
finish by writing the kill-sheet's "Run today" results into the project's
DECISIONS file. Do not report the idea as validated while any "Run today" test
is unrun — report it as UNVERIFIED with the list of pending tests.
