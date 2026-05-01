# Risks

## Architecture Risks

- **commands.js is a hub**: 11 edges, handles 11 commands (init, status, start, auto, manual, onboard, refresh, context, continue, pause, resume). If it grows further, consider splitting by command group.
- **config.js is used everywhere**: `getProjectRoot` and `loadConfig` have 10 edges each. Changes to config shape affect evaluator, commands, auto, state, and prompts.
- **No config migration**: `version: 1` is hardcoded. Schema changes will break existing project configs unless migration is added.

## Graph Hotspots

- `handleStart` and `handleOnboard` (9 edges each): similar flows, possible duplication.
- `planAutoContinuation` (8 edges): core auto-mode logic with hybrid flag. Bugs here affect workflow safety.

## Testing Gaps

- `index.ts` `agent_end` wiring and the `pendingWorkflowSkillResponse` flag lifecycle are not directly unit-tested.
- No integration test with real pi RPC session.
- No test for graphify output parsing (delegated to the skill).

## Operational Risks

- **Graphify dependency**: graphify must be installed separately (Python). If missing, onboarding produces no graph artifacts.
- **pi version coupling**: extension uses `@mariozechner/pi-coding-agent` types. Pi API changes could break the extension.
- **Installer `--delete` behavior**: removing a skill or extension file from the repo removes it from the install target. Intentional but requires awareness.
- **Third-party skills**: `find-docs`, `ast-grep`, `graphify` are bundled but not maintained by us. Could go stale.

## Security

- `audit.js` redacts obvious secret patterns, but redaction is regex-based and not exhaustive.
- `.pi/workflow-orchestrator.json` and `.pi/workflows/*.jsonl` may contain goal text or artifact summaries. Review before committing to public repos.
