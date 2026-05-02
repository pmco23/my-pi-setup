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

## Bundled theme

`onyx` is bundled under `assets/onyx-theme.json`. The repository installer copies it to `~/.pi/agent/themes/onyx.json` so it is available across projects.

## Planned runtime commands

```text
/my-pi:setup
/workflow:init
/workflow:start
/workflow:auto
/workflow:manual
/workflow:continue
/workflow:upgrade-config
/workflow:status
/workflow:pause
/workflow:resume
```
