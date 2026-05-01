---
description: Start a new orchestrated project workflow
argument-hint: "[auto|user-in-the-loop] <project idea>"
---
Use the `workflow-orchestrator` skill.

Start a new workflow for this project.

Mode: `$1`
Project idea / goal: `${@:2}`

If mode is missing, use the persisted `.pi/workflow-orchestrator.json` default mode if present; otherwise ask me which mode to use.

Instructions:
1. Detect/read project workflow config from `.pi/workflow-orchestrator.json`.
2. If config is missing, ask before creating it unless I explicitly said to initialize.
3. Begin with the appropriate starting skill, usually `brainstorm-spec` for a new idea.
4. Persist workflow state and artifact log when config enables it.
5. Use the deterministic evaluator before any auto-continue decision.
6. In user-in-the-loop mode, pause after each skill and ask before continuing.
