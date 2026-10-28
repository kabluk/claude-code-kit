---
name: portfolio-audit
description: Use when the owner asks what is going on across all repositories, where lessons or rules are lost, which branches were never merged, or which skills drifted from the kit; on the weekly backup run; and before rolling a playbook, hook or skill change out to several repos. Sweeps every non-archived repo of the owner, collects playbook entries that never reached the canon in the HQ repo, and writes one report with what needs a decision.
---

# Portfolio audit

A candidate since early September (one project's decisions recorded ten repos,
merges made by other sessions, copies inside a monorepo). Built on 2026-10-27,
when the very first sweep showed that 222 lessons and 13 playbook rules lived
only in their own repos (127 in one of them alone), while the canon saw a single
project. "The journal is one-sided" turned out to be not a fact about the
projects but a blind spot in how lessons were collected.

The sweep runs on two scripts in the HQ repo, the owner's private repo that
holds the playbook canon: `scripts/playbook_sync.py` (compare and collect
playbook copies) and `scripts/portfolio_audit.py` (the report). Without access
to that repo, the steps below still say what to check by hand.

## Steps

1. **List the repos.** `list_repos` (Claude Code Remote), archived ones left
   out. New repos appear without warning: one week there were 18, the next 21.
2. **Access.** Private repos: `add_repo` with read access. Public ones git
   serves anyway, but the GitHub API does not let the session in to them
   (branches show as "?" in the report).
3. **Partial clones**, one at a time, not in parallel (the proxy cuts two
   concurrent operations on one repo):
   `git clone --depth 1 --filter=blob:none --sparse <url> <scratch>/<repo>`,
   then `git -C <repo> sparse-checkout set docs/playbook .claude`.
4. **Collect into the canon.** In the HQ repo:
   `python3 scripts/playbook_sync.py <copies HQ manages> --collect <all other copies> [--write]`.
   Other repos' copies only give up what is new (dated entries, P-NN sections
   matched by title, table rows) and are never overwritten. Dry run first and
   read the whole output. The copies HQ manages get the canon by PR; after the
   merge and a `git fetch`, run `playbook_sync.py --confirm <copies>`,
   otherwise the base is not updated (and that is correct: a base moves only
   once the canon has really landed). Translations of the playbook (English
   copies, including this kit's) stay out of the collection: their blocks
   will never match a Russian one.
5. **Report.** `python3 scripts/portfolio_audit.py --kit <clone of the kit> <clones…> > docs/portfolio/AUDIT.md`:
   how far each copy lags, hooks present and wired, skills against the kit,
   branches ahead of `main`.
6. **Decisions go to the owner, not done silently.** A branch with code ahead
   of `main`: merge it or close it. A skill marked "≠": whose version is newer.
   A copy that "lags": whether to roll the canon into that repo (that is a PR
   into a product repo, and it may deploy).

## Pitfalls

- **A rule number is not a key.** P-17 in the canon and in two product repos
  were three different rules. The comparison recognises a section by its
  title; when collecting, a taken number is changed to a free one with a note
  "(in <repo> — P-17)".
- **The journal is written in two formats:** a line "- 19.09 · project · …"
  and a section "## 2026-09-19 · project · …" with sub-items. The comparison
  recognises both; a new format gets a test first, then a collection run.
- **Before overwriting a copy, check line by line, not by keys.** On
  2026-10-27 an entry's key matched, while six lines of its tail lived only in
  the copy.
- **An empty repo** clones without a HEAD: that is not an error.
- The audit report is a claim, checked with `gate`: before deciding on a
  branch, open its diff rather than judging by the number of files.
