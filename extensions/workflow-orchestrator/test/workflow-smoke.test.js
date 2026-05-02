const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { initConfig, loadConfig, saveConfig } = require('../src/config');
const { startWorkflow } = require('../src/state');
const { planAutoContinuation } = require('../src/auto');
const { buildStartPrompt, buildContinuePrompt } = require('../src/prompts');

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'wf-smoke-')); }

function markdownFor(current, next) {
  const complete = next === 'none';
  return `Done.\n\n## Next Step\nRecommended skill: \`${next}\`\nReason: continue\n\nUser prompt:\n- Continue?\n\nAuto handoff:\n\`\`\`json\n${JSON.stringify({
    workflow_mode: 'auto',
    current_skill: current,
    next_skill: next,
    requires_user: complete,
    stop_reason: complete ? 'workflow complete' : null,
    confidence: 'high',
    reason: `${current} complete`,
    inputs: { primary_artifact: `${current} result`, required_context: [], open_questions: [] },
  }, null, 2)}\n\`\`\``;
}

test('full workflow smoke chain reaches completion', () => {
  const root = tmpdir();
  initConfig(root, 'auto');
  let config = startWorkflow(loadConfig(root).config, { mode: 'auto', firstSkill: 'brainstorm-spec', workflowId: 'wf-smoke' });
  saveConfig(root, config);

  const startPrompt = buildStartPrompt({
    mode: 'auto',
    goal: 'Create a simple hello world program',
    workflowId: config.active_workflow.id,
    artifactLog: config.active_workflow.artifact_log,
    firstSkill: 'brainstorm-spec',
    allowedNext: config.transitions['brainstorm-spec'],
  });
  assert.match(startPrompt, /^\/skill:brainstorm-spec/);
  assert.match(startPrompt, /Allowed next skills: implementation-research, acceptance-criteria, plan/);

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
    const result = planAutoContinuation({ config, markdown: markdownFor(current, next), entryId: `entry-${i}`, isWorkflowSkillResponse: true });
    if (next === 'none') {
      assert.equal(result.action, 'complete');
      assert.equal(result.config.active_workflow.id, null);
      config = result.config;
      continue;
    }
    assert.equal(result.action, 'continue');
    assert.equal(result.nextSkill, next);
    assert.match(result.prompt, new RegExp(`^/skill:${next}`));
    assert.match(result.prompt, /Workflow reminder:/);
    assert.match(result.prompt, /Allowed next skills:/);
    config = result.config;
    const continuePrompt = buildContinuePrompt(config);
    assert.match(continuePrompt, new RegExp(`^/skill:${next}`));
  }
});
