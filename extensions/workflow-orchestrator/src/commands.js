const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { getProjectRoot, loadConfig, saveConfig, initConfig, upgradeProjectConfig } = require('./config');
const { startWorkflow, pauseWorkflow, resumeWorkflow } = require('./state');
const { appendAuditEntry } = require('./audit');
const { buildStartPrompt, buildOnboardPrompt, buildRefreshPrompt, buildContinuePrompt, firstSkillForGoal } = require('./prompts');
const { SCOPE_LABELS, THEME_LABELS, THINKING_LEVELS, labelToKey, targetsForScope, applyPiSetup } = require('./setup');

function parseModeAndRest(args, fallbackMode) {
  const parts = String(args || '').trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (first === 'auto' || first === 'user-in-the-loop') {
    return { mode: first, rest: parts.slice(1).join(' ') };
  }
  return { mode: fallbackMode, rest: parts.join(' ') };
}

function createCommandEnv(ctx, pi) {
  return {
    cwd: ctx.cwd,
    homeDir: os.homedir(),
    notify: (message, level = 'info') => ctx.ui.notify(message, level),
    sendUserMessage: (message, options) => pi.sendUserMessage(message, options),
    select: (title, options) => ctx.ui.select(title, options),
    confirm: (title, message, options) => ctx.ui.confirm(title, message, options),
    input: (title, placeholder, options) => ctx.ui.input(title, placeholder, options),
  };
}

async function handleInit(args, env) {
  const { mode } = parseModeAndRest(args, 'user-in-the-loop');
  const projectRoot = getProjectRoot(env.cwd);
  const result = initConfig(projectRoot, mode);
  env.notify(`Workflow config ${result.status}: ${result.configPath}`, result.status === 'created' ? 'success' : 'info');
  // Install pre-push hook if git repo and hook not present
  installPrePushHook(projectRoot, env);
  return { ...result, projectRoot };
}

function installPrePushHook(projectRoot, env) {
  const hooksDir = path.join(projectRoot, '.git', 'hooks');
  if (!fs.existsSync(path.join(projectRoot, '.git'))) return;
  const hookPath = path.join(hooksDir, 'pre-push');
  if (fs.existsSync(hookPath)) return; // don't overwrite existing hooks
  const hookSource = path.join(__dirname, '..', 'assets', 'pre-push-hook.sh');
  if (!fs.existsSync(hookSource)) return;
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.copyFileSync(hookSource, hookPath);
  fs.chmodSync(hookPath, '755');
  env.notify('Installed pre-push hook for stale context warnings.', 'info');
}

async function handleUpgradeConfig(_args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const result = upgradeProjectConfig(projectRoot);
  if (!result.ok) {
    env.notify(`Workflow config not available: ${result.reason}. Run /workflow:init first.`, 'warning');
    return { ok: false, reason: result.reason, projectRoot };
  }
  env.notify(`Workflow config upgraded: ${result.configPath}`, 'success');
  return { ...result, projectRoot };
}

async function handleStatus(_args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const loaded = loadConfig(projectRoot);
  if (!loaded.ok) {
    env.notify(`Workflow config not available: ${loaded.reason}`, 'warning');
    return { ok: false, projectRoot, reason: loaded.reason };
  }
  const active = loaded.config.active_workflow || {};
  const summary = [
    `Workflow mode: ${loaded.config.default_mode}`,
    `Auto continue: ${loaded.config.auto_continue?.enabled ? 'enabled' : 'disabled'}`,
    `Active workflow: ${active.id || 'none'}`,
    `Current skill: ${active.current_skill || 'none'}`,
    `Next skill: ${active.next_skill || 'none'}`,
    `Paused: ${active.paused ? 'yes' : 'no'}`,
  ].join('\n');
  env.notify(summary, 'info');
  return { ok: true, projectRoot, config: loaded.config, summary };
}

async function handleStart(args, env, forcedMode) {
  const projectRoot = getProjectRoot(env.cwd);
  let loaded = loadConfig(projectRoot);
  if (!loaded.ok) {
    env.notify('Workflow config missing. Run /workflow:init first.', 'warning');
    return { ok: false, reason: 'missing config', projectRoot };
  }

  const parsed = parseModeAndRest(args, forcedMode || loaded.config.default_mode);
  const goal = parsed.rest;
  if (!goal) {
    env.notify('Usage: /workflow:start [auto|user-in-the-loop] <goal>', 'warning');
    return { ok: false, reason: 'missing goal', projectRoot };
  }

  const firstSkill = firstSkillForGoal(goal);
  let config = startWorkflow(loaded.config, { mode: parsed.mode, firstSkill });
  saveConfig(projectRoot, config);
  appendAuditEntry(projectRoot, config.active_workflow.artifact_log, {
    event: 'workflow_start',
    mode: parsed.mode,
    goal,
    next_skill: firstSkill,
  });

  const prompt = buildStartPrompt({
    mode: parsed.mode,
    goal,
    workflowId: config.active_workflow.id,
    artifactLog: config.active_workflow.artifact_log,
    firstSkill,
    allowedNext: config.transitions?.[firstSkill] || [],
  });
  env.sendUserMessage(prompt);
  return { ok: true, projectRoot, config, prompt };
}

