#!/usr/bin/env bash
set -euo pipefail

echo "Uninstalling pi workflow setup..."

# Remove extension
rm -rf "$HOME/.pi/agent/extensions/workflow-orchestrator"

# Remove workflow skills
SKILLS=(
  project-intake
  brainstorm-spec
  implementation-research
  acceptance-criteria
  plan
  execute
  review-against-plan
  code-review
)
for skill in "${SKILLS[@]}"; do
  rm -rf "$HOME/.agents/skills/$skill"
done

# Clean old prompt templates if still present
rm -f "$HOME/.pi/agent/prompts"/workflow-*.md

# Remove enableSkillCommands only if we set it (leave other settings alone)
# We don't remove it since other skills/extensions may rely on it.

echo "Removed:"
echo "  ~/.pi/agent/extensions/workflow-orchestrator/"
echo "  ~/.agents/skills/{project-intake,brainstorm-spec,implementation-research,acceptance-criteria,plan,execute,review-against-plan,code-review}/"
echo "  ~/.pi/agent/prompts/workflow-*.md (if present)"
echo
echo "NOT removed:"
echo "  ~/.pi/agent/settings.json (enableSkillCommands left intact)"
echo "  ~/.agents/skills/{find-docs,ast-grep}/ (support skills kept)"
echo "  Project-local .pi/ directories (workflow config and project maps)"
echo
echo "Reload pi with /reload or restart pi."
echo
echo "To also remove support skills:"
echo "  rm -rf ~/.agents/skills/find-docs ~/.agents/skills/ast-grep"
echo
echo "To remove project-local workflow state from a project:"
echo "  rm -rf <project>/.pi/workflow-orchestrator.json <project>/.pi/workflows/ <project>/.pi/project-map/"
