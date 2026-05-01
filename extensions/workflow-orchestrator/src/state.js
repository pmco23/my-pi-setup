const path = require('node:path');

function nowIso() {
  return new Date().toISOString();
}

function createWorkflowId(date = new Date()) {
  return `wf-${date.toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')}`;
}

function artifactLogPath(workflowId) {
  return path.join('.pi', 'workflows', `${workflowId}.jsonl`);
}

function startWorkflow(config, { mode, firstSkill, workflowId = createWorkflowId(), timestamp = nowIso() }) {
  return {
    ...config,
    active_workflow: {
      ...(config.active_workflow || {}),
      id: workflowId,
      mode,
      current_skill: 'workflow-orchestrator',
      next_skill: firstSkill,
      artifact_log: artifactLogPath(workflowId),
      updated_at: timestamp,
      paused: false,
      pause_reason: null,
      last_processed_entry_id: null,
    },
  };
}

function updateActiveWorkflow(config, handoff, { timestamp = nowIso(), lastProcessedEntryId } = {}) {
  return {
    ...config,
    active_workflow: {
      ...(config.active_workflow || {}),
      mode: handoff.workflow_mode,
      current_skill: handoff.current_skill,
      next_skill: handoff.next_skill,
      updated_at: timestamp,
      paused: false,
      pause_reason: null,
      last_processed_entry_id: lastProcessedEntryId ?? config.active_workflow?.last_processed_entry_id ?? null,
    },
  };
}

function pauseWorkflow(config, reason, { timestamp = nowIso() } = {}) {
  return {
    ...config,
    active_workflow: {
      ...(config.active_workflow || {}),
      paused: true,
      pause_reason: reason,
      updated_at: timestamp,
    },
  };
}

function resumeWorkflow(config, { timestamp = nowIso() } = {}) {
  return {
    ...config,
    active_workflow: {
      ...(config.active_workflow || {}),
      paused: false,
      pause_reason: null,
      updated_at: timestamp,
    },
  };
}

function clearWorkflow(config, { timestamp = nowIso() } = {}) {
  return {
    ...config,
    active_workflow: {
      id: null,
      mode: null,
      current_skill: null,
      next_skill: null,
      artifact_log: null,
      updated_at: timestamp,
      paused: false,
      pause_reason: null,
      last_processed_entry_id: null,
    },
  };
}

module.exports = { nowIso, createWorkflowId, artifactLogPath, startWorkflow, updateActiveWorkflow, pauseWorkflow, resumeWorkflow, clearWorkflow };
