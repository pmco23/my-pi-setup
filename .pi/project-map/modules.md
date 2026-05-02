# Modules

## `extensions/workflow-orchestrator/`

### `index.ts` — Extension Entry Point
- Thin wiring layer only. No business logic.
- Busts CommonJS require-cache on load so `/reload` picks up `src/*.js` changes.
- Registers: `workflow:init`, `workflow:continue`, `workflow:pause`, `workflow:resume`
- Listens: `tool_call` (project-map guard + git-push staleness check), `agent_end` (auto-continuation)

### `src/commands.js` — Command Handlers
- `createCommandEnv(ctx, pi)` — builds DI env object (notify, select, confirm, input, sendUserMessage)
- `handleInit` — full setup wizard: scope, mode, theme, thinking level, compaction, retry
- `handleContinue` — resumes pause if needed, calls `buildContinuePrompt`, sends message
- `handlePause` / `handleResume` — delegate to `state.js`
- `installPrePushHook` — copies pre-push hook from assets to `.git/hooks/`
- `projectMapStaleness` — checks if source dirs changed after `agent-guidance.md` mtime

### `src/config.js` — Configuration
- `defaultConfig(mode)` — canonical v2 config shape
- `DEFAULT_TRANSITIONS` — skill transition adjacency map
- `getProjectRoot(cwd)` — git root or fallback to cwd
- `loadConfig` / `saveConfig` / `initConfigV2` — JSON file I/O with version check

### `src/auto.js` — Auto-Continuation Engine
- `latestAssistantMarkdown(messages)` — extracts text from last assistant message
- `planAutoContinuation({ config, markdown, entryId })` — parses handoff, evaluates, returns action: `none | continue | suggest | pause | complete`

### `src/evaluator.js` — Decision Engine
- `validateConfig` / `validateHandoff` — schema validation returning error arrays
- `evaluateHandoff({ config, handoff })` — applies stop-condition logic; returns `{ decision, reason, next_skill, … }`
- Stop conditions: `requires_user`, `stop_reason`, open questions, low confidence, stop-before-execute, failed validation, blockers, destructive signals

### `src/handoff.js` — Handoff Parser
- `extractJsonBlocks(markdown)` — finds all fenced `json` code blocks
- `looksLikeHandoff(value)` — duck-type check for handoff shape
- `extractLatestHandoff(markdown)` — returns the latest valid handoff; prefers blocks preceded by "Auto handoff:"

### `src/state.js` — Workflow State Mutations
- Pure functions: `startWorkflow`, `updateActiveWorkflow`, `pauseWorkflow`, `resumeWorkflow`, `clearWorkflow`
- `createWorkflowId()` — timestamp-based ID (`wf-<iso>`)
- `artifactLogPath(id)` — `.pi/workflows/<id>.jsonl`

### `src/prompts.js` — Prompt Builders
- `buildSkillPrompt(skillName, payload)` — constructs `/skill:<name>` message with workflow context and reminder
- `buildContinuePrompt(config)` — builds from active workflow state
- `workflowReminder(payload)` — appended to skill prompts to remind agent about next-step format

### `src/audit.js` — Audit Log
- `appendAuditEntry(projectRoot, artifactLog, entry)` — appends JSONL line to `.pi/workflows/<id>.jsonl`
- `readAuditEntries` — reads all lines
- `sanitize` — redacts api keys, tokens, secrets, passwords from logged values

### `src/setup.js` — Pi Settings Writer
- `applyPiSetup({ projectRoot, homeDir, scope, theme, thinkingLevel, … })` — merges and writes `settings.json`
- Supports scopes: `project`, `global`, `both`
- Installs `onyx` theme JSON to `~/.pi/agent/themes/` when selected
- Constants: `SCOPE_LABELS`, `THEME_LABELS`, `THINKING_LEVELS`

---

## `skills/` — Agent Skill Definitions

Each subdirectory is a skill with a `SKILL.md` conforming to the Agent Skills standard.

| Skill | Purpose |
|---|---|
| `project-intake` | Map/refresh codebase into `.pi/project-map/` |
| `brainstorm-spec` | Collaborative design spec from an idea |
| `implementation-research` | Research prior art, docs, approaches |
| `acceptance-criteria` | Testable criteria + definition of done |
| `plan` | Actionable task breakdown |
| `execute` | Implement the plan |
| `review-against-plan` | Verify implementation matches plan |
| `code-review` | Engineering review (quality, security, tests) |
| `find-docs` | Fetch current library/API docs via Context7 |
| `ast-grep` | Structural AST code search — action skill with decision table (when to use over grep/rg), 5-step workflow, structured findings output format, CLI reference |

---

## `scripts/`

| Script | Action |
|---|---|
| `install.sh` | rsync skills + extension to global locations; install onyx theme; ensure `enableSkillCommands: true` |
| `uninstall.sh` | Remove extension + workflow skills; leave support skills and project `.pi/` dirs |
| `backup-current.sh` | Sync currently installed state back into repo |

---

## `settings/`

- `global-settings.json` — reference snapshot of `~/.pi/agent/settings.json` (not auto-applied)
