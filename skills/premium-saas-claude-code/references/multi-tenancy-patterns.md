# Multi-Tenancy Patterns for Early SaaS

## Recommended Default (2026)
Shared database + shared schema + `tenant_id` column on every table + Postgres Row-Level Security (RLS).

Why:
- Lowest operational cost
- Fastest to ship
- RLS enforces isolation even if application code has bugs
- Easy to add later features (usage metering, per-tenant feature flags)

## When to Move
- Schema-per-tenant: when enterprise customers demand stronger isolation or custom migrations.
- Database-per-tenant: only for the largest enterprise deals or heavy compliance requirements.

## Implementation Checklist
- [ ] Every table has `tenant_id` (or equivalent)
- [ ] RLS policies enabled and tested
- [ ] All queries are automatically scoped (middleware or query helper)
- [ ] Auth provider returns tenant context
- [ ] Background jobs carry tenant context
- [ ] File storage and caches are tenant-scoped
- [ ] Metrics and logs include tenant_id

## Auth + RBAC
Buy the identity layer (Clerk, WorkOS, Auth0, Supabase Auth).
Build only the tenant-scoped roles and permissions yourself.
Never mix global and tenant permissions without clear boundaries.
