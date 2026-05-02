# Workflow Orchestrator Extension

Simplified pi workflow orchestration extension. Four commands. No routing. No flag.

## Commands

```text
/workflow:init       → setup wizard: mode + theme + thinking level + compaction + retry
/workflow:continue   → advance to suggested next skill, or resume after a pause
/workflow:pause      → stop auto-continuation
/workflow:resume     → clear pause state without advancing
```

## Modes

- **auto**: pi chains skills automatically after each handoff. Pauses on open questions, low confidence, blockers, failed validation, or risky actions.
- **user-in-the-loop**: pi suggests the next skill after each one completes. You run `/workflow:continue` when ready.

Mode is set once in `/workflow:init`. Re-run the wizard to change it.

## Bundled theme

`onyx` is bundled under `assets/onyx-theme.json`. The installer copies it to `~/.pi/agent/themes/onyx.json` so it is available across projects.

## Test

```bash
npm test
```
