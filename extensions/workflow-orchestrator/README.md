# Workflow Orchestrator Extension

Deterministic pi workflow orchestration extension.

## Current batch

Implemented test-first modules for:

- evaluator decisions
- handoff extraction/parsing
- config initialization/loading/saving
- active workflow state transitions
- JSONL audit logging
- skill prompt builders
- command handlers
- extension command registration
- passive `agent_end` handoff evaluation
- guarded auto-continuation with duplicate-entry protection

## Test

```bash
npm test
```

## Planned runtime commands

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
