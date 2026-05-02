---
name: brainstorm-spec
description: Collaboratively brainstorms ideas with the user, explores options and tradeoffs, then produces a clear design specification ready for implementation-research, acceptance-criteria, or plan. Use when the user wants to shape a feature, product idea, architecture, workflow, UX, or technical approach before planning execution.
---

# Brainstorm Spec

Shape an early idea into a concrete design specification.

## Operating Mode

- Collaborate before converging; do not jump to implementation tasks.
- Ask focused questions about users, goals, constraints, risks, and success criteria.
- Explore at least 2 approaches when the direction is not obvious.
- Make tradeoffs explicit: value, complexity, risk, UX, maintainability, reversibility.
- Do not edit project files unless explicitly asked.
- If `.pi/project-map/agent-guidance.md` exists, read it to ground the spec in project architecture and constraints.
- In auto mode (no user present to answer questions): use the goal and provided context to infer reasonable defaults, state assumptions explicitly in the spec, capture unresolved questions in Open Questions rather than blocking, and produce a complete spec even with assumptions — downstream skills can refine.

When used standalone, complete this skill normally without assuming workflow state; treat `## Next Step` as a manual recommendation for the user.

## Workflow

If `Previous artifact:` is provided in the prompt, read that file with the read tool before starting. It contains the full output of the previous skill.

1. Clarify the problem, audience, goals, and constraints.
2. Brainstorm possible approaches.
3. Compare tradeoffs and help the user choose a direction.
4. Define the selected design clearly enough for research, criteria, or planning.
5. Capture assumptions, non-goals, risks, and open questions.
6. Produce a design spec.

## Support Skills

- Prefer `implementation-research` as the next phase when the idea needs current examples, prior art, external docs, or approach comparison.
- Use `find-docs` only when a design decision depends on current API/framework behavior.
- Use `ast-grep` when understanding how a pattern is currently used across the codebase would inform the design — e.g. how many components use a given abstraction, where an error-handling pattern is applied, how widely a deprecated API is still in use.

## Output Format

When ready to converge, produce:

```md
# Design Spec: <title>

## Summary
## Problem
## Goals
## Non-Goals
## MVP / Simplest Useful Version
## Users / Use Cases
## Proposed Design
## Key Decisions
## Alternatives Considered
## Requirements
### Functional
### Non-Functional
## UX / Workflow
## Data / Interfaces
## Risks & Mitigations
## Assumptions
## Open Questions
## Next Step
```

Use stable IDs for important decisions, requirements, risks, assumptions, and questions.

## Artifact

When in a workflow (Artifact dir provided in prompt), save your Design Spec output to:
`<artifact_dir>/<step padded to 2 digits>-brainstorm-spec.md`

Write the artifact BEFORE the `## Next Step` section. Include the path in the handoff `artifact` field.

## Next Skill Guidance

Recommend:

- `implementation-research` when current examples, prior art, docs, or implementation tradeoffs matter.
- `acceptance-criteria` when no research is needed but requirements need to become testable.
- `plan` only when the scope is already precise and testable.

End with `## Next Step`: recommended skill, reason, user prompt, and compact auto handoff JSON:

Auto handoff:
```json
{
  "workflow_mode": "<mode from prompt>",
  "current_skill": "brainstorm-spec",
  "next_skill": "<recommended>",
  "confidence": "high|medium|low",
  "stop_reason": null,
  "open_questions": [],
  "artifact": ""
}
```
