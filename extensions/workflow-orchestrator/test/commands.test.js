const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { handleInit, handleStart, handleOnboard, handleRefresh, handleContext, handleContinue, handleStatus, handlePause, handleResume, parseModeAndRest } = require('../src/commands');
const { loadConfig } = require('../src/config');

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'wf-cmd-')); }
function env(cwd) {
  const sent = [];
  const notifications = [];
  return {
    cwd,
    sent,
    notifications,
    notify: (message, level) => notifications.push({ message, level }),
    sendUserMessage: (message, options) => sent.push({ message, options }),
  };
}

test('parseModeAndRest handles optional mode', () => {
  assert.deepEqual(parseModeAndRest('auto build app', 'user-in-the-loop'), { mode: 'auto', rest: 'build app' });
  assert.deepEqual(parseModeAndRest('build app', 'user-in-the-loop'), { mode: 'user-in-the-loop', rest: 'build app' });
});

test('handleInit creates config', async () => {
  const root = tmpdir();
  const e = env(root);
  const result = await handleInit('auto', e);
  assert.equal(result.status, 'created');
  assert.equal(loadConfig(root).config.default_mode, 'auto');
  assert.equal(e.notifications[0].level, 'success');
});

test('handleStatus summarizes config without sending messages', async () => {
  const root = tmpdir();
  const e = env(root);
  await handleInit('user-in-the-loop', e);
  const status = await handleStatus('', e);
  assert.equal(status.ok, true);
  assert.match(status.summary, /Workflow mode: user-in-the-loop/);
  assert.equal(e.sent.length, 0);
});

test('handleInit installs pre-push hook when git repo exists', async () => {
  const root = tmpdir();
  const fs = require('node:fs');
  const path = require('node:path');
  // Create .git directory to simulate a git repo
  fs.mkdirSync(path.join(root, '.git', 'hooks'), { recursive: true });
  const e = env(root);
  await handleInit('auto', e);
  const hookPath = path.join(root, '.git', 'hooks', 'pre-push');
  assert.equal(fs.existsSync(hookPath), true);
  const content = fs.readFileSync(hookPath, 'utf8');
  assert.match(content, /project-map/);
});

test('handleInit does not overwrite existing pre-push hook', async () => {
  const root = tmpdir();
  const fs = require('node:fs');
  const path = require('node:path');
  fs.mkdirSync(path.join(root, '.git', 'hooks'), { recursive: true });
  const hookPath = path.join(root, '.git', 'hooks', 'pre-push');
  fs.writeFileSync(hookPath, '#!/bin/sh\necho custom hook');
  const e = env(root);
  await handleInit('auto', e);
  assert.equal(fs.readFileSync(hookPath, 'utf8'), '#!/bin/sh\necho custom hook');
});

test('handleStart initializes active workflow and sends first skill prompt', async () => {
  const root = tmpdir();
  const e = env(root);
  await handleInit('auto', e);
  const result = await handleStart('auto build a notes app', e);
  assert.equal(result.ok, true);
  assert.match(e.sent.at(-1).message, /^\/skill:brainstorm-spec/);
  const config = loadConfig(root).config;
  assert.equal(config.active_workflow.mode, 'auto');
  assert.equal(config.active_workflow.next_skill, 'brainstorm-spec');
  assert.equal(fs.existsSync(path.join(root, config.active_workflow.artifact_log)), true);
});

test('handleStart fails closed when config missing', async () => {
  const root = tmpdir();
  const e = env(root);
  const result = await handleStart('auto build app', e);
  assert.equal(result.ok, false);
  assert.equal(e.sent.length, 0);
});

test('handleOnboard initializes config if needed and sends project-intake prompt', async () => {
  const root = tmpdir();
  const e = env(root);
  const result = await handleOnboard('user-in-the-loop', e);
  assert.equal(result.ok, true);
  assert.match(e.sent.at(-1).message, /^\/skill:project-intake/);
  assert.match(e.sent.at(-1).message, /Use graphify from the beginning/);
  const config = loadConfig(root).config;
  assert.equal(config.active_workflow.next_skill, 'project-intake');
  assert.equal(config.project_map.graph.enabled, true);
});

test('handleContext reports missing project map files', async () => {
  const root = tmpdir();
  const e = env(root);
  await handleInit('auto', e);
  const result = await handleContext('', e);
  assert.equal(result.ok, true);
  assert.match(result.summary, /Agent guidance: missing/);
  assert.match(result.summary, /Graph JSON: missing/);
});

test('handleRefresh sends project-intake with refresh instructions', async () => {
  const root = tmpdir();
  const e = env(root);
  await handleInit('auto', e);
  const result = await handleRefresh('', e);
  assert.equal(result.ok, true);
  assert.match(e.sent.at(-1).message, /^\/skill:project-intake/);
  assert.match(e.sent.at(-1).message, /refresh/i);
  assert.match(e.sent.at(-1).message, /Use graphify from the beginning/);
});

test('handleRefresh fails closed when config missing', async () => {
  const root = tmpdir();
  const e = env(root);
  const result = await handleRefresh('', e);
  assert.equal(result.ok, false);
  assert.equal(e.sent.length, 0);
});

test('handleContinue sends active next skill prompt', async () => {
  const root = tmpdir();
  const e = env(root);
  await handleInit('auto', e);
  await handleStart('auto implement auth', e);
  const result = await handleContinue('', e);
  assert.equal(result.ok, true);
  assert.match(e.sent.at(-1).message, /^\/skill:plan/);
});

test('handlePause and handleResume update active state', async () => {
  const root = tmpdir();
  const e = env(root);
  await handleInit('auto', e);
  await handleStart('auto build app', e);
  await handlePause('waiting', e);
  assert.equal(loadConfig(root).config.active_workflow.paused, true);
  await handleResume('', e);
  assert.equal(loadConfig(root).config.active_workflow.paused, false);
});
