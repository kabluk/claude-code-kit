---
description: Executes one GRAPH.yaml node in a bounded implement-verify-fix loop with an attempt limit and escalation.
argument-hint: "[node ID]"
context: fork
---

# Task Loop

Node: $ARGUMENTS

1. Find the node in `docs/project/GRAPH.yaml`.
2. Check its dependencies and `approval_required`.
3. Read only the inputs, interfaces, decisions and files in `scope`.
4. Do not widen the scope silently.

Run the loop:

```text
PLAN → IMPLEMENT → VERIFY → DIAGNOSE → FIX
```

Before treating `verify` as sufficient, check the check itself: plant a violation the
node is supposed to catch, make sure `verify` goes red, then revert. A check that has
never failed is unproven: it may be guarding the wrong thing or nothing at all.
Write tests against the data shape the neighbouring module actually emits, not a
convenient one.

Success: every `verify` command passed and the criteria are met. If part of `verify` is
objectively unreachable in the current environment (no access to an external account or
service, a paid resource is not enabled), do not report it as success. Run everything that
can be checked locally or live, describe the unverified remainder honestly, and move the
node to `review`, not `done`.

Escalate when:
- `max_attempts` is exceeded;
- two attempts give the same error with no progress;
- an architectural decision is needed;
- you would have to leave the scope;
- a breaking API change is needed;
- a security-critical risk is found;
- human approval is required.

Once attempts are exhausted, do not repeat the same thing: the node must have an assigned
failure path: degrade (a partial result, honestly labelled), a fallback source, escalation
to the owner, or a safe stop. A retry without a change of approach does not count as an attempt.

Forbidden: infinite loops, hiding failing tests, weakening tests to get green, and production or destructive actions without permission.

Update attempts and statuses. On success, update STATUS.md, BACKLOG.md, HANDOFF.md and the relevant domains file, and unblock dependent nodes.

Return a compact RESULT/TASK/ATTEMPTS/CHANGED/VALIDATION/DECISIONS/RISKS/NEXT.

Finish with 2–3 options for the next action and one related "Term of the day".
