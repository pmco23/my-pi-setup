---
name: workflow-orchestrator
description: Orchestrates the brainstorm-spec → acceptance-criteria → plan → execute → review-against-plan → code-review workflow in either auto mode or user-in-the-loop mode. Use when the user wants pi to coordinate multiple workflow skills, choose the next logical skill, pause for approvals, or continue automatically when safe.
---

# Workflow Orchestrator

Use this skill to coordinate the end-to-end workflow across specialized skills.

## Supported Workflow

Default sequence:

```text
brainstorm-spec
→ acceptance-criteria
→ plan
→ execute
→ review-against-plan
→ code-review
```

Conditional transitions:

- `brainstorm-spec` → `acceptance-criteria`, or directly to `plan` if criteria are already clear.
- `acceptance-criteria` → `plan`.
- `plan` → `execute`.
- `execute` → `review-against-plan`.
- `review-against-plan` → `execute` if blockers need fixes.
- `review-against-plan` → `code-review` if plan coverage is acceptable and engineering quality needs review.
- `review-against-plan` → `none` if accepted and no further review is needed.
- `code-review` → `execute` if code issues need fixes.
- `code-review` → `review-against-plan` if scope coverage still needs verification.
- `code-review` → `none` if approved.

## Support Skills

Support skills can be used inside a main workflow stage, but they are not part of the deterministic transition graph.

- `find-docs`: Use when current external documentation is needed for libraries, frameworks, SDKs, CLIs, APIs, or cloud services.
- `ast-grep`: Use for structural code search, call-site discovery, refactor impact analysis, pattern verification, and anti-pattern detection.
- `graphify`: Use for complex relationship mapping, architecture/domain modeling, documentation synthesis, and large-codebase impact analysis.

Rules:

- Support skills do not change `current_skill` or `next_skill` in the main handoff.
- If a support skill discovers a blocker, uncertainty, or scope change, reflect that in the main skill handoff using `requires_user`, `stop_reason`, `confidence`, or `inputs.open_questions`.
- In auto mode, support skill usage is allowed only when it does not bypass deterministic evaluator decisions.

## Modes

### User-in-the-loop mode

Use when the user wants approval checkpoints.

Rules:

- Stop after every skill completes.
- Recommend the next logical skill.
- Ask the user for confirmation before continuing.
- Do not continue automatically, even if the handoff says it is safe.

### Auto mode

Use when the user wants the workflow to continue automatically when safe.

Rules:

- Continue to `next_skill` automatically only when all are true:
  - `next_skill` is not `none`.
  - `requires_user` is `false`.
  - `stop_reason` is `null`.
  - `inputs.open_questions` is empty.
  - `confidence` is `medium` or `high`.
  - No destructive, credential-related, production, or irreversible action is required.
- Pause and ask the user when any stop condition is present.

## Stop Conditions

Always pause for user input if:

- `requires_user` is `true`.
- `next_skill` is `none`.
- `stop_reason` is not `null`.
- There are unresolved open questions.
- Confidence is `low`.
- A skill reports blockers, failed validation, or ambiguous scope.
- The next step requires secrets, credentials, external account access, production operations, data deletion, or git history rewriting.

## Project Persistence

Persist workflow behavior at the base of each working project so the agent can resume consistently across sessions.

### Project root

Use the git root when available:

```bash
git rev-parse --show-toplevel
```

If there is no git root, use the current working directory.

### Config files

Preferred files:

```text
.pi/workflow-orchestrator.json      # stable workflow policy/config
.pi/workflows/<workflow-id>.jsonl   # per-workflow JSONL artifact/audit log
```

A template is available at `assets/workflow-orchestrator.template.json` relative to this skill directory.

Do not put secrets in these files.

### Config schema

Create or update `.pi/workflow-orchestrator.json` with this shape:

