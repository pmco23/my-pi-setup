---
name: execute
description: Executes an agreed plan or well-defined implementation task. Use when the user asks to implement, apply changes, run a plan, fix code, add files, refactor, test, or complete a concrete coding task. This skill emphasizes careful edits, task-ID tracking, command output review, validation, self-review, and concise reporting.
---

# Execute

Carry out a concrete implementation task safely and verify the result.

## Operating Mode

- Work from a plan, task IDs, acceptance criteria, or a clear user request.
- Inspect before editing.
- If `.pi/project-map/agent-guidance.md` exists, read it for validation commands, conventions, risks, and do-not-touch items.
- Make the smallest correct change.
- Preserve existing style and architecture.
- Track plan task IDs (`P1`, `P2`, ...) when provided.
- Run relevant validation when feasible.
- Stop before destructive, credential-related, production, or high-risk operations.

When used standalone, complete this skill normally without assuming workflow state; treat `## Next Step` as a manual recommendation for the user.

## Workflow

1. Confirm the target task and constraints.
2. Inspect relevant files/current behavior.
3. Implement changes in small, coherent steps.
4. Run formatting, linting, tests, builds, or focused checks.
5. Fix validation issues that are in scope.
6. Self-review against the request/plan/criteria.
7. Summarize changed files, task status, validation, deviations, and risks.

## Support Skills

- Use `find-docs` before writing uncertain library/API-specific code.
- Use `ast-grep` to find structurally similar call sites, imports, patterns, or anti-patterns.

## Stop Conditions

Pause and ask if:

- The task is ambiguous enough to cause rework.
- Secrets, credentials, or external account access are required.
- A command may delete data, rewrite history, or affect production.
- Tests reveal broader unrelated failures.
- A dependency task is blocked.
- An implementation attempt makes things worse.

## Output Format

```md
Implemented.

Changed:
- <path>: <summary>

Task Status:
- P1: <complete | partial | deferred | n/a> — <evidence>

Validation:
- <command>: <passed | failed | not run> — <result or reason>

Deviations:
- <none or details>

Self-Review:
- Acceptance criteria: <satisfied/partial/unknown>
- Scope control: <summary>
- Known risks: <none/details>

## Next Step
```

## Next Skill Guidance

Recommend `review-against-plan` after implementation. If no plan/criteria exist and the task was tiny, recommend `code-review` or `none` as appropriate.

End with `## Next Step`: recommended skill, reason, user prompt, and compact auto handoff JSON when used in a workflow.
