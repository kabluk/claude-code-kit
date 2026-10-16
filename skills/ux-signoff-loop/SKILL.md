---
name: ux-signoff-loop
description: Use when the owner asks to make a site "beautiful", "better UX", "check it like a UX designer", or to run it against outside UI/UX rules, and whenever a UI change is big enough that only a browser can tell whether it works. Runs an independent reviewer against fixed rule sets, fixes what it finds, and repeats until it signs off, turning every bug class it finds into a build gate.
---

# UX sign-off loop

Five times in ten days on one calculator site, the same cycle: an independent
reviewer looks at the built site → a P0/P1/P2 list → fixes → the reviewer
again. Every pass found what neither the tests nor I had seen: pages wider than
a phone, an empty result panel on five calculators, "$ 0.4 / sq ft", numbers
clipped inside a tile at 768px.

## Steps

1. **Rules are external and written down.** Take open rule sets (Vercel Web
   Interface Guidelines `command.md`, github.com/vercel-labs/web-interface-guidelines;
   ui-ux-pro-max `quick-reference.md` + `pro-rules.md`,
   github.com/nextlevelbuilder/ui-ux-pro-max-skill), clone them into a
   separate folder, and record a line in the project's register of external
   skills (e.g. `docs/playbook/EXTERNAL-SKILLS.md`). Done when the source and
   the revision are recorded.
2. **Build once, hand it to the reviewer.** `npm run build`; the reviewer
   serves `out/` itself on its own port and stops it by PID (`echo $! > file`,
   `kill $(cat file)`, never `pkill -f`). While it works, do not rebuild
   `out/`.
3. **Brief for the reviewer** (an agent, read-only): widths
   360/375/768/1024/1440, light and dark theme, touch at 360/375, a Tab pass
   with visible focus, contrast of small text, reduced motion, overlaps with a
   bottom bar, new features from a list. Output: PASS/PARTIAL/FAIL per
   category of each rule set, a score /100, P0/P1/P2 with a fix, a verdict
   SIGN OFF / NOT.
4. **Fix every P0 and P1 in one pass**, and check it in a browser the same way
   the reviewer found the problem.
5. **Every bug class becomes a gate.** What a browser found, not the HTML, is
   caught only by a browser: a Playwright script in the build (no page wider
   than 360px; no clipped numbers at 360/768/1024). The gate is proven both
   ways: it fails on the old code and passes on the new (the `gate` skill).
   The first version of the clipping gate passed on the broken layout:
   `overflow-wrap` hid the overflow by wrapping.
6. **Repeat from step 2** until the verdict is SIGN OFF or the scores stop
   rising; the result goes to HARVEST (the `harvest` skill) and as one line to
   the owner.
