# AGENTS.md

Project instructions for AI coding agents (pi, Claude Code, Codex, etc.).

## Project overview

This is a portable pi workflow setup containing skills, a pi extension, and installer scripts. It provides a structured workflow for turning ideas into reviewed implementations.

## Pi documentation

Always consult pi's own docs before modifying skills, extensions, or settings. Pi evolves and assumptions may be outdated.

Docs location (resolve your Node version):

```text
~/.nvm/versions/node/<version>/lib/node_modules/@mariozechner/pi-coding-agent/docs/
```

Or ask pi directly:

```text
Read the pi docs for extensions/skills/settings.
```

Key references:

- `docs/extensions.md` — extension API, events, lifecycle, commands, tools
- `docs/skills.md` — Agent Skills standard, frontmatter, discovery, validation
- `docs/settings.md` — all settings, resource paths, precedence
- `docs/prompt-templates.md` — template format, arguments, loading rules
- `docs/packages.md` — package distribution and manifest

Do not guess pi API behavior. Verify against docs first.

## Before editing

- Read `.pi/project-map/agent-guidance.md` for full project context.
- If the user asks to refresh project context, project map, agent guidance, repo map, architecture map, or graph insights, do not manually edit `.pi/project-map/` first. Run `/workflow:refresh` or use `project-intake`, and use graphify from the beginning.
- Run `npm test` before and after changes.
- Never edit installed files directly. Edit the repo, then run `./scripts/install.sh`.

## Important paths

```text
extensions/workflow-orchestrator/        Extension source (index.ts + src/*.js)
extensions/workflow-orchestrator/test/   Tests (node:test, run with npm test)
skills/*/SKILL.md                        Skill definitions
scripts/install.sh                       Installer
scripts/uninstall.sh                     Uninstaller
.pi/project-map/                         Durable project context
```

## Commands

```bash
npm test                    # Run all extension tests (must pass before committing)
./scripts/install.sh        # Install to global pi locations
./scripts/uninstall.sh      # Remove from global pi locations
./scripts/backup-current.sh # Refresh repo from installed state
```

## Architecture rules

- `index.ts` is a thin wiring layer. No business logic.
- All workflow logic lives in `src/*.js` as pure CommonJS modules.
- Command handlers use dependency-injected `env` objects for testability.
- Evaluator, handoff parser, state, audit, config, and prompts are pure functions with no pi runtime dependency.

## Skill rules

- Each skill is a directory with `SKILL.md`.
- Name: lowercase, hyphens only, must match directory name, ≤64 chars.
- Description: required, ≤1024 chars, specific about when to use.
- Use relative paths from the skill directory for assets/scripts.
- No absolute paths.

## Extension rules

- Register commands in `index.ts` only.
- Business logic goes in `src/commands.js` or other `src/` modules.
- Every new command needs a test in `test/commands.test.js`.
- Every evaluator/config/state change needs a test update.

## Config rules

- Project config lives at `.pi/workflow-orchestrator.json` (per project, gitignored).
- Config shape is defined by `defaultConfig()` in `src/config.js`.
- **Mode is set by `/workflow:start` (or `/workflow:auto` / `/workflow:manual`), not by `/workflow:init`.** `handleStart` calls `syncModeToConfig()` to keep `default_mode` and `auto_continue.enabled` always in sync with the requested mode.
- Do not add fields without updating tests.
- Backward compatibility: existing project configs don't auto-migrate; use `/workflow:upgrade-config`.

## Testing rules

- Use Node built-in test runner (`node:test`).
- All tests must pass before committing.
- Use temp directories for filesystem tests.
- Mock pi context via the `env` pattern in command tests.

## Do not

- Add npm runtime dependencies without strong justification.
- Commit `.pi/workflow-orchestrator.json` or `.pi/workflows/`.
- Hand-edit `.pi/project-map/graph/graph.json`.
- Use absolute paths anywhere in skills or extension code.
- Put secrets in any file.

## Workflow for changes

1. Edit repo files.
2. `npm test` — must pass.
3. `./scripts/install.sh` — install locally.
4. `/reload` in pi — verify commands work.
5. Commit with descriptive message.
6. Push.
