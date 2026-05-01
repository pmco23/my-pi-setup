const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateHandoff, resolveMode } = require('../src/evaluator');

function baseConfig(overrides = {}) {
  return {
    version: 1,
    default_mode: 'auto',
    default_sequence: ['brainstorm-spec', 'acceptance-criteria', 'plan', 'execute', 'review-against-plan', 'code-review'],
    auto_continue: {
      enabled: true,
      allowed_skills: ['brainstorm-spec', 'acceptance-criteria', 'plan', 'execute', 'review-against-plan', 'code-review'],
      stop_on_open_questions: true,
      stop_on_low_confidence: true,
      stop_on_failed_validation: true,
      stop_on_blockers: true,
      stop_before_execute: false,
    },
    handoff: { require_json: true, require_user_prompt: true, persist_artifacts: true },
    transitions: {
      'brainstorm-spec': ['acceptance-criteria', 'plan'],
      'acceptance-criteria': ['plan'],
      plan: ['execute'],
      execute: ['review-against-plan'],
      'review-against-plan': ['execute', 'code-review', 'none'],
      'code-review': ['execute', 'review-against-plan', 'none'],
      'workflow-orchestrator': ['brainstorm-spec', 'acceptance-criteria', 'plan', 'execute', 'review-against-plan', 'code-review', 'none'],
    },
    active_workflow: { id: null, mode: null, current_skill: null, next_skill: null, artifact_log: null, updated_at: null },
    ...overrides,
  };
}

function baseHandoff(overrides = {}) {
  return {
    workflow_mode: 'auto',
    current_skill: 'plan',
    next_skill: 'execute',
    requires_user: false,
    stop_reason: null,
    confidence: 'high',
    reason: 'Ready to implement.',
    inputs: { primary_artifact: 'Plan', required_context: [], open_questions: [] },
    ...overrides,
  };
}

test('valid plan -> execute in auto mode continues', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff() });
  assert.equal(result.decision, 'continue');
  assert.equal(result.next_skill, 'execute');
});

test('user-in-the-loop mode pauses', () => {
  const config = baseConfig({ default_mode: 'user-in-the-loop', auto_continue: { ...baseConfig().auto_continue, enabled: false } });
  const result = evaluateHandoff({ config, handoff: baseHandoff({ workflow_mode: 'auto' }) });
  assert.equal(result.decision, 'pause');
  assert.equal(result.workflow_mode, 'user-in-the-loop');
  assert.match(result.reason, /User-in-the-loop/);
});

test('invalid transition pauses', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: baseHandoff({ next_skill: 'code-review' }) });
  assert.equal(result.decision, 'pause');
  assert.match(result.reason, /Invalid transition/);
});

test('open questions pause', () => {
  const result = evaluateHandoff({
    config: baseConfig(),
    handoff: baseHandoff({ inputs: { primary_artifact: 'Plan', required_context: [], open_questions: ['Choose database'] } }),
  });
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

test('mode precedence is override > active workflow > config default > handoff', () => {
  const config = baseConfig({ default_mode: 'user-in-the-loop', active_workflow: { ...baseConfig().active_workflow, mode: 'auto' } });
  assert.equal(resolveMode({ config, handoff: baseHandoff({ workflow_mode: 'user-in-the-loop' }) }), 'auto');
  assert.equal(resolveMode({ config, handoff: baseHandoff(), modeOverride: 'user-in-the-loop' }), 'user-in-the-loop');
});

test('schema validation failure pauses', () => {
  const result = evaluateHandoff({ config: baseConfig(), handoff: { next_skill: 'execute' } });
  assert.equal(result.decision, 'pause');
  assert.equal(result.reason, 'Schema validation failed');
  assert.ok(result.errors.length > 0);
});
