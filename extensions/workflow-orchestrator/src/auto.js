const { extractLatestHandoff } = require('./handoff');
const { evaluateHandoff } = require('./evaluator');
const { startWorkflow, updateActiveWorkflow, pauseWorkflow, clearWorkflow } = require('./state');
const { buildSkillPrompt, artifactDir } = require('./prompts');

function messageText(message) {
  if (!message) return '';
  if (typeof message.content === 'string') return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  if (typeof message.text === 'string') return message.text;
  return '';
}

function latestAssistantMarkdown(messages = []) {
  const assistantMessages = messages.filter((m) => m && m.role === 'assistant');
  if (assistantMessages.length === 0) return '';
  return messageText(assistantMessages.at(-1));
}

function hasActiveWorkflow(config) {
  return Boolean(config?.active_workflow?.id && config?.active_workflow?.next_skill);
}

// In v2 there is no pendingWorkflowSkillResponse flag — always evaluate in auto mode.
// In user-in-the-loop mode, evaluate to get the decision but return action: 'suggest' instead of continuing.
function planAutoContinuation({ config, markdown, entryId, modeOverride }) {
  // Parse handoff first so it is available for bootstrapping if needed.
  const parsed = extractLatestHandoff(markdown || '');

  if (!hasActiveWorkflow(config)) {
    // Bootstrap a new workflow from the first skill handoff if one is present.
    if (!parsed.ok) {
      return { action: 'none', reason: 'No active workflow' };
    }
    config = startWorkflow(config, {
      firstSkill: parsed.handoff.next_skill,
      goal: parsed.handoff.goal ?? parsed.handoff.inputs?.primary_artifact ?? null,
    });
  }

  if (entryId && config.active_workflow.last_processed_entry_id === entryId) {
    return { action: 'none', reason: 'Handoff already processed for this entry' };
  }

  const mode = modeOverride || config.mode;
  const artifactLog = config.active_workflow.artifact_log;

  if (!parsed.ok) {
    // In auto mode: pause. In human mode: silently skip — user drives manually.
    if (mode === 'user-in-the-loop') {
      return { action: 'none', reason: 'No handoff in response (user drives in human mode)' };
    }
    const updatedConfig = pauseWorkflow(config, `No valid handoff: ${parsed.reason}`);
    return {
      action: 'pause',
      reason: parsed.reason,
      config: updatedConfig,
      artifactLog,
      audit: { event: 'handoff_parse_failed', decision: 'pause', reason: parsed.reason, entry_id: entryId || null },
    };
  }

  const decision = evaluateHandoff({ config, handoff: parsed.handoff, modeOverride });
  let updatedConfig = updateActiveWorkflow(config, parsed.handoff, { lastProcessedEntryId: entryId });

  if (decision.decision === 'complete') {
    updatedConfig = clearWorkflow(updatedConfig);
    return {
      action: 'complete',
      reason: decision.reason,
      nextSkill: decision.next_skill,
      config: updatedConfig,
      decision,
      artifactLog,
      audit: { event: 'handoff_evaluated', decision: 'complete', current_skill: decision.current_skill, next_skill: decision.next_skill, reason: decision.reason, entry_id: entryId || null },
    };
  }

  if (decision.decision === 'continue') {
    const goal = updatedConfig.active_workflow.goal;
    const wfId = updatedConfig.active_workflow.id;
    const prompt = buildSkillPrompt(decision.next_skill, {
      mode: decision.workflow_mode,
      workflowId: wfId,
      artifactLog: updatedConfig.active_workflow.artifact_log,
      artifactDir: artifactDir(wfId),
      step: updatedConfig.active_workflow.step_number + 1,
      previousArtifact: updatedConfig.active_workflow.last_artifact || null,
      allowedNext: updatedConfig.transitions?.[decision.next_skill] || [],
      context: [
        goal ? `Goal: ${goal}` : null,
        `Previous skill: ${decision.current_skill}`,
        `Continuation reason: ${decision.reason}`,
      ].filter(Boolean),
    });

    // Human-in-the-loop: suggest instead of auto-chain
    if (mode === 'user-in-the-loop') {
      return {
        action: 'suggest',
        reason: decision.reason,
        nextSkill: decision.next_skill,
        prompt,
        config: updatedConfig,
        decision,
        artifactLog,
        audit: { event: 'handoff_evaluated', decision: 'suggest', current_skill: decision.current_skill, next_skill: decision.next_skill, reason: decision.reason, entry_id: entryId || null },
      };
    }

    return {
      action: 'continue',
      reason: decision.reason,
      nextSkill: decision.next_skill,
      prompt,
      config: updatedConfig,
      decision,
      artifactLog,
      audit: { event: 'handoff_evaluated', decision: 'continue', current_skill: decision.current_skill, next_skill: decision.next_skill, reason: decision.reason, entry_id: entryId || null },
    };
  }

  updatedConfig = pauseWorkflow(updatedConfig, decision.reason);
  return {
    action: 'pause',
    reason: decision.reason,
    nextSkill: decision.next_skill,
    config: updatedConfig,
    decision,
    artifactLog,
    audit: { event: 'handoff_evaluated', decision: 'pause', current_skill: decision.current_skill, next_skill: decision.next_skill, reason: decision.reason, entry_id: entryId || null },
  };
}

module.exports = { messageText, latestAssistantMarkdown, hasActiveWorkflow, planAutoContinuation };
