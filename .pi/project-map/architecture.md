# Architecture

## Overview

```text
extensions/workflow-orchestrator/   Pi extension (commands, evaluator, auto-continuation)
skills/                             Pi skills (project-intake, brainstorm-spec, plan, etc.)
scripts/                            Bash installer/uninstaller/backup
settings/                           Reference global settings
docs/                               Design notes
deprecated/prompts/                 Old prompt templates (not installed)
.pi/project-map/                    Durable project context (committed)
```

## Runtime Flow

1. User runs `scripts/install.sh` on a new machine.
2. Skills are copied to `~/.agents/skills/` (with `--delete`).
3. Extension is copied to `~/.pi/agent/extensions/workflow-orchestrator/` (with `--delete`).
4. Pi loads extension on startup or `/reload`.
5. Extension registers `/workflow:*` commands.
6. Pi loads skills and exposes `/skill:*` commands.
7. Extension commands send `/skill:<name>` prompts to pi agent.
8. Extension sets `pendingWorkflowSkillResponse` flag before sending.
9. On `agent_end`:
   - If flag is set and no handoff found: pause (skill failed).
   - If flag is not set and no handoff found: skip silently (side conversation).
   - If valid handoff found (with or without flag): evaluate deterministically.
   - If evaluator says continue: re-set flag, send next `/skill:<name>` as follow-up.
   - If evaluator says pause: notify user, update config.

## Graph Communities (refreshed)

- **Community 0 (14 members)**: Auto-continuation and state — `auto.js`, `state.js`. Manages workflow state transitions and post-agent evaluation.
- **Community 1 (13 members)**: Command handlers — `commands.js`. Central hub orchestrating all workflow commands.
- **Community 2 (12 members)**: Audit + prompts — `audit.js`, `prompts.js`. Audit logging and skill prompt building.
- **Community 3 (10 members)**: Config + test fixtures — `config.js`, `test/auto.test.js`. Config generation and test helpers.
- **Community 4 (5 members)**: Evaluator — `evaluator.js`. Deterministic continue/pause decisions.
- **Community 5 (5 members)**: Handoff parser — `handoff.js`. Extract and validate handoff JSON.
- **Communities 6–13**: Test files, each coupled to their source module.

## Central Nodes (highest edge count)

- `commands.js` (11 edges): orchestrates all command handlers
- `getProjectRoot` / `loadConfig` (10 edges each): used everywhere
- `handleStart` / `handleOnboard` (9 edges each): key command flows
- `planAutoContinuation` (8 edges): core auto-continuation logic
- `saveConfig` / `state.js` (8 edges each): persistence path

## Dependencies

- No npm runtime dependencies.
- Pi extension types from `@mariozechner/pi-coding-agent` (provided by pi runtime via jiti).
- `graphify` (Python, installed separately) for project onboarding.
- `ctx7` (npm global) for `find-docs` skill.
- `ast-grep` (CLI) for `ast-grep` skill.
