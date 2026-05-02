# Architecture

## Overview

A pi coding-agent extension that implements a structured, multi-skill workflow orchestrator. Skills are discrete phases (brainstorm → research → criteria → plan → execute → review); the extension chains them automatically (auto mode) or suggests the next step (user-in-the-loop mode) by parsing a JSON handoff block that each skill emits at the end of its response.

## Runtime Flow

```
User invokes /skill:<name>
         │
         ▼
[pi agent runs skill]
         │
         ▼  (skill emits "## Next Step" + compact auto handoff JSON block)
pi fires `agent_end` event
         │
         ▼
index.ts → planAutoContinuation()
         │
         ├── extractLatestHandoff()   parse JSON from assistant markdown
         ├── evaluateHandoff()        validate schema + decide continue/pause/complete
         ├── updateActiveWorkflow()   mutate config state
         └── (auto) → pi.sendUserMessage(buildSkillPrompt())
             (loop) → ctx.ui.notify(suggestion)
             (done) → clearWorkflow()
```

## Two Modes

| Mode | Behaviour |
|---|---|
| **auto** | Extension calls next skill automatically; pauses on open questions, low confidence, failed validation, blockers, or destructive signals |
| **user-in-the-loop** | Extension surfaces suggestion via `notify`; user runs `/workflow:continue` to advance |

Mode is set once by `/workflow:init` wizard, stored in `config.mode`, propagated to `auto_continue.enabled`.

## Config Version

Only **v2** is accepted. V1 configs are rejected at load time — user must re-run `/workflow:init`.

## Skill Transition Graph (default)

```
brainstorm-spec → implementation-research, acceptance-criteria, plan
implementation-research → acceptance-criteria, plan
acceptance-criteria → plan
plan → execute
execute → review-against-plan
review-against-plan → execute, code-review, none
code-review → execute, review-against-plan, none
project-intake → plan, none
```

## Key Integrations

- **pi ExtensionAPI**: `registerCommand`, `on("tool_call")`, `on("agent_end")`, `sendUserMessage`, `ctx.ui.notify/select/confirm/input`
- **git**: `getProjectRoot` uses `git rev-parse --show-toplevel`; pre-push hook warns on stale context
- **Node built-ins only**: `fs`, `path`, `child_process`, `os` — no npm runtime deps
