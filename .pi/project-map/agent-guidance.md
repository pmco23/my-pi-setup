# Agent Guidance

## Before Editing

- Read `AGENTS.md` for project rules.
- Read `.pi/project-map/architecture.md`, `.pi/project-map/modules.md`, and `.pi/project-map/risks.md` for current context.
- Run validation before and after changes:

```bash
cd extensions/workflow-orchestrator && npm test
```

or from repo root:

```bash
npm test
```

## Project Map

- Intake: `.pi/project-map/intake.md`
- Commands: `.pi/project-map/commands.md`
- Architecture: `.pi/project-map/architecture.md`
- Modules: `.pi/project-map/modules.md`
- Testing: `.pi/project-map/testing.md`
- Conventions: `.pi/project-map/conventions.md`
- Risks: `.pi/project-map/risks.md`
- Graph JSON: `.pi/project-map/graph/graph.json`
- Graph communities: `.pi/project-map/graph/communities.json`

## Common Tasks

- **Add extension command**: implement handler in `src/commands.js`, register in `index.ts`, add/adjust `test/commands.test.js`, update docs/install output.
- **Change workflow config shape/sequence**: edit `defaultConfig()` and upgrade helpers in `src/config.js`, update config/evaluator/smoke tests.
- **Change auto-continuation**: edit `src/auto.js` and/or `src/evaluator.js`, update `auto.test.js`, `evaluator.test.js`, and `workflow-smoke.test.js`.
- **Change prompt behavior**: edit `src/prompts.js`, update `prompts.test.js`.
- **Add or rename skill**: create/update `skills/<name>/SKILL.md`, update config transitions/allowed skills/support mappings, update docs and `skills.test.js` expectations if needed.
- **Change setup wizard/theme**: edit `src/setup.js`, `assets/onyx-theme.json`, `scripts/install.sh`, and `test/setup.test.js`.
- **Reinstall after changes**: run `./scripts/install.sh`, then `/reload` in pi.

## Validation Expectations

Current expected test count: 75 tests, 0 failures.

Important coverage includes:

- config init/load/save/upgrade
- evaluator continue/pause/complete decisions
- handoff parsing/fail-closed behavior
- prompt workflow reminders
- command handlers
- setup wizard/theme writes
- skill/config integrity
- full workflow smoke chain

## Current Workflow

```text
brainstorm-spec
→ implementation-research
→ acceptance-criteria
→ plan
→ execute
→ review-against-plan
→ code-review
→ none
```

`project-intake` is separate onboarding/refresh and can hand off to `plan` or `none`.

## Risky Areas

- `config.js`: high-impact default config and upgrade behavior.
- `commands.js`: central command-handler hub.
- `auto.js` + `evaluator.js`: auto-mode safety and complete/pause semantics.
- `index.ts`: pi runtime wiring, module cache busting, and `agent_end` flag lifecycle.
- `scripts/install.sh`: uses `rsync --delete`; repo removals propagate globally.

## Do Not Touch Unless Asked

- `skills/find-docs/`, `skills/ast-grep/`, `skills/graphify/`: bundled third-party support skills.
- `settings/global-settings.json`: reference copy, not directly used by pi.
- `.pi/project-map/graph/graph.json`: regenerate via `/workflow:refresh`; do not hand-edit.
- `.pi/settings.json`: local project pi settings; do not commit unless explicitly intended.
