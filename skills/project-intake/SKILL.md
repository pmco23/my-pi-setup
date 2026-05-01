---
name: project-intake
description: Maps an existing codebase before feature work. Use when entering a project not created with this workflow or when project context is stale. Performs a graphify-first onboarding flow and produces durable project context under .pi/project-map for future planning and execution.
---

# Project Intake

Use this skill to onboard an existing codebase so future workflow stages understand the project.

## Goal

Create a durable project map under:

```text
.pi/project-map/
```

Required outputs:

```text
.pi/project-map/intake.md
.pi/project-map/commands.md
.pi/project-map/architecture.md
.pi/project-map/modules.md
.pi/project-map/testing.md
.pi/project-map/conventions.md
.pi/project-map/risks.md
.pi/project-map/agent-guidance.md
.pi/project-map/graph/graph.html
.pi/project-map/graph/graph.json
.pi/project-map/graph/audit.md
```

## Operating Mode

- Inspect before summarizing.
- Do not modify source code.
- Prefer concise durable docs over long analysis dumps.
- Use `graphify` from the beginning unless the project has no supported files or the user explicitly opts out.
- Use `ast-grep` for structural code discovery when useful.
- Use `find-docs` when framework/library behavior must be verified.

## Workflow

1. Detect project root and create `.pi/project-map/` and `.pi/project-map/graph/` if missing.
2. Check if this is a refresh (existing `.pi/project-map/` files present) or first-time onboard.
3. Quick scan important files:
   - README/docs
   - package/config files
   - source directories
   - test directories
   - CI workflows
   - env examples
   - generated-code indicators
   - existing AGENTS.md or CLAUDE.md
4. Select graphify inputs.
5. Invoke/use `graphify` early on the selected inputs.
6. Move or copy graphify outputs into `.pi/project-map/graph/`:
   - graph HTML → `.pi/project-map/graph/graph.html`
   - graph JSON → `.pi/project-map/graph/graph.json`
   - report/audit → `.pi/project-map/graph/audit.md`
7. Synthesize graph insights and repository scan into project-map markdown files.
8. Run self-check.
9. End with a workflow handoff to `plan` or `none`.

## Graphify Input Selection

Prefer a focused corpus over the entire repository when the project is large.

Include:

- README and docs
- main source directories
- test directories
- package/config files
- API/schema/model files
- architectural docs if present

Exclude:

- `node_modules/`, `.git/`, build outputs, caches
- generated files unless they define public contracts
- secrets or env files containing credentials
- large binary assets unless relevant

If the corpus has >200 source files or >2,000,000 words, ask before graphifying the entire repository. Offer to focus on the most important subdirectories.

## Refresh Mode

When called as a refresh (not first-time onboard):

- Read existing `.pi/project-map/` files first.
- Identify what has changed in the codebase since the last onboard.
- Re-run graphify to detect structural changes.
- Preserve valid historical context that still applies.
- Note significant changes explicitly in updated files.
- Update `agent-guidance.md` with any new risks, modules, conventions, or commands.

## Output Requirements

### intake.md

```md
# Project Intake

## Summary
<what the project is>

## Stack
- <language/framework/runtime>

## Important Files
- `<path>`: <why it matters>

## Entrypoints
- `<path>`: <entrypoint role>

## Graphify Inputs
- `<path>`
```

### commands.md

```md
# Commands

## Install
- `<command>`

## Run
- `<command>`

## Test
- `<command>`

## Lint / Format
- `<command>`

## Notes
- <caveat>
```

### architecture.md

Include:

- high-level architecture
- main runtime flow
- external integrations
- graphify clusters/communities
- important dependencies

### modules.md

Include:

- major modules/directories
- responsibilities
- key files
- relationships discovered by graphify

### testing.md

Include:

- test framework
- test locations
- recommended validation commands
- gaps/risks

### conventions.md

Include:

- naming/style patterns
- architectural conventions
- error handling patterns
- generated files
- migration/schema conventions

### risks.md

Include:

- risky areas
- coupling/hotspots from graphify
- missing tests
- unclear ownership
- security/privacy concerns

### agent-guidance.md

This is the most important output. Keep it concise and actionable.

```md
# Agent Guidance

## Before Editing
- <what the agent should check first>

## Project Map
- Intake: `.pi/project-map/intake.md`
- Architecture: `.pi/project-map/architecture.md`
- Modules: `.pi/project-map/modules.md`
- Graph: `.pi/project-map/graph/graph.html`

## Common Tasks
- <where to make common changes>

## Validation
- <commands to run>

## Graph Insights
- <cluster/community/hotspot insight>

## Risky Areas
- <area and reason>

## Do Not Touch Unless Asked
- <generated files, vendored code, secrets, etc.>
```

## Handoff Protocol

Every final response must end with:

````md
## Next Step
Recommended skill: `<plan | none>`
Reason: <why>

User prompt:
- Shall I continue with `<plan | none>`?

Auto handoff:
```json
{
  "workflow_mode": "user-in-the-loop",
  "current_skill": "project-intake",
  "next_skill": "none",
  "requires_user": true,
  "stop_reason": "project onboarding complete",
  "confidence": "high",
  "reason": "Project map created under .pi/project-map.",
  "inputs": {
    "primary_artifact": ".pi/project-map/agent-guidance.md",
    "required_context": [".pi/project-map", ".pi/project-map/graph"],
    "open_questions": []
  }
}
```
````

## Rules

- Do not claim graphify insights unless graphify ran or graph artifacts already existed.
- If graphify cannot run, still create project-map files and explain the gap in `risks.md` and final handoff.
- Keep `agent-guidance.md` short enough to be read at the start of future tasks (≤100 lines).
- If the user asks to start feature work immediately after onboarding, recommend `plan` next.
- If the project has an existing `AGENTS.md` or `CLAUDE.md`, reference it in `agent-guidance.md` and avoid duplicating its instructions.
- If the user indicated a goal or task alongside onboarding, set `next_skill` to `plan` in the handoff. Otherwise set it to `none` and ask what they want to work on.

## Self-Check Before Handoff

Verify before producing the final response:

- `agent-guidance.md` is ≤100 lines and actionable.
- `commands.md` includes at least one runnable validation command.
- `architecture.md` references graphify communities if graph ran.
- `risks.md` identifies at least one concrete risk or explicitly states none found.
- Every required output file exists and is non-empty.
- No absolute paths appear in any output file.
- If this is a refresh, changes since last onboard are noted.

## After Onboarding

Recommend the user:

- Add `.pi/project-map/` to version control for collaborators.
- Add `.pi/workflow-orchestrator.json` and `.pi/workflows/` to `.gitignore`.
- Add `.pi/project-map/graph/graphify-out/` and `.pi/project-map/graph/.graphify_*` to `.gitignore`.
