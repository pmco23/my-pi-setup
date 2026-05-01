# Architecture

## Overview

```text
skills/                 → global pi skills (loaded by pi on startup)
extensions/             → global pi extension (loaded by pi on startup)
scripts/                → bash installer/backup
settings/               → reference global settings
docs/                   → design notes
deprecated/prompts/     → old prompt templates (not installed)
```

## Runtime Flow

1. User runs `scripts/install.sh` on a new machine.
2. Skills are copied to `~/.agents/skills/`.
3. Extension is copied to `~/.pi/agent/extensions/workflow-orchestrator/`.
4. Pi loads extension on startup or `/reload`.
5. Extension registers `/workflow:*` commands.
6. Pi loads skills and exposes `/skill:*` commands.
7. Extension commands send `/skill:<name>` prompts to pi agent.
8. Extension `agent_end` hook evaluates handoffs and auto-continues or pauses.

## Graph Communities (from graphify)

- **Community 0 (19 members)**: Command handlers and config — `commands.js`, `config.js`. Central hub of the extension.
- **Community 1 (14 members)**: Auto-continuation and state — `auto.js`, `state.js`. Manages workflow state transitions and post-agent evaluation.
- **Community 2 (7 members)**: Legacy CLI evaluator script — removed, graph data is stale for this community. Will be cleaned on next `/workflow:refresh`.
- **Community 3 (6 members)**: Prompt builders — `prompts.js`. Builds `/skill:<name>` prompts.
- **Community 4 (5 members)**: Evaluator module — `evaluator.js`. Deterministic continue/pause decisions.
- **Community 5 (5 members)**: Handoff parser — `handoff.js`. Extracts and validates handoff JSON from assistant markdown.
- **Community 6 (4 members)**: Audit module — `audit.js`. JSONL audit logging with secret redaction.
- **Communities 7–16**: Test files, each tightly coupled to their source module.

## Central Nodes (highest edge count)

- `commands.js` (10 edges): orchestrates all command handlers
- `handleStart` / `handleOnboard` (9 edges each): key command flows
- `getProjectRoot` / `loadConfig` (9 edges each): used everywhere
- `planAutoContinuation` (8 edges): core auto-continuation logic
- `saveConfig` (8 edges): persistence path for every write

## Dependencies

- No npm runtime dependencies.
- Pi extension types from `@mariozechner/pi-coding-agent` (loaded by pi).
- `typebox` available from pi runtime.
- `graphify` (Python, installed separately) for project onboarding.
