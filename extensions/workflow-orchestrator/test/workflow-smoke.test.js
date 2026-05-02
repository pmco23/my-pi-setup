const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { defaultConfig } = require('../src/config');
const { startWorkflow } = require('../src/state');
const { planAutoContinuation } = require('../src/auto');
const { buildSkillPrompt } = require('../src/prompts');

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'wf-smoke-')); }

function markdownFor(current, next) {
  const complete = next === 'none';
  return `Done.\n\n## Next Step\nRecommended skill: \`${next}\`\n\nAuto handoff:\n\`\`\`json\n${JSON.stringify({
    workflow_mode: 'auto',
    current_skill: current,
    next_skill: next,
    stop_reason: complete ? 'workflow complete' : null,
    confidence: 'high',
    open_questions: [],
  }, null, 2)}\n\`\`\``;
}

test('full v2 workflow smoke chain reaches completion', () => {
  let config = defaultConfig('auto');
  // Disable stop_before_execute to test the full chain
  config.auto_continue.stop_before_execute = false;
  config = startWorkflow(config, { firstSkill: 'brainstorm-spec', goal: 'Build hello world', workflowId: 'wf-smoke' });

  const sequence = [
    ['brainstorm-spec', 'implementation-research'],
    ['implementation-research', 'acceptance-criteria'],
    ['acceptance-criteria', 'plan'],
    ['plan', 'execute'],
    ['execute', 'review-against-plan'],
    ['review-against-plan', 'code-review'],
    ['code-review', 'none'],
  ];

  for (let i = 0; i < sequence.length; i++) {
    const [current, next] = sequence[i];
    const result = planAutoContinuation({ config, markdown: markdownFor(current, next), entryId: `e${i}` });

    if (next === 'none') {
      assert.equal(result.action, 'complete');
      assert.equal(result.config.active_workflow.id, null);
      config = result.config;
      continue;
    }

    assert.equal(result.action, 'continue', `${current} -> ${next} should continue`);
    assert.equal(result.nextSkill, next);
    assert.match(result.prompt, new RegExp(`^/skill:${next}`));
    assert.match(result.prompt, /Workflow reminder:/);
    assert.match(result.prompt, /Allowed next skills:/);

    // Goal should persist throughout chain
    assert.equal(result.config.active_workflow.goal, 'Build hello world');
    config = result.config;
  }
});

test('full v2 workflow smoke chain in user-in-the-loop suggests not chains', () => {
  let config = defaultConfig('user-in-the-loop');
  config = startWorkflow(config, { firstSkill: 'brainstorm-spec', workflowId: 'wf-manual' });

  const result = planAutoContinuation({
    config,
    markdown: markdownFor('brainstorm-spec', 'implementation-research'),
    entryId: 'e0',
  });

  assert.equal(result.action, 'suggest');
  assert.equal(result.nextSkill, 'implementation-research');
  assert.ok(result.prompt);
});
