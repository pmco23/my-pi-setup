# Conventions

## Code Style

- Extension modules: plain CommonJS JavaScript (`.js`).
- Extension entrypoint: TypeScript (`.ts`), loaded by pi via jiti.
- No build step. No bundler. No transpiler.
- Tests: plain JS using `node:test` and `node:assert/strict`.

## Architecture Patterns

- **Thin entrypoint**: `index.ts` only registers commands, manages the workflow-skill flag, and wires `agent_end`. No business logic.
- **Dependency injection**: command handlers receive an `env` object for filesystem, UI, and message sending. Enables testing without pi runtime.
- **Pure functions**: evaluator, handoff parser, state transitions, and prompt builders are pure modules with no pi dependencies.
- **Fail-closed**: any invalid, missing, or ambiguous state results in a pause decision, never auto-continuation.
- **Hybrid flag**: `pendingWorkflowSkillResponse` distinguishes workflow skill responses from side conversations. Missing handoff only pauses if the flag is set.

## Naming

- Skills: lowercase hyphenated directories with `SKILL.md`.
- Extension modules: lowercase `.js` files matching their domain.
- Tests: `<module>.test.js` mirroring source module names.
- Commands: `workflow:<verb>` pattern.

## Project Config

- Stored at `.pi/workflow-orchestrator.json` per project (gitignored).
- Config shape is defined by `defaultConfig()` in `src/config.js`.
- Do not add fields without updating tests.
- Backward compatibility: existing project configs don't auto-migrate.

## Workflow Logs

- JSONL only: `.pi/workflows/<workflow-id>.jsonl`.
- One JSON object per line. Append-only.
- Secrets are redacted by `audit.js` before writing.

## Generated Files

- `.pi/` directory: workflow state and project-map artifacts.
- `.pi/project-map/graph/graphify-out/`: graphify cache (gitignored).
- `.pi/project-map/graph/.graphify_*`: graphify temp files (gitignored).

## Do Not Modify

- `skills/find-docs/`, `skills/ast-grep/`, `skills/graphify/`: third-party skills, bundled for portability.
- `deprecated/prompts/`: kept for historical reference only.
- `settings/global-settings.json`: reference copy, not directly used by pi.
