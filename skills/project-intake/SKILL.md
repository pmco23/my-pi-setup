---
name: project-intake
description: Maps or refreshes an existing codebase before feature work. Use when entering a project, when project context is stale, or whenever the user asks to "refresh project context", "update project map", "refresh agent guidance", or "map the repo". Scans the codebase and produces durable context under .pi/project-map.
---

# Project Intake

Create durable project context under `.pi/project-map/` before feature work.

## Operating Mode

- Inspect before summarizing.
- Do not modify source code.
- Use `ast-grep` for structural code discovery when useful.
- Use `find-docs` only when framework/library behavior must be verified.
- Prefer concise durable docs over long analysis dumps.
- Keep `agent-guidance.md` ≤100 lines.

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
```

## Workflow

1. Detect project root and create `.pi/project-map/` if missing.
2. Determine first-time onboard vs refresh (`.pi/project-map/` already exists).
3. Scan:
   - README and docs
   - package/config files (package.json, pyproject.toml, Cargo.toml, etc.)
   - source directories
   - test directories
   - CI workflows
   - env examples and generated-code indicators
   - existing AGENTS.md or CLAUDE.md
4. Synthesize findings into the required markdown files.
5. Self-check outputs before final response.

## Refresh Mode

When `.pi/project-map/` already exists:

- Read existing project-map files first.
- Identify what has changed since the last onboard.
- Preserve valid historical context.
- Update `agent-guidance.md` with new risks, modules, conventions, or commands.

## File Content Guide

- `intake.md`: project summary, stack, important files, entrypoints.
- `commands.md`: install, run, test, lint/format, notes.
- `architecture.md`: high-level architecture, runtime flow, key integrations.
- `modules.md`: major modules/directories, responsibilities, relationships.
- `testing.md`: framework, locations, commands, gaps.
- `conventions.md`: style, naming, error handling, generated files, schema conventions.
- `risks.md`: hotspots, coupling concerns, missing tests, security notes.
- `agent-guidance.md`: before-editing checklist, project map links, common tasks, validation commands, risky areas, do-not-touch list.

## Rules

- Do not put absolute paths in generated project-map files.
- If the user included a feature goal, recommend `plan` next; otherwise recommend `none` and ask what they want to work on.

## Next Skill Guidance

Recommend `plan` when the user has a concrete next task. Otherwise recommend `none` after onboarding completes.

End with `## Next Step`: recommended skill, reason, user prompt, and compact auto handoff JSON:

Auto handoff:
```json
{
  "workflow_mode": "<mode from prompt>",
  "current_skill": "project-intake",
  "next_skill": "<recommended>",
  "confidence": "high|medium|low",
  "stop_reason": null,
  "open_questions": [],
  "artifact": ""
}
```
