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

1. Copies skills and extension to global pi locations.
2. Copies the bundled `onyx` theme to `~/.pi/agent/themes/onyx.json`.
3. Ensures `enableSkillCommands: true` in `~/.pi/agent/settings.json`.

After installing, restart pi or run:

```text
/reload
```


## What gets installed

### Global themes

```text
onyx
```

The installer copies `onyx` to `~/.pi/agent/themes/onyx.json`, so it is available in every project.

### Extension commands

```text
/workflow:init
/workflow:continue
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

Support skills:

```text
/skill:find-docs
/skill:ast-grep
```

## Per-project workflow state

The installed resources are global, but each project keeps its own workflow state and project map:

```text
.pi/workflow-orchestrator.json
.pi/workflows/
.pi/project-map/
```

Initialise a project:

```text
/workflow:init
```

The wizard sets mode (auto or user-in-the-loop), theme, thinking level, compaction, and retry.

For an existing codebase, map it first:

```text
/skill:project-intake
```

Then invoke a skill to start working. In auto mode, pi chains automatically. In user-in-the-loop mode, run `/workflow:continue` after each skill.

To refresh project context after significant changes, do not manually edit `.pi/project-map/`. Use `/skill:project-intake` — it detects first-time vs. refresh automatically.

## Uninstall

To remove everything from the current machine:

```bash
./scripts/uninstall.sh
```

This removes the extension and workflow skills but leaves:

- `~/.pi/agent/settings.json` intact
- Support skills (`find-docs`, `ast-grep`) in place
- Project-local `.pi/` directories untouched

After uninstalling, restart pi or run `/reload`.

## Backup current machine state

To refresh this repository from the currently installed global pi setup:

```bash
./scripts/backup-current.sh
```

## Usage

See [`USAGE.md`](USAGE.md) for day-to-day workflow instructions.
