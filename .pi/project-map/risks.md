# Risks

## Architecture Risks

- **`commands.js` is the hub**: 12 handlers plus `projectMapStaleness` and `syncModeToConfig`. Adding more increases coupling. Consider splitting by domain if it grows further.
- **`config.js` is high impact**: `defaultConfig()`, `upgradeConfig()`, and `loadConfig()` are called from every command and auto-continuation. Shape changes require updating config, evaluator, smoke tests, and project-level configs.
- **Config upgrade is explicit**: existing `.pi/workflow-orchestrator.json` files do not auto-migrate; users must run `/workflow:upgrade-config`.
- **`index.ts` runtime wiring is hard to unit-test**: `pendingWorkflowSkillResponse` and `projectMapRefreshMarkers` lifecycle are only indirectly validated through pure module tests.
- **Completion semantics**: `next_skill: "none"` returns `action: "complete"`, not `"pause"`. Runtime code depending on pause-only semantics must be aware of this distinction.

## Workflow Risks

- Skills are intentionally concise; runtime prompt reminders carry workflow handoff mechanics. If a model ignores the reminder, continuation may produce missing/malformed handoffs, causing pauses.
- `implementation-research` can consume external context quickly via Context7. Keep queries focused and avoid leaking sensitive information.

## Audit / Sanitize

- **`token(?!s)` pattern** in `audit.js` intentionally excludes `input_tokens`/`output_tokens` from redaction. Do not widen to plain `token` without considering impact on graphify cost fields.
- The regex is still not exhaustive — bearer tokens in URL query strings or non-standard key names could be missed.

## Operational Risks

- **Graphify semantic extraction unavailable in pi**: graphify requires Agent/subagent tool for full pipeline. Pi does not expose this. Graph refreshes inside pi are AST-only. For full semantic graph, run graphify from a subagent-capable harness and commit the artifacts.
- **`install.sh` graphify auto-sync**: runs `graphify install --platform pi` on every install. If graphify is not installed or the command fails, it exits with `|| true` — the install continues but the repo skill may be stale.
- **`install.sh` uses `rsync --delete`**: removing a file from the repo removes it globally on the next install. Intentional but high-impact.
- **pi version coupling**: extension uses pi event APIs. Pi API changes can break runtime behavior even if all pure module tests pass.

## Testing Gaps

- No real pi interactive/RPC integration test.
- No direct test for `index.ts` registered command discovery after `/reload`.
- No graphify output parsing/validation tests.
- No automated installer sandbox test.
- Runtime project-map manual-edit guard in `index.ts` is not unit-tested against pi events.
