# Agent Guidance

## Before Editing

1. Run `npm test` — must be green (66 pass, 0 fail).
2. Read `modules.md` to locate the right module before touching code.
3. Keep `index.ts` thin — no business logic; all logic in `src/*.js`.
4. Every new command → handler in `src/commands.js` + registration in `index.ts` + test in `test/commands.test.js`.
5. Every config shape change → update `defaultConfig()` + all test fixtures that build configs.
6. Every new skill → add to `DEFAULT_TRANSITIONS` in `src/config.js` + update `skills.test.js` if needed.

## Project Map Links

- `intake.md` — stack, entrypoints, important files
- `architecture.md` — runtime flow, modes, transition graph
- `modules.md` — all source modules and their responsibilities
- `testing.md` — test locations, gaps
- `conventions.md` — naming, style, error handling, no-absolutes rule
- `risks.md` — known hotspots

## Common Tasks

| Task | Where to start |
|---|---|
| Add extension command | `src/commands.js` → `index.ts` → `test/commands.test.js` |
| Change auto-continuation logic | `src/auto.js`, `src/evaluator.js` → `test/auto.test.js`, `test/evaluator.test.js` |
| Change config shape | `src/config.js` `defaultConfig()` → all test files that build config fixtures |
| Add/modify a skill | `skills/<name>/SKILL.md` → `src/config.js` DEFAULT_TRANSITIONS |
| Change prompt format | `src/prompts.js` → `test/prompts.test.js` |
| Modify settings wizard | `src/setup.js`, `src/commands.js` `handleInit` |
| Refresh project context | `/skill:project-intake` — do NOT hand-edit project-map files |

## Validation Commands

```bash
npm test                   # All 66 tests must pass
./scripts/install.sh       # Install to global locations
# then in pi: /reload      # Verify commands work
```

## Risky Areas

- `src/config.js` — changing `defaultConfig()` breaks existing project `.pi/workflow-orchestrator.json` files
- `src/evaluator.js` — stop-condition logic determines when auto mode pauses; incorrect changes cause runaway chains or excessive pausing
- `src/setup.js` — writes live pi settings files; always test `applyPiSetup` before installing
- `index.ts` — pi event wiring is untested; keep changes minimal and verify with `/reload`

## Do Not

- Edit installed files in `~/.pi/agent/` or `~/.agents/skills/` directly
- Add npm runtime dependencies without strong justification and test coverage
- Commit `.pi/workflow-orchestrator.json`, `.pi/workflows/`, or `.pi/project-map/graph/`
- Use absolute paths anywhere in source, skills, or docs
- Hand-edit `.pi/project-map/` files directly — use `/skill:project-intake` to refresh
- Set `config.mode` and `auto_continue.enabled` independently — always use `initConfigV2()`
