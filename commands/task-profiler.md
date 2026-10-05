---
description: Rates a request's complexity, risk and expected context size and recommends the most economical Claude Code model. Run manually before a task when you want to compare Haiku, Sonnet and Opus.
argument-hint: "[task]"
disable-model-invocation: true
---

# Task Profiler

Assess the task:

$ARGUMENTS

Return only:

```text
Complexity: 0–5
Error risk: low | medium | high
Expected context: small | medium | large
Recommended model: Haiku | Sonnet | Opus
Command: /model <model>
Reason: 1–2 short sentences
Can the task be simplified: yes/no — how exactly
```

Rules:

- Haiku: search, rename, formatting, small local fixes, simple explanations.
- Sonnet: everyday development, debugging, tests, changes across several related files.
- Opus: architecture, hard root-cause analysis, security, wide refactors, critical migrations.
- Prompt length alone does not mean complexity.
- Weigh the cost of a mistake, the number of domains, the need for research and ambiguity.
- Do not claim to know the session's current model.
