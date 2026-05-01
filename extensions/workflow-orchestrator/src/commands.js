const { getProjectRoot, loadConfig, saveConfig, initConfig } = require('./config');
const { startWorkflow, pauseWorkflow, resumeWorkflow } = require('./state');
const { appendAuditEntry } = require('./audit');
const { buildStartPrompt, buildOnboardPrompt, buildRefreshPrompt, buildContinuePrompt, firstSkillForGoal } = require('./prompts');

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
    notify: (message, level = 'info') => ctx.ui.notify(message, level),
    sendUserMessage: (message, options) => pi.sendUserMessage(message, options),
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
  const fs = require('node:fs');
  const path = require('node:path');
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
  let config = startWorkflow(loaded.config, { mode, firstSkill: 'project-intake' });
  saveConfig(projectRoot, config);
  appendAuditEntry(projectRoot, config.active_workflow.artifact_log, {
    event: 'workflow_onboard_start',
    mode,
    next_skill: 'project-intake',
    project_map: config.project_map,
  });
  const prompt = buildOnboardPrompt({
    mode,
    workflowId: config.active_workflow.id,
    artifactLog: config.active_workflow.artifact_log,
    projectMap: config.project_map,
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
  const prompt = buildRefreshPrompt({ mode: parsed.mode, projectMap: loaded.config.project_map });
  env.sendUserMessage(prompt);
  return { ok: true, projectRoot, config: loaded.config, prompt };
}

async function handleContext(_args, env) {
  const fs = require('node:fs');
  const path = require('node:path');
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
  const summary = [
    `Project map: ${map.path || '.pi/project-map'}`,
    `Agent guidance: ${fs.existsSync(files.guidance) ? 'present' : 'missing'} (${guidance})`,
    `Graph HTML: ${fs.existsSync(files.graphHtml) ? 'present' : 'missing'}`,
    `Graph JSON: ${fs.existsSync(files.graphJson) ? 'present' : 'missing'}`,
    `Graph audit: ${fs.existsSync(files.graphAudit) ? 'present' : 'missing'}`,
    `Last updated: ${map.last_updated || 'unknown'}`,
  ].join('\n');
  env.notify(summary, 'info');
  return { ok: true, projectRoot, config: loaded.config, summary, files };
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

module.exports = {
  parseModeAndRest,
  createCommandEnv,
  handleInit,
  handleStatus,
  handleStart,
  handleOnboard,
  handleRefresh,
  handleContext,
  handleContinue,
  handlePause,
  handleResume,
};
