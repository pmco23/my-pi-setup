---
name: execute
description: Executes an agreed plan or well-defined implementation task. Use when the user asks to implement, apply changes, run a plan, fix code, add files, refactor, test, or complete a concrete coding task. This skill emphasizes careful edits, task-ID tracking, command output review, validation, self-review, and concise reporting.
---

# Execute

Use this skill to carry out a concrete task safely and verify the result.

## Operating Mode

- Work from the user's request or an existing plan.
- Inspect before editing.
- Make the smallest correct change.
- Prefer precise edits over broad rewrites.
- Track plan task IDs when provided: `P1`, `P2`, `P3`, ...
- Run relevant validation when feasible.
- Stop and ask before destructive, irreversible, credential-related, or high-risk actions.

## Inputs

Use any available inputs:

- Plan from `plan`
- Design spec from `brainstorm-spec`
- Acceptance criteria from `acceptance-criteria`
- Existing code, tests, docs, logs, or user constraints

## Workflow

1. Confirm the target task from the request or plan.
2. Inspect relevant files and current behavior.
3. Implement changes in small, coherent steps.
4. Run formatting, linting, tests, builds, or focused checks when available.
5. Fix issues discovered during validation when in scope.
6. Perform a self-review against the task IDs, acceptance criteria, and validation expectations.
7. Summarize changed files, completed task IDs, validation results, deviations, and reviewer focus.

## Editing Guidelines

- Preserve existing style and architecture.
- Avoid unrelated changes.
- Do not silently change public APIs, schemas, migrations, or generated files unless required.
- If multiple files need changes, keep them logically grouped.
- If validation cannot be run, explain why and provide suggested commands.

## Self-Review Checklist

Before reporting completion, check:

- Which plan task IDs are complete, partial, deferred, or not applicable?
- Which acceptance criteria are satisfied?
- Were any unplanned files or behaviors changed?
- Were all expected validation checks run?
- Are there known risks, TODOs, or follow-ups?
- What should `review-against-plan` focus on?

## Support Skills

Use support skills during implementation when useful:

- Use `find-docs` before writing library/API-specific code when behavior, syntax, configuration, or migration details are uncertain.
- Use `ast-grep` to find and update structurally similar call sites, imports, patterns, or anti-patterns.

Support skill findings should be reflected in implementation notes, deviations, validation results, and the final handoff.

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
Implemented.

Changed:
- `<path>`: <summary>

Task Status:
- P1: <complete | partial | deferred | n/a> — <evidence>
- P2: <complete | partial | deferred | n/a> — <evidence>

Validation:
- V1 / `<command>`: <passed | failed | not run> — <result or reason>

Deviations:
- <intentional or accidental deviation from plan, or "None">

Self-Review:
- Acceptance criteria: <satisfied/partial/unknown>
- Scope control: <no unrelated changes / note concerns>
- Known risks: <risk or "None known">

## Next Step
Recommended skill: `review-against-plan`
Reason: The implementation should be checked against the plan, acceptance criteria, and validation expectations.

User prompt:
- Shall I continue with `review-against-plan` to verify this implementation against the plan?

Auto handoff:
```json
{
  "workflow_mode": "auto",
  "current_skill": "execute",
  "next_skill": "review-against-plan",
  "requires_user": false,
  "stop_reason": null,
  "confidence": "high",
  "reason": "Verify implementation coverage against the plan and acceptance criteria.",
  "inputs": {
    "primary_artifact": "Implementation summary from this response",
    "required_context": ["plan reference", "changed files", "completed P task IDs", "validation results", "known deviations"],
    "open_questions": []
  }
}
```
````

## Stop Conditions

Pause and ask the user if:

- The plan is ambiguous in a way that could cause rework.
- The change requires secrets, credentials, or external account access.
- A command may delete data, rewrite history, or perform a production operation.
- Tests reveal a broader unrelated failure.
