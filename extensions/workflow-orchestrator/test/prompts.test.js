const test = require('node:test');
const assert = require('node:assert/strict');
const { workflowReminder, buildSkillPrompt, buildContinuePrompt } = require('../src/prompts');
const { defaultConfig } = require('../src/config');
const { startWorkflow, updateActiveWorkflow } = require('../src/state');

test('workflowReminder returns null without workflowId', () => {
  assert.equal(workflowReminder({ mode: 'auto' }), null);
  assert.equal(workflowReminder({}), null);
});

test('workflowReminder includes allowed next skills when workflowId present', () => {
  const reminder = workflowReminder({ workflowId: 'wf-1', currentSkill: 'plan', allowedNext: ['execute'] });
  assert.match(reminder, /Current skill: plan/);
  assert.match(reminder, /Allowed next skills: execute/);
  assert.match(reminder, /## Next Step/);
});

test('buildSkillPrompt builds slash skill command', () => {
  const prompt = buildSkillPrompt('plan', { goal: 'build x', mode: 'auto', workflowId: 'wf-1', artifactLog: '.pi/workflows/wf-1.jsonl', context: ['A', 'B'] });
  assert.match(prompt, /^\/skill:plan/);
  assert.match(prompt, /Goal: build x/);
  assert.match(prompt, /Workflow mode: auto/);
  assert.match(prompt, /Workflow reminder:/);
  assert.match(prompt, /- A/);
});

test('buildSkillPrompt does not inject reminder without workflowId', () => {
  const prompt = buildSkillPrompt('plan', { mode: 'auto' });
  assert.match(prompt, /^\/skill:plan/);
  assert.equal(prompt.includes('Workflow reminder:'), false);
});

test('buildContinuePrompt resumes from active workflow next skill', () => {
  let config = defaultConfig('auto');
  config = startWorkflow(config, { firstSkill: 'plan', workflowId: 'wf-1' });
  config = updateActiveWorkflow(config, {
    workflow_mode: 'auto', current_skill: 'plan', next_skill: 'execute',
    requires_user: false, stop_reason: null, confidence: 'high', reason: 'done',
    inputs: { primary_artifact: 'Build notes app', required_context: [], open_questions: [] },
  });
  const prompt = buildContinuePrompt(config);
  assert.match(prompt, /^\/skill:execute/);
  assert.match(prompt, /Workflow reminder:/);
  assert.match(prompt, /Goal: Build notes app/);
});
