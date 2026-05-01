const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultConfig } = require('../src/config');
const { startWorkflow } = require('../src/state');
const { latestAssistantMarkdown, messageText, planAutoContinuation } = require('../src/auto');

function activeConfig(mode = 'auto') {
  return startWorkflow(defaultConfig(mode), { mode, firstSkill: 'execute', workflowId: 'wf-1', timestamp: '2026-05-01T00:00:00.000Z' });
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
    inputs: { primary_artifact: 'Plan', required_context: [], open_questions: [] },
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
  const result = planAutoContinuation({ config: activeConfig('auto'), markdown: markdownFor(handoff()), entryId: 'entry-1' });
  assert.equal(result.action, 'continue');
  assert.equal(result.nextSkill, 'execute');
  assert.match(result.prompt, /^\/skill:execute/);
  assert.equal(result.config.active_workflow.last_processed_entry_id, 'entry-1');
});

test('planAutoContinuation pauses on user-in-the-loop config', () => {
  const result = planAutoContinuation({ config: activeConfig('user-in-the-loop'), markdown: markdownFor(handoff({ workflow_mode: 'auto' })), entryId: 'entry-1' });
  assert.equal(result.action, 'pause');
  assert.match(result.reason, /User-in-the-loop/);
  assert.equal(result.config.active_workflow.paused, true);
});

test('planAutoContinuation pauses on invalid or missing handoff when workflow active', () => {
  const result = planAutoContinuation({ config: activeConfig('auto'), markdown: 'no handoff', entryId: 'entry-1' });
  assert.equal(result.action, 'pause');
  assert.match(result.reason, /No fenced JSON/);
  assert.equal(result.config.active_workflow.paused, true);
});

test('planAutoContinuation ignores duplicate processed entry', () => {
  const config = activeConfig('auto');
  config.active_workflow.last_processed_entry_id = 'entry-1';
  const result = planAutoContinuation({ config, markdown: markdownFor(handoff()), entryId: 'entry-1' });
  assert.equal(result.action, 'none');
});

test('planAutoContinuation no-ops without active workflow', () => {
  const result = planAutoContinuation({ config: defaultConfig('auto'), markdown: markdownFor(handoff()), entryId: 'entry-1' });
  assert.equal(result.action, 'none');
});

test('planAutoContinuation clears workflow when next skill is none', () => {
  const result = planAutoContinuation({
    config: activeConfig('auto'),
    markdown: markdownFor(handoff({ current_skill: 'review-against-plan', next_skill: 'none' })),
    entryId: 'entry-1',
  });
  assert.equal(result.action, 'pause');
  assert.equal(result.artifactLog, '.pi/workflows/wf-1.jsonl');
  assert.equal(result.config.active_workflow.id, null);
});
