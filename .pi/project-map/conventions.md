# Conventions

## Code Style

- Extension modules: plain CommonJS JavaScript (`.js`).
- Extension entrypoint: TypeScript (`.ts`), loaded by pi via jiti.
- No build step. No bundler. No transpiler.
- Tests: plain JS using `node:test` and `node:assert/strict`.

## Architecture Patterns

- **Thin entrypoint**: `index.ts` only registers commands and events. No business logic.
- **Dependency injection**: command handlers receive an `env` object for filesystem, UI, and message sending. Enables testing without pi runtime.
- **Pure functions**: evaluator, handoff parser, state transitions, and prompt builders are pure modules with no pi dependencies.
- **Fail-closed**: any invalid, missing, or ambiguous state results in a pause decision, never auto-continuation.

## Naming

- Skills: lowercase hyphenated directories with `SKILL.md`.
- Extension modules: lowercase `.js` files matching their domain.
- Tests: `<module>.test.js` mirroring source module names.

## Project Config

- Stored at `.pi/workflow-orchestrator.json` per project.
- Config template lives in `skills/workflow-orchestrator/assets/workflow-orchestrator.template.json`.
- Extension generates config from `defaultConfig()` in `src/config.js`.
- Config is JSON with `version: 1`.

## Workflow Logs

- JSONL only: `.pi/workflows/<workflow-id>.jsonl`.
- One JSON object per line. Append-only.
- Secrets are redacted by `audit.js` before writing.

## Generated Files

- `.pi/` directory: all workflow state and project-map artifacts.
- `graphify-out/`: graphify working directory (not committed).
- `.pi/project-map/graph/`: graph artifacts from onboarding.

## Do Not Modify

- `skills/*/SKILL.md`: skill instructions. Edit in repo, then reinstall.
- `deprecated/prompts/`: kept for historical reference only.
- `settings/global-settings.json`: reference copy, not directly used by pi.
