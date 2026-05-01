const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { defaultConfig, getConfigPath, getWorkflowsDir, loadConfig, saveConfig, initConfig } = require('../src/config');

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'wf-config-')); }

test('defaultConfig sets auto_continue based on mode', () => {
  assert.equal(defaultConfig('user-in-the-loop').auto_continue.enabled, false);
  assert.equal(defaultConfig('auto').auto_continue.enabled, true);
  assert.ok(defaultConfig().support_skills['find-docs']);
  assert.ok(defaultConfig().auto_continue.allowed_skills.includes('project-intake'));
  assert.ok(defaultConfig().transitions['project-intake'].includes('none'));
  assert.equal(defaultConfig().project_map.graph.enabled, true);
});

test('initConfig creates project config and workflows directory', () => {
  const root = tmpdir();
  const result = initConfig(root, 'auto');
  assert.equal(result.status, 'created');
  assert.equal(fs.existsSync(getConfigPath(root)), true);
  assert.equal(fs.existsSync(getWorkflowsDir(root)), true);
  const loaded = loadConfig(root);
  assert.equal(loaded.ok, true);
  assert.equal(loaded.config.default_mode, 'auto');
  assert.equal(loaded.config.auto_continue.enabled, true);
});

test('initConfig does not overwrite existing config unless forced', () => {
  const root = tmpdir();
  initConfig(root, 'user-in-the-loop');
  const existing = initConfig(root, 'auto');
  assert.equal(existing.status, 'exists');
  assert.equal(loadConfig(root).config.default_mode, 'user-in-the-loop');
  const forced = initConfig(root, 'auto', { force: true });
  assert.equal(forced.status, 'created');
  assert.equal(loadConfig(root).config.default_mode, 'auto');
});

test('saveConfig and loadConfig round-trip', () => {
  const root = tmpdir();
  const config = defaultConfig('user-in-the-loop');
  config.active_workflow.id = 'wf-test';
  saveConfig(root, config);
  assert.equal(loadConfig(root).config.active_workflow.id, 'wf-test');
});

test('loadConfig reports missing config', () => {
  const root = tmpdir();
  const loaded = loadConfig(root);
  assert.equal(loaded.ok, false);
  assert.equal(loaded.reason, 'missing');
});
