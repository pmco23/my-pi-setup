const { extractLatestHandoff } = require('./handoff');
const { evaluateHandoff } = require('./evaluator');
const { updateActiveWorkflow, pauseWorkflow, clearWorkflow } = require('./state');
const { buildSkillPrompt } = require('./prompts');

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
  const assistantMessages = messages.filter((message) => message && message.role === 'assistant');
  if (assistantMessages.length === 0) return '';
  return messageText(assistantMessages.at(-1));
}

function hasActiveWorkflow(config) {
  return Boolean(config?.active_workflow?.id && config?.active_workflow?.next_skill);
}

function planAutoContinuation({ config, markdown, entryId, modeOverride, isWorkflowSkillResponse }) {
  if (!hasActiveWorkflow(config)) {
    return { action: 'none', reason: 'No active workflow' };
  }

  if (entryId && config.active_workflow.last_processed_entry_id === entryId) {
    return { action: 'none', reason: 'Handoff already processed for this entry' };
  }

  const artifactLog = config.active_workflow.artifact_log;
  const parsed = extractLatestHandoff(markdown || '');
  if (!parsed.ok) {
    // If this was not a workflow skill response, silently skip — don't pause on side conversations
    if (!isWorkflowSkillResponse) {
      return { action: 'none', reason: 'No handoff in response (non-workflow prompt)' };
    }
    // If it WAS a workflow skill response and failed to produce a handoff, pause
    const updatedConfig = pauseWorkflow(config, `No valid handoff: ${parsed.reason}`);
    return {
      action: 'pause',
      reason: parsed.reason,
      config: updatedConfig,
      artifactLog,
      audit: { event: 'handoff_parse_failed', decision: 'pause', reason: parsed.reason, entry_id: entryId || null },
    };
  }

  // Valid handoff found — always evaluate regardless of flag
  const decision = evaluateHandoff({ config, handoff: parsed.handoff, modeOverride });
  let updatedConfig = updateActiveWorkflow(config, parsed.handoff, { lastProcessedEntryId: entryId });

  if (decision.decision === 'continue') {
    const prompt = buildSkillPrompt(decision.next_skill, {
      mode: decision.workflow_mode,
      workflowId: updatedConfig.active_workflow.id,
      artifactLog: updatedConfig.active_workflow.artifact_log,
      context: [
        `Previous skill: ${decision.current_skill}`,
        `Continuation reason: ${decision.reason}`,
      ],
    });
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

  if (decision.next_skill === 'none') {
    updatedConfig = clearWorkflow(updatedConfig);
  } else {
    updatedConfig = pauseWorkflow(updatedConfig, decision.reason);
  }

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
