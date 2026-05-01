---
description: Show persisted workflow config and active workflow status
---
Use the `workflow-orchestrator` skill.

Show the workflow status for this project.

Instructions:
1. Detect the project root.
2. Read `.pi/workflow-orchestrator.json` if present.
3. Summarize default mode, auto-continue settings, active workflow, current skill, next skill, artifact log, and last update.
4. If an artifact log exists, summarize the latest workflow step.
5. Do not modify files.
