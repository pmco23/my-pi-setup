# Testing

## Framework

Node built-in test runner (`node:test`) with `node:assert/strict`.

## Commands

From repo root:

```bash
npm test
```

Direct extension test command:

```bash
cd extensions/workflow-orchestrator && npm test
```

## Test Files

All under `extensions/workflow-orchestrator/test/`:

| File | Covers |
|------|--------|
| `audit.test.js` | JSONL append, multi-line logs, secret redaction |
| `auto.test.js` | Auto-continuation planning, duplicate guard, complete/pause behavior, side-question safety |
| `commands.test.js` | Init, upgrade-config, status, start, onboard, refresh, context, continue, pause/resume, setup handlers |
| `config.test.js` | Defaults, init/load/save, force overwrite, upgrade helpers |
| `evaluator.test.js` | Continue/pause/complete decisions, transition validation, stop conditions, mode precedence |
| `handoff.test.js` | JSON extraction, malformed handling, fail-closed behavior |
| `prompts.test.js` | Skill prompt builders, runtime workflow reminders, onboard/refresh/continue prompts |
| `setup.test.js` | `/my-pi:setup` settings/theme merge/write behavior |
| `skills.test.js` | Skill frontmatter, configured skill existence, transition/support-skill reference integrity |
| `state.test.js` | Workflow start/update/pause/resume/clear state transitions |
| `workflow-smoke.test.js` | Full default chain smoke test through completion |

## Current Coverage

75 tests, all passing as of this refresh.

## Important Smoke Path

`workflow-smoke.test.js` verifies:

```text
brainstorm-spec
→ implementation-research
→ acceptance-criteria
→ plan
→ execute
→ review-against-plan
→ code-review
→ none
```

It asserts continuation prompts include workflow reminders and that final `none` clears the active workflow via `action: "complete"`.

## Gaps

- No integration test with a real interactive pi/RPC session.
- `index.ts` event wiring and `pendingWorkflowSkillResponse` lifecycle are indirectly covered through pure `planAutoContinuation`, not direct pi runtime tests.
- No graphify output parser tests; graphify is invoked by skills rather than extension code.
- No automated validation that installed global pi resources are discoverable after `/reload`.
