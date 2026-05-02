# Conventions

## Module Style

- All extension source is **CommonJS** (`require`/`module.exports`), `"type": "commonjs"` in `package.json`
- `index.ts` is TypeScript — thin wiring only; no business logic
- No npm runtime dependencies — Node built-ins only (`fs`, `path`, `os`, `child_process`)

## Naming

- Skills: lowercase, hyphens only, ≤64 chars, must match directory name
- Workflow IDs: `wf-<ISO timestamp with colons/dots replaced by hyphens>`
- Config key style: `snake_case` throughout JSON config and handoff payloads
- Source files: `camelCase.js` in `src/`; `camelCase.test.js` in `test/`

## Architecture Rules

- `index.ts` — registration and event wiring only
- Business logic → `src/*.js` pure CommonJS modules
- Command handlers take a dependency-injected `env` object (no direct pi context access inside handlers)
- Pure functions preferred: state mutations in `state.js` return new objects, never mutate in place

## Config

- Config version: **2** (v1 rejected at load time)
- Mode and `auto_continue.enabled` must be set together via `initConfigV2()` — never set independently
- Per-project config: `.pi/workflow-orchestrator.json` (gitignored)

## Handoff JSON

- Skills must end with `## Next Step` and a compact "Auto handoff:" JSON block
- Required fields: `workflow_mode`, `current_skill`, `next_skill`, `requires_user`, `stop_reason`, `confidence`, `inputs` (with `open_questions[]`, `required_context[]`)

## Error Handling

- Config load errors return `{ ok: false, reason }` — never throw
- Handoff parse errors return `{ ok: false, reason }` — auto mode pauses, user-in-the-loop mode silently skips
- Evaluator returns structured `{ decision, reason, errors[] }` — no exceptions for validation failures

## File I/O

- All paths constructed with `path.join()` — no string concatenation
- No absolute paths in skills, extension source, or project-map docs
- `saveConfig` always creates parent directories with `{ recursive: true }`

## Secret Handling

- `audit.js sanitize()` scrubs `api_key`, `token`, `secret`, `password` patterns before writing to JSONL logs

## Skill Registration

- New skills must be added to `DEFAULT_TRANSITIONS` in `src/config.js` to participate in the workflow
- `skills.test.js` validates all SKILL.md frontmatter and checks that transition targets reference real skills

## Commit / Dev Loop

- Edit repo → `npm test` → `./scripts/install.sh` → `/reload` in pi
- Never edit installed files directly (`~/.pi/agent/`, `~/.agents/skills/`)
- No absolute paths in any committed file
