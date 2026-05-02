# Workflow Orchestrator Extension Notes

## Purpose

Document the current extension-managed workflow orchestration setup and capture remaining follow-up work.

## Current State

The workflow uses global skills plus a global pi extension.

Main workflow:

```text
brainstorm-spec
→ implementation-research
→ acceptance-criteria
→ plan
→ execute
→ review-against-plan
→ code-review
```

Global extension:

```text
~/.pi/agent/extensions/workflow-orchestrator/index.ts
```

Portable source copy:

```text
Projects/my-pi-setup/extensions/workflow-orchestrator/
```

Per-project state:

```text
.pi/workflow-orchestrator.json
.pi/workflows/<workflow-id>.jsonl
```

The extension owns workflow commands, config initialization, handoff evaluation, auto-continuation, and JSONL audit logging.

## Commands

```text
/workflow:init       → setup wizard: mode + pi settings + project config
/workflow:continue   → advance to pending next skill, or resume after a pause
/workflow:pause      → stop auto-continuation
/workflow:resume     → clear pause without advancing
```

**Mode ownership:** Mode is set once in the `/workflow:init` wizard and stored in config.
To change mode, re-run `/workflow:init`. There is no per-start mode override.

**Codebase mapping:** Use `/skill:project-intake` directly. There is no `/workflow:onboard`
or `/workflow:refresh` command in v2.

## Runtime Decision Model

The extension treats the evaluator module as the source of truth:

```text
assistant handoff JSON
→ extractLatestHandoff()
→ evaluateHandoff()
→ continue | pause | none
```

Fail-closed rules:

- malformed handoff: pause
- missing handoff while workflow is active: pause
- missing config: no-op until initialized
- invalid transition: pause
- open questions: pause
- low confidence: pause
- blockers: pause
- failed validation: pause
- risky/destructive action: pause
- duplicate processed assistant entry: no-op

## Implemented Extension Structure

```text
extensions/workflow-orchestrator/
├── index.ts
├── src/
│   ├── audit.js
│   ├── auto.js
│   ├── commands.js
│   ├── config.js
│   ├── evaluator.js
│   ├── handoff.js
│   ├── prompts.js
│   ├── setup.js
│   └── state.js
├── assets/
│   ├── onyx-theme.json
│   └── pre-push-hook.sh
├── test/
│   ├── audit.test.js
│   ├── auto.test.js
│   ├── commands.test.js
│   ├── config.test.js
│   ├── evaluator.test.js
│   ├── handoff.test.js
│   ├── prompts.test.js
│   ├── setup.test.js
│   ├── skills.test.js
│   ├── state.test.js
│   └── workflow-smoke.test.js
├── package.json
└── README.md
```

## TDD Approach

Development is test-first. Keep deterministic workflow logic in pure modules and keep pi-specific command/event wiring thin.

Current test command:

```bash
cd extensions/workflow-orchestrator
npm test
```

Current test coverage includes:

- config initialization/loading/saving
- active workflow state transitions
- JSONL audit logging and basic secret redaction
- handoff extraction and malformed-handoff fail-closed behavior
- deterministic evaluator decisions
- prompt builders
- command handlers
- post-agent auto-continuation planning
- duplicate-entry guard

## Implemented Runtime Behavior

The extension registers commands in `index.ts` and listens to `agent_end`.

On `agent_end`:

1. read project `.pi/workflow-orchestrator.json`
2. extract latest assistant markdown from `event.messages`
3. parse latest handoff JSON
4. evaluate against config transitions and stop conditions
5. update active workflow state
6. append JSONL audit entry
7. if decision is `continue`, queue next `/skill:<name>` using `pi.sendUserMessage(..., { deliverAs: "followUp" })`
8. if decision is `pause`, notify user

## Decisions

- **Implementation form:** pi extension.
- **Post-agent hook:** `agent_end` for MVP.
- **Artifact log format:** JSONL only.
- **Prompt templates:** removed; extension commands are authoritative.
- **Evaluator location:** extension module at `src/evaluator.js`.
- **Support skills:** `find-docs`, `ast-grep`, and `graphify` are support skills, not main workflow transitions.

## Remaining Improvements

- Add `/workflow:debug` to print the last parsed handoff and evaluator decision.
- Consider reading `ctx.sessionManager.getBranch()` as fallback if `agent_end` event messages do not include the expected assistant handoff.
- Add integration tests around installed pi RPC command discovery if feasible.

## Validation Checklist

After install/reload:

```bash
cd ~/.pi/agent/extensions/workflow-orchestrator
npm test
```

Expected: 56 tests, 0 failures.

Verify commands via pi RPC or interactive autocomplete:

```text
/workflow:init
/workflow:start
/workflow:auto
/workflow:manual
/workflow:continue
/workflow:status
/workflow:pause
/workflow:resume
```

Verify old prompt commands are absent:

```text
/workflow-init  # should be missing
/workflow-start # should be missing
```
