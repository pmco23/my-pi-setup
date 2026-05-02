# My Pi Setup

Portable backup and installer for my global pi workflow setup.

## What this includes

This repository contains reusable pi resources:

```text
skills/                   Global skills installed to ~/.agents/skills/
extensions/               Global extensions installed to ~/.pi/agent/extensions/
scripts/install.sh        Install this setup on a machine
scripts/uninstall.sh      Remove this setup from a machine
scripts/backup-current.sh Refresh this repo from the current machine
USAGE.md                  How to use the workflow day to day
CONTRIBUTING.md           Development and contribution guide
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
/workflow:init       → setup wizard (mode, theme, thinking level, compaction, retry)
/workflow:start      → start a new workflow with a skill and goal
/workflow:continue   → advance to suggested next skill, or resume after a pause
/workflow:pause      → stop auto-continuation
/workflow:status     → show current workflow state
/workflow:debug      → show last handoff, evaluator decision, and config
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
.pi/workflow-orchestrator.json       → mode, stop conditions, active workflow (gitignored)
.pi/workflows/<wf-id>.jsonl          → audit log per workflow (gitignored)
.pi/workflows/<wf-id>/              → skill artifacts per workflow (gitignored)
.pi/project-map/                    → durable project context
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

Then start a workflow:

```text
/workflow:start
```

Or invoke a skill directly. In auto mode, pi chains automatically. In user-in-the-loop mode, run `/workflow:continue` after each skill.

## Skill artifacts

Each skill writes its primary output (design spec, plan, review report) to a durable file:

```text
.pi/workflows/<wf-id>/01-brainstorm-spec.md
.pi/workflows/<wf-id>/02-plan.md
.pi/workflows/<wf-id>/03-execute.md
...
```

Artifacts survive compaction and session breaks. The next skill in the chain reads the previous artifact for full context.

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
