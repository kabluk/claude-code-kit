---
name: mockup-in-skin
description: >
  Show interface options built from the product's own built files, not a page
  drawn from scratch. Use when the owner asks to see how a change would look,
  to compare options side by side, or says the mock-up does not look like
  their site. Triggers: "show how it would look", "show three variants",
  "compare with what we have", "that is not our design", "our background /
  header is not like that".
---

# Mock-up in the product's skin

The owner rejects a mock-up drawn from scratch at first glance: "you are
showing a blue background, no, everything must be like on the site". And he
is right: an option shown in someone else's skin proves nothing about our
screen. In one day (21.09.2026) the mock-up had to be rebuilt three times
before this recipe settled.

**Rule.** An interface option is shown with the product's BUILT files: the
production CSS from `dist`, the production page markup, real data. Your own
markup is allowed only where the product has nothing yet (a new block), and
then its classes live next to the production ones, not instead of them.

## Recipe

1. **Build the product**: `npm run build`. A mock-up from sources lies:
   production headings, hashes and CSS rule order exist only in the build.
2. **Take the skin**: the whole `dist/assets/app-*.css`, the `<main>` or the
   whole page from `dist/<lang>/<slug>/index.html`.
3. **Make the document self-contained**, otherwise the iframe has neither
   fonts nor images:
   - fonts `public/fonts/*.woff2` → `data:font/woff2;base64,…` by replacing
     paths in the CSS;
   - photos `public/*.jpg` → `data:image/jpeg;base64,…`;
   - cut out `<script>` and `<link rel=modulepreload>`, replace `<link
     rel=stylesheet>` with a `<style>` holding that CSS.
4. **Move blocks, do not rewrite them**: a regex over the markup cuts a
   section out and inserts it elsewhere; a new block is added as an HTML
   string with classes that will really move into `global.css` later.
5. **Show in 390 px columns** (`iframe srcdoc`), the first column is
   "Now". Next to it a table: what changes, what it costs, what we risk.
6. **Check with a screenshot before publishing**: Playwright on every
   document, print the height, the section order and the number of clipped
   lines. An empty image in a column is usually an un-embedded resource, not
   "the layout broke".

`example-build.mjs` is a worked example of this recipe (four columns, three
typography variants of one content page): a pattern to copy, not a script to
run as is.

## Boundaries

- This is NOT `ui-from-screenshot`: there someone else's design is
  reproduced pixel for pixel from an image; here our own product is shown in
  its own skin.
- Keep the data real: phone numbers, institution names and figures come from
  `data/`, otherwise the owner will trust a demonstration that does not exist.
- Leave the header, palette and photos as they are unless the owner asked:
  the subject of comparison is blocks and mechanics.
- A mock-up is not proof that it works. After an option is chosen, the change
  is checked on the built product (click audit, computed styles), not on a
  screenshot of the mock-up.

## Done when

The owner sees his own pages side by side, the difference reads without
explanation, and every option has its price named (what was removed, what
was added, how many lines of code).

## Before porting: check the sense, not only the look

An approved mock-up is a picture, not proof of logic. Twice in a row a
verbatim port carried over a mistake the product must not have: in a
navigator prototype the "choose your facility" section stood on both paths,
and on the "preparing in advance" path the screen asked for a facility from
someone who could not have one yet (the owner, 22.09: "where is the logic in
this?").

So before porting, ask one question of every block in the mock-up: **is this
state possible for the user at this point?** If a field, button or block
needs data the person cannot have at this step, the block is not ported; it
disappears in that state. The answer is written into the project's decision
record: the mock-up was approved as a whole, so a departure from it must be
named, not made silently.

## After the fix, show only the finished product

A "prototype on the left, product on the right" comparison helps ONCE:
before the fix. After it, the owner opens the same page, sees the old
behaviour in the left column and concludes nothing was fixed (exactly that
happened on 22.09). As soon as the fix is in, show the product (in two states
if the fix is about a state) and leave the prototype as a link in the text.

## When they ask for beautiful

"Make it look expensive", "like Linear / Stripe", "floating elements",
"glow": that is not a mock-up by this recipe but the `glass-stage` skill: real
product screens in phones, light and glass, kie.ai backgrounds, in any
palette. Drawing illustrations in code (SVG diagrams) is not needed: one
owner called them "cheap" twice.
