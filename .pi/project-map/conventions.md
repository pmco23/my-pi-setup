# Conventions

## Code Style

- Extension business logic: CommonJS JavaScript (`src/*.js`).
- Extension entrypoint: TypeScript (`index.ts`), loaded by pi via jiti.
- Tests: plain JavaScript using `node:test` and `node:assert/strict`.
- No build step, bundler, transpiler, linter, or formatter configured.
- Avoid adding runtime npm dependencies unless strongly justified.

## Architecture Patterns

- **Thin entrypoint**: `index.ts` registers commands and runtime hooks only.
- **Pure modules**: config, evaluator, handoff, state, audit, prompts, setup, and auto planning stay pi-runtime independent where possible.
- **Dependency injection**: command handlers receive an `env` object for UI/message/filesystem concerns.
- **Fail-closed workflow**: invalid/missing handoffs from workflow skill responses pause; side conversations without handoffs are ignored.
- **Runtime reminder injection**: detailed workflow mechanics are injected by prompt builders instead of duplicated in every skill.
- **Module cache busting**: `index.ts` clears local CommonJS `require.cache` entries so `/reload` picks up `src/*.js` changes.

## Naming

- Skills: lowercase hyphenated directory names with `SKILL.md`.
- Extension modules: lowercase domain names (`config.js`, `auto.js`, `setup.js`).
- Tests: `<module>.test.js`, plus integration-like tests such as `workflow-smoke.test.js`.
- Commands: `workflow:<verb>` for orchestrator commands; `my-pi:setup` for setup wizard.

## Project Config

- Project config path: `.pi/workflow-orchestrator.json` (gitignored).
- Config shape is defined by `defaultConfig()` in `src/config.js`.
- Existing configs do not auto-migrate; use `/workflow:upgrade-config`.
- Changes to sequence/transitions/support skills require config tests and skill/config validation tests.

## Workflow Logs

- JSONL only: `.pi/workflows/<workflow-id>.jsonl`.
- One JSON object per line.
- `audit.js` redacts obvious secret patterns before writing.

## Generated / Local Files

- `.pi/workflow-orchestrator.json` and `.pi/workflows/` are personal/session state and gitignored.
- `.pi/project-map/` is committed durable context.
- `.pi/project-map/graph/graphify-out/` and `.pi/project-map/graph/.graphify_*` are graphify cache/temp and gitignored.
- `.pi/settings.json` may be local project pi settings; do not commit unless intentionally sharing project defaults.

## Do Not Modify Unless Asked

- `skills/find-docs/`, `skills/ast-grep/`, `skills/graphify/`: bundled third-party support skills.
- `settings/global-settings.json`: reference copy, not directly used by pi.
- `.pi/project-map/graph/graph.json`: regenerate via `/workflow:refresh`; do not hand-edit.
