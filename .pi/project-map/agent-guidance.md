# Agent Guidance

## Before Editing

- Run `cd extensions/workflow-orchestrator && npm test` before and after changes.
- Read `.pi/project-map/architecture.md` and `.pi/project-map/modules.md` for module layout.
- Check `.pi/project-map/risks.md` for known hotspots.

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
- **Change config shape**: edit `defaultConfig()` in `src/config.js`, update template in `skills/workflow-orchestrator/assets/`, update tests.
- **Add a new skill**: create `skills/<name>/SKILL.md`, add to `transitions` and `allowed_skills` in `src/config.js`.
- **Reinstall after changes**: run `./scripts/install.sh` then `/reload` in pi.

## Validation

```bash
cd extensions/workflow-orchestrator && npm test
```

Expected: 51 tests, 0 failures.

## Graph Insights

- `commands.js` is the central hub (10 edges). Most command handlers depend on `config.js` and `state.js`.
- `handleStart` and `handleOnboard` are structurally similar (9 edges each). Consider extracting shared logic if they diverge.
- `evaluator.js` and `handoff.js` are well-isolated modules (5 edges each). Safe to modify independently.
- `audit.js` is a leaf module (4 edges). Low-risk changes.
- Test files form their own communities, each tightly coupled to one source module.

## Risky Areas

- `config.js`: used by every command. Shape changes are high-impact.
- `planAutoContinuation` in `auto.js`: core safety logic for auto mode.
- `index.ts` `agent_end` hook: not directly tested. Manual verification needed.
- `install.sh`: does not `--delete` old files. Removed repo files persist in install targets.

## Do Not Touch Unless Asked

- `deprecated/prompts/`: historical reference only.
- `settings/global-settings.json`: reference copy, not used by pi directly.
- `skills/workflow-orchestrator/scripts/`: legacy CLI scripts, superseded by extension modules.
- `.pi/project-map/graph/graph.json`: regenerate via graphify, do not hand-edit.
