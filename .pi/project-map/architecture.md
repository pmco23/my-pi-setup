# Architecture

## Overview

```text
extensions/workflow-orchestrator/   Pi extension (commands, evaluator, auto-continuation, setup)
skills/                             Workflow and support skills installed to ~/.agents/skills/
scripts/                            Bash installer/uninstaller/backup
settings/                           Reference global settings (not used by pi directly)
.pi/project-map/                    Durable project context (committed)
docs/                               Design notes
```

## Runtime Flow

1. `./scripts/install.sh` — auto-syncs graphify skill, copies skills + extension globally, copies `onyx` theme.
2. Pi loads extension on startup or `/reload` — module cache is busted so `src/*.js` changes take effect.
3. Extension registers `/my-pi:setup` and 12 `/workflow:*` commands.
4. `createWorkflowEnv` wraps command env, sets `pendingWorkflowSkillResponse` before sending skill prompts.
5. On `agent_end`: extract latest handoff JSON → evaluate → continue / complete / pause → notify / queue follow-up.
6. On `tool_call`: detect `git push` (stale warning) and direct `.pi/project-map/*.md` edits without refresh marker (edit guard warning).

## Workflow Sequence

```text
brainstorm-spec
→ implementation-research
→ acceptance-criteria
→ plan → execute → review-against-plan → code-review → none
```

`project-intake` is separate (onboarding/refresh), hands off to `plan` or `none`.

## Key Design Decisions

- **Thin entrypoint**: `index.ts` only wires commands and events; no business logic.
- **Pure modules**: `config`, `evaluator`, `handoff`, `state`, `audit`, `prompts`, `setup`, `auto` have no pi-runtime dependency.
- **Dependency injection**: command handlers receive `env` objects — enables full testing without pi.
- **Fail-closed**: missing/invalid handoffs from workflow skill responses always pause, never silently continue.
- **Runtime reminder injection**: `workflowReminder()` in `prompts.js` injects current skill, allowed next skills, and handoff requirements into every workflow-dispatched skill prompt.
- **Completion semantics**: `next_skill: "none"` → `decision: "complete"` → `action: "complete"` → `clearWorkflow()`. Distinct from pause.
- **Config upgrade**: explicit via `/workflow:upgrade-config`; existing project configs never auto-migrate.

## Graph Insights (AST-backed, refreshed)

98 nodes · 162 edges · 8 communities.

**God nodes** (highest coupling):
- `getProjectRoot()` — 12 edges
- `loadConfig()` — 11 edges
- `handleStart()` / `handleOnboard()` — 9 edges each
- `saveConfig()` — 9 edges
- `planAutoContinuation()` — 8 edges, cross-community bridge connecting auto/state (C0), prompts (C3), evaluator (C5), and handoff (C6)
- `buildSkillPrompt()` — 7 edges

**Community map**:

| Community | Key nodes |
|---|---|
| C0 | `planAutoContinuation`, `startWorkflow`, `pauseWorkflow`, `clearWorkflow` |
| C1 | `handleContext`, `handleRefresh`, `handleUpgradeConfig`, `projectMapStaleness` |
| C2 | `handleOnboard`, `loadConfig`, `saveConfig`, `defaultConfig` |
| C3 | `buildSkillPrompt`, `workflowReminder`, `buildStartPrompt` |
| C4 | `handlePiSetup`, `applyPiSetup`, `readJsonIfPresent` |
| C5 | `evaluateHandoff`, `validateConfig`, `validateHandoff` |
| C6 | `extractLatestHandoff`, `extractJsonBlocks` |
| C7 | `appendAuditEntry`, `sanitize` |

AST-backed only — pi lacks subagent tool for semantic extraction. For a full semantic graph run graphify from Claude Code or Codex and commit updated graph artifacts.

## Dependencies

- No npm runtime dependencies.
- Pi extension types from `@mariozechner/pi-coding-agent` at runtime.
- `ctx7` CLI used by the `find-docs` skill.
- `ast-grep` CLI used by the `ast-grep` skill.
- `graphify` Python tool (graphifyy package) used by the `graphify`/`project-intake` flow.
