const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { getProjectRoot, loadConfig, saveConfig, initConfigV2 } = require('./config');
const { pauseWorkflow, resumeWorkflow, startWorkflow, checkpointWorkflow } = require('./state');
const { appendAuditEntry } = require('./audit');
const { buildContinuePrompt, buildSkillPrompt } = require('./prompts');
const { applyPiSetup, SCOPE_LABELS, THEME_LABELS, THINKING_LEVELS, labelToKey, targetsForScope } = require('./setup');

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

function installPrePushHook(projectRoot, env) {
  const hooksDir = path.join(projectRoot, '.git', 'hooks');
  if (!fs.existsSync(path.join(projectRoot, '.git'))) return;
  const hookPath = path.join(hooksDir, 'pre-push');
  if (fs.existsSync(hookPath)) return;
  const hookSource = path.join(__dirname, '..', 'assets', 'pre-push-hook.sh');
  if (!fs.existsSync(hookSource)) return;
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.copyFileSync(hookSource, hookPath);
  fs.chmodSync(hookPath, '755');
  env.notify('Installed pre-push hook for stale context warnings.', 'info');
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

async function handleInit(_args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const homeDir = env.homeDir || os.homedir();

  if (!env.select || !env.confirm) {
    env.notify('/workflow:init requires interactive UI.', 'error');
    return { ok: false, reason: 'missing interactive ui', projectRoot };
  }

  // Check for existing config
  const configPath = require('./config').getConfigPath(projectRoot);
  const configExists = require('node:fs').existsSync(configPath);
  if (configExists) {
    const ok = await env.confirm('Existing workflow config found', 'Update it with new settings?');
    if (!ok) return { ok: false, reason: 'cancelled', projectRoot };
  }

  // Step 1: settings scope
  const scopeLabel = await env.select('Apply settings to:', Object.values(SCOPE_LABELS));
  if (!scopeLabel) return { ok: false, reason: 'cancelled', projectRoot };
  const scope = labelToKey(SCOPE_LABELS, scopeLabel);

  // Step 2: mode
  const mode = await env.select('Workflow mode:', [
    'auto — pi chains skills until blocked',
    'user-in-the-loop — pi suggests, you confirm each step',
  ]);
  if (!mode) return { ok: false, reason: 'cancelled', projectRoot };
  const resolvedMode = mode.startsWith('auto') ? 'auto' : 'user-in-the-loop';

  // Step 3: theme
  const themeLabel = await env.select('Theme:', Object.values(THEME_LABELS));
  if (!themeLabel) return { ok: false, reason: 'cancelled', projectRoot };
  const theme = labelToKey(THEME_LABELS, themeLabel);

  // Step 4: thinking level
  const thinkingLevel = await env.select('Default thinking level:', THINKING_LEVELS);
  if (!thinkingLevel) return { ok: false, reason: 'cancelled', projectRoot };

  // Step 5: compaction and retry
  const compactionEnabled = await env.confirm('Enable compaction?', 'Recommended for longer sessions.');
  const retryEnabled = await env.confirm('Enable retries?', 'Recommended for transient provider failures.');

  // Write workflow config (force since user confirmed or first time)
  const configResult = initConfigV2(projectRoot, resolvedMode, { force: true });

  // Write pi settings (theme, thinking, compaction, retry)
  applyPiSetup({ projectRoot, homeDir, scope, theme, thinkingLevel, compactionEnabled, retryEnabled });

  // Install pre-push hook
  installPrePushHook(projectRoot, env);

  const modeLabel = resolvedMode === 'auto' ? 'auto' : 'user-in-the-loop';
  env.notify(`Workflow initialised in ${modeLabel} mode. Run /reload to apply theme/settings changes.`, 'success');
  return { ok: true, projectRoot, config: configResult.config, mode: resolvedMode };
}

async function handleContinue(_args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const loaded = loadConfig(projectRoot);
  if (!loaded.ok) {
    env.notify(`Workflow config not available: ${loaded.reason}`, 'warning');
    return { ok: false, reason: loaded.reason, projectRoot };
  }

  const active = loaded.config.active_workflow || {};

  if (!active.id || !active.next_skill) {
    env.notify('No active workflow. Invoke a skill to start.', 'info');
    return { ok: false, reason: 'no active workflow', projectRoot };
  }

  // Clear pause if paused
  const config = active.paused
    ? saveConfig(projectRoot, resumeWorkflow(loaded.config)) && loadConfig(projectRoot).config
    : loaded.config;

  const goalSuffix = active.goal ? ` (goal: ${active.goal})` : '';
  env.notify(`Continuing: ${active.next_skill}${goalSuffix}`, 'info');

  const prompt = buildContinuePrompt(config || loaded.config);
  env.sendUserMessage(prompt);
  return { ok: true, projectRoot, config: config || loaded.config, prompt };
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
  env.notify('Workflow resumed. Run /workflow:continue when ready.', 'info');
  return { ok: true, projectRoot, config };
}

async function handleStart(_args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const loaded = loadConfig(projectRoot);
  if (!loaded.ok) {
    env.notify(`Workflow config not available: ${loaded.reason}`, 'warning');
    return { ok: false, reason: loaded.reason, projectRoot };
  }

  if (!env.select || !env.input || !env.confirm) {
    env.notify('/workflow:start requires interactive UI.', 'error');
    return { ok: false, reason: 'missing interactive ui', projectRoot };
  }

  const existingActive = loaded.config.active_workflow || {};
  if (existingActive.id) {
    const ok = await env.confirm('Active workflow exists', 'Start a new workflow and replace it?');
    if (!ok) return { ok: false, reason: 'cancelled', projectRoot };
  }

  const skillList = Object.keys(loaded.config.transitions || {});
  if (skillList.length === 0) {
    env.notify('No skills configured in transitions.', 'warning');
    return { ok: false, reason: 'no skills configured', projectRoot };
  }

  const firstSkill = await env.select('Start with skill:', skillList);
  if (!firstSkill) return { ok: false, reason: 'cancelled', projectRoot };

  const goal = await env.input('Goal (optional):', '');

  const config = startWorkflow(loaded.config, { firstSkill, goal: goal || null });
  saveConfig(projectRoot, config);

  const active = config.active_workflow;
  const prompt = buildSkillPrompt(firstSkill, {
    mode: config.mode,
    workflowId: active.id,
    artifactLog: active.artifact_log,
    allowedNext: config.transitions?.[firstSkill] || [],
    context: goal ? [`Goal: ${goal}`] : [],
  });

  env.notify(`Workflow started: ${firstSkill}`, 'info');
  env.sendUserMessage(prompt);
  return { ok: true, projectRoot, config, prompt };
}

async function handleCheckpoint(_args, env) {
  const projectRoot = getProjectRoot(env.cwd);
  const loaded = loadConfig(projectRoot);
  if (!loaded.ok) {
    env.notify(`Workflow config not available: ${loaded.reason}`, 'warning');
    return { ok: false, reason: loaded.reason, projectRoot };
  }

  if (!env.select || !env.input || !env.confirm) {
    env.notify('/workflow:checkpoint requires interactive UI.', 'error');
    return { ok: false, reason: 'missing interactive ui', projectRoot };
  }

  const active = loaded.config.active_workflow || {};
  if (active.id) {
    const ok = await env.confirm('Active workflow exists', 'Overwrite current workflow state?');
    if (!ok) return { ok: false, reason: 'cancelled', projectRoot };
  }

  const skillList = Object.keys(loaded.config.transitions || {});

  const currentSkill = await env.select('Current skill (just completed):', skillList);
  if (!currentSkill) return { ok: false, reason: 'cancelled', projectRoot };

  const nextOptions = loaded.config.transitions?.[currentSkill] || skillList;
  const nextSkill = await env.select('Next skill:', nextOptions);
  if (!nextSkill) return { ok: false, reason: 'cancelled', projectRoot };

  const currentGoal = active.goal || null;
  const goalTitle = currentGoal ? `Goal (current: "${currentGoal}"):` : 'Goal (optional):';
  const goalInput = await env.input(goalTitle, '');
  const goal = goalInput || currentGoal;

  const config = checkpointWorkflow(loaded.config, { goal, currentSkill, nextSkill });
  saveConfig(projectRoot, config);

  const artifactLog = config.active_workflow.artifact_log;
  if (artifactLog) {
    appendAuditEntry(projectRoot, artifactLog, { event: 'checkpoint', current_skill: currentSkill, next_skill: nextSkill, goal });
  }

  env.notify(`Checkpoint saved: ${currentSkill} → ${nextSkill}`, 'success');
  return { ok: true, projectRoot, config };
}

module.exports = {
  createCommandEnv,
  installPrePushHook,
  projectMapStaleness,
  handleInit,
  handleContinue,
  handlePause,
  handleResume,
  handleStart,
  handleCheckpoint,
};