async function handleOnboard(args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  let loaded = loadConfig(projectRoot);
  if (!loaded.ok) {
    const parsed = parseModeAndRest(args, 'user-in-the-loop');
    initConfig(projectRoot, parsed.mode);
    loaded = loadConfig(projectRoot);
  }
  const parsed = parseModeAndRest(args, loaded.config.default_mode);
  const mode = parsed.mode;
  const goal = parsed.rest;
  let config = startWorkflow(loaded.config, { mode, firstSkill: 'project-intake' });
  saveConfig(projectRoot, config);
  appendAuditEntry(projectRoot, config.active_workflow.artifact_log, {
    event: 'workflow_onboard_start',
    mode,
    goal: goal || null,
    next_skill: 'project-intake',
    project_map: config.project_map,
  });
  const prompt = buildOnboardPrompt({
    mode,
    workflowId: config.active_workflow.id,
    artifactLog: config.active_workflow.artifact_log,
    projectMap: config.project_map,
    goal,
    allowedNext: config.transitions?.['project-intake'] || [],
  });
  env.sendUserMessage(prompt);
  return { ok: true, projectRoot, config, prompt };
}

async function handleRefresh(args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const loaded = loadConfig(projectRoot);
  if (!loaded.ok) {
    env.notify(`Workflow config not available: ${loaded.reason}. Run /workflow:init first.`, 'warning');
    return { ok: false, reason: loaded.reason, projectRoot };
  }
  const parsed = parseModeAndRest(args, loaded.config.default_mode);
  const prompt = buildRefreshPrompt({ mode: parsed.mode, projectMap: loaded.config.project_map, allowedNext: loaded.config.transitions?.['project-intake'] || [] });
  env.sendUserMessage(prompt);
  return { ok: true, projectRoot, config: loaded.config, prompt };
}

function projectMapStaleness(projectRoot, guidancePath) {
  if (!fs.existsSync(guidancePath)) return { stale: false, reason: 'agent guidance missing' };
  const guidanceMtime = fs.statSync(guidancePath).mtimeMs;
  const srcDirs = ['extensions', 'skills', 'docs'];
  for (const entry of srcDirs) {
    const fullPath = path.join(projectRoot, entry);
    if (!fs.existsSync(fullPath)) continue;
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      if (stat.mtimeMs > guidanceMtime) return { stale: true, reason: `${entry} changed after agent guidance` };
      continue;
    }
    try {
      const files = fs.readdirSync(fullPath, { recursive: true, withFileTypes: true });
      for (const file of files) {
        if (!file.isFile()) continue;
        const filePath = path.join(file.parentPath || file.path, file.name);
        if (fs.statSync(filePath).mtimeMs > guidanceMtime) {
          return { stale: true, reason: `${path.relative(projectRoot, filePath)} changed after agent guidance` };
        }
      }
    } catch {}
  }
  return { stale: false, reason: null };
}

async function handleContext(_args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const loaded = loadConfig(projectRoot);
  if (!loaded.ok) {
    env.notify(`Workflow config not available: ${loaded.reason}`, 'warning');
    return { ok: false, reason: loaded.reason, projectRoot };
  }
  const map = loaded.config.project_map || {};
  const guidance = map.agent_guidance || '.pi/project-map/agent-guidance.md';
  const graph = map.graph || {};
  const files = {
    guidance: path.join(projectRoot, guidance),
    graphHtml: path.join(projectRoot, graph.html || '.pi/project-map/graph/graph.html'),
    graphJson: path.join(projectRoot, graph.json || '.pi/project-map/graph/graph.json'),
    graphAudit: path.join(projectRoot, graph.audit || '.pi/project-map/graph/audit.md'),
  };
  const staleness = projectMapStaleness(projectRoot, files.guidance);
  const summary = [
    `Project map: ${map.path || '.pi/project-map'}`,
    `Agent guidance: ${fs.existsSync(files.guidance) ? 'present' : 'missing'} (${guidance})`,
    `Graph HTML: ${fs.existsSync(files.graphHtml) ? 'present' : 'missing'}`,
    `Graph JSON: ${fs.existsSync(files.graphJson) ? 'present' : 'missing'}`,
    `Graph audit: ${fs.existsSync(files.graphAudit) ? 'present' : 'missing'}`,
    `Last updated: ${map.last_updated || 'unknown'}`,
    `Project map stale: ${staleness.stale ? 'yes' : 'no'}${staleness.reason ? ` (${staleness.reason})` : ''}`,
    `Suggested refresh: ${staleness.stale ? '/workflow:refresh' : 'not needed'}`,
  ].join('\n');
  env.notify(summary, 'info');
  return { ok: true, projectRoot, config: loaded.config, summary, files, staleness };
}

