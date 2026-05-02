# Conventions

## Code Style

- Extension business logic: CommonJS JavaScript (`src/*.js`).
- Extension entrypoint: TypeScript (`index.ts`), loaded by pi via jiti.
- Tests: plain JavaScript using `node:test` and `node:assert/strict`.
- No build step, bundler, transpiler, linter, or formatter configured.
- Avoid adding runtime npm dependencies unless strongly justified.

## Architecture Patterns

- **Thin entrypoint**: `index.ts` registers commands and runtime hooks only.
- **Pure modules**: config, evaluator, handoff, state, audit, prompts, setup, and auto planning stay pi-runtime independent.
- **Dependency injection**: command handlers receive `env` objects for UI/message/filesystem concerns.
- **Fail-closed workflow**: invalid/missing handoffs from workflow skill responses pause; side conversations without handoffs are ignored.
- **Runtime reminder injection**: `workflowReminder()` in `prompts.js` carries handoff mechanics so skill files stay concise.
- **Module cache busting**: `index.ts` clears local CommonJS `require.cache` entries so `/reload` picks up `src/*.js` changes.
- **Completion semantics**: `next_skill: "none"` → `action: "complete"`, not `"pause"`. Runtime code must handle both.

## Naming

- Skills: lowercase hyphenated directory names with `SKILL.md`.
- Extension modules: lowercase domain names.
- Tests: `<module>.test.js`, plus integration-style tests (`workflow-smoke.test.js`).
- Commands: `workflow:<verb>` for orchestrator; `my-pi:setup` for setup wizard.

## Project Config

- Path: `.pi/workflow-orchestrator.json` (gitignored).
- Shape defined by `defaultConfig()` in `src/config.js`.
- No auto-migration; use `/workflow:upgrade-config`.
- Changing sequence/transitions/support skills requires updating config, evaluator, and smoke tests.

## Audit and Sanitize

- JSONL format: `.pi/workflows/<workflow-id>.jsonl`.
- `sanitize()` uses `token(?!s)` to redact auth tokens while preserving `input_tokens`/`output_tokens` metric fields.
- Do not widen the regex without understanding impact on metric fields in audit logs.

## Generated / Local Files

- `.pi/workflow-orchestrator.json` and `.pi/workflows/` — personal/session state, gitignored.
- `.pi/project-map/` — committed durable context.
- `.pi/project-map/graph/graphify-out/` and `.pi/project-map/graph/.graphify_*` — graphify cache/temp, gitignored.
- `.pi/settings.json` — local project pi settings; do not commit unless intentionally sharing project defaults.

## Do Not Modify Unless Asked

- `skills/find-docs/`, `skills/ast-grep/`: bundled third-party support skills.
- `settings/global-settings.json`: reference copy, not directly used by pi.
- `.pi/project-map/graph/graph.json`: regenerate via `/workflow:refresh`; do not hand-edit.
