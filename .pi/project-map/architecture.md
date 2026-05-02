# Architecture

## Overview

```text
extensions/workflow-orchestrator/   Pi extension (commands, evaluator, auto-continuation, setup)
skills/                             Workflow and support skills installed to ~/.agents/skills/
scripts/                            Bash installer/uninstaller/backup
settings/                           Reference global settings
.pi/project-map/                    Durable project context (committed)
docs/                               Design notes
```

Deprecated prompt templates have been removed; extension commands are authoritative.

## Runtime Flow

1. User runs `scripts/install.sh` on a machine.
2. Installer copies skills to `~/.agents/skills/` using `rsync --delete`.
3. Installer copies extensions to `~/.pi/agent/extensions/` using `rsync --delete`.
4. Installer copies `extensions/workflow-orchestrator/assets/onyx-theme.json` to `~/.pi/agent/themes/onyx.json`.
5. Pi loads the extension on startup or `/reload`.
6. Extension busts local CommonJS module cache so `/reload` sees changed `src/*.js` modules.
7. Extension registers `/my-pi:setup` plus `/workflow:*` commands.
8. Command handlers use dependency-injected `env` objects for testability.
9. Workflow commands send `/skill:<name>` prompts with runtime workflow reminders and allowed next skills.
10. Extension sets `pendingWorkflowSkillResponse` before workflow skill prompts.
11. On `agent_end`:
    - Missing handoff from workflow skill response pauses.
    - Missing handoff from side conversation skips silently.
    - Valid handoff is evaluated deterministically.
    - `continue` sends the next `/skill:<name>` follow-up.
    - `complete` clears active workflow and notifies success.
    - `pause` updates config and notifies user.

## Workflow Sequence

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

`project-intake` is used for onboarding/refresh and can hand off to `plan` or `none`.

## Graph Insights

Latest graph refresh was AST-backed because the installed graphify package requires subagent support for semantic extraction in the bundled skill, which is not available in this harness.

- Graph size: 98 nodes, 162 edges, 8 communities.
- Core hubs: `getProjectRoot()` (12 edges), `loadConfig()` (11), `handleStart()` (9), `handleOnboard()` (9), `saveConfig()` (9), `planAutoContinuation()` (8).
- Community 0: auto-continuation and workflow state (`auto.js`, `state.js`).
- Community 1: command status/context/refresh/upgrade handlers (`commands.js`).
- Community 2: onboarding/start config persistence (`commands.js`, `config.js`).
- Community 3: prompt builders and workflow reminder injection (`prompts.js`).
- Community 4: setup wizard and settings/theme writing (`setup.js`).
- Community 5: evaluator validation/decision logic (`evaluator.js`).
- Community 6: handoff extraction (`handoff.js`).
- Community 7: audit logging and redaction (`audit.js`).

## Extension Components

- `index.ts`: thin pi wiring, command registration, event hooks, module-cache busting.
- `src/config.js`: default config, init/load/save, upgrade helpers.
- `src/commands.js`: command handlers and `/my-pi:setup` orchestration.
- `src/prompts.js`: skill prompt construction and workflow reminder injection.
- `src/auto.js`: post-agent handoff evaluation and continuation planning.
- `src/evaluator.js`: deterministic continue/pause/complete decisions.
- `src/handoff.js`: latest handoff JSON extraction and shape recognition.
- `src/state.js`: active workflow start/update/pause/resume/clear.
- `src/audit.js`: JSONL audit logging with basic secret redaction.
- `src/setup.js`: deterministic pi settings/theme setup logic.

## Dependencies

- No npm runtime dependencies.
- Pi extension types from `@mariozechner/pi-coding-agent` at runtime.
- `ctx7` used by the `find-docs` skill for Context7 docs/research.
- `ast-grep` CLI used by the `ast-grep` skill.
- `graphify` Python tool used by the `graphify`/`project-intake` flow.