```json
{
  "version": 1,
  "default_mode": "user-in-the-loop",
  "default_sequence": [
    "brainstorm-spec",
    "acceptance-criteria",
    "plan",
    "execute",
    "review-against-plan",
    "code-review"
  ],
  "auto_continue": {
    "enabled": false,
    "allowed_skills": [
      "brainstorm-spec",
      "acceptance-criteria",
      "plan",
      "execute",
      "review-against-plan",
      "code-review"
    ],
    "stop_on_open_questions": true,
    "stop_on_low_confidence": true,
    "stop_on_failed_validation": true,
    "stop_on_blockers": true,
    "stop_before_execute": false
  },
  "handoff": {
    "require_json": true,
    "require_user_prompt": true,
    "persist_artifacts": true
  },
  "transitions": {
    "brainstorm-spec": ["acceptance-criteria", "plan"],
    "acceptance-criteria": ["plan"],
    "plan": ["execute"],
    "execute": ["review-against-plan"],
    "review-against-plan": ["execute", "code-review", "none"],
    "code-review": ["execute", "review-against-plan", "none"],
    "workflow-orchestrator": ["brainstorm-spec", "acceptance-criteria", "plan", "execute", "review-against-plan", "code-review", "none"]
  },
  "support_skills": {
    "find-docs": {
      "use_when": "External library, framework, SDK, CLI, or cloud-service behavior needs current documentation verification.",
      "allowed_in": ["brainstorm-spec", "acceptance-criteria", "plan", "execute", "review-against-plan", "code-review"]
    },
    "ast-grep": {
      "use_when": "Structural code search, call-site analysis, pattern verification, refactor discovery, or anti-pattern detection is needed.",
      "allowed_in": ["plan", "execute", "review-against-plan", "code-review"]
    },
    "graphify": {
      "use_when": "Complex relationships, architecture, domain modeling, documentation mapping, or large-codebase impact analysis is needed.",
      "allowed_in": ["brainstorm-spec", "plan", "review-against-plan", "code-review"]
    }
  },
  "active_workflow": {
    "id": null,
    "mode": null,
    "current_skill": null,
    "next_skill": null,
    "artifact_log": null,
    "updated_at": null
  }
}
```

### Persistence rules

- At workflow start, read `.pi/workflow-orchestrator.json` if it exists.
- If no config exists, ask whether to create it unless the user explicitly requested setup/init.
- If the user requests auto mode for a project, update `default_mode` and `auto_continue.enabled` only with user approval.
- After each skill, update `active_workflow` with the current skill, next skill, mode, timestamp, and artifact log path.
- If `handoff.persist_artifacts` is true, append each step's key artifact and auto handoff to `.pi/workflows/<workflow-id>.jsonl`.
- On a later session, resume from `active_workflow.next_skill` when the user asks to continue the workflow.
- If project config conflicts with the user's explicit request, the user's request wins for the current run; ask before changing persisted defaults.

## Deterministic Enforcement

Use helper scripts to enforce config instead of relying only on natural-language instructions.

### Initialize project config

When the user explicitly asks to initialize workflow config, run:

```bash
node /Users/pemcoliveira/.agents/skills/workflow-orchestrator/scripts/init-project-workflow.js <project-root> --mode user-in-the-loop
```

For auto mode initialization:

```bash
node /Users/pemcoliveira/.agents/skills/workflow-orchestrator/scripts/init-project-workflow.js <project-root> --mode auto
```

### Evaluate every handoff

Before continuing from one skill to the next, write the handoff JSON to a temp file or pipe it on stdin, then run:

```bash
node /Users/pemcoliveira/.agents/skills/workflow-orchestrator/scripts/evaluate-handoff.js <project-root> <handoff-json-file>
```

or:

```bash
printf '%s' '<handoff-json>' | node /Users/pemcoliveira/.agents/skills/workflow-orchestrator/scripts/evaluate-handoff.js <project-root> -
```

The script returns a deterministic decision:

```json
{
  "decision": "continue",
  "next_skill": "execute",
  "reason": "Auto mode allowed and no stop conditions found"
}
```

or:

