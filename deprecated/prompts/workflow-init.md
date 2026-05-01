---
description: Initialize workflow-orchestrator config for this project
argument-hint: "[auto|user-in-the-loop]"
---
Use the `workflow-orchestrator` skill.

Initialize project workflow config in the current project if missing.

Requested mode: `$1`

If no mode is provided, use `user-in-the-loop`.

Steps:
1. Detect the project root using git root when available, otherwise current working directory.
2. If `.pi/workflow-orchestrator.json` already exists, read it and summarize current settings; do not overwrite unless I explicitly ask.
3. If it does not exist, create it using the workflow-orchestrator init script with the requested mode.
4. Confirm the config path, mode, auto-continue setting, and workflows directory.
5. Do not start the workflow yet unless I explicitly ask.
