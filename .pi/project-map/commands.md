# Commands

## Install

- `./scripts/install.sh` — installs skills, workflow extension, and global `onyx` theme.

## Uninstall

- `./scripts/uninstall.sh` — removes workflow extension and owned workflow skills from global locations.

## Backup

- `./scripts/backup-current.sh` — refreshes repo from currently installed global state.

## Test

- `npm test` — runs all extension tests from repo root.
- `cd extensions/workflow-orchestrator && npm test` — same test suite directly.

## Pi Runtime Commands

After install and `/reload`:

- `/my-pi:setup` — configure global/project pi settings and theme.
- `/workflow:init [auto|user-in-the-loop]` — create project workflow config.
- `/workflow:upgrade-config` — upgrade existing project config to current default sequence/transitions.
- `/workflow:status` — summarize workflow state.
- `/workflow:start [auto|user-in-the-loop] <goal>` — start default workflow.
- `/workflow:auto <goal>` — start in auto mode.
- `/workflow:manual <goal>` — start in user-in-the-loop mode.
- `/workflow:onboard [auto|user-in-the-loop] [optional goal]` — project intake/refresh preparation.
- `/workflow:refresh [auto|user-in-the-loop]` — refresh project map.
- `/workflow:context` — show project-map status.
- `/workflow:continue [auto|user-in-the-loop]` — continue active workflow.
- `/workflow:pause [reason]` — pause active workflow.
- `/workflow:resume` — clear pause without continuing.

## Lint / Format

- No linter/formatter configured.
- Extension uses plain JS/TS with existing style.

## Notes

- No build step required. Pi loads TypeScript entrypoint via jiti.
- No `npm install` required for tests; extension uses Node built-ins only.
- Installer uses `rsync --delete`, so removed skills/extensions in repo are removed from global install target.
