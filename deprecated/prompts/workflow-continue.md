---
description: Continue the active persisted workflow
argument-hint: "[auto|user-in-the-loop]"
---
Use the `workflow-orchestrator` skill.

Continue the active workflow for this project.

Requested mode override: `$1`

Instructions:
1. Detect/read `.pi/workflow-orchestrator.json`.
2. Read `active_workflow` and resume from `active_workflow.next_skill`.
3. If no active workflow exists, ask whether to start a new workflow.
4. If I provided a mode override, use it for this run only unless I ask to persist it.
5. Use the deterministic evaluator before any auto-continue decision.
6. Persist updated active workflow state and append to the artifact log when enabled.
