const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { handleInit, handleContinue, handlePause, handleStart, handleStatus, projectMapStaleness } = require('../src/commands');
const { loadConfig } = require('../src/config');

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'wf-cmd-')); }

function env(cwd, selects = [], confirms = [], inputs = []) {
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
    input: async () => { const v = inputs.shift(); return v !== undefined ? v : ''; },
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

test('handlePause sets pause, handleContinue clears it and advances', async () => {
  const root = tmpdir();
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);
  const { saveConfig, loadConfig: lc } = require('../src/config');
  const { startWorkflow, updateActiveWorkflow } = require('../src/state');
  let config = lc(root).config;
  config = startWorkflow(config, { firstSkill: 'plan', workflowId: 'wf-1' });
  config = updateActiveWorkflow(config, {
    workflow_mode: 'auto', current_skill: 'plan', next_skill: 'execute',
    stop_reason: null, confidence: 'high', open_questions: [],
  });
  saveConfig(root, config);

  const e = env(root);
  await handlePause('waiting for review', e);
  assert.equal(loadConfig(root).config.active_workflow.paused, true);
  assert.equal(loadConfig(root).config.active_workflow.pause_reason, 'waiting for review');

  // handleContinue should clear the pause and advance
  const result = await handleContinue('', e);
  assert.equal(result.ok, true);
  assert.equal(loadConfig(root).config.active_workflow.paused, false);
  assert.match(e.sent.at(-1).message, /^\/skill:execute/);
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

// ── handleStart ──────────────────────────────────────────────────────────────

test('handleStart creates active_workflow and sends skill prompt', async () => {
  const root = tmpdir();
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);

  const e = env(root, ['plan'], [], ['Build a notes app']);
  const result = await handleStart('', e);
  assert.equal(result.ok, true);
  const config = loadConfig(root).config;
  assert.ok(config.active_workflow.id);
  assert.equal(config.active_workflow.next_skill, 'plan');
  assert.equal(config.active_workflow.goal, 'Build a notes app');
  assert.match(e.sent.at(-1).message, /^\/skill:plan/);
  assert.match(e.sent.at(-1).message, /Workflow reminder/);
  assert.match(e.sent.at(-1).message, /Allowed next skills/);
  assert.match(e.notifications[0].message, /Workflow started: plan/);
});

test('handleStart stores null goal when no goal entered', async () => {
  const root = tmpdir();
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);

  const e = env(root, ['plan'], [], ['']); // empty goal input
  const result = await handleStart('', e);
  assert.equal(result.ok, true);
  assert.equal(loadConfig(root).config.active_workflow.goal, null);
});

test('handleStart returns ok:false when skill select is cancelled', async () => {
  const root = tmpdir();
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);

  const e = env(root, [undefined]); // select returns undefined → cancelled
  const result = await handleStart('', e);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'cancelled');
  assert.equal(e.sent.length, 0);
});

test('handleStart returns ok:false when no config', async () => {
  const root = tmpdir();
  const e = env(root, ['plan']);
  const result = await handleStart('', e);
  assert.equal(result.ok, false);
});
test('handleStart confirms before replacing existing workflow (cancel)', async () => {
  const root = tmpdir();
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);
  const { saveConfig, loadConfig: lc } = require('../src/config');
  const { startWorkflow } = require('../src/state');
  saveConfig(root, startWorkflow(lc(root).config, { firstSkill: 'plan', workflowId: 'wf-existing' }));

  const e = env(root, [], [false]); // confirm → cancel
  const result = await handleStart('', e);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'cancelled');
  assert.equal(e.sent.length, 0);
  assert.equal(loadConfig(root).config.active_workflow.id, 'wf-existing');
});

test('handleStart confirms before replacing existing workflow (accept)', async () => {
  const root = tmpdir();
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);
  const { saveConfig, loadConfig: lc } = require('../src/config');
  const { startWorkflow } = require('../src/state');
  saveConfig(root, startWorkflow(lc(root).config, { firstSkill: 'plan', workflowId: 'wf-old' }));

  // confirm → accept, then pick brainstorm-spec, goal = 'New goal'
  const e = env(root, ['brainstorm-spec'], [true], ['New goal']);
  const result = await handleStart('', e);
  assert.equal(result.ok, true);
  const active = loadConfig(root).config.active_workflow;
  assert.notEqual(active.id, 'wf-old');
  assert.equal(active.next_skill, 'brainstorm-spec');
  assert.equal(active.goal, 'New goal');
  assert.equal(e.sent.length, 1);
});

// ── handleStatus ─────────────────────────────────────────────────────────────

test('handleStatus shows no active workflow when none exists', async () => {
  const root = tmpdir();
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'auto — pi chains skills until blocked', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);

  const e = env(root);
  const result = await handleStatus('', e);
  assert.equal(result.ok, true);
  assert.equal(result.hasActive, false);
  assert.match(e.notifications[0].message, /No active workflow/);
});

test('handleStatus shows active workflow details', async () => {
  const root = tmpdir();
  const e1 = env(root,
    ['Project (.pi/settings.json)', 'user-in-the-loop — pi suggests, you confirm each step', 'dark', 'medium'],
    [true, true]
  );
  await handleInit('', e1);

  const { saveConfig, loadConfig: lc } = require('../src/config');
  const { startWorkflow, updateActiveWorkflow } = require('../src/state');
  let config = lc(root).config;
  config = startWorkflow(config, { firstSkill: 'plan', goal: 'Test goal', workflowId: 'wf-status' });
  config = updateActiveWorkflow(config, {
    workflow_mode: 'user-in-the-loop', current_skill: 'plan', next_skill: 'execute',
    stop_reason: null, confidence: 'high', open_questions: [],
  });
  saveConfig(root, config);

  const e = env(root);
  const result = await handleStatus('', e);
  assert.equal(result.ok, true);
  assert.equal(result.hasActive, true);
  assert.match(e.notifications[0].message, /wf-status/);
  assert.match(e.notifications[0].message, /Test goal/);
  assert.match(e.notifications[0].message, /execute/);
});

test('handleStatus reports when no config exists', async () => {
  const root = tmpdir();
  const e = env(root);
  const result = await handleStatus('', e);
  assert.equal(result.ok, false);
  assert.match(e.notifications[0].message, /No workflow configured/);
});
