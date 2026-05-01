---
description: Run workflow-orchestrator in auto mode
argument-hint: "<goal or task>"
---
Use the `workflow-orchestrator` skill in auto mode.

Goal/task: `$ARGUMENTS`

Instructions:
1. Detect/read `.pi/workflow-orchestrator.json`.
2. If config is missing, ask before creating it.
3. Use auto mode for this run.
4. Continue between skills only when the deterministic evaluator returns `decision: continue`.
5. Pause on open questions, blockers, failed validation, risky/destructive actions, credentials, low confidence, malformed handoff, or invalid transition.
6. Persist active workflow state and artifact log when enabled.
