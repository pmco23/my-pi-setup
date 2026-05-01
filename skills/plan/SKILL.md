---
name: plan
description: Creates concise, actionable plans before implementation. Use when the user asks to plan work, design an approach, break down a design spec or acceptance criteria into tasks, investigate a codebase before editing, estimate effort, compare options, or produce an implementation checklist. This skill focuses on analysis and planning; do not modify files unless the user explicitly asks.
---

# Plan

Use this skill to turn a request, design spec, or acceptance criteria into a clear execution plan.

## Operating Mode

- Prefer understanding before changing.
- Do not edit files, install packages, or run destructive commands unless explicitly requested.
- Read relevant files and documentation as needed.
- If `.pi/project-map/agent-guidance.md` exists, read it to understand project architecture, conventions, validation commands, and risky areas before planning.
- Ask clarifying questions only when missing information would materially change the plan.
- Keep plans practical and ordered.
- Produce stable task IDs so `execute` and `review-against-plan` can track coverage.

## Inputs

Use any available inputs:

- Design spec from `brainstorm-spec`
- Acceptance criteria from `acceptance-criteria`
- User request or bug report
- Relevant project files, tests, docs, logs, or constraints

## Workflow

1. Restate the goal in one sentence.
2. Inspect relevant project files when the task depends on existing code.
3. Identify constraints, risks, assumptions, and out-of-scope work.
4. Break the work into ordered tasks with stable IDs: `P1`, `P2`, `P3`, ...
5. Mark dependencies between tasks.
6. Map tasks to requirements or acceptance criteria when available.
7. Include validation steps: tests, commands, manual checks, or review points.
8. Call out decisions the user must make before execution.
9. Produce a handoff for `execute`.

## Plan Size

- For small tasks (bug fix, minor feature): 2–5 tasks.
- For medium features: 5–12 tasks.
- For large features: consider splitting into multiple plans with a phase boundary.
- If a plan exceeds 15 tasks, ask whether to split or proceed.

## Effort Estimation

When the user asks for effort estimates:

- Use relative sizing: small (≤1 hour), medium (1–4 hours), large (4+ hours).
- Base estimates on: number of files changed, complexity of logic, test coverage needed, risk level.
- Mark estimates as rough and note what could make them wrong.
- Do not estimate if the codebase is unknown and no project-map exists.

## Support Skills

Use support skills before finalizing the plan when useful:

- Use `ast-grep` for structural codebase discovery, call-site analysis, refactor impact analysis, and pattern inventory.
- Use `find-docs` for current library, framework, SDK, CLI, API, or cloud-service implementation details.
- Use `graphify` for large codebases, architecture-impacting changes, domain modeling, or dependency/relationship mapping.

Support skill findings should be reflected in task IDs, validation IDs, risks, assumptions, and open questions.

## Handoff Protocol

Every final response must end with a handoff that supports both modes:

- **User-in-the-loop mode**: ask the user to confirm the next logical skill before continuing.
- **Auto mode**: provide the exact next skill name and compact input payload so an orchestrator can continue automatically.

Use this handoff shape in final outputs:

````md
## Next Step
Recommended skill: `<skill-name | none>`
Reason: <why this is the next logical step>

User prompt:
- Shall I continue with `<skill-name>`?

Auto handoff:
```json
{
  "workflow_mode": "user-in-the-loop",
  "current_skill": "<current skill name>",
  "next_skill": "<skill-name | none>",
  "requires_user": false,
  "stop_reason": null,
  "confidence": "high",
  "reason": "<short reason>",
  "inputs": {
    "primary_artifact": "<summary or reference>",
    "required_context": ["<item>"],
    "open_questions": ["<question>"]
  }
}
```
````

If no next skill is needed, set `next_skill` to `none`, set `requires_user` to `true`, set `stop_reason` to `workflow complete`, and ask whether the user wants anything else. In user-in-the-loop mode, always set `requires_user` to `true` because the user must approve the next step. In auto mode, set `requires_user` to `false` only when it is safe to continue automatically.

## Output Format

Use this structure unless the user requests otherwise:

````md
## Goal
<one sentence>

## Assumptions
- A1: <assumption or constraint>

## Out of Scope
- <item not to change>

## Plan
- P1: <task>
  - Covers: <FR/AC IDs or requirement names>
  - Depends on: <P IDs, or "none">
  - Notes: <implementation guidance if useful>
- P2: <task>
  - Covers: <FR/AC IDs or requirement names>
  - Depends on: <P IDs, or "none">

## Validation
- V1: <test/check/command/manual verification>
- V2: <test/check/command/manual verification>

## Decisions Required Before Execution
- <decision the user must make, or "None">

## Risks
- R1: <risk and mitigation>

## Open Questions
- Q1: <question, only if needed>

## Next Step
Recommended skill: `execute`
Reason: The work has been decomposed into task IDs with validation expectations.

User prompt:
- Shall I continue with `execute` to implement this plan?

Auto handoff:
```json
{
  "workflow_mode": "auto",
  "current_skill": "plan",
  "next_skill": "execute",
  "requires_user": false,
  "stop_reason": null,
  "confidence": "high",
  "reason": "Implement the planned task IDs and run validation checks.",
  "inputs": {
    "primary_artifact": "Plan from this response",
    "required_context": ["P task IDs", "V validation IDs", "out-of-scope items", "ask-before items"],
    "open_questions": ["Q IDs, if any"]
  }
}
```
````

## Rules

- Be concise.
- Avoid speculative implementation detail unless useful.
- Prefer concrete file paths, commands, and checkpoints when known.
- Use stable IDs for tasks, validation checks, risks, assumptions, and open questions.
- Mark dependencies between tasks when they exist. Tasks with no dependencies can be executed in parallel.
- If acceptance criteria are missing or fuzzy, recommend using `acceptance-criteria` before execution.
- If the task is already well-defined and safe, end by asking whether to proceed with `execute`.
- Set confidence to `"medium"` if open questions or required decisions remain. Set `"high"` only when the plan is unambiguous and ready to execute.
