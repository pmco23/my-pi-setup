# Usage

This setup gives pi a structured workflow for turning ideas into reviewed implementation work.

## Core workflow

The default flow is:

```text
brainstorm-spec
→ implementation-research
→ acceptance-criteria
→ plan
→ execute
→ review-against-plan
→ code-review
```

Use `workflow-orchestrator` to coordinate the flow and persist project state.

Optionally configure pi theme/settings first:

```text
/my-pi:setup
```

The bundled `onyx` theme is installed globally by `./scripts/install.sh`, so it is available from any project.

For existing projects, run onboarding first:

```text
/workflow:onboard
```

This uses `project-intake` and graphify-first mapping to create `.pi/project-map/`.

## Starting in a new project

From inside a project folder:

```text
/workflow:init user-in-the-loop
```

Then start the workflow:

```text
/workflow:start user-in-the-loop build a local-first notes app
```

For auto mode:

```text
/workflow:init auto
/workflow:start auto build a local-first notes app
```

## Recommended modes

### User-in-the-loop

Best for design, architecture, uncertain requirements, and risky work.

```text
/workflow:manual <goal or task>
```

Behavior:

- pi stops after each workflow skill
- pi recommends the next skill
- you approve before continuing

### Auto

Best for small, low-risk, well-scoped tasks.

```text
/workflow:auto <goal or task>
```

Behavior:

- pi continues only when the deterministic evaluator allows it
- pi pauses on open questions, low confidence, blockers, failed validation, risky actions, or invalid handoffs

## Existing project onboarding

For a project not originally built with this workflow:

```text
/workflow:init user-in-the-loop
/workflow:onboard
/workflow:context
```

`/workflow:onboard` creates or updates:

```text
.pi/project-map/intake.md
.pi/project-map/commands.md
.pi/project-map/architecture.md
.pi/project-map/modules.md
.pi/project-map/testing.md
.pi/project-map/conventions.md
.pi/project-map/risks.md
.pi/project-map/agent-guidance.md
.pi/project-map/graph/graph.html
.pi/project-map/graph/graph.json
.pi/project-map/graph/audit.md
```

`/workflow:context` reports whether project guidance and graph artifacts exist.

## Refreshing project context

After significant codebase changes (new modules, refactors, dependency updates, architecture shifts):

```text
/workflow:refresh
```

This re-runs `project-intake` with graphify and updates all `.pi/project-map/*` files without disturbing the active workflow state. Do not manually edit `.pi/project-map/` first when the goal is to refresh context, graph insights, agent guidance, architecture maps, or repo maps.

### Graphify inside pi: AST-only graphs

Graphify's full pipeline uses parallel subagents for semantic extraction of docs, markdown, and code meaning. Pi does not expose the Agent/subagent tool graphify requires, so graph refreshes inside pi produce **AST-backed graphs only** — code structure nodes and edges, without document/skill/markdown semantic analysis.

This is still useful for structural architecture and coupling insights. But for a full semantic graph:

```bash
# Outside pi, from a terminal
graphify install     # update the bundled skill
cd <project-root>
# then invoke /graphify from a harness with subagent support (Claude Code, Codex, etc.)
```

Refresh `/.pi/project-map/graph/` artifacts and then run `/workflow:refresh` inside pi to pick up the enriched graph insights.

## Continuing later

From the same project folder:

```text
/workflow:continue
```

Or with a one-run mode override:

```text
/workflow:continue auto
```

Project state is read from:

```text
.pi/workflow-orchestrator.json
```

## Upgrading project workflow config

Existing projects do not auto-migrate when the default workflow changes. To update `.pi/workflow-orchestrator.json` to the current default sequence/transitions while preserving active workflow state:

```text
/workflow:upgrade-config
```

## Checking status

```text
/workflow:status
```

This should summarize:

- configured default mode
- auto-continue settings
- active workflow ID
- current skill
- next skill
- artifact log path
- last update
- project-map file presence and stale status
- suggested `/workflow:refresh` when context appears stale

## Direct skill usage

You can also invoke skills directly:

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

Use direct skills when you want to jump to a specific stage instead of using the orchestrator.

## Support skills

These are helper skills used inside workflow stages:

```text
/skill:find-docs
/skill:ast-grep
/skill:graphify
```

Typical use:

- `implementation-research`: main workflow phase for current implementation examples, prior art, Context7-backed docs/research, and approach tradeoffs
- `find-docs`: current library/framework/API documentation
- `ast-grep`: structural code search and pattern verification
- `graphify`: architecture, relationship, and domain mapping

Support skills do not change the main workflow stage. They enrich the current stage.

## Project files created by the workflow

Each project may contain:

```text
.pi/workflow-orchestrator.json
.pi/workflows/<workflow-id>.jsonl
.pi/project-map/
```

These are project-specific and should be committed only if you want to share workflow state with collaborators.

## Typical new project flow

```text
/workflow:init user-in-the-loop
/workflow:start user-in-the-loop <project idea>
```

Then approve each step:

```text
brainstorm-spec → implementation-research → acceptance-criteria → plan → execute → review-against-plan → code-review
```

## Typical existing project flow

First onboard the codebase:

```text
/workflow:init user-in-the-loop
/workflow:onboard
```

Then start feature work.

For a new feature:

```text
/workflow:manual add GitHub OAuth login
```

For a focused implementation task:

```text
/workflow:auto fix the failing user settings form test
```

For reviewing completed work:

```text
/skill:review-against-plan
```

or:

```text
/skill:code-review
```

## Updating this setup repository

After changing global skills or extensions on this machine, refresh this folder with:

```bash
./scripts/backup-current.sh
```

Then commit/sync the updated `my-pi-setup` folder so another computer can install the same setup.

## Important limitations

The workflow is now extension-managed, but it still depends on skills producing valid handoff JSON. Invalid or missing handoffs fail closed and pause the workflow.

For stricter runtime automation, see:

```text
docs/workflow-extension-discussion.md
```
