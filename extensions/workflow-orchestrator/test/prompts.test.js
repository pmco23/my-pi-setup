const test = require('node:test');
const assert = require('node:assert/strict');
const { workflowReminder, buildSkillPrompt, buildStartPrompt, buildOnboardPrompt, buildRefreshPrompt, buildContinuePrompt, firstSkillForGoal } = require('../src/prompts');
const { defaultConfig } = require('../src/config');

test('buildSkillPrompt builds slash skill command with context', () => {
  const prompt = buildSkillPrompt('plan', { goal: 'build x', mode: 'auto', workflowId: 'wf-1', artifactLog: '.pi/workflows/wf-1.jsonl', context: ['A', 'B'] });
  assert.match(prompt, /^\/skill:plan/);
  assert.match(prompt, /Goal: build x/);
  assert.match(prompt, /Workflow mode: auto/);
  assert.match(prompt, /Workflow reminder:/);
  assert.match(prompt, /End the final response with `## Next Step`/);
  assert.match(prompt, /- A/);
});

test('workflowReminder includes allowed next skills', () => {
  const reminder = workflowReminder({ mode: 'auto', currentSkill: 'plan', allowedNext: ['execute'] });
  assert.match(reminder, /Current skill: plan/);
  assert.match(reminder, /Allowed next skills: execute/);
});

test('firstSkillForGoal chooses sensible starting skill', () => {
  // defaults to brainstorm-spec for open-ended goals
  assert.equal(firstSkillForGoal('new product idea'), 'brainstorm-spec');
  assert.equal(firstSkillForGoal('review and improve the workflow extension'), 'brainstorm-spec');
  assert.equal(firstSkillForGoal('improve the API design'), 'brainstorm-spec');
  assert.equal(firstSkillForGoal(''), 'brainstorm-spec');

  // routes to plan for concrete implementation tasks
  assert.equal(firstSkillForGoal('implement auth'), 'plan');
  assert.equal(firstSkillForGoal('fix the failing test'), 'plan');
  assert.equal(firstSkillForGoal('add dark mode support'), 'plan');
  assert.equal(firstSkillForGoal('refactor the config module'), 'plan');
  assert.equal(firstSkillForGoal('build a notes app'), 'plan');
  assert.equal(firstSkillForGoal('create a REST endpoint'), 'plan');
  assert.equal(firstSkillForGoal('update the README'), 'plan');

  // routes to review-against-plan only on specific phrases
  assert.equal(firstSkillForGoal('review against plan'), 'review-against-plan');
  assert.equal(firstSkillForGoal('verify against the plan'), 'review-against-plan');
  assert.equal(firstSkillForGoal('check implementation against plan'), 'review-against-plan');

  // routes to code-review on specific phrases
  assert.equal(firstSkillForGoal('code review this'), 'code-review');
  assert.equal(firstSkillForGoal('engineering review of the PR'), 'code-review');

  // bare "review" should NOT route to review-against-plan
  assert.equal(firstSkillForGoal('review the codebase'), 'brainstorm-spec');
  assert.equal(firstSkillForGoal('review my changes'), 'brainstorm-spec');
});

test('buildStartPrompt uses selected first skill', () => {
  const prompt = buildStartPrompt({ mode: 'user-in-the-loop', goal: 'new app', workflowId: 'wf-1', artifactLog: '.pi/workflows/wf-1.jsonl', firstSkill: 'brainstorm-spec', allowedNext: ['implementation-research'] });
  assert.match(prompt, /^\/skill:brainstorm-spec/);
  assert.match(prompt, /Workflow ID: wf-1/);
  assert.match(prompt, /Allowed next skills: implementation-research/);
});

test('buildOnboardPrompt uses project-intake and graphify-first instructions', () => {
  const prompt = buildOnboardPrompt({ mode: 'user-in-the-loop', workflowId: 'wf-1', artifactLog: '.pi/workflows/wf-1.jsonl', projectMap: defaultConfig().project_map });
  assert.match(prompt, /^\/skill:project-intake/);
  assert.match(prompt, /Use graphify from the beginning/);
  assert.match(prompt, /.pi\/project-map\/graph/);
});

test('buildOnboardPrompt includes optional post-onboarding goal', () => {
  const prompt = buildOnboardPrompt({ mode: 'auto', workflowId: 'wf-1', artifactLog: '.pi/workflows/wf-1.jsonl', projectMap: defaultConfig().project_map, goal: 'build hello world' });
  assert.match(prompt, /prepare to plan this goal: build hello world/);
  assert.match(prompt, /User goal after onboarding: build hello world/);
});

test('buildRefreshPrompt includes refresh instructions and last_updated', () => {
  const pm = { ...defaultConfig().project_map, last_updated: '2026-05-01T00:00:00Z' };
  const prompt = buildRefreshPrompt({ mode: 'user-in-the-loop', projectMap: pm });
  assert.match(prompt, /^\/skill:project-intake/);
  assert.match(prompt, /refresh/i);
  assert.match(prompt, /Use graphify from the beginning/);
  assert.match(prompt, /Last updated: 2026-05-01/);
});

test('buildContinuePrompt resumes from active workflow next skill', () => {
  const config = defaultConfig('auto');
  config.active_workflow = { id: 'wf-1', mode: 'auto', current_skill: 'plan', next_skill: 'execute', artifact_log: '.pi/workflows/wf-1.jsonl' };
  const prompt = buildContinuePrompt(config);
  assert.match(prompt, /^\/skill:execute/);
  assert.match(prompt, /Resume from current skill: plan/);
});
