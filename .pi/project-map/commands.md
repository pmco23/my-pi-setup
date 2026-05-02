# Commands

## Install

- `./scripts/install.sh` — auto-syncs graphify skill if newer, installs skills + extension globally, copies `onyx` theme.

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
- `/workflow:init [auto|user-in-the-loop]` — create project workflow config.
- `/workflow:upgrade-config` — upgrade existing project config to current default sequence/transitions.
- `/workflow:status` — summarise workflow state.
- `/workflow:start [auto|user-in-the-loop] <goal>` — start workflow; routes to first skill based on goal text.
- `/workflow:auto <goal>` — start in auto mode.
- `/workflow:manual <goal>` — start in user-in-the-loop mode.
- `/workflow:onboard [auto|user-in-the-loop] [optional goal]` — project intake/refresh.
- `/workflow:refresh` — refresh project map using graphify.
- `/workflow:context` — show project-map status and staleness.
- `/workflow:continue [auto|user-in-the-loop]` — continue active workflow.
- `/workflow:pause [reason]` — pause active workflow.
- `/workflow:resume` — clear pause without continuing.

## Keeping Graphify Up to Date

```bash
uv tool upgrade graphifyy      # or: pip install --upgrade graphifyy
./scripts/install.sh           # auto-syncs bundled skill then installs everything
```

## Notes

- No build step. Pi loads TypeScript entrypoint via jiti.
- No `npm install` required — extension uses Node built-ins only.
- `rsync --delete` in installer: removing files from repo removes them from global install target.
