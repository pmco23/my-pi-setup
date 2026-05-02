const test = require('node:test');
const assert = require('node:assert/strict');
const { workflowReminder, buildSkillPrompt, buildContinuePrompt, buildWorkflowSystemPrompt } = require('../src/prompts');
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

test('buildSkillPrompt includes artifact dir, step, and previous artifact', () => {
  const prompt = buildSkillPrompt('plan', {
    mode: 'auto',
    workflowId: 'wf-1',
    artifactLog: '.pi/workflows/wf-1.jsonl',
    artifactDir: '.pi/workflows/wf-1/',
    step: 2,
    previousArtifact: '.pi/workflows/wf-1/01-brainstorm-spec.md',
  });
  assert.match(prompt, /Artifact dir: \.pi\/workflows\/wf-1\//);
  assert.match(prompt, /Step: 2/);
  assert.match(prompt, /Previous artifact: \.pi\/workflows\/wf-1\/01-brainstorm-spec\.md/);
});

test('workflowReminder includes artifact read directive when previousArtifact is set', () => {
  const reminder = workflowReminder({ workflowId: 'wf-1', currentSkill: 'plan', allowedNext: ['execute'], previousArtifact: '.pi/workflows/wf-1/01-spec.md' });
  assert.match(reminder, /read it before starting/);
});

test('workflowReminder omits artifact read directive when no previousArtifact', () => {
  const reminder = workflowReminder({ workflowId: 'wf-1', currentSkill: 'plan', allowedNext: ['execute'] });
  assert.equal(reminder.includes('read it before starting'), false);
});

test('buildContinuePrompt resumes from active workflow next skill with artifact fields', () => {
  let config = defaultConfig('auto');
  config = startWorkflow(config, { firstSkill: 'plan', workflowId: 'wf-1' });
  config = updateActiveWorkflow(config, {
    workflow_mode: 'auto', current_skill: 'plan', next_skill: 'execute',
    stop_reason: null, confidence: 'high', open_questions: [],
    artifact: '.pi/workflows/wf-1/01-plan.md',
  });
  const prompt = buildContinuePrompt(config);
  assert.match(prompt, /^\/skill:execute/);
  assert.match(prompt, /Workflow reminder:/);
  assert.match(prompt, /Artifact dir: \.pi\/workflows\/wf-1\//);
  assert.match(prompt, /Step: 2/);
  assert.match(prompt, /Previous artifact: \.pi\/workflows\/wf-1\/01-plan\.md/);
});

test('buildWorkflowSystemPrompt returns null when no active workflow', () => {
  const config = defaultConfig('auto');
  assert.equal(buildWorkflowSystemPrompt(config), null);
});

test('buildWorkflowSystemPrompt returns context block for active workflow', () => {
  let config = defaultConfig('auto');
  config = startWorkflow(config, { firstSkill: 'brainstorm-spec', goal: 'Build notes app', workflowId: 'wf-sys' });
  config = updateActiveWorkflow(config, {
    workflow_mode: 'auto', current_skill: 'brainstorm-spec', next_skill: 'plan',
    stop_reason: null, confidence: 'high', open_questions: [],
    artifact: '.pi/workflows/wf-sys/01-brainstorm-spec.md',
  });
  const block = buildWorkflowSystemPrompt(config);
  assert.ok(block);
  assert.match(block, /\[Active Workflow\]/);
  assert.match(block, /ID: wf-sys/);
  assert.match(block, /Goal: Build notes app/);
  assert.match(block, /Step: 1/);
  assert.match(block, /Last artifact: .pi\/workflows\/wf-sys\/01-brainstorm-spec\.md/);
  assert.match(block, /Mode: auto/);
  assert.match(block, /Allowed transitions from plan: execute/);
});

test('buildWorkflowSystemPrompt omits goal and artifact lines when absent', () => {
  let config = defaultConfig('auto');
  config = startWorkflow(config, { firstSkill: 'plan', workflowId: 'wf-min' });
  const block = buildWorkflowSystemPrompt(config);
  assert.ok(block);
  assert.equal(block.includes('Goal:'), false);
  assert.equal(block.includes('Last artifact:'), false);
});
