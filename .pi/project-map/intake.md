# Project Intake

## Summary

Portable pi workflow setup repository. Contains global skills, a workflow-orchestrator pi extension, a global `onyx` theme asset, and installer scripts for replicating the setup across machines.

## Stack

- Node.js (extension runtime and tests)
- JavaScript CommonJS (extension business logic)
- TypeScript (pi extension entrypoint, loaded via jiti)
- Bash (install/uninstall/backup scripts)
- Markdown (skills, docs, project map)
- Python/graphify support (optional for project onboarding)
- Context7 CLI (`ctx7`) for docs/research support via `find-docs`

## Important Files

- `README.md`: overview, prerequisites, install guide, command/skill lists
- `USAGE.md`: day-to-day workflow usage
- `AGENTS.md`: repository instructions for coding agents
- `CONTRIBUTING.md`: contributor guide
- `package.json`: root test script
- `scripts/install.sh`: installs skills, extension, and global `onyx` theme
- `scripts/uninstall.sh`: removes workflow extension/skills from global pi locations
- `scripts/backup-current.sh`: refreshes repo from installed state
- `extensions/workflow-orchestrator/index.ts`: pi extension entrypoint and runtime event wiring
- `extensions/workflow-orchestrator/src/*.js`: pure workflow/config/state/prompt/setup logic
- `extensions/workflow-orchestrator/assets/onyx-theme.json`: canonical bundled theme copied globally at install
- `extensions/workflow-orchestrator/test/*.test.js`: node:test suite
- `skills/*/SKILL.md`: pi skills, including main workflow and support skills
- `docs/workflow-extension-discussion.md`: design notes and remaining improvements

## Entrypoints

- `scripts/install.sh`: install setup globally
- `scripts/uninstall.sh`: uninstall workflow resources
- `extensions/workflow-orchestrator/index.ts`: pi extension auto-discovery entrypoint
- `skills/*/SKILL.md`: pi skill discovery entrypoints

## Graphify Inputs

- `README.md`
- `USAGE.md`
- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/`
- `extensions/workflow-orchestrator/`
- `skills/`
- `scripts/`
