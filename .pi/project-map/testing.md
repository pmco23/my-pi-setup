# Testing

## Framework

Node built-in test runner (`node:test`).

## Test Command

```bash
cd extensions/workflow-orchestrator
npm test
```

## Test Files

All under `extensions/workflow-orchestrator/test/`:

| File | Covers |
|------|--------|
| `evaluator.test.js` | Deterministic decisions, mode precedence, schema validation |
| `handoff.test.js` | JSON extraction, malformed handling, fail-closed behavior |
| `config.test.js` | Init, load, save, force-overwrite, project_map defaults |
| `state.test.js` | Workflow start/update/pause/resume/clear |
| `audit.test.js` | JSONL append, multi-line, secret redaction |
| `prompts.test.js` | Skill prompt building, onboard prompt, continue prompt |
| `commands.test.js` | Init/status/start/onboard/context/continue/pause/resume handlers |
| `auto.test.js` | Auto-continuation planning, duplicate guard, fail-closed |

## Current Coverage

56 tests, all passing.

## Gaps

- No integration tests that run commands inside a real pi RPC session.
- No tests for the `agent_end` hook wiring in `index.ts` (only pure `planAutoContinuation` is tested).
- No test for graphify output parsing (graphify is invoked by the skill, not the extension).
