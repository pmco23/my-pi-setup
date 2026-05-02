# Project Intake

## Summary

`my-pi-setup` is a portable, version-controlled pi workflow configuration. It packages a workflow-orchestrator extension, a curated set of agent skills, installer/uninstaller scripts, and a global settings reference so the same setup can be reproduced on any machine.

## Stack

- **Runtime**: Node.js ≥ 18, CommonJS modules
- **Extension entry point**: TypeScript (`extensions/workflow-orchestrator/index.ts`) compiled/loaded by pi at runtime
- **Test runner**: Node built-in `node:test`
- **Install mechanism**: `rsync` + `bash` scripts
- **No npm runtime dependencies** — only Node built-ins

## Important Files

| Path | Role |
|---|---|
| `extensions/workflow-orchestrator/index.ts` | Extension entry — command registration, event wiring only |
| `extensions/workflow-orchestrator/src/commands.js` | Command handlers (DI via `env`) |
| `extensions/workflow-orchestrator/src/config.js` | Config load/save, transitions map, `defaultConfig()` |
| `extensions/workflow-orchestrator/src/auto.js` | Handoff parsing + auto-continuation planning |
| `extensions/workflow-orchestrator/src/evaluator.js` | Handoff schema validation + decision engine |
| `extensions/workflow-orchestrator/src/state.js` | Pure workflow state mutations |
| `extensions/workflow-orchestrator/src/prompts.js` | Skill prompt builders |
| `extensions/workflow-orchestrator/src/audit.js` | JSONL audit log writer (with secret scrubbing) |
| `extensions/workflow-orchestrator/src/setup.js` | Pi settings writer (theme, thinking, compaction, retry) |
| `extensions/workflow-orchestrator/assets/` | Bundled `onyx-theme.json`, `pre-push-hook.sh` |
| `skills/*/SKILL.md` | Skill definitions (project-intake, brainstorm-spec, plan, execute, …) |
| `scripts/install.sh` | Installs to `~/.agents/skills/` and `~/.pi/agent/extensions/` |
| `scripts/uninstall.sh` | Removes extension + workflow skills; leaves support skills |
| `scripts/backup-current.sh` | Syncs installed state back to repo |
| `settings/global-settings.json` | Reference global settings snapshot |
| `.pi/workflow-orchestrator.json` | Per-project runtime config (gitignored) |
| `.pi/workflows/<id>.jsonl` | Per-workflow JSONL audit logs (gitignored) |
| `.pi/project-map/` | Durable context docs (committed) |

## Entrypoints

- `npm test` → `cd extensions/workflow-orchestrator && node --test test/*.test.js`
- `./scripts/install.sh` → installs everything globally
- pi loads `extensions/workflow-orchestrator/index.ts` automatically after install + `/reload`
