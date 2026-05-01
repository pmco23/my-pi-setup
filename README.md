# My Pi Setup

Portable backup and installer for my global pi workflow setup.

## What this includes

This repository contains reusable pi resources:

```text
skills/                   Global skills installed to ~/.agents/skills/
extensions/               Global extensions installed to ~/.pi/agent/extensions/
deprecated/prompts/       Old workflow prompt templates kept for reference, not installed
settings/                 Reference global pi settings
scripts/install.sh        Install this setup on a machine
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

The installer copies:

```text
skills/*     -> ~/.agents/skills/
extensions/* -> ~/.pi/agent/extensions/
```

It also ensures global pi settings include:

```json
{
  "enableSkillCommands": true
}
```

After installing, restart pi or run:

```text
/reload
```

## What gets installed

### Extension commands

```text
/workflow:init
/workflow:start
/workflow:auto
/workflow:manual
/workflow:continue
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
/skill:acceptance-criteria
/skill:plan
/skill:execute
/skill:review-against-plan
/skill:code-review
```

Support skills are also included when present:

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

Initialize a project with:

```text
/workflow:init user-in-the-loop
```

or:

```text
/workflow:init auto
```

For an existing codebase, onboard/map it before feature work:

```text
/workflow:onboard
```

## Backup current machine state

To refresh this repository from the currently installed global pi setup:

```bash
./scripts/backup-current.sh
```

## Usage

See [`USAGE.md`](USAGE.md) for day-to-day workflow instructions.
