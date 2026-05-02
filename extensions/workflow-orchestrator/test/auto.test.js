const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultConfig } = require('../src/config');
const { startWorkflow, updateActiveWorkflow } = require('../src/state');
const { latestAssistantMarkdown, messageText, planAutoContinuation } = require('../src/auto');

function activeConfig(mode = 'auto') {
  const c = defaultConfig(mode);
  return startWorkflow(c, { firstSkill: 'execute', workflowId: 'wf-1', timestamp: '2026-05-01T00:00:00.000Z' });
}

function handoff(overrides = {}) {
  return {
    workflow_mode: 'auto',
    current_skill: 'plan',
    next_skill: 'execute',
    requires_user: false,
    stop_reason: null,
    confidence: 'high',
    reason: 'Ready',
    inputs: { primary_artifact: 'Plan output', required_context: [], open_questions: [] },
    ...overrides,
  };
}

function markdownFor(handoffObject) {
  return `Done.\n\nAuto handoff:\n\`\`\`json\n${JSON.stringify(handoffObject, null, 2)}\n\`\`\``;
}

test('messageText extracts text from string and content arrays', () => {
  assert.equal(messageText({ content: 'hello' }), 'hello');
  assert.equal(messageText({ content: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] }), 'a\nb');
});

test('latestAssistantMarkdown returns the latest assistant message text', () => {
  const text = latestAssistantMarkdown([
    { role: 'assistant', content: 'old' },
    { role: 'user', content: 'ignore' },
    { role: 'assistant', content: [{ type: 'text', text: 'new' }] },
  ]);
  assert.equal(text, 'new');
});

test('planAutoContinuation continues on valid auto handoff', () => {
  const result = planAutoContinuation({ config: activeConfig('auto'), markdown: markdownFor(handoff()), entryId: 'e1' });
  assert.equal(result.action, 'continue');
  assert.equal(result.nextSkill, 'execute');
  assert.match(result.prompt, /^\/skill:execute/);
  assert.equal(result.config.active_workflow.last_processed_entry_id, 'e1');
});

test('planAutoContinuation suggests (not chains) in user-in-the-loop mode', () => {
  const result = planAutoContinuation({ config: activeConfig('user-in-the-loop'), markdown: markdownFor(handoff()), entryId: 'e1' });
  assert.equal(result.action, 'suggest');
  assert.equal(result.nextSkill, 'execute');
  assert.match(result.prompt, /^\/skill:execute/);
});

test('planAutoContinuation skips silently when no handoff in user-in-the-loop mode', () => {
  const result = planAutoContinuation({ config: activeConfig('user-in-the-loop'), markdown: 'no handoff here', entryId: 'e1' });
  assert.equal(result.action, 'none');
});

test('planAutoContinuation pauses when no handoff in auto mode', () => {
  const result = planAutoContinuation({ config: activeConfig('auto'), markdown: 'no handoff here', entryId: 'e1' });
  assert.equal(result.action, 'pause');
  assert.equal(result.config.active_workflow.paused, true);
});

test('planAutoContinuation ignores duplicate processed entry', () => {
  const config = activeConfig('auto');
  config.active_workflow.last_processed_entry_id = 'e1';
  const result = planAutoContinuation({ config, markdown: markdownFor(handoff()), entryId: 'e1' });
  assert.equal(result.action, 'none');
});

test('planAutoContinuation no-ops without active workflow', () => {
  const result = planAutoContinuation({ config: defaultConfig('auto'), markdown: markdownFor(handoff()), entryId: 'e1' });
  assert.equal(result.action, 'none');
});

test('planAutoContinuation completes when next_skill is none', () => {
  const result = planAutoContinuation({
    config: activeConfig('auto'),
    markdown: markdownFor(handoff({ current_skill: 'code-review', next_skill: 'none', requires_user: true, stop_reason: 'workflow complete' })),
    entryId: 'e1',
  });
  assert.equal(result.action, 'complete');
  assert.equal(result.config.active_workflow.id, null);
  assert.equal(result.audit.decision, 'complete');
});

test('planAutoContinuation captures goal from first handoff', () => {
  const config = activeConfig('auto');
  config.active_workflow.goal = null;
  const result = planAutoContinuation({
    config,
    markdown: markdownFor(handoff({ inputs: { primary_artifact: 'Build a notes app', required_context: [], open_questions: [] } })),
    entryId: 'e1',
  });
  assert.equal(result.action, 'continue');
  assert.equal(result.config.active_workflow.goal, 'Build a notes app');
});
