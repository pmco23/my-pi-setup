#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$HOME/.agents/skills" "$HOME/.pi/agent/prompts" "$HOME/.pi/agent/extensions" "$HOME/.pi/agent"

rsync -a "$ROOT/skills/" "$HOME/.agents/skills/"
rm -f "$HOME/.pi/agent/prompts"/workflow-*.md
if [[ -d "$ROOT/prompts" ]]; then
  rsync -a "$ROOT/prompts/" "$HOME/.pi/agent/prompts/"
fi
if [[ -d "$ROOT/extensions" ]]; then
  rsync -a "$ROOT/extensions/" "$HOME/.pi/agent/extensions/"
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

Available extension commands:
- /workflow:init
- /workflow:start
- /workflow:auto
- /workflow:manual
- /workflow:continue
- /workflow:status
- /workflow:pause
- /workflow:resume

Available skill commands:
- /skill:workflow-orchestrator
- /skill:brainstorm-spec
- /skill:acceptance-criteria
- /skill:plan
- /skill:execute
- /skill:review-against-plan
- /skill:code-review
EOF
