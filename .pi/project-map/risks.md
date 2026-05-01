# Risks

## Architecture Risks

- **commands.js is a hub**: 10 edges, handles 8+ commands. If it grows further, consider splitting by command group.
- **config.js is used everywhere**: changes to config shape affect evaluator, commands, auto, state, and prompts.
- **No config migration**: `version: 1` is hardcoded. Schema changes will break existing project configs unless migration is added.

## Graph Hotspots

- `handleStart` and `handleOnboard` (9 edges each): similar flows, possible duplication.
- `getProjectRoot` and `loadConfig` (9 edges each): called from every command handler. A failure here blocks everything.
- `planAutoContinuation` (8 edges): core auto-mode logic. Bugs here affect workflow safety.

## Testing Gaps

- `index.ts` `agent_end` wiring is not directly tested.
- No integration test with real pi RPC.
- Graphify output parsing is delegated to the skill, not validated by the extension.
- Legacy CLI scripts are not regression-tested alongside extension modules.

## Operational Risks

- **Graphify dependency**: graphify must be installed separately (Python). If missing, onboarding produces no graph artifacts.
- **pi version coupling**: extension uses `@mariozechner/pi-coding-agent` types. Pi API changes could break the extension.
- **Installer overwrites**: `install.sh` uses rsync `--delete` for skills/extensions. Removing a skill from the repo will also remove it from the install target.

## Security

- `audit.js` redacts obvious secret patterns, but redaction is regex-based and not exhaustive.
- `.pi/workflow-orchestrator.json` and `.pi/workflows/*.jsonl` may contain goal text or artifact summaries. Review before committing to public repos.
