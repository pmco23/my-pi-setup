# My Pi Setup

Portable backup and installer for my global pi workflow setup.

## What this includes

This repository contains reusable pi resources:

```text
skills/                   Global skills installed to ~/.agents/skills/
extensions/               Global extensions installed to ~/.pi/agent/extensions/
settings/                 Reference global pi settings
scripts/install.sh        Install this setup on a machine
scripts/uninstall.sh      Remove this setup from a machine
scripts/backup-current.sh Refresh this repo from the current machine
docs/                     Design notes and future extension discussion
USAGE.md                  How to use the workflow day to day
```

## Prerequisites

- [pi](https://github.com/badlogic/pi-mono) installed and available on PATH
- Node.js ≥ 18 (for extension runtime and tests)
- rsync (used by installer scripts)
- Python 3 + [graphify](https://pypi.org/project/graphifyy/) (optional, for `/workflow:onboard` and `/workflow:refresh`)

## Local development

Clone and run tests:

```bash
git clone https://github.com/pmco23/my-pi-setup.git
cd my-pi-setup
npm test
```

## Install

From this folder:

```bash
./scripts/install.sh
```

The installer:

1. Checks if graphify is installed and auto-syncs the bundled `skills/graphify/` skill if the installed package is newer — so the repo always has the current skill version before copying to global locations.
2. Copies skills and extension to global pi locations.
3. Copies the bundled `onyx` theme to `~/.pi/agent/themes/onyx.json`.
4. Ensures `enableSkillCommands: true` in `~/.pi/agent/settings.json`.

After installing, restart pi or run:

```text
/reload
```

## Keeping graphify up to date

The bundled `skills/graphify/` skill tracks the installed graphify package version in `.graphify_version`. When you upgrade graphify, running `./scripts/install.sh` is enough — it auto-refreshes the bundled skill before syncing:

```bash
# Upgrade graphify
uv tool upgrade graphifyy
# or: pip install --upgrade graphifyy

# Re-run install — auto-syncs bundled skill then installs everything
./scripts/install.sh
```

The installer prints `Updated bundled graphify skill: <old> -> <new>` when it detects and syncs a version change.

The test suite also includes a soft version-drift check — if the repo and installed versions differ, it prints a warning and reminds you to run `./scripts/install.sh`.

## What gets installed

### Global themes

```text
onyx
```

The installer copies `onyx` to `~/.pi/agent/themes/onyx.json`, so it is available in every project.

### Extension commands

```text
/my-pi:setup
/workflow:init
/workflow:start
/workflow:auto
/workflow:manual
/workflow:continue
/workflow:upgrade-config
/workflow:status
/workflow:onboard
/workflow:refresh
/workflow:context
/workflow:pause
/workflow:resume
```

### Skill commands

```text
/skill:project-intake
/skill:brainstorm-spec
/skill:implementation-research
/skill:acceptance-criteria
/skill:plan
/skill:execute
/skill:review-against-plan
/skill:code-review
```

Support skills (third-party, bundled for portability):

```text
/skill:find-docs
/skill:ast-grep
/skill:graphify
```

## Per-project workflow state

The installed resources are global, but each project keeps its own workflow state and project map:

```text
.pi/workflow-orchestrator.json
.pi/workflows/
.pi/project-map/
```

Optionally configure pi theme/settings with:

```text
/my-pi:setup
```

Initialise a project:

```text
/workflow:init
```

Then start a workflow — the mode you pass here is the single source of truth:

```text
/workflow:auto <goal>        → pi drives automatically
/workflow:manual <goal>      → you approve every step
```

For an existing codebase, onboard/map it before feature work:

```text
/workflow:onboard
```

To refresh project context or graph insights later, do not manually edit `.pi/project-map/` first. Use the graphify-backed refresh flow:

```text
/workflow:refresh
```

Check stale status with:

```text
/workflow:context
```

## Uninstall

To remove everything from the current machine:

```bash
./scripts/uninstall.sh
```

This removes the extension and workflow skills but leaves:

- `~/.pi/agent/settings.json` intact
- Support skills (`find-docs`, `ast-grep`, `graphify`) in place
- Project-local `.pi/` directories untouched

After uninstalling, restart pi or run `/reload`.

## Backup current machine state

To refresh this repository from the currently installed global pi setup:

```bash
./scripts/backup-current.sh
```

## Usage

See [`USAGE.md`](USAGE.md) for day-to-day workflow instructions.
