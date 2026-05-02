const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateHandoff, resolveMode, validateConfig, validateHandoff } = require('../src/evaluator');
const { defaultConfig } = require('../src/config');

function baseConfig(overrides = {}) {
  return { ...defaultConfig('auto'), ...overrides };
}

function baseHandoff(overrides = {}) {
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

test('valid brainstorm-spec -> implementation-research in auto mode continues', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff() });
  assert.equal(result.decision, 'continue');
  assert.equal(result.next_skill, 'implementation-research');
});

test('plan -> execute pauses by default (stop_before_execute)', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff({ current_skill: 'plan', next_skill: 'execute' }) });
  assert.equal(result.decision, 'pause');
  assert.match(result.reason, /stop before execute/);
});

test('plan -> execute continues when stop_before_execute is disabled', () => {
  const config = baseConfig();
  config.auto_continue.stop_before_execute = false;
  const result = evaluateHandoff({ config, handoff: baseHandoff({ current_skill: 'plan', next_skill: 'execute' }) });
  assert.equal(result.decision, 'continue');
  assert.equal(result.next_skill, 'execute');
});

test('next skill none completes workflow', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff({ current_skill: 'code-review', next_skill: 'none', stop_reason: 'workflow complete' }) });
  assert.equal(result.decision, 'complete');
  assert.equal(result.next_skill, 'none');
});

test('invalid transition pauses', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff({ current_skill: 'plan', next_skill: 'code-review' }) });
  assert.equal(result.decision, 'pause');
  assert.match(result.reason, /Invalid transition/);
});

test('open questions pause', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff({ open_questions: ['Choose database'] }) });
  assert.equal(result.decision, 'pause');
  assert.match(result.reason, /Open questions/);
});

test('open questions in old format (inputs.open_questions) also pause', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff({ open_questions: undefined, inputs: { open_questions: ['Pick a DB'] }, requires_user: false }) });
  assert.equal(result.decision, 'pause');
  assert.match(result.reason, /Open questions/);
});

test('low confidence pauses', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff({ confidence: 'low' }) });
  assert.equal(result.decision, 'pause');
  assert.match(result.reason, /Low confidence/);
});

test('blockers pause', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff({ signals: { blockers: true } }) });
  assert.equal(result.decision, 'pause');
  assert.match(result.reason, /Blockers/);
});

test('failed validation pauses', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff({ signals: { failed_validation: true } }) });
  assert.equal(result.decision, 'pause');
  assert.match(result.reason, /Failed validation/);
});

test('destructive or risky signal pauses', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff({ signals: { destructive_or_risky: true } }) });
  assert.equal(result.decision, 'pause');
  assert.match(result.reason, /Destructive or risky/);
});

test('schema validation failure pauses on v1 config', () => {
  const v1Config = { version: 1, default_mode: 'auto', auto_continue: { enabled: true }, transitions: {}, active_workflow: {} };
  const result = evaluateHandoff({ config: v1Config, handoff: baseHandoff() });
  assert.equal(result.decision, 'pause');
  assert.equal(result.reason, 'Schema validation failed');
  assert.ok(result.errors.length > 0);
});

test('resolveMode uses config.mode in v2', () => {
  assert.equal(resolveMode({ config: baseConfig() }), 'auto');
  assert.equal(resolveMode({ config: baseConfig(), modeOverride: 'user-in-the-loop' }), 'user-in-the-loop');
});
