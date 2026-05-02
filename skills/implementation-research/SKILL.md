---
name: implementation-research
description: Researches implementation approaches, examples, prior art, libraries, framework docs, and tradeoffs for a new idea or design before acceptance criteria and planning. Use after brainstorm-spec when an idea needs current external knowledge, implementation examples, Context7 documentation, web-backed research, or comparison of technical approaches.
---

# Implementation Research

Ground a new idea or design in current implementation knowledge before criteria and planning.

## Operating Mode

- Research approaches and examples; do not edit source code or create implementation tasks.
- Use current external information when choices depend on libraries, SDKs, CLIs, cloud services, or implementation patterns.
- Prefer Context7 for specific technology docs/examples.
- Use Context7 `--research` or direct web/search tooling for broader examples, prior art, or cross-library comparisons.
- Never include secrets, credentials, proprietary code, or personal data in external queries.
- If `.pi/project-map/agent-guidance.md` exists, read it for project stack, constraints, and risks.
- If external access fails, report it and separate researched findings from model knowledge.

When used standalone, complete this skill normally without assuming workflow state; treat `## Next Step` as a manual recommendation for the user.

## Workflow

1. Restate the idea, goal, and project context.
2. Identify research questions and likely technologies/patterns.
3. Search current sources:
   - `find-docs` / Context7 for specific libraries/frameworks.
   - `ctx7 docs <libraryId> "<query>" --research` when default docs are insufficient.
   - Web/search tooling when available for examples or prior art outside one library.
4. Compare 2–4 viable implementation options.
5. Capture useful examples and source references.
6. Identify risks, gotchas, dependencies, and validation implications.
7. Recommend an approach or decision framework.

## Context7 Rules

- Resolve a library ID first: `ctx7 library <name> "<query>"`.
- Query docs with a descriptive question: `ctx7 docs <libraryId> "<query>"`.
- Retry once with `--research` only when needed.
- Keep to roughly 3 Context7 requests per research question unless the user approves more.
- Report quota/network/auth failures explicitly.

## Output Format

```md
# Implementation Research: <title>

## Summary
## Idea / Context
## Research Questions
## Sources Consulted
## Relevant Examples / Prior Art
## Implementation Options
### Option A: <name>
### Option B: <name>
## Recommendation
## Acceptance-Criteria Implications
## Planning Notes
## Open Questions
## Next Step
```

## Next Skill Guidance

Recommend:

- `acceptance-criteria` when behavior and success criteria still need to become measurable.
- `plan` when requirements are already precise and testable.

End with `## Next Step`: recommended skill, reason, user prompt, and compact auto handoff JSON when used in a workflow.
