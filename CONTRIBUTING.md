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
extensions/workflow-orchestrator/   Pi extension (commands, evaluator, auto-continuation)
skills/                             Pi skills (project-intake, brainstorm-spec, plan, etc.)
scripts/                            Install, uninstall, backup scripts
docs/                               Design notes
.pi/project-map/                    Durable project context (committed for contributors)
```

## Development workflow

1. Read `.pi/project-map/agent-guidance.md` before starting.
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
3. Add the skill name to `transitions` in `extensions/workflow-orchestrator/src/config.js` if it should participate in the workflow.
4. Update tests in `test/config.test.js` or `test/evaluator.test.js` if transitions change.
5. Run `npm test`.
6. Update `README.md`, `USAGE.md`, and `scripts/install.sh` output.

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

## Modifying config shape

1. Edit `defaultConfig()` in `src/config.js`.
2. Update all tests that create configs (especially `test/evaluator.test.js` base fixture).
3. Consider backward compatibility — existing `.pi/workflow-orchestrator.json` files in projects won't auto-migrate.
4. Document migration in `docs/workflow-extension-discussion.md` if needed.

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
- Do not add npm runtime dependencies unless strictly necessary and tested.
- Do not commit `.pi/workflow-orchestrator.json` or `.pi/workflows/` (they are gitignored).
- Do not hand-edit `.pi/project-map/graph/graph.json` — regenerate with `/skill:project-intake`.
- Do not add absolute paths in skills or extension code.

## Refreshing project context

After significant changes, update the project map:

```bash
./scripts/install.sh
# then in pi:
/skill:project-intake
```

Or commit the updated `.pi/project-map/` files so other contributors benefit.
