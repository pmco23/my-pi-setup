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
| `prompts.js` | Build `/skill:<name>` prompt strings | `buildSkillPrompt`, `buildStartPrompt`, `buildOnboardPrompt`, `buildContinuePrompt` |
| `commands.js` | Command handler functions (dependency-injected) | `handleInit`, `handleStart`, `handleOnboard`, `handleContext`, `handleContinue`, `handleStatus`, `handlePause`, `handleResume` |
| `auto.js` | Post-agent handoff evaluation and continuation planning | `planAutoContinuation`, `latestAssistantMarkdown`, `messageText` |

## Extension Entrypoint

`extensions/workflow-orchestrator/index.ts`: registers commands and `agent_end` hook. Contains no business logic.

## Skills

All under `skills/`:

| Skill | Purpose |
|-------|---------|
| `project-intake` | Graphify-first codebase onboarding |
| `workflow-orchestrator` | Skill-level orchestration instructions (complements extension) |
| `brainstorm-spec` | Collaborative idea exploration → design spec |
| `acceptance-criteria` | Design spec → testable acceptance criteria |
| `plan` | Acceptance criteria → ordered task plan |
| `execute` | Task plan → implementation |
| `review-against-plan` | Implementation → plan coverage review |
| `code-review` | Implementation → engineering quality review |
| `find-docs` | External docs/API verification (support skill) |
| `ast-grep` | Structural code search (support skill) |
| `graphify` | Knowledge graph / architecture mapping (support skill) |

## Legacy / Standalone Scripts

Removed. The `skills/workflow-orchestrator/` directory (including `scripts/evaluate-handoff.js` and `scripts/init-project-workflow.js`) has been deleted. The extension modules in `src/evaluator.js` and `src/config.js` are the authoritative replacements.
