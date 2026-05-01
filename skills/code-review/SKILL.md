---
name: code-review
description: Performs an engineering-quality review of code changes independent of plan coverage. Use after execute or review-against-plan to inspect maintainability, correctness, security, performance, error handling, tests, architecture, and project conventions before merging or accepting changes.
---

# Code Review

Use this skill to review implementation quality, regardless of whether the changes match the original plan.

## Operating Mode

- Review, do not implement, unless the user explicitly asks for fixes.
- If `.pi/project-map/agent-guidance.md` exists, read it to understand project conventions, style patterns, risky areas, and protected files.
- Be evidence-based and specific.
- Inspect changed files, diffs, tests, and relevant surrounding code.
- Prioritize issues by impact.
- Avoid nitpicks unless they affect clarity, consistency, or maintainability.

## Inputs

Use any available inputs:

- Git diff or changed files
- Implementation summary from `execute`
- Review results from `review-against-plan`
- Tests, build logs, lint output, runtime logs, or docs
- Project conventions and surrounding code

## Workflow

1. Identify changed files and intended behavior.
2. Inspect implementation and surrounding context.
3. Check correctness, edge cases, error handling, and integration boundaries.
4. Check maintainability, readability, architecture, and consistency with project style.
5. Check tests and validation coverage.
6. Check security, privacy, accessibility, performance, and compatibility where relevant.
7. Run validation commands independently when safe and non-destructive.
8. Produce prioritized findings and an acceptance recommendation.

## Review Criteria

Check for:

- Correctness: logic matches intended behavior and handles edge cases.
- Maintainability: simple, cohesive, readable, and idiomatic code.
- Architecture: appropriate boundaries, low coupling, no unnecessary abstractions.
- Tests: meaningful coverage for important paths and regressions.
- Error handling: failures are handled, surfaced, or logged appropriately.
- Security/privacy: input validation, authz/authn, secrets, injection, data exposure.
- Performance: avoids unnecessary expensive work or regressions.
- Accessibility/UX: user-facing changes remain usable and clear.
- Compatibility: APIs, schemas, migrations, configs, and public contracts are safe.

## Support Skills

Use support skills when they improve engineering review quality:

- Use `ast-grep` for structural anti-pattern checks, unsafe API usage, repeated code patterns, missing call-site updates, or deprecated imports.
- Use `find-docs` for framework/API-specific correctness, security recommendations, configuration behavior, or migration guidance.
- Use `graphify` for architecture-level review, dependency/coupling analysis, domain relationship analysis, or large-codebase impact review.

Support skill findings should be cited as concrete evidence in findings, validation assessment, risks, and recommendations.

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
# Code Review

## Verdict
<Approved | Approved with comments | Needs changes | Blocked>

## Summary
<brief overall assessment>

## Findings
### Blockers
- `<path>`: <issue, evidence, impact, suggested fix>

### Important
- `<path>`: <issue, evidence, impact, suggested fix>

### Minor
- `<path>`: <issue or polish item>

## Validation Assessment
- <test/build/lint/manual check>: <passed | failed | not run | insufficient> — <notes>

## Positive Notes
- <good implementation choice worth preserving>

## Recommendation
<accept, fix blockers, add tests, run additional checks, or return to execute>

## Next Step
Recommended skill: `<execute | review-against-plan | none>`
Reason: Use `execute` if code issues need fixes, `review-against-plan` if scope coverage still needs verification, or `none` if approved.

User prompt:
- Shall I continue with `<execute | review-against-plan>` based on this review?

Auto handoff:
```json
{
  "workflow_mode": "auto",
  "current_skill": "code-review",
  "next_skill": "<execute | review-against-plan | none>",
  "requires_user": false,
  "stop_reason": null,
  "confidence": "high",
  "reason": "<fix code review findings, verify scope coverage, or no further action>",
  "inputs": {
    "primary_artifact": "Code review from this response",
    "required_context": ["blockers", "important findings", "suggested validation"],
    "open_questions": []
  }
}
```
````

## Severity Guidance

- **Blocker**: must fix before accepting; likely bug, regression, security issue, data loss risk, broken contract, or failing validation.
- **Important**: should fix soon; maintainability, missing tests, edge cases, or moderate risk.
- **Minor**: polish, clarity, style consistency, or low-risk cleanup.

## Rules

- Prefer concrete evidence: file paths, function names, commands, failing cases.
- Do not duplicate `review-against-plan`; focus on code quality and engineering risk.
- If the change does not match the plan, mention it briefly and recommend `review-against-plan` for full scope analysis.
- If fixes are needed, recommend handing findings to `execute`.

## Handoff Confidence and Signals

Set handoff confidence:

- `"high"`: verdict is clear (Approved or obvious blockers).
- `"medium"`: some findings need discussion or evidence is incomplete.
- `"low"`: cannot assess quality without more context.

Include `signals` in the auto handoff JSON when relevant:

- `"blockers": true` — if verdict is "Needs changes" or "Blocked".
- `"failed_validation": true` — if any validation command failed during review.

## Self-Check Before Handoff

Verify:

- Every blocker has a concrete file path, evidence, and suggested fix or direction.
- Positive notes section is not empty — acknowledge at least one good choice.
- Findings are not duplicating `review-against-plan` scope (plan coverage, AC mapping).
- If no issues found, explicitly state what was checked.
