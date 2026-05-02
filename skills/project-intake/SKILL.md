---
name: project-intake
description: Maps or refreshes an existing codebase before feature work. Use when entering a project, when project context is stale, or whenever the user asks to "refresh project context", "update project map", "refresh agent guidance", "map the repo", or "regenerate graph". Performs a graphify-first onboarding/refresh flow and produces durable context under .pi/project-map.
---

# Project Intake

Create durable project context under `.pi/project-map/` before feature work.

## Operating Mode

- Inspect before summarizing.
- Do not modify source code.
- Use `graphify` from the beginning unless the project has no supported files or the user opts out.
- Use `ast-grep` for structural discovery when useful.
- Use `find-docs` only when framework/library behavior must be verified.
- Prefer concise durable docs over long analysis dumps.

When used standalone, complete this skill normally without assuming workflow state; treat `## Next Step` as a manual recommendation for the user.

## Required Outputs

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

## Workflow

1. Detect project root and create `.pi/project-map/` and `.pi/project-map/graph/`.
2. Determine first-time onboard vs refresh.
3. Scan README/docs, package/config files, source, tests, CI, env examples, generated-code indicators, and agent instruction files.
4. Select focused graphify inputs; avoid secrets, binaries, generated/vendor/build/cache directories.
5. Run/use `graphify` and place graph outputs under `.pi/project-map/graph/`.
6. Synthesize graph insights and repository scan into the required markdown files.
7. Keep `agent-guidance.md` concise, actionable, and ≤100 lines.
8. Self-check outputs before final response.

## Refresh Mode

When `.pi/project-map/` already exists:

- Read existing project-map files first.
- Identify codebase changes since last onboard.
- Re-run graphify when structural changes are likely.
- Preserve valid historical context.
- Update `agent-guidance.md` with new risks, modules, conventions, commands, or do-not-touch items.

## File Content Guide

- `intake.md`: project summary, stack, important files, entrypoints, graphify inputs.
- `commands.md`: install, run, test, lint/format, notes.
- `architecture.md`: high-level architecture, runtime flow, integrations, graph communities.
- `modules.md`: major modules/directories, responsibilities, relationships.
- `testing.md`: framework, locations, commands, gaps.
- `conventions.md`: style, naming, error handling, generated files, schema/migration conventions.
- `risks.md`: hotspots, coupling, missing tests, security/privacy concerns.
- `agent-guidance.md`: before-editing checklist, project map links, common tasks, validation, graph insights, risky areas, do-not-touch list.

## Rules

- Do not claim graphify insights unless graphify ran or graph artifacts already existed.
- If graphify cannot run, still create project-map files and explain the gap in `risks.md` and the final response.
- Do not put absolute paths in generated project-map files.
- If the user included a feature goal, recommend `plan` next; otherwise recommend `none` and ask what they want to work on.

## Next Skill Guidance

Recommend `plan` when the user has a concrete next task. Otherwise recommend `none` after onboarding completes.

End with `## Next Step`: recommended skill, reason, user prompt, and compact auto handoff JSON when used in a workflow.
