#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: init-project-workflow.js <project-root> [--mode auto|user-in-the-loop] [--force]');
  process.exit(2);
}

const args = process.argv.slice(2);
const projectRootArg = args[0];
if (!projectRootArg) usage();
const modeIndex = args.indexOf('--mode');
const mode = modeIndex >= 0 ? args[modeIndex + 1] : null;
const force = args.includes('--force');
if (mode && !['auto', 'user-in-the-loop'].includes(mode)) usage();

const projectRoot = path.resolve(projectRootArg);
const skillRoot = path.resolve(__dirname, '..');
const templatePath = path.join(skillRoot, 'assets', 'workflow-orchestrator.template.json');
const piDir = path.join(projectRoot, '.pi');
const workflowsDir = path.join(piDir, 'workflows');
const configPath = path.join(piDir, 'workflow-orchestrator.json');

if (fs.existsSync(configPath) && !force) {
  console.log(JSON.stringify({ status: 'exists', config_path: configPath, message: 'Config already exists. Use --force to overwrite.' }, null, 2));
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
if (mode) {
  config.default_mode = mode;
  config.auto_continue.enabled = mode === 'auto';
}

fs.mkdirSync(workflowsDir, { recursive: true });
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

console.log(JSON.stringify({
  status: 'created',
  config_path: configPath,
  workflows_dir: workflowsDir,
  default_mode: config.default_mode,
  auto_continue_enabled: config.auto_continue.enabled
}, null, 2));
