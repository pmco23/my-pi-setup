# Workflow Orchestrator Extension Notes

## Purpose

Document the current extension-managed workflow orchestration setup and capture remaining follow-up work.

## Current State

The workflow uses global skills plus a global pi extension.

Main workflow:

```text
brainstorm-spec
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

Extension-managed commands:

```text
/workflow:init [auto|user-in-the-loop]
/workflow:start [auto|user-in-the-loop] <goal>
/workflow:auto <goal>
/workflow:manual <goal>
/workflow:continue [auto|user-in-the-loop]
/workflow:status
/workflow:pause [reason]
/workflow:resume
```

Old prompt-template commands such as `/workflow-init` and `/workflow-start` are deprecated and not installed. Reference copies are kept under:

```text
Projects/my-pi-setup/deprecated/prompts/
```

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
│   └── state.js
├── test/
│   ├── audit.test.js
│   ├── auto.test.js
│   ├── commands.test.js
│   ├── config.test.js
│   ├── evaluator.test.js
│   ├── handoff.test.js
│   ├── prompts.test.js
│   └── state.test.js
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
- **Prompt templates:** deprecated; extension commands are authoritative.
- **Evaluator location:** extension module at `src/evaluator.js`.
- **Support skills:** `find-docs`, `ast-grep`, and `graphify` are support skills, not main workflow transitions.

## Remaining Improvements

- Add `/workflow:debug` to print the last parsed handoff and evaluator decision.
- Add config migration support if `version` changes.
- Consider reading `ctx.sessionManager.getBranch()` as fallback if `agent_end` event messages do not include the expected assistant handoff.
- Add integration tests around installed pi RPC command discovery if feasible.
- Consider removing deprecated prompt files entirely once no longer useful as references.

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
