const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { selectedSettings, mergeSettings, applyPiSetup } = require('../src/setup');

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'wf-setup-')); }

test('selectedSettings builds pi settings from choices', () => {
  const settings = selectedSettings({ theme: 'onyx', thinkingLevel: 'high', compactionEnabled: true, retryEnabled: true });
  assert.equal(settings.theme, 'onyx');
  assert.equal(settings.defaultThinkingLevel, 'high');
  assert.equal(settings.compaction.enabled, true);
  assert.equal(settings.retry.maxRetries, 3);
});

test('mergeSettings preserves unknown existing settings', () => {
  const merged = mergeSettings({ defaultProvider: 'opencode-go', custom: true }, { theme: 'dark' });
  assert.deepEqual(merged, { defaultProvider: 'opencode-go', custom: true, theme: 'dark' });
});

test('applyPiSetup writes project settings and globally available bundled onyx theme', () => {
  const root = tmpdir();
  const home = tmpdir();
  const result = applyPiSetup({
    projectRoot: root,
    homeDir: home,
    scope: 'project',
    theme: 'onyx',
    thinkingLevel: 'medium',
    compactionEnabled: true,
    retryEnabled: false,
  });

  const settingsPath = path.join(root, '.pi', 'settings.json');
  const projectThemePath = path.join(root, '.pi', 'themes', 'onyx.json');
  const globalThemePath = path.join(home, '.pi', 'agent', 'themes', 'onyx.json');
  assert.equal(result.ok, true);
  assert.equal(fs.existsSync(settingsPath), true);
  assert.equal(fs.existsSync(projectThemePath), false);
  assert.equal(fs.existsSync(globalThemePath), true);

  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  assert.equal(settings.theme, 'onyx');
  assert.equal(settings.defaultThinkingLevel, 'medium');
  assert.equal(settings.retry.enabled, false);

  const theme = JSON.parse(fs.readFileSync(globalThemePath, 'utf8'));
  assert.equal(theme.name, 'onyx');
  assert.equal(theme.colors.accent, 'teal');
});

test('applyPiSetup writes both project and global settings', () => {
  const root = tmpdir();
  const home = tmpdir();
  applyPiSetup({
    projectRoot: root,
    homeDir: home,
    scope: 'both',
    theme: 'dark',
    thinkingLevel: 'skip',
    compactionEnabled: false,
    retryEnabled: true,
  });

  assert.equal(fs.existsSync(path.join(root, '.pi', 'settings.json')), true);
  assert.equal(fs.existsSync(path.join(home, '.pi', 'agent', 'settings.json')), true);
  assert.equal(fs.existsSync(path.join(root, '.pi', 'themes', 'onyx.json')), false);
});
