---
name: review-against-plan
description: Reviews implementation changes made by the execute skill against an agreed plan or design spec. Use after development to verify that completed work matches task IDs, acceptance criteria, and validation expectations; identify deviations; assess risks; and recommend follow-up actions before acceptance.
---

# Review Against Plan

Use this skill to compare completed changes with the original plan or design spec and produce an acceptance-oriented review.

## Operating Mode

- Review, do not implement, unless the user explicitly asks for fixes.
- Compare actual changes against the plan/spec/acceptance criteria, not just general code quality.
- Be objective and evidence-based.
- Inspect relevant files, diffs, tests, and command output when available.
- Call out both matches and gaps.
- Distinguish blockers from minor follow-ups.

## Inputs

Use any available inputs:

- Original design spec from `brainstorm-spec`
- Acceptance criteria from `acceptance-criteria`
- Task plan from `plan`
- Implementation summary and self-review from `execute`
- Git diff, changed files, tests, logs, or build output
- User acceptance criteria

If the plan/spec is missing, ask for it or reconstruct expected behavior from the conversation and mark assumptions clearly.

## Workflow

1. Identify the intended scope from the plan/spec and task IDs.
2. Inspect changed files and implementation details.
3. Map each planned item, task ID, requirement, and acceptance criterion to implementation status.
4. Review validation evidence: tests, lint, build, manual checks, or missing checks.
5. Identify deviations, regressions, incomplete work, and unplanned changes.
6. Assess risks: correctness, maintainability, security, performance, UX, compatibility.
7. Produce a concise review with acceptance recommendation and handoff.

## Review Criteria

Check for:

- Plan coverage: every planned task ID addressed or explicitly deferred.
- Acceptance coverage: every acceptance criterion satisfied or documented.
- Requirement coverage: functional and non-functional requirements satisfied.
- Scope control: no unrelated or surprising changes.
- Code quality: simple, maintainable, consistent with project style.
- Integration: APIs, data models, migrations, configs, docs, and tests align.
- Validation: relevant checks were run and passed, or gaps are documented.
- Risk: known risks are mitigated or tracked.

## Support Skills

Use support skills when they improve review evidence:

- Use `ast-grep` to verify structural completion, remaining legacy patterns, required call-site updates, or forbidden usages.
- Use `find-docs` to verify framework/API-specific correctness against current documentation.
- Use `graphify` for broad architecture, coupling, dependency, or relationship-impact review.

Support skill findings should be cited as evidence in plan coverage, deviations, validation review, issues, or risks.

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
# Review Against Plan

## Verdict
<Accepted | Accepted with follow-ups | Needs changes | Blocked>

## Summary
<brief overall assessment>

## Plan Coverage
- P1: <complete | partial | missing | changed> — <evidence>
- P2: <complete | partial | missing | changed> — <evidence>

## Acceptance Coverage
- AC1: <satisfied | partial | missing | not applicable> — <evidence>

## Deviations
- <deviation from plan/spec, whether acceptable, or "None found">

## Validation Review
- V1 / <check/test/build>: <passed | failed | not run | insufficient> — <notes>

## Issues
### Blockers
- <issue requiring fix before acceptance>

### Follow-ups
- <non-blocking improvement or deferred item>

## Risks
- <risk and impact>

## Recommendation
<accept, request fixes, run more validation, or return to plan/execute>

## Next Step
Recommended skill: `<execute | code-review | none>`
Reason: Use `execute` if blockers need fixes, `code-review` if plan coverage is acceptable but engineering quality needs review, or `none` if accepted.

User prompt:
- Shall I continue with `<execute | code-review>` based on this verdict?

Auto handoff:
```json
{
  "workflow_mode": "auto",
  "current_skill": "review-against-plan",
  "next_skill": "<execute | code-review | none>",
  "requires_user": false,
  "stop_reason": null,
  "confidence": "high",
  "reason": "<fix blockers, perform engineering review, or no further action>",
  "inputs": {
    "primary_artifact": "Review against plan from this response",
    "required_context": ["blockers", "follow-ups", "reviewer focus"],
    "open_questions": []
  }
}
```
````

## Severity Guidance

- **Blocker**: breaks stated requirements, causes failing validation, introduces high-risk regression, or prevents safe acceptance.
- **Follow-up**: useful improvement, minor gap, documentation, polish, or explicitly deferred work.
- **Deviation**: any meaningful difference from the plan, even if reasonable. Mark whether acceptable.

## Rules

- Do not approve work solely because tests pass.
- Do not fail work solely because it differs from the plan; evaluate whether the deviation is justified.
- Prefer file paths, symbols, commands, and concrete evidence.
- If evidence is insufficient, say what should be checked next.
- If fixes are needed, recommend handing the review back to `execute` with the blocker list.
- If plan coverage is good but engineering quality needs deeper inspection, recommend `code-review`.
