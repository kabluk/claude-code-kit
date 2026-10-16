---
name: click-audit
description: 'Use when the owner asks whether all the buttons and links actually work, when a control looks decorative, before shipping a screen with new interactive elements, or after a redesign copied from a mockup. Clicks every button on every listed page, checks every link resolves, and classifies each control by what it actually did — navigation, DOM change, stored state, or nothing. Triggers: "check all the buttons", "does everything work", "where does this lead", "the button does nothing", "where is the mechanic".'
---

# Click audit

The owner of a directory product asked twice in two days: "What does the *save
to my plan* button do?" and "Picking one situation or the other changes
absolutely nothing. Where, where is the mechanic in there?". Both times the button existed, looked alive and did nothing. The
rule "a button with no reader of its state is a promise with no follow-up" was
already written down; what was missing was **a way to find such buttons before
the owner does**. This is it.

The script is [`audit.mjs`](audit.mjs). It takes page paths and prints one line
per button plus a list of dead links.

```bash
npm run build
node .claude/skills/click-audit/audit.mjs --dist ./dist / /app/ /search/
node .claude/skills/click-audit/audit.mjs --base http://127.0.0.1:4173 --dist ./dist / /app/
```

Without `--base` the script serves `--dist` (default `./dist`) itself, with the
headers from its `_headers` file. Playwright is resolved from the project
(then `NODE_PATH`); the browser binary comes from the `CHROMIUM` environment
variable, `--exe` is a synonym, and with neither Playwright uses its own
download. `--out report.json` writes the full report. Exit code 1 only on dead
internal links: a NOTHING verdict stays a hypothesis (see false findings
below).

## Steps

1. **Build a copy equal to production and serve it.** An audit against the dev
   server lies: production headers and CSP live only in the built files. Done
   when the page opens at a local address.
2. **List the pages, do not guess them.** Every screen with its own state,
   plus the pages that host widgets (find them by how the content marks a
   widget, e.g. a `kind: 'tool'` field). Done when the list is closed.
3. **Run the script.** For each button it opens the page afresh, captures the
   URL, the page text and `localStorage`, clicks, captures again, and writes a
   verdict: navigates, new tab, print, changes content, writes state,
   disabled, or **NOTHING**. Links are checked against the build files: an
   internal address must exist in `dist`. Done when every button has a
   verdict.
4. **Re-check every finding by hand.** A NOTHING verdict is a hypothesis, not
   a sentence (see false findings below). Done when every confirmed finding
   has a line of code that explains why it is dead.
5. **Fix, do not hide.** The button either gains a consequence or leaves the
   page. There is no third option: "the button is there, but it is for the
   future" is a promise the owner will notice before the user does.
6. **Run the scenarios a click does not cover.** Field + button (enter a
   valid and an invalid value), a choice from a list, a mode toggle: look not
   for "it clicked" but for "what it exists for changed". Done when every
   scenario has a printed result.

## False findings

- **A choice marked only by a class.** A questionnaire set `sel` on the
  button: the page text did not change and the verdict was NOTHING. Look at
  the class and at the next step appearing, not only at the text.
- **Indices before hydration.** The first run addressed elements by their
  number in the list: on the click page hydration had not finished, there were
  fewer elements, and clicks landed on neighbours, producing "navigations" to
  the wrong place. The script waits for hydration and addresses an element by
  its label and its ordinal among same-label elements.
- **Print.** `window.print()` shows nothing in headless. The script stubs
  `print` in `addInitScript` and catches the call.
- **A disabled button.** An empty field is a valid state, not a finding: such
  buttons are reported separately and not clicked (otherwise the click hangs
  until the timeout).
- **The active item.** A click on an already selected stage or tab
  legitimately changes nothing.

## A mobile app link is looked up, never guessed

An app identifier cannot be derived from the company name: in one session all
five guessed addresses (bundle ids and App Store ids) returned 404. Take them
from the catalogues:

```bash
curl -s --get --data-urlencode "term=<company>" --data-urlencode "entity=software" \
  --data-urlencode "country=us" https://itunes.apple.com/search   # App Store
curl -s "https://play.google.com/store/search?q=<company>&c=apps&hl=en_US" \
  | grep -o 'id=[a-zA-Z0-9_.]*' | sort -u                         # Google Play
```

Match the **publisher**, not only the name: both stores carry fakes of
well-known services (one was a lookalike title spelled with Cyrillic letters
from an unrelated developer). Publish only the address whose publisher matches
the operator, and check the response code of the app's page.

## What to look for besides dead buttons

- A search that searches only the current section although the field
  promises the whole site: a subtopic that exists was not found from another
  section.
- A button that re-creates a component instead of changing its state
  (changing a `key` remounted a picker in its closed state).
- An external link without `target="_blank"`/`rel="noopener noreferrer"`.
- A directory that has a record but no page: compare the data list with the
  list of built files, not with the sitemap.
