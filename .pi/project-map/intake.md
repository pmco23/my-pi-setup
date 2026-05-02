# Project Intake

## Summary

Portable pi workflow setup. Contains global workflow skills, a workflow-orchestrator pi extension, a bundled `onyx` theme, and installer scripts for replicating the setup across machines.

## Stack

- Node.js (extension runtime and tests)
- JavaScript CommonJS (extension business logic)
- TypeScript (pi extension entrypoint, loaded via jiti — no build step)
- Bash (install/uninstall/backup scripts)
- Markdown (skills, docs, project map)
- Python/graphify (optional for graphify-first project onboarding)
- Context7 CLI (`ctx7`) for docs/research support via `find-docs`

## Important Files

- `README.md`: overview, prerequisites, install guide, graphify upgrade flow
- `USAGE.md`: day-to-day workflow usage; graphify AST-only limitation documented
- `AGENTS.md`: repository instructions for coding agents
- `CONTRIBUTING.md`: contributor guide; graphify upgrade section
- `package.json`: root test script
- `scripts/install.sh`: auto-syncs graphify skill, installs skills + extension + onyx theme
- `scripts/uninstall.sh`: removes workflow extension and all workflow skills (incl. implementation-research)
- `scripts/backup-current.sh`: refreshes repo from installed state
- `extensions/workflow-orchestrator/index.ts`: pi extension entrypoint
- `extensions/workflow-orchestrator/src/*.js`: pure workflow/config/state/prompt/setup/audit logic
- `extensions/workflow-orchestrator/assets/onyx-theme.json`: bundled theme copied globally at install
- `extensions/workflow-orchestrator/test/*.test.js`: 80-test node:test suite
- `skills/*/SKILL.md`: pi skill discovery entrypoints

## Entrypoints

- `scripts/install.sh` — install setup globally
- `scripts/uninstall.sh` — uninstall workflow resources
- `extensions/workflow-orchestrator/index.ts` — pi extension auto-discovery entrypoint
- `skills/*/SKILL.md` — pi skill discovery entrypoints

## Graphify Inputs

- `README.md`, `USAGE.md`, `AGENTS.md`, `CONTRIBUTING.md`
- `docs/`
- `extensions/workflow-orchestrator/`
- `skills/`
- `scripts/`
