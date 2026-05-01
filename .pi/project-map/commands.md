# Commands

## Install

- `./scripts/install.sh` — installs skills and extension globally, cleans old prompts, sets settings

## Uninstall

- `./scripts/uninstall.sh` — removes extension and workflow skills from global locations

## Backup

- `./scripts/backup-current.sh` — refreshes repo from currently installed global state

## Test

- `npm test` (from root) — runs all 56 extension unit tests
- `cd extensions/workflow-orchestrator && npm test` — same, direct

## Lint / Format

- No linter/formatter configured. Extension uses plain JS.

## Notes

- No build step needed. Pi loads TypeScript entrypoint via jiti.
- Tests use Node built-in test runner (`node --test`).
- No `npm install` required — extension uses only Node built-ins.
