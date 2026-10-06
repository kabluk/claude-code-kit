# Design System Checklist (Day One)

## Foundation
- [ ] Spacing scale: 4, 8, 16, 24, 32, 48, 64
- [ ] Typography: max 2 font families, clear scale (display → body → caption)
- [ ] Color palette: restrained, strong hierarchy, accessible contrast
- [ ] Radius, shadow and border tokens
- [ ] Dark mode tokens from the start if product needs it

## Primitives (build or adopt these first)
- Button (primary, secondary, ghost, destructive, sizes)
- Input, Textarea, Select, Checkbox, Switch, Radio
- Card, Dialog/Modal, Sheet/Drawer
- Table (with pinned columns, bulk actions, density)
- Skeleton, Spinner, Progress
- EmptyState (with illustration + clear CTA)
- Badge, Avatar, Tooltip
- Command / CommandPalette
- Toast / Notification

## Interaction Patterns
- Hover, focus-visible, active, disabled states for every interactive element
- Loading states (skeleton preferred over spinner)
- Success and error feedback
- Keyboard navigation and ARIA where needed

## Rules
- No one-off styles. Every new visual element must become a token or component.
- Prefer composition of existing primitives over new custom components.
- Document the system in the repo (even a simple markdown file is enough at the beginning).

## Recommended 2026 Stack
- shadcn/ui + Tailwind CSS + Radix UI as the default foundation
- Tremor or Recharts for charts
- Framer Motion or CSS transitions for micro-interactions
- Only add specialized libraries (Aceternity, Magic UI, etc.) for marketing surfaces, never for core product UI
