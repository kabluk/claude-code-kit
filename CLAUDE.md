# claude-code-kit — project memory

## How we work (cross-project playbook)

Process rules shared by every project live in `docs/playbook/COLLABORATION.md`
(P-00…P-16): the start ritual (skills, context, key inventory — enforced by the
`hooks/session-start.sh` hook), the access model (one scoped key for the life of
the project, never in chat), autonomy with an exact reason for every manual step,
checking against the live site/API, handing over the session at ~75 % context,
and three options at the end of every cycle.

## Working on this repo

- Everything here must be useful to any project: no product-specific `CLAUDE.md`,
  data, keys or domains.
- English only. Keep frontmatter valid for Claude Code (`name`, `description`,
  `tools`, `model`, …).
- Before committing, run what CI runs:
  `python3 scripts/context_monitor.test.py && bash -n hooks/*.sh scripts/*.sh`.
