# Modules

## Extension Modules

All under `extensions/workflow-orchestrator/src/`:

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `config.js` | Project config defaults, init/load/save, upgrade, project root detection | `defaultConfig`, `initConfig`, `upgradeConfig`, `upgradeProjectConfig`, `loadConfig`, `saveConfig`, `getProjectRoot` |
| `evaluator.js` | Deterministic handoff decision model | `evaluateHandoff`, `resolveMode`, `validateConfig`, `validateHandoff` |
| `handoff.js` | Extract/parse handoff JSON from assistant markdown | `extractLatestHandoff`, `looksLikeHandoff`, `extractJsonBlocks` |
| `state.js` | Active workflow state transitions | `startWorkflow`, `updateActiveWorkflow`, `pauseWorkflow`, `resumeWorkflow`, `clearWorkflow` |
| `audit.js` | JSONL audit logging with secret redaction | `appendAuditEntry`, `readAuditEntries`, `sanitize` |
| `prompts.js` | Build `/skill:<name>` prompts and runtime workflow reminders | `workflowReminder`, `buildSkillPrompt`, `buildStartPrompt`, `buildOnboardPrompt`, `buildRefreshPrompt`, `buildContinuePrompt` |
| `commands.js` | Dependency-injected command handlers | `handleInit`, `handleUpgradeConfig`, `handleStart`, `handleOnboard`, `handleRefresh`, `handleContext`, `handleContinue`, `handleStatus`, `handlePause`, `handleResume`, `handlePiSetup` |
| `auto.js` | Post-agent handoff evaluation and continuation planning | `planAutoContinuation`, `latestAssistantMarkdown`, `messageText`, `hasActiveWorkflow` |
| `setup.js` | Deterministic pi settings/theme setup | `applyPiSetup`, `selectedSettings`, `mergeSettings`, theme/option constants |

## Extension Entrypoint

`extensions/workflow-orchestrator/index.ts`:

- Busts local CommonJS module cache on `/reload`.
- Registers `/my-pi:setup`.
- Registers workflow commands: init, upgrade-config, status, start, auto, manual, onboard, refresh, context, continue, pause, resume.
- Warns on `git push` if project-map context may be stale.
- Warns when `.pi/project-map/*.md` is edited without a graphify-backed refresh marker.
- Handles `agent_end` auto-continuation/pause/complete notifications.
- Keeps business logic in `src/*.js`.

## Assets

- `assets/onyx-theme.json`: canonical `onyx` theme source; installer copies it globally to `~/.pi/agent/themes/onyx.json`.
- `assets/pre-push-hook.sh`: copied into `.git/hooks/pre-push` by `/workflow:init` when no pre-existing hook exists.

## Owned Workflow Skills

| Skill | Purpose |
|-------|---------|
| `project-intake` | Graphify-first codebase onboarding/refresh |
| `brainstorm-spec` | Idea exploration and design spec |
| `implementation-research` | Current implementation research, examples, prior art, Context7/web-backed tradeoffs |
| `acceptance-criteria` | Design/research → testable criteria and definition of done |
| `plan` | Criteria/request → ordered implementation tasks and validation plan |
| `execute` | Plan/task → implementation with validation and self-review |
| `review-against-plan` | Implementation → plan/criteria coverage review |
| `code-review` | Implementation → engineering quality review |

## Support Skills

| Skill | Purpose |
|-------|---------|
| `find-docs` | Current docs/API verification via Context7 CLI |
| `ast-grep` | Structural code search via ast-grep CLI |
| `graphify` | Knowledge graph generation via graphify Python tool |

## Graph Communities

Latest graph refresh identifies these implementation communities:

| Community | Area |
|-----------|------|
| 0 | Auto-continuation and workflow state (`auto.js`, `state.js`) |
| 1 | Context/status/refresh/upgrade command handlers (`commands.js`) |
| 2 | Start/onboard/config persistence (`commands.js`, `config.js`) |
| 3 | Prompt builders and workflow reminders (`prompts.js`) |
| 4 | Setup wizard and settings/theme helpers (`setup.js`) |
| 5 | Evaluator validation and decision logic (`evaluator.js`) |
| 6 | Handoff parsing (`handoff.js`) |
| 7 | Audit logging and redaction (`audit.js`) |

## Tests

All tests live under `extensions/workflow-orchestrator/test/` and run with Node's built-in test runner. Current coverage includes module unit tests, command handler tests, setup tests, skill/config validation, and full workflow smoke chain.
