# Commands

## Install

- `./scripts/install.sh` — installs skills, extensions, cleans old prompts, sets global settings

## Backup

- `./scripts/backup-current.sh` — refreshes repo from currently installed global pi state

## Test

- `cd extensions/workflow-orchestrator && npm test` — runs 54 unit tests

## Lint / Format

- No linter/formatter configured. Extension uses plain JS.

## Notes

- No build step needed. Pi loads TypeScript entrypoint via jiti.
- Tests use Node built-in test runner (`node --test`).
