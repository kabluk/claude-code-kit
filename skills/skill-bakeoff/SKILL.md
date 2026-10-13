---
name: skill-bakeoff
description: 'Blind comparison of design skills on one product: each skill draws the same pages from scratch on the same real data, and the owner picks by the pictures (monitor + phone). Use when the owner asks to compare design/UI skills, "compare N skills", "show how each skill would do it", "pick a skill for the design", or wants several from-scratch design directions for one product side by side.'
---

# skill-bakeoff

Bake-off: N skills × M pages = N×M pictures, the same conditions for all.
A variant is fair only if it differs in one thing, the skill: the same brief,
the same real data, the same check, the same picture layout. The owner
chooses by eye, so the picture is the only product of the comparison.

Skill files (paths relative to its folder):

| File | What it is |
|---|---|
| `skills.json` | eight vetted skills: repository, entry point, how to drive each without its own harness |
| `brief-template.md` | the brief for an agent; leave the `keep` blocks untouched |
| `bakeoff.example.json` | a comparison config: pages and skills |
| `render.mjs` | shots of a variant at 1280/390, exit 1 on sideways overflow or an external request |
| `compose.mjs` | N×M pictures "monitor on the left, phone on the right" |
| `brief-refine-template.md` | the REFINE-mode brief: polish the built site, only a `refine.css` on top |
| `refine-render.mjs` | the REFINE renderer: sits next to `current/` (a copy of the build `out/`), serves the build with the variant's `refine.css` injected last in `<head>`; shots at 1280 full page, 390 first screen and full page; exit 1 on overflow or an external request |
| `make-map.mjs` | a real map basemap (OSM/CARTO GL), if a page has a map |

## Mode: choose before step 1

- **REFINE**: the owner says "tweak", "polish", "based on ours".
  Work folder: `current/` = a copy of the built `out/`, `refine-render.mjs`
  next to it, the brief from `brief-refine-template.md`. The agent writes only
  `out2/<slug>/refine.css` (+ fonts). The first picture is the current look
  (an empty `refine.css`). Steps 2–3 below are not needed.
- **FROM-SCRATCH**: "new design", "from scratch", "directions". The steps below.

## Steps

1. **Work folder** in the scratchpad: `bakeoff.json` (from the example), `BRIEF.md` (from
   the template). Pages are the ones the owner named; if he named none, the home page and
   the second most important one. Done when the brief has not a single `{placeholder}` left,
   and the product's main element, if the owner named it, stands in the brief in capitals.
2. **Real data**: a script exporting from the product's DB/files into one JSON next to
   the brief. Done when every number on the future pages comes from it and the brief
   forbids inventing the rest.
