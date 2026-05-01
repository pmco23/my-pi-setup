# Modules

## Extension Modules

All under `extensions/workflow-orchestrator/src/`:

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `config.js` | Project config init/load/save, project root detection | `defaultConfig`, `initConfig`, `loadConfig`, `saveConfig`, `getProjectRoot` |
| `evaluator.js` | Deterministic continue/pause decision | `evaluateHandoff`, `resolveMode`, `validateConfig`, `validateHandoff` |
| `handoff.js` | Extract/parse handoff JSON from assistant markdown | `extractLatestHandoff`, `looksLikeHandoff`, `extractJsonBlocks` |
| `state.js` | Active workflow state transitions | `startWorkflow`, `updateActiveWorkflow`, `pauseWorkflow`, `resumeWorkflow`, `clearWorkflow` |
| `audit.js` | JSONL audit logging with secret redaction | `appendAuditEntry`, `readAuditEntries`, `sanitize` |
| `prompts.js` | Build `/skill:<name>` prompt strings | `buildSkillPrompt`, `buildStartPrompt`, `buildOnboardPrompt`, `buildRefreshPrompt`, `buildContinuePrompt` |
| `commands.js` | Command handler functions (dependency-injected) | `handleInit`, `handleStart`, `handleOnboard`, `handleRefresh`, `handleContext`, `handleContinue`, `handleStatus`, `handlePause`, `handleResume` |
| `auto.js` | Post-agent handoff evaluation and continuation planning | `planAutoContinuation`, `latestAssistantMarkdown`, `messageText`, `hasActiveWorkflow` |

## Extension Entrypoint

`extensions/workflow-orchestrator/index.ts`:

- Registers 11 commands
- Manages `pendingWorkflowSkillResponse` flag
- Listens to `agent_end` for auto-continuation
- Contains no business logic

## Skills (owned)

| Skill | Purpose |
|-------|---------|
| `project-intake` | Graphify-first codebase onboarding |
| `brainstorm-spec` | Collaborative idea exploration → design spec |
| `acceptance-criteria` | Design spec → testable acceptance criteria |
| `plan` | Acceptance criteria → ordered task plan with dependencies |
| `execute` | Task plan → implementation with self-review |
| `review-against-plan` | Implementation → plan coverage and acceptance review |
| `code-review` | Implementation → engineering quality review |

## Skills (third-party, bundled)

| Skill | Purpose |
|-------|---------|
| `find-docs` | External docs/API verification via Context7 CLI |
| `ast-grep` | Structural code search via ast-grep CLI |
| `graphify` | Knowledge graph generation via graphify Python tool |
