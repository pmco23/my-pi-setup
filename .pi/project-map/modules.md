# Modules

## Extension Modules

All under `extensions/workflow-orchestrator/src/`:

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `config.js` | Project config defaults, init/load/save, upgrade, project root detection | `defaultConfig`, `initConfig`, `upgradeConfig`, `upgradeProjectConfig`, `loadConfig`, `saveConfig`, `getProjectRoot` |
| `evaluator.js` | Deterministic handoff decision: continue / pause / complete | `evaluateHandoff`, `resolveMode`, `validateConfig`, `validateHandoff` |
| `handoff.js` | Extract and parse handoff JSON from assistant markdown | `extractLatestHandoff`, `looksLikeHandoff`, `extractJsonBlocks` |
| `state.js` | Active workflow state transitions | `startWorkflow`, `updateActiveWorkflow`, `pauseWorkflow`, `resumeWorkflow`, `clearWorkflow` |
| `audit.js` | JSONL audit logging with secret redaction (`token(?!s)` pattern) | `appendAuditEntry`, `readAuditEntries`, `sanitize` |
| `prompts.js` | Build `/skill:<name>` prompts and inject runtime workflow reminders | `workflowReminder`, `buildSkillPrompt`, `buildStartPrompt`, `buildOnboardPrompt`, `buildRefreshPrompt`, `buildContinuePrompt` |
| `commands.js` | Dependency-injected command handlers + `projectMapStaleness` + `syncModeToConfig` | `handleInit`, `handleUpgradeConfig`, `handleStart`, `handleOnboard`, `handleRefresh`, `handleContext`, `handleContinue`, `handleStatus`, `handlePause`, `handleResume`, `handlePiSetup`, `projectMapStaleness`, `syncModeToConfig` |
| `auto.js` | Post-agent handoff evaluation and continuation planning | `planAutoContinuation`, `latestAssistantMarkdown`, `messageText`, `hasActiveWorkflow` |
| `setup.js` | Deterministic pi settings/theme setup; `readJsonIfPresent` is try/catch safe | `applyPiSetup`, `selectedSettings`, `mergeSettings`, theme/option constants |

## Extension Entrypoint

`extensions/workflow-orchestrator/index.ts`:

- Busts local CommonJS require-cache on `/reload`.
- Registers `/my-pi:setup` and 12 `/workflow:*` commands.
- Tracks `pendingWorkflowSkillResponse` flag for auto-continuation.
- Tracks `projectMapRefreshMarkers` per project root.
- Warns when `.pi/project-map/*.md` edited without refresh marker.
- Uses `projectMapStaleness()` on `git push` to detect stale context.
- Handles `agent_end` → continue / complete / pause.

## Assets

- `assets/onyx-theme.json`: canonical `onyx` theme; installer copies globally to `~/.pi/agent/themes/onyx.json`.
- `assets/pre-push-hook.sh`: stale-context pre-push hook, installed by `/workflow:init` when no existing hook present.

## Owned Workflow Skills

| Skill | Purpose |
|-------|---------|
| `project-intake` | Graphify-first codebase onboarding/refresh |
| `brainstorm-spec` | Idea exploration → design spec |
| `implementation-research` | Current implementation research, examples, Context7/web-backed tradeoffs |
| `acceptance-criteria` | Design/research → testable criteria |
| `plan` | Criteria/request → ordered implementation tasks |
| `execute` | Plan/task → implementation with validation and self-review |
| `review-against-plan` | Implementation → plan/criteria coverage review |
| `code-review` | Implementation → engineering quality review |

## Support Skills (bundled)

| Skill | Purpose | Sync |
|-------|---------|------|
| `find-docs` | Current docs/API verification via Context7 CLI | Manual |
| `ast-grep` | Structural code search via ast-grep CLI | Manual |
| `graphify` | Knowledge graph generation via graphify Python tool | Auto-synced by `install.sh` via `.graphify_version` |

## Graph Communities (AST-backed)

| Community | Area |
|-----------|------|
| C0 | Auto-continuation and workflow state (`auto.js`, `state.js`) |
| C1 | Context/status/refresh/upgrade command handlers |
| C2 | Start/onboard/config persistence handlers |
| C3 | Prompt builders and workflow reminders (`prompts.js`) |
| C4 | Setup wizard and settings/theme helpers (`setup.js`) |
| C5 | Evaluator validation and decision logic (`evaluator.js`) |
| C6 | Handoff parsing (`handoff.js`) |
| C7 | Audit logging and redaction (`audit.js`) |
