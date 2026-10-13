# claude-code-kit — project memory

## How we work (cross-project playbook)

Process rules shared by every project live in `docs/playbook/COLLABORATION.md`
(P-00…P-18): the start ritual (skills, context, key inventory — enforced by the
`hooks/session-start.sh` hook), the access model (one scoped key for the life of
the project, never in chat), autonomy with an exact reason for every manual step,
checking against the live site/API, handing over the session at ~75 % context,
and three options at the end of every cycle.

## One session, one thread

Open the first working reply, and every new task, with the start block:
`**Thread:** goal · repo · done when …` and `**Skills:**` (one line per skill
from the catalog: what it does for this task). Route any other goal to a new
session with a ready prompt (P-17, `skills/session-focus/`). A request to merge
or press an owner button explains in plain words what it changes and how to undo
it (P-18).

## Working on this repo

- Everything here must be useful to any project: no product-specific `CLAUDE.md`,
  data, keys or domains.
- English only. Keep frontmatter valid for Claude Code (`name`, `description`,
  `tools`, `model`, …).
- Before committing, run what CI runs:
  `python3 scripts/context_monitor.test.py && bash -n hooks/*.sh scripts/*.sh skills/*/*.sh && bash scripts/check-catalog.sh`.
- A new or renamed skill, agent or command gets its row in `skills/skill-catalog/SKILL.md`
  in the same commit.
- A `description` containing `: ` breaks YAML frontmatter (CI's "Frontmatter parses"
  step fails). Wrap it in single quotes; double quotes clash with quoted triggers.
