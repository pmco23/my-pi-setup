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

// Initialise a new active workflow. Mode is always read from config.mode — not stored in active_workflow.
function startWorkflow(config, { firstSkill, goal = null, workflowId = createWorkflowId(), timestamp = nowIso() }) {
  return {
    ...config,
    active_workflow: {
      id: workflowId,
      goal,
      current_skill: 'workflow-orchestrator',
      next_skill: firstSkill,
      artifact_log: artifactLogPath(workflowId),
      updated_at: timestamp,
      paused: false,
      pause_reason: null,
      last_processed_entry_id: null,
      step_number: 0,
      last_artifact: null,
    },
  };
}

function updateActiveWorkflow(config, handoff, { timestamp = nowIso(), lastProcessedEntryId } = {}) {
  const prev = config.active_workflow || {};
  return {
    ...config,
    active_workflow: {
      ...prev,
      // Capture goal from first handoff if not yet set
      goal: prev.goal ?? handoff.goal ?? handoff.inputs?.primary_artifact ?? null,
      current_skill: handoff.current_skill,
      next_skill: handoff.next_skill,
      updated_at: timestamp,
      paused: false,
      pause_reason: null,
      last_processed_entry_id: lastProcessedEntryId ?? prev.last_processed_entry_id ?? null,
      step_number: (prev.step_number || 0) + 1,
      last_artifact: handoff.artifact || prev.last_artifact || null,
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
      goal: null,
      current_skill: null,
      next_skill: null,
      artifact_log: null,
      updated_at: timestamp,
      paused: false,
      pause_reason: null,
      last_processed_entry_id: null,
      step_number: 0,
      last_artifact: null,
    },
  };
}

function checkpointWorkflow(config, { goal, currentSkill, nextSkill, timestamp = nowIso() }) {
  const existing = config.active_workflow || {};
  const id = existing.id || createWorkflowId();
  return {
    ...config,
    active_workflow: {
      ...existing,
      id,
      goal: goal !== undefined ? goal : (existing.goal ?? null),
      current_skill: currentSkill,
      next_skill: nextSkill,
      artifact_log: existing.artifact_log || artifactLogPath(id),
      updated_at: timestamp,
      paused: false,
      pause_reason: null,
    },
  };
}

module.exports = { nowIso, createWorkflowId, artifactLogPath, startWorkflow, updateActiveWorkflow, pauseWorkflow, resumeWorkflow, clearWorkflow, checkpointWorkflow };
