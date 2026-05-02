const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultConfig } = require('../src/config');
const { startWorkflow, updateActiveWorkflow } = require('../src/state');
const { latestAssistantMarkdown, messageText, planAutoContinuation } = require('../src/auto');

function activeConfig(mode = 'auto') {
  const c = defaultConfig(mode);
  return startWorkflow(c, { firstSkill: 'implementation-research', workflowId: 'wf-1', timestamp: '2026-05-01T00:00:00.000Z' });
}

function handoff(overrides = {}) {
  return {
    workflow_mode: 'auto',
    current_skill: 'brainstorm-spec',
    next_skill: 'implementation-research',
    stop_reason: null,
    confidence: 'high',
    open_questions: [],
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
  assert.equal(result.nextSkill, 'implementation-research');
  assert.match(result.prompt, /^\/skill:implementation-research/);
  assert.equal(result.config.active_workflow.last_processed_entry_id, 'e1');
});

test('planAutoContinuation suggests (not chains) in user-in-the-loop mode', () => {
  const result = planAutoContinuation({ config: activeConfig('user-in-the-loop'), markdown: markdownFor(handoff()), entryId: 'e1' });
  assert.equal(result.action, 'suggest');
  assert.equal(result.nextSkill, 'implementation-research');
  assert.match(result.prompt, /^\/skill:implementation-research/);
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

test('planAutoContinuation no-ops without active workflow and no handoff', () => {
  const result = planAutoContinuation({ config: defaultConfig('auto'), markdown: 'no handoff here', entryId: 'e1' });
  assert.equal(result.action, 'none');
});

test('planAutoContinuation bootstraps workflow from first handoff in auto mode', () => {
  const result = planAutoContinuation({ config: defaultConfig('auto'), markdown: markdownFor(handoff()), entryId: 'e1' });
  assert.equal(result.action, 'continue');
  assert.equal(result.nextSkill, 'implementation-research');
  assert.ok(result.config.active_workflow.id, 'workflow id should be set after bootstrap');
  assert.ok(result.config.active_workflow.artifact_log, 'artifact_log should be set after bootstrap');
});

test('planAutoContinuation bootstraps and suggests from first handoff in user-in-the-loop mode', () => {
  const result = planAutoContinuation({ config: defaultConfig('user-in-the-loop'), markdown: markdownFor(handoff()), entryId: 'e1' });
  assert.equal(result.action, 'suggest');
  assert.equal(result.nextSkill, 'implementation-research');
  assert.ok(result.config.active_workflow.id, 'workflow id should be set after bootstrap');
  assert.ok(result.config.active_workflow.artifact_log, 'artifact_log should be set after bootstrap');
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
    markdown: markdownFor(handoff({ inputs: { primary_artifact: 'Build a notes app', required_context: [], open_questions: [] }, requires_user: false })),
    entryId: 'e1',
  });
  assert.equal(result.action, 'continue');
  assert.equal(result.config.active_workflow.goal, 'Build a notes app');
});
