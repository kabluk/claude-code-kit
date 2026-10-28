Vendored from https://github.com/Leonxlnx/taste-skill (`skills/redesign-skill/`,
renamed here to `redesign-existing-projects`), upstream commit
`51c272e2196a34fba489fc27079cf2c839c46e71` (taken 2026-10-13). MIT license; the full
copyright and permission notice is in `LICENSE` next to this file (upstream's
repository `LICENSE`).

Copyright (c) 2026 Leonxlnx.

Audit 2026-10-13: a single instruction file; no scripts and no network commands.

Kit changes (this file is modified, as the MIT licence allows):
- A "Local rules" section is inserted right after the frontmatter. Everything after
  it, from `# Redesign Skill` on, is upstream's text unchanged, and the frontmatter is
  upstream's.
- Why: upstream advises inventing "organic" figures, names and dates, using
  placeholder photos, and picks fonts from a fixed list. On a real client's site that
  means fake data and look-alike sites. The section makes content and photos come
  from the client (with visible `[no data: what is needed]` markers and labelled
  empty frames; stock only in demos), starts fonts and colours from the client's
  brand, and lets `frontend-design` win where the two skills disagree.

Refresh: download upstream `skills/redesign-skill/SKILL.md`, diff it against this copy
from `# Redesign Skill` on, read every changed line, re-insert the "Local rules"
section after the frontmatter, then update the commit hash above.
