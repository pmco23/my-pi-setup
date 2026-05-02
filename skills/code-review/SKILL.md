---
name: code-review
description: Performs an engineering-quality review of code changes independent of plan coverage. Use after execute or review-against-plan to inspect maintainability, correctness, security, performance, error handling, tests, architecture, and project conventions before merging or accepting changes.
---

# Code Review

Review code changes for engineering quality, independent of whether they matched a plan.

## Operating Mode

- Review only; do not edit unless explicitly asked.
- Inspect diffs and relevant surrounding code.
- Prioritize correctness, maintainability, security, performance, error handling, tests, and architecture.
- Avoid nitpicks unless they affect clarity or conventions.
- If `.pi/project-map/agent-guidance.md` exists, read it for conventions, risky areas, and validation commands.

When used standalone, complete this skill normally without assuming workflow state; treat `## Next Step` as a manual recommendation for the user.

## Inputs

Use any available input:

- Git diff / changed files
- Execute or review-against-plan summary
- Relevant tests/build output
- Project map guidance
- User-specified review focus

## Workflow

1. Determine changed files and review scope.
2. Inspect relevant code paths and tests.
3. Evaluate risks and quality criteria.
4. Separate blocking issues from non-blocking suggestions.
5. Recommend accept, accept with follow-ups, or changes requested.

## Review Criteria

- Correctness and edge cases
- Security/privacy/data handling
- Error handling and resilience
- Performance and scalability
- Test coverage and validation
- API/schema compatibility
- Architecture and maintainability
- Project conventions and readability

## Output Format

```md
# Code Review

## Verdict
<accept | accept-with-follow-ups | changes-requested | blocked>

## Summary
## Findings
- F1: <severity> — <finding, evidence, suggested fix>
## Validation Assessment
## Security / Risk Notes
## Suggested Follow-ups
## Next Step
```

Use severities: `critical`, `major`, `minor`, `suggestion`.

## Next Skill Guidance

Recommend:

- `execute` when fixes are needed.
- `review-against-plan` when plan/criteria coverage still needs verification.
- `none` when changes are acceptable.

End with `## Next Step`: recommended skill, reason, user prompt, and compact auto handoff JSON when used in a workflow.
