---
description: Run workflow-orchestrator in user-in-the-loop mode
argument-hint: "<goal or task>"
---
Use the `workflow-orchestrator` skill in user-in-the-loop mode.

Goal/task: `$ARGUMENTS`

Instructions:
1. Detect/read `.pi/workflow-orchestrator.json`.
2. If config is missing, ask before creating it.
3. Use user-in-the-loop mode for this run.
4. Stop after every skill.
5. Recommend the next logical skill and ask me before continuing.
6. Persist active workflow state and artifact log when enabled.