3. **Basemaps**, if a page has a map: `node make-map.mjs <work>/map <name>
   <west,south,east,north>` (the box from the data's real coordinates). Done
   when you have opened the image and it shows streets and labels, not a grey field.
4. **Skills**: `git clone --depth 1 <repo>` into `scratchpad/skills/<dir>` per
   `skills.json` (a new skill: add its entry there with `entry` and `drive`).
   Done when every `entry` exists.
5. **Agents**: one per skill, in parallel, in the background. The prompt: the path to the
   brief, the skill's `entry` and `drive`, the slug, the work folder, "write to disk early,
   put a timeout on long commands". Done when all have reported, or for every silent one
   you can see on disk what it left (silence is not a result).
6. **Check and compose**: `node render.mjs <work>/out/<slug> home:scroll search`
   for each (exit 0 for all), then `node compose.mjs <work>/bakeoff.json`
   (exit 0 = nothing missing). Open at least one picture of every page with your own
   eyes. Done when all N×M files are in `final/` and you have seen them.
7. **Show**: all pictures in one `SendUserFile`, captioned "odd ones are …, even ones are …";
   in the reply, a table "number · skill · direction in one line" and the data oddities the
   agents found (they always find some).
8. **Final round** (if the owner picked two or three): to the same agents (`SendMessage`,
   the context of their design system is alive) two more page types each (an object card,
   a data page) in their own system. This shows whether the system holds beyond the shop
   window.
9. **Save**: the scratchpad disappears with the session, so `final/`, `out/` (without png),
   basemaps, the brief and the data go into the product repository on a separate branch
   with a README. Done when the branch is pushed.

## Rules

- A skill is driven by ITS process, not by a common checklist: the agent reads its
  SKILL.md and references in full and names in its report what the process made it do
  differently. That is the subject of the comparison.
- The product's current look enters the brief as one line: as the thing NOT to copy.
- Pages make no external requests (fonts downloaded next to them), otherwise the
  screenshot depends on the network, not on the skill.
- A map in a shot is a real basemap with markers placed by the Mercator formula from
  `<name>-map.json`; a drawn SVG "map" does not survive the comparison.

## Lessons

The skill is alive: after every use, add here what broke or worked unexpectedly,
with the date and the project.

- project A (September) · six skills from a Grok table: the first comparison, no common
  brief, no scripts.
- 03.10 · project B · eight skills × 2 pages: eight out of eight in ~13 minutes,
  render exit 0 for all. The agents found four data oddities on their own (a "clinic"
  type with a service area, the same 15-mile area for 20 providers, the address
  "MOBILE SERVICE ONLY", not one licence): the data report is valuable in itself.
- 03.10 · project B · CARTO raster tiles require a key; GL styles do not, but
  curl must run with `--compressed` (otherwise "Unable to parse the tile").
- 04.10 · project B · "not one provider in the city has a licence": eight
  agents honestly drew it and called it a data oddity, but it was an export bug: the
  filter `status='active'` while the real values were `verified/pending/not_found`.
  A round-2 agent caught it by comparing two exports. The sign for the future:
  "the same for everyone" in the agents' reports means check the export first, then take
  it to the owner. The rule is written into step 2.
- 04.10 · project B · round 2 to the same agents through `SendMessage`: the systems
  stayed whole (the same tokens, header, components), the new page types were added as
  an extension, not as a new design.
- 05.10 · project B · of four "data oddities" from the agents' reports, two turned out
  to be by design ("the same 15 miles" were areas with `source='inferred'`, and the site
  does not present them as stated anyway), one was my export bug, and only three small
  things in addresses and the licence source were real. Before taking an "oddity" to the
  owner, look at the row's provenance fields (`source`, `basis`, `status`) and at how the
  product itself shows them.
- 13.10 · project C · the skill was carried over from project B without changes.
  Eight skills × 2 pages (home, a payment calculator). The brief demands a WORKING
  calculator: the formulas and the expected numbers at the defaults sit in data.json
  (`result_at_defaults`), so the comparison runs on a live product, not on a picture of
  inputs.
- 13.10 · project C · 8 of 8 in ~8 minutes, render exit 0 for all. A data oddity from two
  agents turned out to be a real bug on the live site: one lender's `conditions` still
  held an old 6.75% rate next to an APR of 7.00%; fixed the same evening, a test added.
  Six agents of eight complained that the phone is shot only as its first screen (844 px),
  and nobody saw the lower sections on the phone. Candidate: `render.mjs` shoots the
  whole phone page for `:scroll`, `compose.mjs` shows the first ~1700 px.
- 13.10 · project C · **the owner rejected all 8 variants: "very different from ours,
  the one already built".** The request was "tweak the design", and the skill's template
  drives "from scratch, do not copy the current look". Lesson: before step 1 choose the
  mode by the owner's words: "tweak / polish" = REFINE mode (the same built site, each
  skill writes only a `refine.css` on top, the owner's structure / texts / features stay;
  the render is our build with the CSS injected), "new design / from scratch /
  directions" = FROM-SCRATCH mode. The second round went to REFINE with the same agents.
