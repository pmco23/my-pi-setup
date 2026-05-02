#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$HOME/.agents/skills" "$HOME/.pi/agent/extensions" "$HOME/.pi/agent" "$HOME/.pi/agent/themes"

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
- `/workflow:init` — setup wizard: mode + pi settings + project config
- `/workflow:start` — start a new workflow with a skill and goal
- `/workflow:continue` — advance or resume
- `/workflow:pause` — pause
- `/workflow:status` — show current workflow state
- `/workflow:debug` — show last handoff, evaluator decision, stop conditions

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
