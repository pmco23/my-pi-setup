const fs = require('node:fs');
const path = require('node:path');

const ONYX_THEME = require('../assets/onyx-theme.json');

const SCOPE_LABELS = {
  project: 'Project (.pi/settings.json)',
  global: 'Global (~/.pi/agent/settings.json)',
  both: 'Both project and global',
};

const THEME_LABELS = {
  dark: 'dark',
  light: 'light',
  onyx: 'onyx (bundled custom dark theme)',
  skip: 'Keep existing theme',
};

const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'skip'];

function labelToKey(labels, label) {
  return Object.keys(labels).find((key) => labels[key] === label) || label;
}

function targetsForScope(scope, projectRoot, homeDir) {
  const targets = [];
  if (scope === 'project' || scope === 'both') {
    targets.push({
      scope: 'project',
      settingsPath: path.join(projectRoot, '.pi', 'settings.json'),
      themesDir: path.join(projectRoot, '.pi', 'themes'),
    });
  }
  if (scope === 'global' || scope === 'both') {
    targets.push({
      scope: 'global',
      settingsPath: path.join(homeDir, '.pi', 'agent', 'settings.json'),
      themesDir: path.join(homeDir, '.pi', 'agent', 'themes'),
    });
  }
  return targets;
}

function readJsonIfPresent(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function selectedSettings(options) {
  const settings = {};
  if (options.theme && options.theme !== 'skip') settings.theme = options.theme;
  if (options.thinkingLevel && options.thinkingLevel !== 'skip') settings.defaultThinkingLevel = options.thinkingLevel;
  if (typeof options.compactionEnabled === 'boolean') {
    settings.compaction = options.compactionEnabled
      ? { enabled: true, reserveTokens: 16384, keepRecentTokens: 20000 }
      : { enabled: false };
  }
  if (typeof options.retryEnabled === 'boolean') {
    settings.retry = options.retryEnabled
      ? { enabled: true, maxRetries: 3, baseDelayMs: 2000, provider: { maxRetryDelayMs: 60000 } }
      : { enabled: false };
  }
  return settings;
}

function mergeSettings(existing, updates) {
  return { ...existing, ...updates };
}

function applyPiSetup({ projectRoot, homeDir, scope, theme, thinkingLevel, compactionEnabled, retryEnabled }) {
  if (!['project', 'global', 'both'].includes(scope)) throw new Error(`Invalid setup scope: ${scope}`);
  if (![...Object.keys(THEME_LABELS)].includes(theme)) throw new Error(`Invalid theme: ${theme}`);
  if (!THINKING_LEVELS.includes(thinkingLevel)) throw new Error(`Invalid thinking level: ${thinkingLevel}`);

  const updates = selectedSettings({ theme, thinkingLevel, compactionEnabled, retryEnabled });
  const targets = targetsForScope(scope, projectRoot, homeDir);
  const written = [];

  for (const target of targets) {
    const existing = readJsonIfPresent(target.settingsPath);
    const next = mergeSettings(existing, updates);
    fs.mkdirSync(path.dirname(target.settingsPath), { recursive: true });
    fs.writeFileSync(target.settingsPath, JSON.stringify(next, null, 2) + '\n');
    written.push(target.settingsPath);

  }

  if (theme === 'onyx') {
    const globalThemeDir = path.join(homeDir, '.pi', 'agent', 'themes');
    const globalThemePath = path.join(globalThemeDir, 'onyx.json');
    fs.mkdirSync(globalThemeDir, { recursive: true });
    fs.writeFileSync(globalThemePath, JSON.stringify(ONYX_THEME, null, 2) + '\n');
    if (!written.includes(globalThemePath)) written.push(globalThemePath);
  }

  return { ok: true, scope, settings: updates, written };
}

module.exports = {
  ONYX_THEME,
  SCOPE_LABELS,
  THEME_LABELS,
  THINKING_LEVELS,
  labelToKey,
  targetsForScope,
  selectedSettings,
  mergeSettings,
  applyPiSetup,
};
