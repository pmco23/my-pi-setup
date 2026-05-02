# Testing

## Framework

Node.js built-in test runner (`node:test`). No external test libraries.

## Location

```text
extensions/workflow-orchestrator/test/
```

## Test Files

| File | Covers |
|---|---|
| `audit.test.js` | `appendAuditEntry`, `readAuditEntries`, `sanitize` |
| `auto.test.js` | `latestAssistantMarkdown`, `planAutoContinuation` (auto + loop modes) |
| `commands.test.js` | `handleInit`, `handleContinue`, `handlePause`, `handleResume`, `projectMapStaleness` (DI env mocks) |
| `config.test.js` | `defaultConfig`, `loadConfig`, `saveConfig`, `initConfigV2`, `getProjectRoot` |
| `evaluator.test.js` | `validateConfig`, `validateHandoff`, `evaluateHandoff` (all stop conditions) |
| `handoff.test.js` | `extractJsonBlocks`, `extractLatestHandoff`, `looksLikeHandoff` |
| `prompts.test.js` | `buildSkillPrompt`, `buildContinuePrompt`, `workflowReminder` |
| `skills.test.js` | SKILL.md frontmatter validity; transition references; `## Next Step` presence |
| `state.test.js` | `startWorkflow`, `updateActiveWorkflow`, `pauseWorkflow`, `resumeWorkflow`, `clearWorkflow` |
| `workflow-smoke.test.js` | End-to-end chain through `planAutoContinuation` in auto + user-in-the-loop modes |

## Run Command

```bash
npm test
# or
cd extensions/workflow-orchestrator && node --test test/*.test.js
```

## Status (intake date)

- 66 tests, 0 failures, 0 skipped

## Gaps

- No integration test that exercises the actual pi ExtensionAPI — `index.ts` is untested at the wiring level
- No test for `applyPiSetup` / `setup.js` filesystem writes (except indirectly via `handleInit`)
- No test for `installPrePushHook`
- Skills `find-docs` and `ast-grep` are bundled but not tested for content quality — only frontmatter is validated
