---
name: first-mobile-app
description: 'Path from an idea to a first mobile app built with AI agents: validate with a web prototype first, decide whether a real app is needed, map flows, write a PRD, pick a builder by stated criteria, build flow by flow, test with a handful of people, release. Use when the owner wants to build a mobile app (iOS or Android), asks where to start with an app, or has an app idea that has not met a single user yet. Not for web-only products (see premium-saas-claude-code).'
---

# First mobile app with AI

Built from one practitioner's step-by-step post (r/vibecoding, Oct 2026, author
shipped 100+ apps before AI and sells an AI app builder, so the "native is
best" advice is an opinion, not a measurement). Every number below (weeks,
percentages, prices) comes from that single source: treat it as a rough guide
and say so when quoting it to the owner.

The expensive mistake this skill prevents: months spent building a native app
for an idea no user has touched. The order is validate cheaply, then build
once, flow by flow.

## Steps

1. **Gate the idea first.** Run `idea-gates` (in `lab`: `blue-ocean`) before
   any app work. Then name the source of the idea: the owner's own pain
   (harder to validate, needs real users early) or a category someone else
   already proved (study every competitor's pricing, reviews and complaints,
   and find the angle). Done when the idea survived the gates and the angle
   is one written sentence.
2. **Prototype on the web, then talk to users.** A mobile-width web version
   in whatever builder the owner already pays for: about two days to build,
   then about a week with real target users (interviews or a questionnaire).
   Expect to change direction or drop the idea. Done when at least five real
   people from the target group used it and the owner wrote down what they
   kept, dropped and asked for.
3. **Decide whether an installed app is needed at all.** If the web version
   works for users, stop here and keep developing it. An installed app earns
   its cost only when the idea needs the phone: notifications, widgets,
   camera, offline, store distribution. Options: a wrapper around the web app
   (fast, usually temporary), React Native, or fully native (Swift and
   Kotlin). Choose by what the idea needs and what the owner can maintain;
   the source argues for native, so weigh that as an opinion. Expect a
   rebuild rather than a port, which is cheaper than the first build because
   the features are now known. Done when the choice and its reason are written.
4. **Map the app flow by flow before any code.** On paper or a board: one
   sketch per flow (onboarding, registration, monetization, each core flow),
   using screenshots of the web prototype and flows from similar apps as
   reference (Mobbin is the source's example), plus what is specific to
   mobile. Done when every flow has a sketch and a list of its screens.
5. **Write the PRD, flow by flow.** Together with the agent. This is the
   context the builder will receive. Done when each flow has its own section
   with screens, states, and acceptance criteria.
6. **Pick the builder by three checks.** (a) Pricing model: prefer tools where
   the owner plugs in their own agent subscription over per-credit billing,
   since the app will be maintained for years. (b) Code ownership: confirm the
   code can be exported for free before starting. (c) Feel: the owner tries it
   on one real flow. Both platforms needed means a tool that covers both.
   Done when the three checks are answered for the chosen tool, in writing.
7. **Build one flow at a time.** One spec and its reference screenshots per
   flow; never the whole app in one prompt. Plan about a third of the time for
   debugging and checking. Rough timeline from the source: one to two weeks
   of full-time work for an average app, one to two months part-time. Done when
   each flow passes its acceptance criteria on a device, not in a simulator
   alone.
8. **Test with a few people and release fast.** Apple developer account (about
   $99 per year, verify at developer.apple.com) and TestFlight builds to five
   to seven testers, feedback from each. No audience to test with: release a
   free version and learn from store users; pricing can come later. Before the
   store submission run `site-launch` for the landing page and legal pages.
   Done when the testers' feedback is logged and the build is submitted.

## Rules

- Do not skip steps 1 and 2 because the owner is eager to build; they are the
  cheapest steps and the only ones that can kill the idea for free.
- A tool recommendation is the owner's choice by the step 6 checks. Never name
  one builder as the answer because a source promoted it.
- Hand the owner each store account, payment and signing step as a button
  (`secrets-and-buttons`), with a direct link first.
