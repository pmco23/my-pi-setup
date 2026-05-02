---
name: review-against-plan
description: Reviews implementation changes made by the execute skill against an agreed plan or design spec. Use after development to verify that completed work matches task IDs, acceptance criteria, and validation expectations; identify deviations; assess risks; and recommend follow-up actions before acceptance.
---

# Review Against Plan

Verify implementation against the agreed plan, acceptance criteria, and validation expectations.

## Operating Mode

- Review, do not implement fixes unless explicitly asked.
- Compare changed files/results against plan task IDs and acceptance criteria.
- Inspect diffs, relevant files, and validation output.
- Identify omissions, deviations, regressions, and unvalidated assumptions.
- If `.pi/project-map/agent-guidance.md` exists, read it for project conventions and validation expectations.

When used standalone, complete this skill normally without assuming workflow state; treat `## Next Step` as a manual recommendation for the user.

## Inputs

Use any available input:

- Plan with task IDs
- Acceptance criteria or design spec
- Execute summary
- Git diff / changed files
- Test/build/lint output

If plan or criteria are missing, state the limitation and review against the user request and visible changes.

## Workflow

If `Previous artifact:` is provided in the prompt, read that file with the read tool before starting. It contains the full output of the previous skill.

1. Identify intended scope and expected task/criteria coverage.
2. Inspect changed files and relevant context.
3. Map implementation to tasks/criteria.
4. Check validation evidence.
5. Identify deviations, gaps, risks, and follow-ups.
6. Recommend whether to accept, revise, or run more validation.

## Review Criteria

- Plan/task coverage
- Acceptance criteria coverage
- Correctness and regression risk
- Validation completeness
- Scope control
- Architecture/convention alignment
- Security, data, and operational risk

## Output Format

```md
# Review Against Plan

## Verdict
<accept | accept-with-follow-ups | changes-requested | blocked>

## Summary
## Plan Coverage
## Acceptance Criteria Coverage
## Findings
- F1: <severity> — <finding>
## Validation Assessment
## Deviations
## Risks
## Recommended Follow-ups
## Next Step
```

## Artifact

When in a workflow (Artifact dir provided in prompt), save your Review Report output to:
`<artifact_dir>/<step padded to 2 digits>-review-against-plan.md`

Write the artifact BEFORE the `## Next Step` section. Include the path in the handoff `artifact` field.

## Next Skill Guidance

Recommend:

- `execute` when fixes or missing work are needed.
- `code-review` when implementation matches the plan and needs broader engineering review.
- `none` when the work is accepted and no further review is needed.

End with `## Next Step`: recommended skill, reason, user prompt, and compact auto handoff JSON:

Auto handoff:
```json
{
  "workflow_mode": "<mode from prompt>",
  "current_skill": "review-against-plan",
  "next_skill": "<recommended>",
  "confidence": "high|medium|low",
  "stop_reason": null,
  "open_questions": [],
  "artifact": ""
}
```
