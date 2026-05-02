# Agent Guidance

## Before Editing

- Read `AGENTS.md` for project rules.
- Read `.pi/project-map/architecture.md`, `.pi/project-map/modules.md`, and `.pi/project-map/risks.md` for current context.
- If asked to refresh project context or project map, use `/skill:project-intake` directly. Do not manually edit `.pi/project-map/` files.
- Run validation before and after changes:

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
- **Change mode sync behaviour**: edit `syncModeToConfig()` in `src/commands.js`, update `commands.test.js` mode sync tests.
- **Change auto-continuation**: edit `src/auto.js` and/or `src/evaluator.js`, update `auto.test.js`, `evaluator.test.js`, and `workflow-smoke.test.js`.
- **Change prompt behavior**: edit `src/prompts.js`, update `prompts.test.js`.
- **Add or rename skill**: create/update `skills/<name>/SKILL.md`, update config transitions/allowed skills/support mappings, update docs and `skills.test.js` expectations if needed.
- **Change setup wizard/theme**: edit `src/setup.js`, `assets/onyx-theme.json`, `scripts/install.sh`, and `test/setup.test.js`.
- **Change audit/sanitize logic**: edit `src/audit.js`, update `test/audit.test.js`. The `token(?!s)` pattern intentionally preserves `input_tokens`/`output_tokens`.
- **Reinstall after changes**: run `./scripts/install.sh`, then `/reload` in pi.

## Validation Expectations

Current expected test count: 85 tests, 0 failures.

Important coverage:
- config init/load/save/upgrade
- evaluator continue/pause/complete decisions
- handoff parsing/fail-closed behavior
- prompt workflow reminders
- command handlers
- setup wizard/theme writes (including malformed settings fallback)
- skill/config integrity
- full workflow smoke chain
- audit sanitize precision (token vs tokens)

## Current Workflow

```text
brainstorm-spec → implementation-research → acceptance-criteria
→ plan → execute → review-against-plan → code-review → none
```

`project-intake` is separate onboarding/refresh; can hand off to `plan` or `none`.

## Graph Insights (AST-backed, refreshed)

98 nodes · 162 edges · 8 communities. Core hubs:

- `getProjectRoot()` — 12 edges, called from every command
- `loadConfig()` — 11 edges, used everywhere
- `handleStart()` / `handleOnboard()` — 9 edges each
- `saveConfig()` — 9 edges
- `planAutoContinuation()` — 8 edges, cross-community bridge
- `buildSkillPrompt()` — 7 edges, all prompts route through here

Communities: C0 = auto/state, C1 = context/status/refresh cmds, C2 = onboard/config cmds, C3 = prompts, C4 = setup wizard, C5 = evaluator, C6 = handoff, C7 = audit.



## Risky Areas

- `config.js`: default config + upgrade helpers — high-impact, used everywhere.
- `commands.js`: hub with 12 handlers; `projectMapStaleness` also lives here.
- `auto.js` + `evaluator.js`: complete/pause/continue semantics.
- `audit.js`: `token(?!s)` pattern — do not widen without understanding impact on metric fields.
- `index.ts`: pi runtime wiring, module cache busting, `agent_end` flag lifecycle.
- `scripts/install.sh`: `rsync --delete` — repo removals propagate globally.

## Do Not Touch Unless Asked

- `skills/find-docs/`, `skills/ast-grep/`: bundled third-party support skills.
- `settings/global-settings.json`: reference copy, not used by pi directly.
- `.pi/project-map/graph/graph.json`: regenerate via `/workflow:refresh`; do not hand-edit.
- `.pi/settings.json`: local project pi settings; do not commit unless explicitly intended.
