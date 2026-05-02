# Commands

## Install & Setup

```bash
npm test                     # Run all extension tests (must pass before committing)
./scripts/install.sh         # Install skills + extension to global pi locations
./scripts/uninstall.sh       # Remove workflow extension and skills
./scripts/backup-current.sh  # Sync installed state back into repo
```

No `npm install` needed — extension uses only Node built-ins.

## Tests

```bash
# From repo root:
npm test

# Directly (same result):
cd extensions/workflow-orchestrator && node --test test/*.test.js
```

- 66 tests, 0 failures as of intake date
- Test files: `test/*.test.js` (audit, auto, commands, config, evaluator, handoff, prompts, skills, state, workflow-smoke)

## Pi Commands (after install + `/reload`)

```text
/workflow:init       → setup wizard (mode, theme, thinking level, compaction, retry)
/workflow:continue   → advance to suggested next skill, or resume after pause
/workflow:pause      → stop auto-continuation with optional reason
/workflow:resume     → clear pause state without advancing
/skill:project-intake
/skill:brainstorm-spec
/skill:implementation-research
/skill:acceptance-criteria
/skill:plan
/skill:execute
/skill:review-against-plan
/skill:code-review
/skill:find-docs
/skill:ast-grep
```

## Lint / Format

No linter or formatter configured. Follow existing code style manually.

## Notes

- After editing any source file: `npm test` → `./scripts/install.sh` → `/reload` in pi
- `.pi/workflow-orchestrator.json` and `.pi/workflows/` are gitignored (per-project state)
- `.pi/project-map/` is committed (durable agent context)
