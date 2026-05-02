# Usage

This setup gives pi a structured workflow for turning ideas into reviewed implementation work.

## Two modes

| Mode | What happens |
|---|---|
| **auto** | Pi chains skill → skill automatically. Pauses only when there is genuine uncertainty, open questions, failed validation, or a risky action. |
| **user-in-the-loop** | Pi runs each skill and suggests the next one. You confirm each step with `/workflow:continue`. |

---

## Quick start

```bash
cd my-project
/workflow:init          # wizard: choose mode, theme, thinking level, compaction, retry
```

Then invoke a skill to start working:

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
/workflow:continue   → advance to the suggested next skill, or resume after a pause
/workflow:pause      → stop auto-continuation with an optional reason
/workflow:resume     → clear pause state without advancing
```

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
/skill:ast-grep      → structural code search (prefer over grep/rg when the query depends on code structure, not just text)
```

---

## Project files

Each project keeps its own state:

```text
.pi/workflow-orchestrator.json   → mode, stop conditions, active workflow (gitignored)
.pi/workflows/<id>.jsonl         → JSONL audit log (gitignored)
.pi/project-map/                 → committed durable project context
```

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

