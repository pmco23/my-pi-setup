---
name: plan
description: Creates concise, actionable plans before implementation. Use when the user asks to plan work, design an approach, break down a design spec or acceptance criteria into tasks, investigate a codebase before editing, estimate effort, compare options, or produce an implementation checklist. This skill focuses on analysis and planning; do not modify files unless the user explicitly asks.
---

# Plan

Create an implementation plan from a request, spec, research brief, or acceptance criteria.

## Operating Mode

- Analyze before proposing tasks; do not edit files.
- Inspect relevant project files when needed to make the plan realistic.
- If `.pi/project-map/agent-guidance.md` exists, read it first.
- Produce task IDs that `execute` can track: `P1`, `P2`, ...
- Include validation steps and dependency order.
- Ask clarifying questions when ambiguity would cause rework or risk.

When used standalone, complete this skill normally without assuming workflow state; treat `## Next Step` as a manual recommendation for the user.

## Inputs

Use any available input:

- Acceptance criteria
- Implementation research
- Design spec
- User request
- Existing codebase/project map

## Workflow

1. Understand the goal and constraints.
2. Inspect relevant code/docs when needed.
3. State assumptions and out-of-scope items.
4. Break work into ordered tasks with IDs.
5. Identify dependencies, risks, and rollback/verification points.
6. Define validation commands/checks.
7. Recommend whether execution is safe to begin.

## Support Skills

- Use `find-docs` when planning depends on current library/API behavior.
- Use `ast-grep` for structural impact analysis before planning any rename, refactor, or interface change — e.g. find all callers of a function being changed, all components using a prop being renamed, all classes implementing an interface being modified. Prefer it over grep whenever the query depends on where or how code appears, not just what text it contains.

## Output Format

```md
# Plan: <title>

## Goal
## Assumptions
## Out of Scope
## Current State / Findings
## Tasks
- P1: <task> — depends on: <none/Px>; validation: <check>
- P2: <task> — depends on: <P1>; validation: <check>
## Risks & Mitigations
## Validation Plan
## Rollback / Safety Notes
## Open Questions
## Next Step
```

Keep plans concise. Prefer 3–8 tasks for normal work; split larger initiatives.

## Artifact

When in a workflow (Artifact dir provided in prompt), save your Plan output to:
`<artifact_dir>/<step padded to 2 digits>-plan.md`

Write the artifact BEFORE the `## Next Step` section. Include the path in the handoff `artifact` field.

## Next Skill Guidance

Recommend `execute` only when the plan is clear, ordered, and safe to implement. Require user input for unresolved choices, destructive operations, credentials, or production-impacting work.

End with `## Next Step`: recommended skill, reason, user prompt, and compact auto handoff JSON:

Auto handoff:
```json
{
  "workflow_mode": "<mode from prompt>",
  "current_skill": "plan",
  "next_skill": "<recommended>",
  "confidence": "high|medium|low",
  "stop_reason": null,
  "open_questions": [],
  "artifact": ""
}
```
