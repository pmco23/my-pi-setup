---
name: acceptance-criteria
description: Converts a design spec, feature idea, bug report, or user request into clear, testable acceptance criteria and definition of done. Use after brainstorm-spec and implementation-research, and before plan when requirements need to be made measurable, edge cases identified, or success criteria clarified.
---

# Acceptance Criteria

Turn a request, design spec, or research-backed direction into measurable acceptance criteria.

## Operating Mode

- Focus on observable behavior and testability.
- Do not plan implementation tasks or edit files.
- Preserve user constraints, non-goals, and risks.
- Identify edge cases, failure modes, and validation expectations.
- Ask questions only when missing information would materially change criteria.
- If `.pi/project-map/agent-guidance.md` exists, read it for project conventions and validation commands.

When used standalone, complete this skill normally without assuming workflow state; treat `## Next Step` as a manual recommendation for the user.

## Inputs

Use any available input:

- Design spec from `brainstorm-spec`
- Research brief from `implementation-research`
- User request, feature idea, bug report, or constraints
- Existing project context

## Workflow

1. Restate scope and assumptions.
2. Define in-scope and out-of-scope behavior.
3. Write functional acceptance criteria with stable IDs.
4. Add non-functional criteria: performance, reliability, security, accessibility, maintainability, etc.
5. Capture edge cases and error states.
6. Define validation expectations and definition of done.
7. Note open questions and risks.

## Criteria Quality Bar

Each criterion should be:

- Specific and observable
- Testable by manual check, automated test, or inspection
- Independent enough to verify
- Traceable to the request/spec/research
- Free of implementation-task wording unless explicitly required

## Output Format

```md
# Acceptance Criteria: <title>

## Scope
## Assumptions
## Non-Goals
## Acceptance Criteria
### Functional
- AC-F1: Given/When/Then...
### Non-Functional
- AC-NF1: ...
## Edge Cases
## Validation Plan
## Definition of Done
## Open Questions
## Next Step
```

## Next Skill Guidance

Recommend `plan` when criteria are testable enough to decompose into tasks. If critical questions remain, require user input before continuing.

End with `## Next Step`: recommended skill, reason, user prompt, and compact auto handoff JSON when used in a workflow.
