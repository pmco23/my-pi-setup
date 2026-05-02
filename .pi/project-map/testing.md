# Testing

## Framework

Node built-in test runner (`node:test`) with `node:assert/strict`.

## Commands

```bash
npm test                                          # from repo root
cd extensions/workflow-orchestrator && npm test  # direct
```

## Test Files

All under `extensions/workflow-orchestrator/test/`:

| File | Covers |
|------|--------|
| `audit.test.js` | JSONL append, multi-line, secret redaction, token(?!s) precision |
| `auto.test.js` | Auto-continuation, duplicate guard, complete/pause/none, side-question safety |
| `commands.test.js` | Init, upgrade-config, status, start, onboard (with optional goal), refresh, context (staleness), continue, pause/resume, setup handlers |
| `config.test.js` | Defaults, init/load/save, force overwrite, upgradeConfig/upgradeProjectConfig |
| `evaluator.test.js` | Continue/pause/complete decisions, transition validation, stop conditions, mode precedence |
| `handoff.test.js` | JSON extraction, malformed handling, fail-closed behavior |
| `prompts.test.js` | Skill prompt builders, runtime workflow reminders, onboard/refresh/continue prompts |
| `setup.test.js` | Settings/theme writes, onyx install, scope handling, malformed settings fallback |
| `skills.test.js` | Skill frontmatter, configured skill existence, transition/support-skill integrity |
| `state.test.js` | Workflow start/update/pause/resume/clear state transitions |
| `workflow-smoke.test.js` | Full default chain smoke test through completion |

## Current Coverage

85 tests, 0 failures.

## Smoke Chain

`workflow-smoke.test.js` verifies:

```text
brainstorm-spec → implementation-research → acceptance-criteria → plan
→ execute → review-against-plan → code-review → none
```

Asserts continuation prompts include workflow reminders, allowed next skills, and that `next_skill: none` returns `action: "complete"` and clears the active workflow.

## Gaps

- No integration test with a real interactive pi/RPC session.
- `index.ts` event wiring and `pendingWorkflowSkillResponse` lifecycle only indirectly covered.
- No automated test for installer effects in a sandboxed fake home directory.
