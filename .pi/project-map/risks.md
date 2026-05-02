# Risks

## R1 — `index.ts` Wiring Is Untested

`index.ts` registers commands and wires `agent_end` / `tool_call` events but has no automated tests. Bugs at the pi ExtensionAPI boundary (wrong event shape, bad ctx access) would only surface at runtime. **Mitigation**: keep `index.ts` thin; all logic in testable `src/` modules.

## R2 — Config Version Upgrade Is Manual

V1 configs are rejected at load; users must re-run `/workflow:init`. There is no migration path. **Risk**: projects with old configs silently stop working after an update. **Mitigation**: clear error message with action; document in `docs/`.

## R3 — Handoff Parsing Is Heuristic

`extractLatestHandoff` matches JSON blocks by duck-typing and looks for "Auto handoff:" text prefix. If a skill outputs a large JSON block that happens to match the shape, it may be misidentified. **Mitigation**: schema validated by `evaluateHandoff`; malformed blocks cause pause not silent skip.

## R4 — `setup.js` Writes Live Pi Settings

`applyPiSetup` merges into `~/.pi/agent/settings.json` (and/or project `.pi/settings.json`). Corrupt existing JSON causes a backup + overwrite fallback inside `install.sh` but not inside `setup.js` itself — it would silently write `{}` base. **Mitigation**: `readJsonIfPresent` logs a warning before falling back.

## R5 — `projectMapStaleness` Is Mtime-Based

Staleness detection compares `agent-guidance.md` mtime against `extensions/`, `skills/`, and `docs/` files. This misses changes to `scripts/` or `settings/`, and mtime can be unreliable across git checkouts or rsync. **Risk**: stale warnings may fire or not fire incorrectly. **Mitigation**: warning is advisory only, not blocking.

## R6 — No Lockfile / Version Pinning

`package.json` has no `devDependencies` and uses `node:test`. No `package-lock.json` present. Node version drift between machines could affect test behavior. **Mitigation**: README requires Node ≥ 18.

## R7 — `find-docs` May Become Stale; `ast-grep` Has an Implicit CLI Dependency

`find-docs` references the `ctx7` CLI and Context7 API, which are third-party and can change independently of this repo. Its content is validated only for frontmatter, not for correctness or currency. `ast-grep` has been rewritten and is actively maintained in this repo, but it assumes the `ast-grep` binary is installed on `PATH` — there is no check or install step. **Risk**: `find-docs` instructions may drift; `ast-grep` silently fails if the binary is absent. **Mitigation**: periodically review `find-docs` content; document `ast-grep` as a prerequisite in README if the skill becomes widely relied on.

## R8 — No CI Pipeline

Tests are run manually. There is no GitHub Actions / CI enforcing `npm test` on PRs. **Risk**: regressions can reach main. **Mitigation**: CONTRIBUTING.md mandates passing tests before commit.
