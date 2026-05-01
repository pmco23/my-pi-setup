const test = require('node:test');
const assert = require('node:assert/strict');
const { extractLatestHandoff, looksLikeHandoff } = require('../src/handoff');

function handoffJson(overrides = {}) {
  return JSON.stringify({
    workflow_mode: 'auto',
    current_skill: 'plan',
    next_skill: 'execute',
    requires_user: false,
    stop_reason: null,
    confidence: 'high',
    reason: 'Ready',
    inputs: { primary_artifact: 'Plan', required_context: [], open_questions: [] },
    ...overrides,
  }, null, 2);
}

test('looksLikeHandoff recognizes required handoff shape', () => {
  assert.equal(looksLikeHandoff(JSON.parse(handoffJson())), true);
  assert.equal(looksLikeHandoff({ workflow_mode: 'auto' }), false);
});

test('extracts latest valid workflow handoff JSON block', () => {
  const markdown = `
First:
\`\`\`json
${handoffJson({ current_skill: 'brainstorm-spec', next_skill: 'acceptance-criteria' })}
\`\`\`

Second:
\`\`\`json
${handoffJson({ current_skill: 'plan', next_skill: 'execute' })}
\`\`\`
`;
  const result = extractLatestHandoff(markdown);
  assert.equal(result.ok, true);
  assert.equal(result.handoff.current_skill, 'plan');
  assert.equal(result.handoff.next_skill, 'execute');
});

test('ignores unrelated JSON blocks', () => {
  const markdown = `
\`\`\`json
{"foo":"bar"}
\`\`\`

Auto handoff:
\`\`\`json
${handoffJson()}
\`\`\`
`;
  const result = extractLatestHandoff(markdown);
  assert.equal(result.ok, true);
  assert.equal(result.source, 'auto-handoff');
  assert.equal(result.handoff.next_skill, 'execute');
});

test('prefers last Auto handoff block over later unrelated handoff-shaped block', () => {
  const markdown = `
Auto handoff:
\`\`\`json
${handoffJson({ current_skill: 'plan', next_skill: 'execute' })}
\`\`\`

Example only:
\`\`\`json
${handoffJson({ current_skill: 'execute', next_skill: 'review-against-plan' })}
\`\`\`
`;
  const result = extractLatestHandoff(markdown);
  assert.equal(result.ok, true);
  assert.equal(result.source, 'auto-handoff');
  assert.equal(result.handoff.current_skill, 'plan');
});

test('fails closed when no JSON block exists', () => {
  const result = extractLatestHandoff('No handoff here.');
  assert.equal(result.ok, false);
  assert.match(result.reason, /No fenced JSON/);
});

test('fails closed when Auto handoff JSON is malformed', () => {
  const result = extractLatestHandoff(`
Auto handoff:
\`\`\`json
{"workflow_mode":"auto",
\`\`\`
`);
  assert.equal(result.ok, false);
  assert.match(result.reason, /Malformed Auto handoff JSON/);
});

test('fails closed when no valid workflow handoff exists', () => {
  const result = extractLatestHandoff(`
\`\`\`json
{"foo":"bar"}
\`\`\`
`);
  assert.equal(result.ok, false);
  assert.match(result.reason, /No valid workflow handoff/);
});
