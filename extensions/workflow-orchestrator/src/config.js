const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const DEFAULT_TRANSITIONS = {
  'brainstorm-spec': ['implementation-research', 'acceptance-criteria', 'plan'],
  'implementation-research': ['acceptance-criteria', 'plan'],
  'acceptance-criteria': ['plan'],
  plan: ['execute'],
  execute: ['review-against-plan', 'execute'],
  'review-against-plan': ['execute', 'code-review', 'none'],
  'code-review': ['execute', 'review-against-plan', 'none'],
  'project-intake': ['plan', 'brainstorm-spec', 'none'],
};

function defaultConfig(mode = 'user-in-the-loop') {
  if (!['auto', 'user-in-the-loop'].includes(mode)) throw new Error(`Invalid mode: ${mode}`);
  return {
    version: 2,
    mode,
    auto_continue: {
      enabled: mode === 'auto',
      stop_on_open_questions: true,
      stop_on_low_confidence: true,
      stop_on_failed_validation: true,
      stop_on_blockers: true,
      stop_before_execute: true,
    },
    transitions: { ...DEFAULT_TRANSITIONS },
    active_workflow: {
      id: null,
      goal: null,
      current_skill: null,
      next_skill: null,
      artifact_log: null,
      updated_at: null,
      paused: false,
      pause_reason: null,
      last_processed_entry_id: null,
      step_number: 0,
      last_artifact: null,
    },
  };
}

function getProjectRoot(cwd) {
  try {
    return childProcess.execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return path.resolve(cwd);
  }
}

function getConfigPath(projectRoot) {
  return path.join(projectRoot, '.pi', 'workflow-orchestrator.json');
}

function getWorkflowsDir(projectRoot) {
  return path.join(projectRoot, '.pi', 'workflows');
}

function loadConfig(projectRoot) {
  const configPath = getConfigPath(projectRoot);
  if (!fs.existsSync(configPath)) return { ok: false, reason: 'missing', configPath };
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.version !== 2) return { ok: false, reason: 'outdated config version — run /workflow:init to upgrade', configPath };
    return { ok: true, config, configPath };
  } catch (error) {
    return { ok: false, reason: `invalid json: ${error.message}`, configPath };
  }
}

function saveConfig(projectRoot, config) {
  const configPath = getConfigPath(projectRoot);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  return configPath;
}

function initConfigV2(projectRoot, mode = 'user-in-the-loop', options = {}) {
  if (!['auto', 'user-in-the-loop'].includes(mode)) throw new Error(`Invalid mode: ${mode}`);
  const configPath = getConfigPath(projectRoot);
  if (fs.existsSync(configPath) && !options.force) {
    try {
      const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { status: 'exists', configPath, config: existing };
    } catch {
      // fall through to create
    }
  }
  const config = defaultConfig(mode);
  fs.mkdirSync(getWorkflowsDir(projectRoot), { recursive: true });
  saveConfig(projectRoot, config);
  return { status: 'created', configPath, workflowsDir: getWorkflowsDir(projectRoot), config };
}

module.exports = { DEFAULT_TRANSITIONS, defaultConfig, getProjectRoot, getConfigPath, getWorkflowsDir, loadConfig, saveConfig, initConfigV2 };
