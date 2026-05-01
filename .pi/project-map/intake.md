# Project Intake

## Summary

Portable pi workflow setup repository. Contains global skills, a workflow-orchestrator pi extension, and installer scripts for replicating the setup across machines.

## Stack

- Node.js (extension runtime via pi/jiti)
- JavaScript (extension modules, plain CommonJS)
- TypeScript (extension entrypoint, loaded by pi via jiti)
- Bash (installer/backup scripts)
- Markdown (skills, docs)
- Python (graphify support tool)

## Important Files

- `README.md`: overview and install guide
- `USAGE.md`: day-to-day workflow usage
- `scripts/install.sh`: installs skills, extensions, and settings globally
- `scripts/backup-current.sh`: refreshes repo from installed global state
- `settings/global-settings.json`: reference global pi settings
- `extensions/workflow-orchestrator/index.ts`: pi extension entrypoint
- `extensions/workflow-orchestrator/package.json`: extension package
- `docs/workflow-extension-discussion.md`: design notes and remaining improvements

## Entrypoints

- `scripts/install.sh`: user runs this to install the setup
- `extensions/workflow-orchestrator/index.ts`: pi loads this as a global extension
- `skills/*/SKILL.md`: pi loads these as global skills

## Graphify Inputs

- `README.md`
- `USAGE.md`
- `docs/`
- `extensions/workflow-orchestrator/`
- `skills/`
- `scripts/`
