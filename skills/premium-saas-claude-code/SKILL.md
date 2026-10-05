---
name: premium-saas-claude-code
description: Full production-ready skill for Claude Code to structure, architect and ship high-end SaaS and web applications with premium UX/UI from day one. Use when building SaaS, apps, dashboards, design systems, information architecture, progressive disclosure, component libraries, multi-tenancy, or when the user wants premium polish, clean structure, or Claude Code to avoid generic AI-looking interfaces. Triggers include premium SaaS, high-end UX, SaaS architecture, design system early, Claude Code SaaS, structure app for premium feel, shadcn premium, information architecture SaaS.
---

# Premium SaaS for Claude Code

You are now operating with the complete production playbook for building SaaS and applications that feel high-end from the first commit. This skill overrides generic AI coding habits.

## Core Philosophy

- Structure and information architecture come before pixels.
- Design system and component library are created on day one, not later.
- Progressive disclosure and time-to-value are non-negotiable.
- Every screen must answer one clear user decision.
- Premium feel comes from consistency, spacing, hierarchy, micro-interactions and empty states — not from decorative effects.
- Start with a modular monolith. Multi-tenancy is designed in, not bolted on.

## Phase 0 — Before Any Code

1. Write the single-sentence user workflow for the core job.
2. Define the primary user roles (admin, manager, contributor, etc.).
3. Map the information architecture:
   - Primary navigation (main product areas)
   - Secondary navigation (tabs, filters, feature groups)
   - Objects the user thinks in (OOUX style)
4. List the critical paths: signup → first value, core recurring task, settings, billing.
5. Decide tenancy model early (default: shared DB + shared schema + tenant_id + Postgres RLS).

## Phase 1 — Architecture & File Structure (Claude Code default)

Always produce this structure first:

```
src/
├── app/                    # Next.js App Router (or equivalent)
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/                 # Design system primitives (shadcn style)
│   ├── forms/
│   ├── tables/
│   ├── empty-states/
│   └── layouts/
├── lib/
│   ├── db/                 # Schema, queries, RLS helpers
│   ├── auth/
│   ├── tenancy/
│   └── utils/
├── hooks/
├── types/
└── styles/
```

Rules:
- One design system source of truth in `components/ui`.
- All business logic stays out of UI components.
- Database schema and RLS policies live next to the code that uses them.
- Prefer modular monolith with clear internal boundaries over microservices until proven necessary.

## Phase 2 — Design System First

Before building features:

1. Install and configure a solid foundation (shadcn/ui + Tailwind + Radix is the 2026 default).
2. Establish the spacing system: 4 / 8 / 16 / 24 / 32 / 48.
3. Choose max 2 fonts (one for headings, one for body).
4. Define a calm, restrained color palette with strong hierarchy (not purple gradients).
5. Create reusable primitives: Button, Input, Table, Card, Dialog, EmptyState, Skeleton, CommandPalette.
6. Document interaction patterns (hover, focus, loading, error, success).

Never invent new visual styles per feature. Everything must come from the system.

## Phase 3 — Screen Design Process (every screen)

Follow this exact sequence for every new screen:

1. Write the screen purpose in one sentence.
2. List every required element.
3. Sketch structure (even mentally) with clear hierarchy.
4. Design the empty state and loading state first.
5. Design the error and edge states.
6. Build using only existing design-system components.
7. Squint test: the most important action must be the most visible.
8. Ask: would a brand-new user understand what to do in 5 seconds?

## Phase 4 — Premium UX Non-Negotiables

- Progressive disclosure: show only what is needed for the current task.
- Time-to-value: shortest honest path from signup to first meaningful outcome.
- Role-based default views.
- Command palette (Cmd/Ctrl + K) for power users as the product grows.
- Skeleton loaders instead of spinners.
- Persistent filters and saved views where relevant.
- Clear visual hierarchy and generous white space.
- Micro-interactions that feel physical (hover, press, success feedback).
- Every data table is treated as a first-class surface (pinned columns, bulk actions, inline edit, density controls).

## Phase 5 — Technical Foundations for Scale

- Auth: use a mature provider (Clerk, Auth0, WorkOS, Supabase Auth) + tenant-scoped RBAC.
- Database: Postgres + Row-Level Security from day one.
- API: start with REST (or tRPC). GraphQL only when multiple distinct clients demand it.
- Background jobs and queues from the beginning if any async work exists.
- Observability and error states are part of the product, not afterthoughts.
- Keep the deployable unit simple (Vercel / Railway / single container) until metrics force splitting.

## Phase 6 — Claude Code Specific Instructions

When generating code:

- Always start by proposing the information architecture and file structure.
- Generate the design system components before feature screens.
- Prefer composition over configuration.
- Write empty states, loading states and error states in the same PR as the happy path.
- Never produce generic AI purple-gradient or Bootstrap-looking interfaces.
- Use real component libraries (shadcn, Radix, Tremor for charts, etc.) instead of inventing CSS.
- When the user asks for a feature, first ask (or decide) which role it belongs to and how it fits the existing IA.
- After generating UI, self-review against the 5-second rule and hierarchy test.

## Anti-Patterns to Reject

- Starting with pixels before structure.
- Feature bloat on the first screens.
- Different button styles or spacing across the product.
- Hiding primary actions behind secondary menus.
- Ignoring empty and error states.
- Premature microservices.
- Treating the design system as optional.

## Quick Reference Commands for Claude Code

When the user says any of:
- “structure this SaaS”
- “make it premium”
- “high-end UX”
- “design system”
- “information architecture”
- “Claude Code SaaS best practices”

→ Load this skill and follow Phases 0–6 strictly.

## References

For deeper detail load these files on demand:
- references/information-architecture.md
- references/design-system-checklist.md
- references/multi-tenancy-patterns.md
- references/screen-design-process.md
- references/ui-libraries-2026.md
