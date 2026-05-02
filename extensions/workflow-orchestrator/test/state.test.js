const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultConfig } = require('../src/config');
const { startWorkflow, updateActiveWorkflow, pauseWorkflow, resumeWorkflow, clearWorkflow, checkpointWorkflow } = require('../src/state');

const timestamp = '2026-05-01T00:00:00.000Z';

test('startWorkflow stores v2 active workflow fields with goal', () => {
  const config = startWorkflow(defaultConfig('auto'), { firstSkill: 'brainstorm-spec', goal: 'Build a notes app', workflowId: 'wf-1', timestamp });
  assert.equal(config.active_workflow.id, 'wf-1');
  assert.equal(config.active_workflow.goal, 'Build a notes app');
  assert.equal(config.active_workflow.current_skill, 'workflow-orchestrator');
  assert.equal(config.active_workflow.next_skill, 'brainstorm-spec');
  assert.equal(config.active_workflow.artifact_log, '.pi/workflows/wf-1.jsonl');
  assert.ok(!('mode' in config.active_workflow));
});

test('startWorkflow goal defaults to null', () => {
  const config = startWorkflow(defaultConfig('auto'), { firstSkill: 'plan', workflowId: 'wf-1', timestamp });
  assert.equal(config.active_workflow.goal, null);
});

test('updateActiveWorkflow captures goal from first handoff when not set', () => {
  let config = startWorkflow(defaultConfig('auto'), { firstSkill: 'plan', workflowId: 'wf-1', timestamp });
  config = updateActiveWorkflow(config, {
    workflow_mode: 'auto', current_skill: 'plan', next_skill: 'execute',
    inputs: { primary_artifact: 'Build a notes app', required_context: [], open_questions: [] },
  });
  assert.equal(config.active_workflow.goal, 'Build a notes app');
  assert.equal(config.active_workflow.current_skill, 'plan');
  assert.equal(config.active_workflow.next_skill, 'execute');
});

test('updateActiveWorkflow preserves existing goal', () => {
  let config = startWorkflow(defaultConfig('auto'), { firstSkill: 'plan', goal: 'Original goal', workflowId: 'wf-1', timestamp });
  config = updateActiveWorkflow(config, {
    workflow_mode: 'auto', current_skill: 'plan', next_skill: 'execute',
    inputs: { primary_artifact: 'Different artifact', required_context: [], open_questions: [] },
  });
  assert.equal(config.active_workflow.goal, 'Original goal');
});

test('pause and resume workflow update pause state', () => {
  let config = startWorkflow(defaultConfig(), { firstSkill: 'plan', workflowId: 'wf-1', timestamp });
  config = pauseWorkflow(config, 'needs approval', { timestamp });
  assert.equal(config.active_workflow.paused, true);
  assert.equal(config.active_workflow.pause_reason, 'needs approval');
  config = resumeWorkflow(config, { timestamp });
  assert.equal(config.active_workflow.paused, false);
  assert.equal(config.active_workflow.pause_reason, null);
});

test('clearWorkflow resets all fields including goal', () => {
  let config = startWorkflow(defaultConfig(), { firstSkill: 'plan', goal: 'Some goal', workflowId: 'wf-1', timestamp });
  config = clearWorkflow(config, { timestamp });
  assert.equal(config.active_workflow.id, null);
  assert.equal(config.active_workflow.goal, null);
  assert.equal(config.active_workflow.next_skill, null);
  assert.equal(config.active_workflow.updated_at, timestamp);
});

test('checkpointWorkflow sets goal, current_skill, next_skill and clears pause', () => {
  let config = startWorkflow(defaultConfig('auto'), { firstSkill: 'plan', workflowId: 'wf-1', timestamp });
  config = pauseWorkflow(config, 'session ended', { timestamp });
  config = checkpointWorkflow(config, { goal: 'My goal', currentSkill: 'plan', nextSkill: 'execute', timestamp });
  assert.equal(config.active_workflow.id, 'wf-1');
  assert.equal(config.active_workflow.goal, 'My goal');
  assert.equal(config.active_workflow.current_skill, 'plan');
  assert.equal(config.active_workflow.next_skill, 'execute');
  assert.equal(config.active_workflow.paused, false);
  assert.equal(config.active_workflow.pause_reason, null);
  assert.equal(config.active_workflow.artifact_log, '.pi/workflows/wf-1.jsonl');
});

test('checkpointWorkflow creates new id and artifact_log when no active workflow', () => {
  const config = checkpointWorkflow(defaultConfig('auto'), { goal: 'Fresh start', currentSkill: 'brainstorm-spec', nextSkill: 'plan', timestamp });
  assert.ok(config.active_workflow.id);
  assert.ok(config.active_workflow.artifact_log.endsWith('.jsonl'));
  assert.equal(config.active_workflow.goal, 'Fresh start');
  assert.equal(config.active_workflow.next_skill, 'plan');
});

test('checkpointWorkflow preserves existing goal when goal is undefined', () => {
  let config = startWorkflow(defaultConfig('auto'), { firstSkill: 'plan', goal: 'Keep me', workflowId: 'wf-1', timestamp });
  config = checkpointWorkflow(config, { currentSkill: 'plan', nextSkill: 'execute', timestamp });
  assert.equal(config.active_workflow.goal, 'Keep me');
});

test('checkpointWorkflow preserves existing artifact_log', () => {
  let config = startWorkflow(defaultConfig('auto'), { firstSkill: 'plan', workflowId: 'wf-1', timestamp });
  config = checkpointWorkflow(config, { currentSkill: 'plan', nextSkill: 'execute', timestamp });
  assert.equal(config.active_workflow.artifact_log, '.pi/workflows/wf-1.jsonl');
});
