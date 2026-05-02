const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DEFAULT_TRANSITIONS, defaultConfig, getConfigPath, getWorkflowsDir, loadConfig, saveConfig, initConfigV2 } = require('../src/config');
const { mergeSettings } = require('../src/setup');

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'wf-config-')); }

test('defaultConfig version 2 shape', () => {
  const c = defaultConfig('auto');
  assert.equal(c.version, 2);
  assert.equal(c.mode, 'auto');
  assert.equal(c.auto_continue.enabled, true);
  assert.ok(!('default_mode' in c));
  assert.ok(!('default_sequence' in c));
  assert.ok(!('support_skills' in c));
  assert.ok(!('project_map' in c));
  assert.ok(!('handoff' in c));
  assert.ok('goal' in c.active_workflow);
  assert.ok(c.transitions['brainstorm-spec'].includes('implementation-research'));
  assert.ok(c.transitions['project-intake'].includes('none'));
});

test('defaultConfig user-in-the-loop disables auto_continue', () => {
  const c = defaultConfig('user-in-the-loop');
  assert.equal(c.mode, 'user-in-the-loop');
  assert.equal(c.auto_continue.enabled, false);
});

test('defaultConfig throws on invalid mode', () => {
  assert.throws(() => defaultConfig('invalid'), /Invalid mode/);
});

test('initConfigV2 creates v2 config and workflows directory', () => {
  const root = tmpdir();
  const result = initConfigV2(root, 'auto');
  assert.equal(result.status, 'created');
  assert.equal(fs.existsSync(getConfigPath(root)), true);
  assert.equal(fs.existsSync(getWorkflowsDir(root)), true);
  const loaded = loadConfig(root);
  assert.equal(loaded.ok, true);
  assert.equal(loaded.config.version, 2);
  assert.equal(loaded.config.mode, 'auto');
});

test('initConfigV2 does not overwrite existing config unless forced', () => {
  const root = tmpdir();
  initConfigV2(root, 'user-in-the-loop');
  const existing = initConfigV2(root, 'auto');
  assert.equal(existing.status, 'exists');
  assert.equal(loadConfig(root).config.mode, 'user-in-the-loop');
  const forced = initConfigV2(root, 'auto', { force: true });
  assert.equal(forced.status, 'created');
  assert.equal(loadConfig(root).config.mode, 'auto');
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

test('loadConfig rejects v1 configs as outdated', () => {
  const root = tmpdir();
  const v1Config = { version: 1, default_mode: 'auto', auto_continue: { enabled: true } };
  fs.mkdirSync(path.join(root, '.pi'), { recursive: true });
  fs.writeFileSync(path.join(root, '.pi', 'workflow-orchestrator.json'), JSON.stringify(v1Config));
  const loaded = loadConfig(root);
  assert.equal(loaded.ok, false);
  assert.match(loaded.reason, /outdated/);
});

test('DEFAULT_TRANSITIONS contains expected skill chain', () => {
  assert.ok(DEFAULT_TRANSITIONS['brainstorm-spec'].includes('implementation-research'));
  assert.ok(DEFAULT_TRANSITIONS['plan'].includes('execute'));
  assert.ok(DEFAULT_TRANSITIONS['code-review'].includes('none'));
});

test('defaultConfig sets stop_before_execute to true', () => {
  const c = defaultConfig('auto');
  assert.equal(c.auto_continue.stop_before_execute, true);
});

test('mergeSettings deep-merges nested objects', () => {
  const existing = {
    theme: 'dark',
    compaction: { enabled: true, reserveTokens: 16384, keepRecentTokens: 20000 },
    retry: { enabled: true, maxRetries: 3 },
  };
  const updates = {
    compaction: { enabled: false },
    defaultThinkingLevel: 'high',
  };
  const result = mergeSettings(existing, updates);
  // Deep merge: keepRecentTokens preserved from existing
  assert.equal(result.compaction.enabled, false);
  assert.equal(result.compaction.keepRecentTokens, 20000);
  assert.equal(result.compaction.reserveTokens, 16384);
  // Top-level fields merged
  assert.equal(result.theme, 'dark');
  assert.equal(result.defaultThinkingLevel, 'high');
  // Untouched nested object preserved
  assert.equal(result.retry.enabled, true);
  assert.equal(result.retry.maxRetries, 3);
});

test('mergeSettings deep-merges two levels (e.g. retry.provider)', () => {
  const existing = {
    retry: { enabled: true, maxRetries: 3, provider: { timeoutMs: 3600000, maxRetries: 0, maxRetryDelayMs: 60000 } },
  };
  const updates = {
    retry: { provider: { maxRetryDelayMs: 30000 } },
  };
  const result = mergeSettings(existing, updates);
  // 2-level deep: timeoutMs preserved, maxRetryDelayMs updated
  assert.equal(result.retry.provider.timeoutMs, 3600000);
  assert.equal(result.retry.provider.maxRetries, 0);
  assert.equal(result.retry.provider.maxRetryDelayMs, 30000);
  // First-level preserved
  assert.equal(result.retry.enabled, true);
  assert.equal(result.retry.maxRetries, 3);
});
