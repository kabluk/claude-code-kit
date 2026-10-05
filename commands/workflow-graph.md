---
description: Builds and maintains the project dependency graph in docs/project/GRAPH.yaml. Use for multiple tasks, roles, dependencies and parallel development.
argument-hint: "[goal or phase]"
context: fork
---

# Workflow Graph

Request: $ARGUMENTS

Model the project as a DAG: a node is a bounded, verifiable task; an edge is a real dependency.

Read VISION.md, STATUS.md, ROADMAP.md, BACKLOG.md, DECISIONS.md, INTERFACES.md and the existing GRAPH.yaml selectively. Do not read the whole repository.

Create or update `docs/project/GRAPH.yaml`:

```yaml
version: 1
updated_at: YYYY-MM-DD
limits:
  max_parallel: 3
  max_nodes_per_iteration: 8
  default_max_attempts: 4
nodes:
  - id: BE-001
    title: Short verifiable result
    owner: backend-engineer
    status: planned
    depends_on: []
    inputs: []
    scope: []
    outputs: []
    verify: []
    node_kind: agent          # agent | script | test | data-query
    on_failure: escalate      # degrade | fallback | escalate | halt
    max_attempts: 4
    attempts: 0
    risk: low
    approval_required: false
    notes: ""
```

Statuses: planned, blocked, ready, running, review, done, failed, escalated.

`node_kind` and `on_failure` are required for new nodes; do not retroactively rewrite
existing nodes: they default to `agent` / `escalate`.

Rules:
1. A node finishes within one autonomous working pass.
2. One node, one main owner.
3. Parallel nodes must not change the same files.
4. `ready` is allowed only after all dependencies are finished.
5. Do not create cycles or more than eight new nodes per iteration.
6. Production, destructive migrations, breaking APIs, security-critical work and paid resources require `approval_required: true`.
7. Suggest worktrees for parallel work.
8. If a node is done but not fully verified (for example, a critical part needs access
   or an account the executor does not have), set `status: review`, not `done`.
   `done` means "verified", not "code written".
9. Mark which nodes need an agent and which need a plain function, script or test.
   A deterministic node is cheaper, reproducible and does not report on its own
   success. If a node can be expressed as a script, it must be a script.
10. Besides `verify`, give every node a failure path: degrade, fallback source,
    escalation or safe stop. A node with no assigned failure path turns into an
    endless retry when it fails.
11. Do not build a graph where a single loop is enough. A graph is justified only by real
    branching, parallelism, checkpoints between steps or recovery after failure.

Pick a mode:
- direct — one local task;
- verification-loop — one verifiable task;
- graph — several dependent tasks;
- graph-parallel — several independent tasks;
- scheduled-loop — waiting for CI, a PR, a deploy or an external event.

Show the ready nodes, blockers, safe parallel groups, the critical path and the best next node.

Finish with 2–3 options for the next action and one related "Term of the day".
