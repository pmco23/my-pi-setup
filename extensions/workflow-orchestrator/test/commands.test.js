const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { handleInit, handleContinue, handlePause, handleResume, projectMapStaleness } = require('../src/commands');
const { loadConfig } = require('../src/config');

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'wf-cmd-')); }

function env(cwd, selects = [], confirms = []) {
  const sent = [];
  const notifications = [];
  return {
    cwd,
    homeDir: os.tmpdir(),
    sent,
    notifications,
    notify: (message, level) => notifications.push({ message, level }),
    sendUserMessage: (message, options) => sent.push({ message, options }),
    select: async () => selects.shift(),
    confirm: async () => { const v = confirms.shift(); return v !== undefined ? v : true; },
    input: async (title, placeholder) => placeholder || '',
  };
}

test('handleInit creates v2 config with auto mode via wizard', async () => {
  const root = tmpdir();
  const e = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'onyx (bundled custom dark theme)', 'medium'],
    [true, true]  // compaction, retry
  );
  const result = await handleInit('', e);
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'auto');
  const config = loadConfig(root);
  assert.equal(config.ok, true);
  assert.equal(config.config.version, 2);
  assert.equal(config.config.mode, 'auto');
  assert.equal(config.config.auto_continue.enabled, true);
  assert.equal(e.notifications.at(-1).level, 'success');
});

test('handleInit creates v2 config with user-in-the-loop mode', async () => {
  const root = tmpdir();
  const e = env(root,
    ['Project (.pi/settings.json)', 'user-in-the-loop — pi suggests, you confirm each step', 'dark', 'medium'],
    [true, true]
  );
  const result = await handleInit('', e);
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'user-in-the-loop');
  const config = loadConfig(root);
  assert.equal(config.config.mode, 'user-in-the-loop');
  assert.equal(config.config.auto_continue.enabled, false);
});

test('handleInit prompts before overwriting existing config', async () => {
  const root = tmpdir();
  // first init
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);
  // second init — confirm overwrite + new selections
  const e2 = env(root,
    ['Project (.pi/settings.json)', 'user-in-the-loop — pi suggests, you confirm each step', 'dark', 'medium'],
    [true, true, true]  // confirm overwrite, then compaction, retry
  );
  const result = await handleInit('', e2);
  assert.equal(result.ok, true);
  assert.equal(loadConfig(root).config.mode, 'user-in-the-loop');
});

test('handleContinue sends next skill prompt when workflow is active', async () => {
  const root = tmpdir();
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);

  // Manually set up an active workflow with a pending next skill
  const { saveConfig, loadConfig } = require('../src/config');
  const { startWorkflow, updateActiveWorkflow } = require('../src/state');
  let config = loadConfig(root).config;
  config = startWorkflow(config, { firstSkill: 'plan', goal: 'Build a notes app', workflowId: 'wf-1' });
  config = updateActiveWorkflow(config, {
    workflow_mode: 'auto', current_skill: 'plan', next_skill: 'execute',
    requires_user: false, stop_reason: null, confidence: 'high', reason: 'done',
    inputs: { primary_artifact: 'Build a notes app', required_context: [], open_questions: [] },
  });
  saveConfig(root, config);

  const e = env(root);
  const result = await handleContinue('', e);
  assert.equal(result.ok, true);
  assert.match(e.sent.at(-1).message, /^\/skill:execute/);
  assert.match(e.notifications[0].message, /Continuing: execute/);
});

test('handleContinue notifies when no active workflow', async () => {
  const root = tmpdir();
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);
  const e = env(root);
  const result = await handleContinue('', e);
  assert.equal(result.ok, false);
  assert.match(e.notifications[0].message, /No active workflow/);
  assert.equal(e.sent.length, 0);
});

test('handlePause and handleResume update pause state', async () => {
  const root = tmpdir();
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);
  const { saveConfig, loadConfig } = require('../src/config');
  const { startWorkflow } = require('../src/state');
  let config = loadConfig(root).config;
  config = startWorkflow(config, { firstSkill: 'plan', workflowId: 'wf-1' });
  saveConfig(root, config);

  const e = env(root);
  await handlePause('waiting for review', e);
  assert.equal(loadConfig(root).config.active_workflow.paused, true);
  await handleResume('', e);
  assert.equal(loadConfig(root).config.active_workflow.paused, false);
});

test('projectMapStaleness detects stale guidance', async () => {
  const root = tmpdir();
  const guidancePath = path.join(root, '.pi', 'project-map', 'agent-guidance.md');
  fs.mkdirSync(path.dirname(guidancePath), { recursive: true });
  fs.writeFileSync(guidancePath, '# guidance\n');
  const oldTime = new Date(Date.now() - 60_000);
  fs.utimesSync(guidancePath, oldTime, oldTime);
  fs.mkdirSync(path.join(root, 'skills', 'x'), { recursive: true });
  fs.writeFileSync(path.join(root, 'skills', 'x', 'SKILL.md'), '# changed\n');

  const result = projectMapStaleness(root, guidancePath);
  assert.equal(result.stale, true);
});

test('projectMapStaleness returns not stale when guidance is up to date', () => {
  const root = tmpdir();
  const guidancePath = path.join(root, 'guidance.md');
  fs.writeFileSync(guidancePath, '# guidance\n');
  const result = projectMapStaleness(root, guidancePath);
  assert.equal(result.stale, false);
});
