# Graph Report - .  (2026-05-02)

## Corpus Check
- Corpus is ~24,920 words - fits in a single context window. You may not need a graph.

## Summary
- 98 nodes · 162 edges · 8 communities detected
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]

## God Nodes (most connected - your core abstractions)
1. `getProjectRoot()` - 12 edges
2. `loadConfig()` - 11 edges
3. `handleStart()` - 9 edges
4. `handleOnboard()` - 9 edges
5. `saveConfig()` - 9 edges
6. `planAutoContinuation()` - 8 edges
7. `initConfig()` - 7 edges
8. `buildSkillPrompt()` - 7 edges
9. `parseModeAndRest()` - 6 edges
10. `handleContinue()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `handleStart()` --calls--> `appendAuditEntry()`  [INFERRED]
  extensions/workflow-orchestrator/src/commands.js → extensions/workflow-orchestrator/src/audit.js
- `handleOnboard()` --calls--> `appendAuditEntry()`  [INFERRED]
  extensions/workflow-orchestrator/src/commands.js → extensions/workflow-orchestrator/src/audit.js
- `planAutoContinuation()` --calls--> `extractLatestHandoff()`  [INFERRED]
  extensions/workflow-orchestrator/src/auto.js → extensions/workflow-orchestrator/src/handoff.js
- `planAutoContinuation()` --calls--> `evaluateHandoff()`  [INFERRED]
  extensions/workflow-orchestrator/src/auto.js → extensions/workflow-orchestrator/src/evaluator.js
- `planAutoContinuation()` --calls--> `updateActiveWorkflow()`  [INFERRED]
  extensions/workflow-orchestrator/src/auto.js → extensions/workflow-orchestrator/src/state.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (10): hasActiveWorkflow(), latestAssistantMarkdown(), messageText(), planAutoContinuation(), artifactLogPath(), clearWorkflow(), pauseWorkflow(), startWorkflow() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.26
Nodes (12): handleContext(), handleContinue(), handleInit(), handleRefresh(), handleResume(), handleStatus(), handleUpgradeConfig(), installPrePushHook() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.44
Nodes (10): handleOnboard(), handlePause(), defaultConfig(), getConfigPath(), getWorkflowsDir(), initConfig(), loadConfig(), saveConfig() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.42
Nodes (8): handleStart(), buildContinuePrompt(), buildOnboardPrompt(), buildRefreshPrompt(), buildSkillPrompt(), buildStartPrompt(), firstSkillForGoal(), workflowReminder()

### Community 4 - "Community 4"
Cohesion: 0.46
Nodes (7): handlePiSetup(), applyPiSetup(), labelToKey(), mergeSettings(), readJsonIfPresent(), selectedSettings(), targetsForScope()

### Community 5 - "Community 5"
Cohesion: 0.7
Nodes (4): evaluateHandoff(), resolveMode(), validateConfig(), validateHandoff()

### Community 6 - "Community 6"
Cohesion: 0.5
Nodes (2): extractJsonBlocks(), extractLatestHandoff()

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (2): appendAuditEntry(), sanitize()

## Knowledge Gaps
- **Thin community `Community 6`** (5 nodes): `handoff.js`, `extractJsonBlocks()`, `extractLatestHandoff()`, `looksLikeHandoff()`, `parseJsonBlock()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (4 nodes): `audit.js`, `appendAuditEntry()`, `readAuditEntries()`, `sanitize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `planAutoContinuation()` connect `Community 0` to `Community 3`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Why does `pauseWorkflow()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `handlePause()` connect `Community 2` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `getProjectRoot()` (e.g. with `handleInit()` and `handleUpgradeConfig()`) actually correct?**
  _`getProjectRoot()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `loadConfig()` (e.g. with `handleStatus()` and `handleStart()`) actually correct?**
  _`loadConfig()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `handleStart()` (e.g. with `getProjectRoot()` and `loadConfig()`) actually correct?**
  _`handleStart()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `handleOnboard()` (e.g. with `getProjectRoot()` and `loadConfig()`) actually correct?**
  _`handleOnboard()` has 7 INFERRED edges - model-reasoned connections that need verification._

## Refresh Notes

Semantic extraction was skipped because this environment does not expose the subagent/Agent tool required by the bundled graphify skill. The graph is AST-backed and should be treated as structural code analysis, not full semantic documentation analysis.
