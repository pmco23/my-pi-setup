# Agent Guidance

## Before Editing

- Run `cd extensions/workflow-orchestrator && npm test` before and after changes.
- Read `.pi/project-map/architecture.md` and `.pi/project-map/modules.md` for module layout.
- Read `AGENTS.md` for project rules.
- Check `.pi/project-map/risks.md` for known hotspots.
- If `.pi/project-map/agent-guidance.md` is stale, run `/workflow:refresh` to update.

## Project Map

- Intake: `.pi/project-map/intake.md`
- Architecture: `.pi/project-map/architecture.md`
- Modules: `.pi/project-map/modules.md`
- Testing: `.pi/project-map/testing.md`
- Conventions: `.pi/project-map/conventions.md`
- Risks: `.pi/project-map/risks.md`
- Graph JSON: `.pi/project-map/graph/graph.json`
- Graph communities: `.pi/project-map/graph/communities.json`

## Common Tasks

- **Add a new extension command**: add handler in `src/commands.js`, register in `index.ts`, add test in `test/commands.test.js`.
- **Change evaluator logic**: edit `src/evaluator.js`, update `test/evaluator.test.js`.
- **Change config shape**: edit `defaultConfig()` in `src/config.js`, update all tests that create configs.
- **Add a new skill**: create `skills/<name>/SKILL.md`, add to `transitions` and `allowed_skills` in `src/config.js`, update `support_skills.allowed_in` if it's a support skill.
- **Reinstall after changes**: run `./scripts/install.sh` then `/reload` in pi.

## Validation

```bash
cd extensions/workflow-orchestrator && npm test
```

Expected: 56 tests, 0 failures.

## Graph Insights (refreshed)

- `commands.js` is the central hub (11 edges). All command handlers depend on `config.js`.
- `getProjectRoot` and `loadConfig` (10 edges each): called from every command and auto-continuation.
- `handleStart` and `handleOnboard` (9 edges each): structurally similar flows.
- `planAutoContinuation` (8 edges): core auto-mode safety logic. Now uses hybrid flag for side-question protection.
- `evaluator.js` and `handoff.js` (5 edges each): well-isolated pure modules. Safe to modify independently.
- `audit.js` + `prompts.js` now share a community (both leaf-like, low coupling).
- 14 communities total, down from 17 after removing the legacy CLI skill scripts.

## Risky Areas

- `config.js`: used by every command and auto-continuation. Shape changes are high-impact.
- `planAutoContinuation` in `auto.js`: core safety logic. The hybrid flag (`isWorkflowSkillResponse`) determines whether missing handoffs pause or skip.
- `index.ts` `agent_end` hook: manages the `pendingWorkflowSkillResponse` flag. Not directly unit-tested (only the pure `planAutoContinuation` is tested).
- `install.sh` uses `--delete`: removing a skill from the repo removes it from the install target. This is intentional but be aware.

## Do Not Touch Unless Asked

- `deprecated/prompts/`: historical reference only.
- `settings/global-settings.json`: reference copy, not used by pi directly.
- `skills/find-docs/`, `skills/ast-grep/`, `skills/graphify/`: third-party support skills, bundled for portability.
- `.pi/project-map/graph/graph.json`: regenerate via `/workflow:refresh`, do not hand-edit.
