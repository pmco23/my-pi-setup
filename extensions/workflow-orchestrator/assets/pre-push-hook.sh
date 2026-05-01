#!/bin/sh
# Pi workflow pre-push hook
# Warns if .pi/project-map/ is stale relative to source files.
# Installed by /workflow:init. Never blocks — advisory only.

if [ -f .pi/project-map/agent-guidance.md ]; then
  newer=$(find . \( -name '*.js' -o -name '*.ts' -o -name '*.py' -o -name '*.go' \
    -o -name '*.rs' -o -name '*.rb' -o -name '*.java' -o -name '*.md' \
    -o -name '*.json' -o -name '*.yaml' -o -name '*.yml' -o -name '*.sh' \) \
    -newer .pi/project-map/agent-guidance.md \
    -not -path './.git/*' -not -path './.pi/*' -not -path '*/node_modules/*' \
    -not -path '*/dist/*' -not -path '*/build/*' | head -1)
  if [ -n "$newer" ]; then
    echo ""
    echo "⚠️  Project context (.pi/project-map/) may be stale."
    echo "   Source files have changed since last refresh."
    echo "   Consider running /workflow:refresh in pi before or after pushing."
    echo ""
  fi
fi
