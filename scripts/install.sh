#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$HOME/.agents/skills" "$HOME/.pi/agent/extensions" "$HOME/.pi/agent" "$HOME/.pi/agent/themes"

# Refresh bundled graphify skill from installed package if a newer version is available.
if command -v graphify &>/dev/null; then
  GRAPHIFY_INSTALLED_SKILL="$HOME/.pi/agent/skills/graphify"
  GRAPHIFY_REPO_SKILL="$ROOT/skills/graphify"
  REPO_VER="$(cat "$GRAPHIFY_REPO_SKILL/.graphify_version" 2>/dev/null || echo '0')"
  graphify install --platform pi &>/dev/null || true
  INSTALLED_VER="$(cat "$GRAPHIFY_INSTALLED_SKILL/.graphify_version" 2>/dev/null || echo '0')"
  if [[ "$INSTALLED_VER" != "$REPO_VER" ]]; then
    cp "$GRAPHIFY_INSTALLED_SKILL/SKILL.md" "$GRAPHIFY_REPO_SKILL/SKILL.md"
    cp "$GRAPHIFY_INSTALLED_SKILL/.graphify_version" "$GRAPHIFY_REPO_SKILL/.graphify_version"
    echo "Updated bundled graphify skill: $REPO_VER -> $INSTALLED_VER"
  fi
fi

rsync -a --delete "$ROOT/skills/" "$HOME/.agents/skills/"
rm -f "$HOME/.pi/agent/prompts"/workflow-*.md
if [[ -d "$ROOT/extensions" ]]; then
  rsync -a --delete "$ROOT/extensions/" "$HOME/.pi/agent/extensions/"
fi

if [[ -f "$ROOT/extensions/workflow-orchestrator/assets/onyx-theme.json" ]]; then
  cp "$ROOT/extensions/workflow-orchestrator/assets/onyx-theme.json" "$HOME/.pi/agent/themes/onyx.json"
fi

SETTINGS="$HOME/.pi/agent/settings.json"
if [[ ! -f "$SETTINGS" ]]; then
  printf '{\n  "enableSkillCommands": true\n}\n' > "$SETTINGS"
else
  python3 - <<'PY' "$SETTINGS"
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
try:
    data = json.loads(p.read_text())
except Exception:
    backup = p.with_suffix(p.suffix + '.bak')
    backup.write_text(p.read_text())
    data = {}
data['enableSkillCommands'] = True
p.write_text(json.dumps(data, indent=2) + '\n')
PY
fi

cat <<'EOF'
Installed pi workflow setup.

Reload pi resources with /reload or restart pi.

Installed global theme:
- onyx

Extension commands:
- /workflow:init       → setup wizard (mode, theme, thinking level, compaction, retry)
- /workflow:continue   → advance or resume
- /workflow:pause      → pause
- /workflow:resume     → clear pause

Skill commands:
- /skill:project-intake
- /skill:brainstorm-spec
- /skill:implementation-research
- /skill:acceptance-criteria
- /skill:plan
- /skill:execute
- /skill:review-against-plan
- /skill:code-review

Run /workflow:init to set up a project.
EOF
