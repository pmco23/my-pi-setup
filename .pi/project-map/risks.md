# Risks

## Architecture Risks

- **`commands.js` remains a hub**: it handles workflow commands and setup orchestration. If it grows further, split command groups by domain.
- **`config.js` is high impact**: default sequence, transitions, support skills, and upgrade behavior affect evaluator, commands, auto-continuation, and tests.
- **Config upgrade is explicit**: existing project configs do not auto-migrate; users must run `/workflow:upgrade-config`.
- **`index.ts` runtime wiring is hard to unit-test**: pi event hooks and `pendingWorkflowSkillResponse` lifecycle are mostly validated indirectly through pure modules.
- **Completion semantics changed**: `next_skill: "none"` now produces `action: "complete"`; any future runtime code should preserve that distinction from pause.

## Workflow Risks

- Skills are intentionally concise; runtime prompt reminders carry workflow handoff mechanics. If users invoke skills outside workflow-orchestrator, skills still work but continuation is manual.
- `implementation-research` can consume external context quickly. Keep research focused and avoid leaking secrets into Context7/web queries.
- Missing or malformed handoff from workflow skill responses pauses by design; this is safe but can interrupt auto mode if a model ignores the reminder.

## Operational Risks

- **Graphify dependency**: project intake depends on optional external graphify tooling. If missing, project-map docs should still be created but graph insights may be absent.
- **Context7 dependency**: `find-docs`/research quality depends on `ctx7` availability, quota, and network access.
- **pi version coupling**: extension uses pi extension APIs/events. Pi API changes can break runtime behavior even if pure tests pass.
- **Installer `--delete` behavior**: removing a skill/extension file from repo removes it globally on install. This is intentional but risky for accidental deletions.
- **Global theme conflict**: `onyx` should exist only as `~/.pi/agent/themes/onyx.json` plus non-discoverable repo asset `assets/onyx-theme.json`.

## Testing Gaps

- No real pi interactive/RPC integration test.
- No direct test for `index.ts` registered command discovery after `/reload`.
- No graphify output parsing/validation tests.
- No automated test for installer effects in a sandboxed fake home.

## Security / Privacy

- `audit.js` redaction is regex-based and not exhaustive.
- Workflow logs and project configs can contain user goals or artifact summaries; review before sharing.
- External research queries must not include secrets, credentials, proprietary code, or personal data.
