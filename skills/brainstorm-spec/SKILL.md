---
name: brainstorm-spec
description: Collaboratively brainstorms ideas with the user, explores options and tradeoffs, then produces a clear design specification ready for acceptance-criteria or plan to decompose into implementation tasks. Use when the user wants to shape a feature, product idea, architecture, workflow, UX, or technical approach before planning execution.
---

# Brainstorm Spec

Use this skill to help the user explore an idea and turn the discussion into a concrete design specification.

## Operating Mode

- Collaborate first; do not jump straight to implementation tasks.
- Encourage divergent thinking before converging on a design.
- Ask focused questions that uncover goals, users, constraints, risks, and success criteria.
- Offer options with tradeoffs when the direction is not obvious.
- Do not edit project files unless the user explicitly asks.
- The final artifact should be a design spec, not an execution plan.
- If `.pi/project-map/agent-guidance.md` exists, read it to ground the design in the actual project architecture, conventions, and constraints.

## Workflow

1. Clarify the problem, audience, goals, and desired outcome.
2. Brainstorm possible approaches, including unconventional options when useful.
3. Compare options by value, complexity, risk, UX, maintainability, and reversibility.
4. Help the user choose or combine directions.
5. Define the selected design in enough detail for planning.
6. Identify open questions, assumptions, constraints, and non-goals.
7. Produce a design spec that can be handed to `acceptance-criteria` or `plan`.

## Brainstorming Prompts

Use these selectively:

- What problem are we solving, and for whom?
- What would a successful version look like?
- What is explicitly out of scope?
- What constraints matter: time, budget, stack, compatibility, performance, security, UX?
- What is the simplest useful version?
- What alternatives should we consider?
- What could go wrong?
- What should be easy to change later?
- How will we know this worked?

## When to Converge

Produce the design spec when:

- The user says "let's go with that", "sounds good", "write it up", or similar.
- The user has answered the key questions and a clear direction has emerged.
- You have explored at least 2 alternatives and the user picked one.
- Remaining uncertainties can be captured as open questions rather than blocking the spec.

Do not converge if:

- The user is still asking exploratory questions.
- No clear direction has been chosen.
- Critical constraints are unknown.

## Scope Control

- If the idea grows beyond what a single spec can cover, suggest splitting into multiple specs.
- If brainstorming has gone more than 5–6 exchanges without convergence, summarize what has been discussed and ask explicitly: "Shall I write up the spec based on what we have, or do you want to explore more?"

## Support Skills

Use support skills when they improve the design spec:

- Use `find-docs` when design decisions depend on current external APIs, SDKs, frameworks, CLIs, or cloud services.
- Use `graphify` when the idea has many entities, workflows, dependencies, stakeholders, or architectural relationships.

Support skill findings should be reflected in the design spec as requirements, constraints, risks, assumptions, alternatives, or open questions.

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

When the discussion is ready to converge, produce:

````md
# Design Spec: <title>

## Summary
<short description of the chosen design>

## Problem
<problem statement and context>

## Goals
- <goal>

## Non-Goals
- <explicitly out-of-scope item>

## MVP / Simplest Useful Version
<what the first deliverable version looks like, if applicable>

## Users / Use Cases
- <user or scenario>

## Proposed Design
<the selected approach, described clearly>

## Key Decisions
- D1: <decision> — <rationale>

## Alternatives Considered
- <alternative>: <pros/cons and why it was not chosen>

## Requirements
### Functional
- FR1: <requirement>

### Non-Functional
- NFR1: <performance, reliability, security, accessibility, maintainability, etc.>

## UX / Workflow
<user flow, system flow, or interaction model if relevant>

## Data / Interfaces
<APIs, data models, inputs/outputs, integrations, or file formats if relevant>

## Risks & Mitigations
- R1: <risk> — <mitigation>

## Assumptions
- A1: <assumption>

## Open Questions
- Q1: <question>

## Next Step
Recommended skill: `acceptance-criteria` unless criteria are already clear and testable; otherwise `plan`
Reason: The design spec should become testable acceptance criteria before implementation planning.

User prompt:
- Shall I continue with `acceptance-criteria` to turn this spec into testable acceptance criteria?

Auto handoff:
Choose `next_skill` based on specificity:
- If requirements are vague or need testable criteria: `acceptance-criteria`
- If requirements are already precise and testable: `plan`

```json
{
  "workflow_mode": "auto",
  "current_skill": "brainstorm-spec",
  "next_skill": "acceptance-criteria",
  "requires_user": false,
  "stop_reason": null,
  "confidence": "high",
  "reason": "Convert the design spec into testable acceptance criteria before planning.",
  "inputs": {
    "primary_artifact": "Design spec from this response",
    "required_context": ["FR/NFR IDs", "constraints", "open questions"],
    "open_questions": ["Q IDs, if any"]
  }
}
```
````

## Rules

- Keep brainstorming conversational until the user is ready for a spec.
- Prefer concrete examples over abstract descriptions.
- Make tradeoffs explicit.
- Avoid premature task breakdown; leave decomposition to the `plan` skill.
- Use stable IDs for decisions, requirements, risks, assumptions, and questions when producing the final spec.
- If the user asks to proceed after the spec, recommend invoking or using `acceptance-criteria` next, or `plan` if the scope is already precise.
