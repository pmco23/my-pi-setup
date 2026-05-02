# Contributing

Thank you for contributing to my-pi-setup.

## Prerequisites

- [pi](https://github.com/badlogic/pi-mono) installed
- Node.js ≥ 18
- rsync

## Reference documentation

Always check pi's own documentation before making changes to skills, extensions, or prompt templates:

```text
~/.nvm/versions/node/<version>/lib/node_modules/@mariozechner/pi-coding-agent/docs/
```

Key docs:

- `docs/extensions.md` — extension API, events, commands, tools
- `docs/skills.md` — skill format, frontmatter, validation, discovery
- `docs/settings.md` — all pi settings and resource paths
- `docs/prompt-templates.md` — prompt template format and arguments
- `docs/packages.md` — pi package distribution

Pi evolves. Do not rely on assumptions — verify against current docs before implementing.

## Setup

```bash
git clone https://github.com/pmco23/my-pi-setup.git
cd my-pi-setup
npm test
```

No `npm install` is needed — the extension uses only Node built-ins.

## Project structure

```text
extensions/workflow-orchestrator/        Extension source (index.ts + src/*.js)
extensions/workflow-orchestrator/test/   Tests (node:test runner)
skills/                                 Pi skills (project-intake, brainstorm-spec, plan, etc.)
scripts/                                Install, uninstall, backup scripts
```

## Development workflow

1. Read `AGENTS.md` for project rules and constraints.
2. Make changes in the repo (not in `~/.pi/agent/` or `~/.agents/skills/` directly).
3. Run tests before and after changes:

```bash
npm test
```

4. Install locally to verify:

```bash
./scripts/install.sh
```

5. Reload pi:

```text
/reload
```

6. Manually verify affected commands work.

## Adding a new skill

1. Create `skills/<skill-name>/SKILL.md`.
2. Follow the [Agent Skills standard](https://agentskills.io/specification):
   - Frontmatter: `name` (must match directory), `description` (≤1024 chars, specific).
   - Name: lowercase, hyphens, ≤64 chars, no leading/trailing/consecutive hyphens.
3. Include an `## Artifact` section if the skill produces a primary deliverable (design spec, plan, review, etc.).
4. Include a `## Next Skill Guidance` section with the handoff JSON template.
5. Add the skill name to `transitions` in `extensions/workflow-orchestrator/src/config.js` if it should participate in the workflow.
6. Update tests in `test/config.test.js` or `test/evaluator.test.js` if transitions change.
7. Run `npm test`.
8. Update `README.md`, `USAGE.md`, and `scripts/install.sh` output.

## Modifying the extension

1. Edit modules in `extensions/workflow-orchestrator/src/`.
2. Keep business logic in pure modules (no pi runtime dependency).
3. Keep `index.ts` thin — only command registration and event wiring.
4. Add or update tests in `extensions/workflow-orchestrator/test/`.
5. Run `npm test` — all tests must pass before committing.

## Adding a new extension command

1. Add handler function in `src/commands.js` (dependency-injected `env` for testability).
2. Register in `index.ts` with `pi.registerCommand(...)`.
3. Add test in `test/commands.test.js`.
4. Update `README.md`, `USAGE.md`, `scripts/install.sh` output.

## Extension event hooks

The extension subscribes to these pi lifecycle events:

- `session_start`: loads config and notifies if an active workflow exists.
- `before_agent_start`: injects active workflow context (ID, goal, step, artifact, mode, transitions) into the system prompt.
- `session_shutdown`: defensive config save.
- `tool_call`: stale-context and project-map edit guard.
- `agent_end`: evaluates every agent response for a workflow handoff and auto-continues or pauses.

## Modifying config shape

1. Edit `defaultConfig()` in `src/config.js`.
2. Update `startWorkflow()` and `clearWorkflow()` in `src/state.js` for new active_workflow fields.
3. Update all tests that create configs.
4. New fields must have safe defaults (null, 0, false) — existing configs won't auto-migrate.

## Handoff format

Skills emit a compact JSON block at the end of their response:

```json
{
  "workflow_mode": "<mode>",
  "current_skill": "<this skill>",
  "next_skill": "<recommended>",
  "confidence": "high|medium|low",
  "stop_reason": null,
  "open_questions": [],
  "artifact": "<path or empty string>"
}
```

Required fields: `workflow_mode`, `current_skill`, `next_skill`, `confidence`, `stop_reason`.
Optional fields: `open_questions`, `artifact`.

The extension parses this from fenced JSON blocks in the assistant response.

## Artifact system

Skills write their primary output to numbered files:

```text
.pi/workflows/<wf-id>/<NN>-<skill-name>.md
```

The step number comes from the `Step:` line in the skill prompt. The extension:
- Stores the artifact path from the handoff in `active_workflow.last_artifact`
- Passes it as `Previous artifact:` to the next skill
- Increments `step_number` on each skill completion

## Commit guidelines

- Keep commits focused: one logical change per commit.
- Run `npm test` before committing.
- Use descriptive commit messages:
  - `Add <feature>`
  - `Fix <issue>`
  - `Remove <thing> (reason)`
  - `Update docs for <change>`

## Testing

Tests use Node's built-in test runner:

```bash
npm test
# or directly:
cd extensions/workflow-orchestrator && node --test test/*.test.js
```

All tests must pass before merging.

## What NOT to do

- Do not edit installed files directly (`~/.pi/agent/extensions/`, `~/.agents/skills/`). Edit the repo, then run `./scripts/install.sh`.
- Do not add npm runtime dependencies unless strictly necessary.
- Do not commit `.pi/workflow-orchestrator.json` or `.pi/workflows/` (they are gitignored).
- Do not hand-edit `.pi/project-map/` files directly — use `/skill:project-intake`.
- Do not use absolute paths in skills or extension code.

## Refreshing project context

After significant changes, update the project map:

```bash
./scripts/install.sh
# then in pi:
/skill:project-intake
```
