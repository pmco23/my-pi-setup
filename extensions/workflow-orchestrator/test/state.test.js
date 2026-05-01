const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultConfig } = require('../src/config');
const { startWorkflow, updateActiveWorkflow, pauseWorkflow, resumeWorkflow, clearWorkflow } = require('../src/state');

const timestamp = '2026-05-01T00:00:00.000Z';

test('startWorkflow stores active workflow fields', () => {
  const config = startWorkflow(defaultConfig('auto'), { mode: 'auto', firstSkill: 'brainstorm-spec', workflowId: 'wf-1', timestamp });
  assert.equal(config.active_workflow.id, 'wf-1');
  assert.equal(config.active_workflow.mode, 'auto');
  assert.equal(config.active_workflow.current_skill, 'workflow-orchestrator');
  assert.equal(config.active_workflow.next_skill, 'brainstorm-spec');
  assert.equal(config.active_workflow.artifact_log, '.pi/workflows/wf-1.jsonl');
});

test('updateActiveWorkflow maps handoff to current and next skill', () => {
  let config = startWorkflow(defaultConfig('auto'), { mode: 'auto', firstSkill: 'plan', workflowId: 'wf-1', timestamp });
  config = updateActiveWorkflow(config, { workflow_mode: 'auto', current_skill: 'plan', next_skill: 'execute' }, { timestamp, lastProcessedEntryId: 'entry-1' });
  assert.equal(config.active_workflow.current_skill, 'plan');
  assert.equal(config.active_workflow.next_skill, 'execute');
  assert.equal(config.active_workflow.last_processed_entry_id, 'entry-1');
});

test('pause and resume workflow update pause state', () => {
  let config = startWorkflow(defaultConfig(), { mode: 'user-in-the-loop', firstSkill: 'plan', workflowId: 'wf-1', timestamp });
  config = pauseWorkflow(config, 'needs approval', { timestamp });
  assert.equal(config.active_workflow.paused, true);
  assert.equal(config.active_workflow.pause_reason, 'needs approval');
  config = resumeWorkflow(config, { timestamp });
  assert.equal(config.active_workflow.paused, false);
  assert.equal(config.active_workflow.pause_reason, null);
});

test('clearWorkflow clears active workflow but keeps timestamp', () => {
  let config = startWorkflow(defaultConfig(), { mode: 'user-in-the-loop', firstSkill: 'plan', workflowId: 'wf-1', timestamp });
  config = clearWorkflow(config, { timestamp });
  assert.equal(config.active_workflow.id, null);
  assert.equal(config.active_workflow.next_skill, null);
  assert.equal(config.active_workflow.updated_at, timestamp);
});
