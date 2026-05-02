# Commands

## Install

- `./scripts/install.sh` — installs skills + extension globally, copies `onyx` theme.

## Uninstall

- `./scripts/uninstall.sh` — removes workflow extension and owned workflow skills (including `implementation-research`) from global pi locations.

## Backup

- `./scripts/backup-current.sh` — refreshes repo from currently installed global pi state.

## Test

```bash
npm test                                          # from repo root (80 tests)
cd extensions/workflow-orchestrator && npm test  # direct
```

## Pi Runtime Commands

After install and `/reload`:

- `/my-pi:setup` — interactive wizard: configure scope, theme, thinking level, compaction, retry.
- `/workflow:init` — create project workflow config. Mode is optional; start is what sets mode.
- `/workflow:auto <goal>` — start workflow in auto mode (pi drives).
- `/workflow:manual <goal>` — start workflow in user-in-the-loop mode (you approve every step).
- `/workflow:start [auto|user-in-the-loop] <goal>` — explicit form of the above two; always syncs config mode.
- `/workflow:upgrade-config` — upgrade existing project config to current default sequence/transitions.
- `/workflow:status` — summarise workflow state.
- `/workflow:continue [mode]` — resume; explicit mode also syncs config.
- `/workflow:pause [reason]` — pause active workflow.
- `/workflow:resume` — clear pause without continuing.
- `/workflow:onboard [auto|user-in-the-loop] [optional goal]` — project intake/refresh.

- `/workflow:context` — show project-map status and staleness.

## Notes

- No build step. Pi loads TypeScript entrypoint via jiti.
- No `npm install` required — extension uses Node built-ins only.
- `rsync --delete` in installer: removing files from repo removes them from global install target.
