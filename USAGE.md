# Usage

This setup gives pi a structured workflow for turning ideas into reviewed implementation work.

## Two modes — the only thing you need to understand

| Mode | What happens |
|---|---|
| **auto** | Pi chains skill → skill automatically. Pauses only when there is genuine uncertainty, open questions, failed validation, or a risky action. |
| **user-in-the-loop** | Pi stops after every skill and waits for you to say "continue". You stay in the driver's seat at every step. |

**How to choose:**

```text
/workflow:auto <goal>         → pi drives, you intervene when needed
/workflow:manual <goal>       → you approve every step
```

That is it. The mode you pass to these commands is the single source of truth — it sets everything consistently.

`/workflow:init` just creates the config file. It does not need a mode. Start is what matters.

---

## Core workflow

```text
brainstorm-spec
→ implementation-research
→ acceptance-criteria
→ plan
→ execute
→ review-against-plan
→ code-review
```

---

## Quick start

### New project

```bash
cd my-project
/workflow:init
/workflow:auto build a local-first notes app       # fully automated
# or
/workflow:manual build a local-first notes app     # approve every step
```

### Existing codebase

```bash
/workflow:init
/workflow:onboard                                  # map codebase with graphify first
/workflow:auto add GitHub OAuth login
```

### One-off setup

```text
/my-pi:setup         → configure theme, thinking level, compaction, retry
```

---

## When to use each mode

### `/workflow:auto <goal>`

Best for:
- Small, low-risk, well-scoped tasks
- Fixes, refactors, adding tests
- Work where requirements are already clear

Pi will pause automatically if it encounters open questions, low confidence, blockers, failed validation, or risky operations. You only get involved when something needs a decision.

### `/workflow:manual <goal>`

Best for:
- New features with uncertain requirements
- Architecture decisions
- Anything you want to review at each phase

Pi stops after every skill (after brainstorm, after research, after planning, etc.) and asks whether to continue.

---

## Changing mode mid-workflow

Override mode for a single continuation:

```text
/workflow:continue auto             → continue this step in auto mode
/workflow:continue user-in-the-loop → continue this step manually
```

When you pass an explicit mode to `/workflow:continue`, it also updates the project config so subsequent steps use the same mode.

---

## Starting from a specific skill

Skip phases you don't need by invoking a skill directly:

```text
/skill:plan implement rate limiting middleware        → jump straight to planning
/skill:execute                                        → implement from an existing plan
/skill:code-review                                    → review without a full workflow
```

Skills work standalone — they don't require an active workflow.

---

## Project onboarding and context

### Onboard an existing project

```text
/workflow:init
/workflow:onboard
```

Creates `.pi/project-map/` with architecture docs, module map, and graph. Takes a few minutes. Do this once when entering a new codebase.

Optional: pass a goal to prepare for immediate feature work:

```text
/workflow:onboard auto add dark mode support
```

### Refresh project context

After significant changes (new modules, refactors, dependency updates):

```text
/workflow:refresh
```

Check whether context is stale:

```text
/workflow:context
```

### Graphify inside pi: AST-only graphs

Graphify's full pipeline requires parallel subagents. Pi does not expose this, so graph refreshes inside pi produce **AST-only graphs** — code structure only, without doc/markdown semantic analysis.

For a full semantic graph, run graphify from a harness with subagent support (Claude Code, Codex, etc.) and commit the updated `.pi/project-map/graph/` artifacts.

---

## Workflow state commands

```text
/workflow:status          → show mode, active workflow, current/next skill
/workflow:pause [reason]  → pause the active workflow
/workflow:resume          → clear pause without continuing
/workflow:continue [mode] → continue the active workflow
```

---

## Config management

```text
/workflow:upgrade-config  → migrate existing project config to current defaults
```

Existing `.pi/workflow-orchestrator.json` files do not auto-migrate when the workflow sequence changes. Run this after upgrading the setup.

---

## Support skills

These enrich the current workflow phase rather than advancing it:

```text
/skill:find-docs     → fetch current library/API docs via Context7
/skill:ast-grep      → structural code search
/skill:graphify      → architecture and knowledge graph
```

---

## Project files

Each project keeps its own state:

```text
.pi/workflow-orchestrator.json   → mode, sequence, active workflow (gitignored)
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
