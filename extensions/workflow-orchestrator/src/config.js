const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const DEFAULT_SEQUENCE = ['brainstorm-spec', 'acceptance-criteria', 'plan', 'execute', 'review-against-plan', 'code-review'];
const DEFAULT_ALLOWED_SKILLS = ['project-intake', ...DEFAULT_SEQUENCE];

function defaultConfig(mode = 'user-in-the-loop') {
  const auto = mode === 'auto';
  return {
    version: 1,
    default_mode: mode,
    default_sequence: [...DEFAULT_SEQUENCE],
    auto_continue: {
      enabled: auto,
      allowed_skills: [...DEFAULT_ALLOWED_SKILLS],
      stop_on_open_questions: true,
      stop_on_low_confidence: true,
      stop_on_failed_validation: true,
      stop_on_blockers: true,
      stop_before_execute: false,
    },
    handoff: { require_json: true, require_user_prompt: true, persist_artifacts: true },
    transitions: {
      'brainstorm-spec': ['acceptance-criteria', 'plan'],
      'acceptance-criteria': ['plan'],
      plan: ['execute'],
      execute: ['review-against-plan'],
      'review-against-plan': ['execute', 'code-review', 'none'],
      'code-review': ['execute', 'review-against-plan', 'none'],
      'project-intake': ['plan', 'none'],
      'workflow-orchestrator': ['project-intake', 'brainstorm-spec', 'acceptance-criteria', 'plan', 'execute', 'review-against-plan', 'code-review', 'none'],
    },
    support_skills: {
      'find-docs': {
        use_when: 'External library, framework, SDK, CLI, or cloud-service behavior needs current documentation verification.',
        allowed_in: ['brainstorm-spec', 'acceptance-criteria', 'plan', 'execute', 'review-against-plan', 'code-review'],
      },
      'ast-grep': {
        use_when: 'Structural code search, call-site analysis, pattern verification, refactor discovery, or anti-pattern detection is needed.',
        allowed_in: ['plan', 'execute', 'review-against-plan', 'code-review'],
      },
      graphify: {
        use_when: 'Complex relationships, architecture, domain modeling, documentation mapping, or large-codebase impact analysis is needed.',
        allowed_in: ['brainstorm-spec', 'plan', 'review-against-plan', 'code-review'],
      },
    },
    project_map: {
      enabled: true,
      path: '.pi/project-map',
      agent_guidance: '.pi/project-map/agent-guidance.md',
      graph: {
        enabled: true,
        path: '.pi/project-map/graph',
        html: '.pi/project-map/graph/graph.html',
        json: '.pi/project-map/graph/graph.json',
        audit: '.pi/project-map/graph/audit.md',
      },
      last_updated: null,
    },
    active_workflow: { id: null, mode: null, current_skill: null, next_skill: null, artifact_log: null, updated_at: null, paused: false, pause_reason: null, last_processed_entry_id: null },
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
    return { ok: true, config: JSON.parse(fs.readFileSync(configPath, 'utf8')), configPath };
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

function initConfig(projectRoot, mode = 'user-in-the-loop', options = {}) {
  if (!['auto', 'user-in-the-loop'].includes(mode)) throw new Error(`Invalid mode: ${mode}`);
  const configPath = getConfigPath(projectRoot);
  if (fs.existsSync(configPath) && !options.force) {
    return { status: 'exists', configPath, config: JSON.parse(fs.readFileSync(configPath, 'utf8')) };
  }
  const config = defaultConfig(mode);
  fs.mkdirSync(getWorkflowsDir(projectRoot), { recursive: true });
  saveConfig(projectRoot, config);
  return { status: 'created', configPath, workflowsDir: getWorkflowsDir(projectRoot), config };
}

module.exports = { DEFAULT_SEQUENCE, DEFAULT_ALLOWED_SKILLS, defaultConfig, getProjectRoot, getConfigPath, getWorkflowsDir, loadConfig, saveConfig, initConfig };
