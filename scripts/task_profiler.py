#!/usr/bin/env python3
"""Claude Code UserPromptSubmit hook: recommend an economical model for each task."""

from __future__ import annotations

import json
import re
import sys
from typing import Any


LIGHT_TERMS = {
    "rename", "typo", "format", "fix the text", "translate",
    "lint", "comment", "explain this line", "explain the line",
    "find the file", "find file", "grep", "replace", "short answer",
}
HEAVY_TERMS = {
    "architect", "design the", "refactor", "migrat", "security",
    "audit", "race condition", "scaling", "scalab",
    "distributed", "architecture", "security audit", "threat model",
    "redesign", "root cause", "optimize the whole", "explore the project",
}
CRITICAL_TERMS = {
    "production", "prod ", "payment", "financ", "authoriz",
    "authentic", "encrypt", "personal data", "data deletion",
    "database migration", "breaking change", "compliance",
}
MULTI_DOMAIN_TERMS = {
    "backend", "frontend", "devops", "marketing",
    "database", "infrastructure", "api", "design",
    "analytics", "mobile", "product",
}


def contains_any(text: str, terms: set[str]) -> int:
    return sum(1 for term in terms if term in text)


def classify(prompt: str) -> dict[str, Any]:
    text = prompt.lower().strip()
    words = re.findall(r"\w+", text, flags=re.UNICODE)
    score = 1
    reasons: list[str] = []

    light = contains_any(text, LIGHT_TERMS)
    heavy = contains_any(text, HEAVY_TERMS)
    critical = contains_any(text, CRITICAL_TERMS)
    domains = contains_any(text, MULTI_DOMAIN_TERMS)

    if len(words) > 80:
        score += 1
        reasons.append("detailed request")
    if len(words) > 220:
        score += 1
        reasons.append("large set of requirements")
    if heavy:
        score += min(2, heavy)
        reasons.append("needs complex reasoning or design")
    if critical:
        score += 1
        reasons.append("high cost of a mistake")
    if domains >= 3:
        score += 1
        reasons.append("several project areas")
    if re.search(r"\b(whole|entire|completely|end[- ]to[- ]end|from scratch)\b", text):
        score += 1
        reasons.append("wide area of change")
    if re.search(r"\b(one file|one line|small|quick|simple)\b", text):
        score -= 1
    if light and not heavy and not critical:
        score -= 1
        reasons.append("local mechanical task")

    score = max(0, min(5, score))

    if score <= 1:
        model = "haiku"
        label = "LOW"
        context = "small"
        risk = "low"
    elif score <= 3:
        model = "sonnet"
        label = "MEDIUM"
        context = "medium"
        risk = "medium" if score == 3 else "low"
    else:
        model = "opus"
        label = "HIGH" if score == 4 else "VERY HIGH"
        context = "large"
        risk = "high"

    if not reasons:
        reasons.append("ordinary task with no clear signs of extreme complexity")

    return {
        "score": score,
        "label": label,
        "model": model,
        "context": context,
        "risk": risk,
        "reasons": reasons[:3],
    }


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    prompt = str(payload.get("prompt", "")).strip()
    if not prompt or prompt.startswith("/model"):
        print("{}")
        return 0

    result = classify(prompt)
    command = f"/model {result['model']}"
    reason = "; ".join(result["reasons"])

    visible = (
        f"Model Advisor | {result['label']} ({result['score']}/5) | "
        f"recommended {result['model'].upper()} | "
        f"context: {result['context']}, risk: {result['risk']}. "
        f"Reason: {reason}. If needed: {command}"
    )

    context = (
        "MODEL_ADVISOR_RESULT\n"
        f"complexity={result['label']} ({result['score']}/5)\n"
        f"recommended_model={result['model']}\n"
        f"risk={result['risk']}\n"
        f"expected_context={result['context']}\n"
        f"reason={reason}\n"
        "Before doing substantial work, add one short first sentence only when the "
        "recommended model materially differs from what the task appears to require: "
        f"\"Model tip: /model {result['model']} is enough for this task — <short reason>.\" "
        "Do not claim you know the current session model. Do not repeatedly ask for confirmation. "
        "For trivial conversational follow-ups, acknowledge the recommendation silently."
    )

    output = {
        "systemMessage": visible,
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": context,
        },
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