```json
{
  "decision": "pause",
  "next_skill": "execute",
  "reason": "User-in-the-loop mode requires confirmation"
}
```

Rules:

- If the script returns `continue`, the orchestrator may proceed to `next_skill` in auto mode.
- If the script returns `pause`, stop and ask the user.
- If the script errors, returns invalid JSON, or reports schema/transition errors, fail closed: pause and ask the user.
- The script decision overrides model intuition.

## Handoff Schema

Every orchestrated skill should end with an auto handoff in this shape:

```json
{
  "workflow_mode": "auto | user-in-the-loop",
  "current_skill": "<skill-name>",
  "next_skill": "<skill-name | none>",
  "requires_user": false,
  "stop_reason": null,
  "confidence": "high | medium | low",
  "reason": "<why this next skill is recommended>",
  "inputs": {
    "primary_artifact": "<summary or artifact reference>",
    "required_context": ["<context item>"],
    "open_questions": []
  }
}
```

## Orchestration Workflow

1. Locate the project root and read `.pi/workflow-orchestrator.json` if present.
2. Determine requested mode:
   - If the user says "auto", use `auto`.
   - If the user says "user-in-the-loop", "manual", "ask me", or similar, use `user-in-the-loop`.
   - If unspecified, use the project config `default_mode` when present.
   - If neither user request nor config specifies a mode, ask which mode to use.
3. Initialize persistence if needed:
   - If config exists, respect it.
   - If config is missing and the user asked to initialize/setup workflow config, create it.
   - If config is missing and the user did not ask to initialize, ask before creating it.
4. Determine starting skill:
   - Resume from `active_workflow.next_skill` if the user asks to continue an existing workflow.
   - Use `brainstorm-spec` for vague ideas, product/UX/architecture exploration, or unclear design.
   - Use `acceptance-criteria` when a design exists but success criteria are fuzzy.
   - Use `plan` when a spec or acceptance criteria are ready.
   - Use `execute` when a concrete plan or implementation task is ready.
   - Use `review-against-plan` after implementation.
   - Use `code-review` for engineering-quality review.
5. Check whether the current stage should invoke a support skill based on `support_skills` config and the task context.
6. Run or recommend the starting skill.
7. Inspect the skill's handoff.
8. Persist the artifact, current skill, next skill, mode, and timestamp when config enables persistence.
9. Run `scripts/evaluate-handoff.js` against the handoff and project config.
10. Apply the script's deterministic decision.
11. Continue, pause, or finish.

## Output Format

When starting or resuming orchestration, use:

```md
# Workflow Orchestration

Mode: `<auto | user-in-the-loop>`
Project config: `<.pi/workflow-orchestrator.json | not configured>`
Workflow artifact log: `<.pi/workflows/<workflow-id>.jsonl | none>`
Current skill: `<skill-name>`
Next skill: `<skill-name | none>`

## Decision
<continue automatically | pause for user | finished>

## Reason
<why>

## User Prompt
- <question or confirmation request, if pausing>

## Auto Handoff
```json
{
  "workflow_mode": "auto",
  "current_skill": "workflow-orchestrator",
  "next_skill": "<skill-name | none>",
  "requires_user": false,
  "stop_reason": null,
  "confidence": "high",
  "reason": "<why>",
  "inputs": {
    "primary_artifact": "<artifact>",
    "required_context": ["<item>"],
    "open_questions": ["<question>"],
    "project_config": ".pi/workflow-orchestrator.json",
    "artifact_log": ".pi/workflows/<workflow-id>.jsonl"
  }
}
```
```

## Rules

- Skills recommend; the orchestrator decides whether to continue.
- The deterministic evaluator script is the source of truth for continue vs pause.
- Preserve artifacts from each step and pass them forward.
- In auto mode, do not suppress important uncertainty; pause instead.
- In user-in-the-loop mode, always ask before moving to the next skill.
- If a previous skill's handoff is malformed or missing, reconstruct it from the response, mark confidence as `low`, and run the evaluator. If evaluation fails, pause.
