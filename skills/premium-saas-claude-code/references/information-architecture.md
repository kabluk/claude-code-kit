# Information Architecture for Premium SaaS

## Core Principle
Information architecture is infrastructure. Poor IA surfaces at month 6 when users cannot find settings or reports. Good IA lets the product grow without becoming a maze.

## Process

1. List the mental objects users think in (projects, teams, invoices, campaigns, etc.).
2. Group into primary product areas (max 5–7 top-level items — Miller’s Law).
3. Define primary navigation (sidebar or top) for those areas.
4. Define secondary navigation (tabs, filters, sub-pages) inside each area.
5. Map every critical flow:
   - Activation (signup → first value)
   - Core recurring job
   - Settings & permissions
   - Billing & plans
6. Apply progressive disclosure: surface only what the current role and current task need.

## Role-Based Views
Different roles need different default home screens and different visible complexity.
- Admin: configuration, billing, team management
- Manager: overview metrics, team performance
- Contributor: personal tasks and core workflow

Never force one interface on all roles.

## Scalability Rules
- Command palette (Cmd/Ctrl+K) becomes mandatory once primary nav exceeds ~7 items.
- Search must work across all major objects.
- Saved views and persistent filters prevent navigation fatigue.
- Settings should be grouped by frequency of use, not by technical domain.
