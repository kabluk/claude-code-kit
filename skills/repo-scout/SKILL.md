---
name: repo-scout
description: 'Classify your projects and get GitHub repositories that are gaining stars now matched to each of them, verified by reading their README, on a schedule. Use when the owner asks for trending or rising repos, tools or libraries "for our projects", to set up or change the scheduled scout, to refresh the project profiles after the project list changed, and when a scheduled run asks to turn new candidates into a digest.'
---

# Repo scout

A builder with nine projects cannot watch GitHub. Stars move fast, and a star
count says nothing about fit: a 4,000-star repo that solves another stack's
problem is noise. The scout separates the two jobs. A script does what is
exact (search, star deltas between runs, keyword matches against each
project's profile); the agent does what needs reading (is this real, does it
fit *this* project, what would it change). Nothing found is installed: a pick
is a reading tip until a session in that project's repo decides to adopt it.

## Where things live

- **Profiles and digests**: the owner's registry repo (the one holding
  `PROJECTS.md`), under `scout/`: `profiles.json`, `state.json`,
  `candidates/YYYY-MM-DD.md` (script output), `digests/YYYY-MM-DD.md` (verified).
- **Search runs in GitHub Actions** (`repo-scout.yml` next to this file), not
  in a cloud session: a session's proxy refuses GitHub's search API and
  github.com/trending, and the public trend APIs have been unreliable. The
  Actions token can search. Results go to a `scout` branch, never `main`.
- **Verification runs as a scheduled Claude session** an hour later. It reads
  the newest candidates file and fetches READMEs from
  `raw.githubusercontent.com`, which sessions can reach.

## Steps

1. **Profile the projects** (first run, and whenever `PROJECTS.md` changes).
   For every product row: name, repo, stage, the stack from its manifest
   (`package.json`, `requirements.txt`, `wrangler.toml`), its domain, and its
   next blocker from the registry. Turn that into `keywords` (single words
   match a repo's topics, name or description words; phrases match the
   description) and two or three `queries` (GitHub search qualifiers without
   dates, e.g. `topic:astro`). Done when every product row has a profile and
   `python3 -m json.tool scout/profiles.json` passes.
2. **Collect candidates**: `node scout.mjs scout/profiles.json scout/state.json
   scout/candidates/<date>.md` — in Actions on schedule, or by hand where the
   search API is reachable. It searches young repos climbing fast and
   established ones pushed this week, scores each against each project
   (keyword hits, stars, stars per day since the last run) and skips anything
   recommended in the last 30 days. Done when the candidates file exists.
3. **Verify every candidate** before the owner sees it. Fetch its README
   (`https://raw.githubusercontent.com/<owner>/<repo>/HEAD/README.md`). Drop it
   when it is empty, a list of links, a fork of something known, a token or
   course promo, unmaintained, or unlicensed for the intended use. For each kept
   pick write one concrete line: what it would change in *that* project
   ("replaces the hand-written sitemap splitter in the crawler", not "useful
   for SEO"). Done when every candidate has a verdict: `keep — <use>` or
   `drop — <reason>`.
4. **Write the digest** `scout/digests/<date>.md`: at most three kept picks per
   project, five overall marked as the best, each with link, stars and gain,
   licence, the one-line use, and the route to try it: `[new session:
   <project repo>]` with a one-line prompt. Commit it to the `scout` branch.
   Done when the digest is pushed.
5. **Tell the owner** in plain words: the top picks, one line each, with the
   link first. A scheduled run's final message is that summary, because the
   notification shows it.

## Safety

Picks are text. Never install a package, run a script, or copy code from a
scouted repo inside the scout; never add a dependency to a project from here.
Adopting a pick is a separate session in that project's repo, which reads the
code and the licence first (`session-focus` routes it there).

## Schedule

- Actions: `repo-scout.yml` with `cron: '23 14 */2 * *'` (UTC), a push trigger on
  `scout/profiles.json` (a profile change rescans at once) and
  `workflow_dispatch`; it needs `contents: write` and the default
  `GITHUB_TOKEN`.
- Claude routine: a fresh session in the registry repo an hour later, prompt
  "Run the repo-scout skill: verify the newest candidates on branch scout,
  write the digest, push it, and summarise the top picks for the owner." Turn
  push notifications on so the summary reaches the phone.
- Change the cadence in both places together.