async function handleContinue(args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const loaded = loadConfig(projectRoot);
  if (!loaded.ok) {
    env.notify(`Workflow config not available: ${loaded.reason}`, 'warning');
    return { ok: false, reason: loaded.reason, projectRoot };
  }
  const { mode } = parseModeAndRest(args, loaded.config.active_workflow?.mode || loaded.config.default_mode);
  const config = { ...loaded.config, active_workflow: { ...loaded.config.active_workflow, mode, paused: false, pause_reason: null } };
  if (!config.active_workflow.next_skill) {
    env.notify('No active workflow to continue.', 'warning');
    return { ok: false, reason: 'no active workflow', projectRoot };
  }
  saveConfig(projectRoot, config);
  const prompt = buildContinuePrompt(config);
  env.sendUserMessage(prompt);
  return { ok: true, projectRoot, config, prompt };
}

async function handlePause(args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const loaded = loadConfig(projectRoot);
  if (!loaded.ok) return { ok: false, reason: loaded.reason, projectRoot };
  const reason = String(args || '').trim() || 'paused by user';
  const config = pauseWorkflow(loaded.config, reason);
  saveConfig(projectRoot, config);
  env.notify(`Workflow paused: ${reason}`, 'info');
  return { ok: true, projectRoot, config };
}

async function handleResume(_args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const loaded = loadConfig(projectRoot);
  if (!loaded.ok) return { ok: false, reason: loaded.reason, projectRoot };
  const config = resumeWorkflow(loaded.config);
  saveConfig(projectRoot, config);
  env.notify('Workflow resumed.', 'info');
  return { ok: true, projectRoot, config };
}

async function handlePiSetup(_args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const homeDir = env.homeDir || os.homedir();
  if (!env.select || !env.confirm) {
    env.notify('Interactive UI is required for /my-pi:setup.', 'error');
    return { ok: false, reason: 'missing interactive ui', projectRoot };
  }

  const scopeLabel = await env.select('Apply pi setup to:', Object.values(SCOPE_LABELS));
  if (!scopeLabel) return { ok: false, reason: 'cancelled', projectRoot };
  const scope = labelToKey(SCOPE_LABELS, scopeLabel);

  const themeLabel = await env.select('Choose theme:', Object.values(THEME_LABELS));
  if (!themeLabel) return { ok: false, reason: 'cancelled', projectRoot };
  const theme = labelToKey(THEME_LABELS, themeLabel);

  const thinkingLabel = await env.select('Default thinking level:', THINKING_LEVELS);
  if (!thinkingLabel) return { ok: false, reason: 'cancelled', projectRoot };
  const thinkingLevel = thinkingLabel;

  const compactionEnabled = await env.confirm(
    'Enable compaction?',
    'Recommended for longer sessions. Uses a 16K response reserve and keeps the latest 20K tokens.'
  );
  const retryEnabled = await env.confirm(
    'Enable retries?',
    'Recommended for transient provider/network failures. Uses 3 retries with exponential backoff.'
  );

  const targets = targetsForScope(scope, projectRoot, homeDir);
  const existing = targets.filter((target) => fs.existsSync(target.settingsPath));
  if (existing.length) {
    const ok = await env.confirm(
      'Update existing settings?',
      `Existing unknown settings will be preserved. Files: ${existing.map((target) => target.settingsPath).join(', ')}`
    );
    if (!ok) return { ok: false, reason: 'cancelled existing settings update', projectRoot };
  }

  const result = applyPiSetup({ projectRoot, homeDir, scope, theme, thinkingLevel, compactionEnabled, retryEnabled });
  env.notify(`pi setup updated ${result.written.length} file(s). Run /reload to apply changes.`, 'success');
  return { ...result, projectRoot };
}

module.exports = {
  parseModeAndRest,
  createCommandEnv,
  handleInit,
  handleUpgradeConfig,
  handleStatus,
  handleStart,
  handleOnboard,
  handleRefresh,
  projectMapStaleness,
  handleContext,
  handleContinue,
  handlePause,
  handleResume,
  handlePiSetup,
};
