#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$ROOT/skills" "$ROOT/prompts" "$ROOT/extensions" "$ROOT/settings"

rsync -a --delete "$HOME/.agents/skills/" "$ROOT/skills/"
if [[ -d "$HOME/.pi/agent/prompts" ]]; then
  rsync -a --delete --exclude 'workflow-*.md' "$HOME/.pi/agent/prompts/" "$ROOT/prompts/"
fi
if [[ -d "$HOME/.pi/agent/extensions" ]]; then
  rsync -a --delete "$HOME/.pi/agent/extensions/" "$ROOT/extensions/"
fi

if [[ -f "$HOME/.pi/agent/settings.json" ]]; then
  cp "$HOME/.pi/agent/settings.json" "$ROOT/settings/global-settings.json"
fi

echo "Backed up current pi skills, prompts, extensions, and global settings into $ROOT"
