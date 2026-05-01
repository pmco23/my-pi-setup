const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSkillPrompt, buildStartPrompt, buildOnboardPrompt, buildContinuePrompt, firstSkillForGoal } = require('../src/prompts');
const { defaultConfig } = require('../src/config');

test('buildSkillPrompt builds slash skill command with context', () => {
  const prompt = buildSkillPrompt('plan', { goal: 'build x', mode: 'auto', workflowId: 'wf-1', artifactLog: '.pi/workflows/wf-1.jsonl', context: ['A', 'B'] });
  assert.match(prompt, /^\/skill:plan/);
  assert.match(prompt, /Goal: build x/);
  assert.match(prompt, /Workflow mode: auto/);
  assert.match(prompt, /- A/);
});

test('firstSkillForGoal chooses sensible starting skill', () => {
  assert.equal(firstSkillForGoal('new product idea'), 'brainstorm-spec');
  assert.equal(firstSkillForGoal('implement auth'), 'plan');
  assert.equal(firstSkillForGoal('review against plan'), 'review-against-plan');
  assert.equal(firstSkillForGoal('code review this'), 'code-review');
});

test('buildStartPrompt uses selected first skill', () => {
  const prompt = buildStartPrompt({ mode: 'user-in-the-loop', goal: 'new app', workflowId: 'wf-1', artifactLog: '.pi/workflows/wf-1.jsonl', firstSkill: 'brainstorm-spec' });
  assert.match(prompt, /^\/skill:brainstorm-spec/);
  assert.match(prompt, /Workflow ID: wf-1/);
});

test('buildOnboardPrompt uses project-intake and graphify-first instructions', () => {
  const prompt = buildOnboardPrompt({ mode: 'user-in-the-loop', workflowId: 'wf-1', artifactLog: '.pi/workflows/wf-1.jsonl', projectMap: defaultConfig().project_map });
  assert.match(prompt, /^\/skill:project-intake/);
  assert.match(prompt, /Use graphify from the beginning/);
  assert.match(prompt, /.pi\/project-map\/graph/);
});

test('buildContinuePrompt resumes from active workflow next skill', () => {
  const config = defaultConfig('auto');
  config.active_workflow = { id: 'wf-1', mode: 'auto', current_skill: 'plan', next_skill: 'execute', artifact_log: '.pi/workflows/wf-1.jsonl' };
  const prompt = buildContinuePrompt(config);
  assert.match(prompt, /^\/skill:execute/);
  assert.match(prompt, /Resume from current skill: plan/);
});
