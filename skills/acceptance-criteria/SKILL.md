---
name: acceptance-criteria
description: Converts a design spec, feature idea, bug report, or user request into clear, testable acceptance criteria and definition of done. Use after brainstorm-spec and before plan when requirements need to be made measurable, edge cases identified, or success criteria clarified.
---

# Acceptance Criteria

Use this skill to make fuzzy requirements testable before implementation planning.

## Operating Mode

- Clarify what must be true for the work to be accepted.
- Prefer observable outcomes over implementation details.
- Ask focused questions only when ambiguity would materially affect acceptance.
- Do not create an implementation plan; leave task decomposition to `plan`.
- Do not edit files unless the user explicitly asks.
- If `.pi/project-map/agent-guidance.md` exists, read it to understand project validation commands, test patterns, and conventions when defining validation methods.

## Inputs

Use any available inputs:

- Design spec from `brainstorm-spec`
- User stories, product notes, bug reports, screenshots, logs, or examples
- Existing tests, docs, or behavior if relevant

## Workflow

1. Identify the feature, user, problem, and intended outcome.
2. Extract functional and non-functional requirements.
3. Convert requirements into acceptance criteria with stable IDs: `AC1`, `AC2`, `AC3`, ...
4. Include edge cases, error states, permissions, accessibility, performance, compatibility, and security criteria when relevant.
5. Include negative criteria when relevant: "Must NOT expose user data in logs", "Must NOT break existing API consumers."
6. Define validation methods for each criterion: automated test, manual check, demo, log inspection, etc.
7. Group and prioritize criteria when there are more than 5.
8. Identify non-goals, assumptions, and open questions.
9. Run self-check.
10. Produce a handoff for `plan`.

## Grouping and Priority

When producing more than 5 criteria:

- Group related criteria under headings (e.g., "Authentication", "Error Handling", "Performance").
- Mark each criterion with priority: must-have (MVP), should-have, or nice-to-have.
- This helps `plan` decompose efficiently and scope MVP work.

## Criteria Quality Bar

Each acceptance criterion should be:

- Testable: someone can verify pass/fail.
- Specific: avoids vague terms like "fast" unless quantified.
- User- or system-observable: describes behavior or outcome.
- Scoped: clear about what is included and excluded.
- Traceable: maps back to a requirement, goal, or use case when possible.

## Support Skills

Use support skills when they make acceptance criteria more accurate:

- Use `find-docs` when acceptance depends on documented framework/API behavior, platform limits, accessibility requirements, security guidance, or CLI/service semantics.
- Use `ast-grep` when acceptance depends on understanding current code behavior, existing patterns, or call sites that must be preserved.

Support skill findings should become testable acceptance criteria, edge cases, assumptions, or open questions.

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
# Acceptance Criteria: <title>

## Scope
<short summary of what is being accepted>

## Assumptions
- A1: <assumption>

## Non-Goals
- <out-of-scope behavior>

## Acceptance Criteria
- AC1: Given <context>, when <action>, then <observable result>.
  - Validated by: <automated/manual check>
  - Source: <FR/use case/spec section, if known>
- AC2: <criterion>
  - Validated by: <check>

## Edge Cases
- E1: <edge case and expected outcome>

## Definition of Done
- <required condition before the work is considered complete>

## Open Questions
- Q1: <question, only if needed>

## Next Step
Recommended skill: `plan`
Reason: The acceptance criteria are ready to be decomposed into implementation tasks and validation checks.

User prompt:
- Shall I continue with `plan` to decompose these acceptance criteria into task IDs?

Auto handoff:
```json
{
  "workflow_mode": "auto",
  "current_skill": "acceptance-criteria",
  "next_skill": "plan",
  "requires_user": false,
  "stop_reason": null,
  "confidence": "high",
  "reason": "Decompose acceptance criteria into ordered implementation tasks.",
  "inputs": {
    "primary_artifact": "Acceptance criteria from this response",
    "required_context": ["AC IDs", "edge cases", "definition of done"],
    "open_questions": ["Q IDs, if any"]
  }
}
```
````

## Rules

- Do not over-specify internal implementation unless it is itself a requirement.
- If criteria are not testable, rewrite them until they are.
- If the user says "good enough" or "MVP," explicitly separate MVP criteria from later enhancements.
- Recommend using `plan` next once criteria are stable.
- Set confidence to `"medium"` in the handoff if open questions remain. Set `"high"` only if all criteria are unambiguous and no questions are outstanding.

## Self-Check Before Handoff

Verify:

- Every AC is testable (someone could write a pass/fail check for it).
- No AC uses vague terms without quantification ("fast", "secure", "user-friendly").
- Edge cases cover at least: empty input, invalid input, unauthorized access, concurrent access (when relevant).
- Definition of Done includes at least one validation command or test expectation.
- AC IDs are stable and sequential.
- Negative criteria are included where regressions, data loss, or security violations are possible.
