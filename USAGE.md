# Usage

This setup gives pi a structured workflow for turning ideas into reviewed implementation work.

## Two modes

| Mode | What happens |
|---|---|
| **auto** | Pi chains skill → skill automatically. Pauses on open questions, low confidence, blockers, failed validation, risky actions, or before execute (by default). |
| **user-in-the-loop** | Pi runs each skill and suggests the next one. You confirm each step with `/workflow:continue`. |

---

## Quick start

```bash
cd my-project
/workflow:init          # wizard: choose mode, theme, thinking level, compaction, retry
/workflow:start         # pick a starting skill and set a goal
```

Or invoke a skill directly:

```text
/skill:brainstorm-spec build a local-first notes app
/skill:project-intake                                  # map an existing codebase first
/skill:plan add dark mode support                      # jump straight to planning
```

In **auto mode**, pi chains skills automatically from there.
In **user-in-the-loop mode**, pi suggests the next skill after each one completes — run `/workflow:continue` when ready.

---

## Core workflow

```text
brainstorm-spec
→ implementation-research
→ acceptance-criteria
→ plan → execute → review-against-plan → code-review
```

`project-intake` is used for onboarding/refresh and hands off to `plan` or `none`.

---

## Commands

```text
/workflow:init       → full setup wizard (run once per project, or re-run to change settings)
/workflow:start      → start a new workflow: pick a skill and set a goal
/workflow:continue   → advance to the suggested next skill, or resume after a pause
/workflow:pause      → stop auto-continuation with an optional reason
/workflow:status     → show current workflow state (skill, goal, artifact, paused)
```

---

## Skill artifacts

Each skill writes its primary output to a durable file that survives compaction and session breaks:

```text
.pi/workflows/<wf-id>/01-brainstorm-spec.md
.pi/workflows/<wf-id>/02-plan.md
.pi/workflows/<wf-id>/03-execute.md
.pi/workflows/<wf-id>/04-review-against-plan.md
```

The next skill automatically receives the path to the previous artifact and reads it for full context. This means:

- No context loss between skill transitions
- You can review any step's full output at any time
- Session breaks are recoverable — just run `/workflow:status` and `/workflow:continue`

---

## Mapping an existing codebase

Before starting feature work on an unfamiliar project:

```text
/skill:project-intake
```

This scans the codebase and creates `.pi/project-map/` with architecture docs, module map, agent guidance, and more.

To refresh after significant changes:

```text
/skill:project-intake
```

The skill detects whether it is a first-time onboard or a refresh automatically.

---

## Support skills

These enrich the current workflow phase rather than advancing it:

```text
/skill:find-docs     → fetch current library/API docs via Context7
/skill:ast-grep      → structural code search (prefer over grep/rg for structure-dependent queries)
```

---

## Project files

Each project keeps its own state:

```text
.pi/workflow-orchestrator.json       → mode, stop conditions, active workflow (gitignored)
.pi/workflows/<wf-id>.jsonl          → JSONL audit log (gitignored)
.pi/workflows/<wf-id>/              → skill artifact files (gitignored)
.pi/project-map/                    → committed durable project context
```

---

## Checking workflow state

```text
/workflow:status
```

Shows: workflow ID, goal, current/next skill, mode, paused state, and last artifact path.

---

## Updating this setup

After changing global skills or extensions, refresh the repo and push:

```bash
./scripts/backup-current.sh
git add -A && git commit -m "..." && git push
```

On another machine:

```bash
./scripts/install.sh
```
