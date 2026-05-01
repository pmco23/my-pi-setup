#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: evaluate-handoff.js <project-root> <handoff-json-file|-> [mode-override]');
  process.exit(2);
}

function readJson(fileOrDash) {
  const text = fileOrDash === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(fileOrDash, 'utf8');
  return JSON.parse(text);
}

function fail(decision, reason, extra = {}) {
  return { decision, reason, next_skill: extra.next_skill ?? null, errors: extra.errors ?? [], config_path: extra.config_path ?? null };
}

function validateConfig(config) {
  const errors = [];
  if (!config || typeof config !== 'object') errors.push('config must be an object');
  if (config.version !== 1) errors.push('config.version must be 1');
  if (!['auto', 'user-in-the-loop'].includes(config.default_mode)) errors.push('config.default_mode must be auto or user-in-the-loop');
  if (!config.auto_continue || typeof config.auto_continue !== 'object') errors.push('config.auto_continue is required');
  if (!config.handoff || typeof config.handoff !== 'object') errors.push('config.handoff is required');
  if (!config.transitions || typeof config.transitions !== 'object') errors.push('config.transitions is required');
  if (!config.active_workflow || typeof config.active_workflow !== 'object') errors.push('config.active_workflow is required');
  return errors;
}

function validateHandoff(handoff) {
  const errors = [];
  if (!handoff || typeof handoff !== 'object') errors.push('handoff must be an object');
  if (!['auto', 'user-in-the-loop'].includes(handoff.workflow_mode)) errors.push('workflow_mode must be auto or user-in-the-loop');
  if (typeof handoff.current_skill !== 'string' || !handoff.current_skill) errors.push('current_skill is required');
  if (typeof handoff.next_skill !== 'string' || !handoff.next_skill) errors.push('next_skill is required');
  if (typeof handoff.requires_user !== 'boolean') errors.push('requires_user must be boolean');
  if (!(handoff.stop_reason === null || typeof handoff.stop_reason === 'string')) errors.push('stop_reason must be null or string');
  if (!['high', 'medium', 'low'].includes(handoff.confidence)) errors.push('confidence must be high, medium, or low');
  if (!handoff.inputs || typeof handoff.inputs !== 'object') errors.push('inputs is required');
  if (handoff.inputs) {
    if (!Array.isArray(handoff.inputs.open_questions)) errors.push('inputs.open_questions must be an array');
    if (!Array.isArray(handoff.inputs.required_context)) errors.push('inputs.required_context must be an array');
  }
  return errors;
}

function main() {
  const [projectRootArg, handoffArg, modeOverride] = process.argv.slice(2);
  if (!projectRootArg || !handoffArg) usage();

  const projectRoot = path.resolve(projectRootArg);
  const configPath = path.join(projectRoot, '.pi', 'workflow-orchestrator.json');
  if (!fs.existsSync(configPath)) {
    console.log(JSON.stringify(fail('pause', 'Missing project config .pi/workflow-orchestrator.json', { config_path: configPath }), null, 2));
    return;
  }

  let config, handoff;
  try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch (e) { console.log(JSON.stringify(fail('pause', `Invalid config JSON: ${e.message}`, { config_path: configPath }), null, 2)); return; }
  try { handoff = readJson(handoffArg); }
  catch (e) { console.log(JSON.stringify(fail('pause', `Invalid handoff JSON: ${e.message}`, { config_path: configPath }), null, 2)); return; }

  const errors = [...validateConfig(config), ...validateHandoff(handoff)];
  if (errors.length) {
    console.log(JSON.stringify(fail('pause', 'Schema validation failed', { errors, config_path: configPath, next_skill: handoff && handoff.next_skill }), null, 2));
    return;
  }

  const mode = modeOverride || config.active_workflow?.mode || config.default_mode || handoff.workflow_mode;
  const allowedNext = config.transitions[handoff.current_skill] || [];
  if (!allowedNext.includes(handoff.next_skill)) {
    console.log(JSON.stringify(fail('pause', `Invalid transition ${handoff.current_skill} -> ${handoff.next_skill}`, { config_path: configPath, next_skill: handoff.next_skill }), null, 2));
    return;
  }

  const reasons = [];
  const signals = handoff.signals || {};
  if (handoff.next_skill === 'none') reasons.push('Workflow complete or no next skill');
  if (mode === 'user-in-the-loop') reasons.push('User-in-the-loop mode requires confirmation');
  if (!config.auto_continue.enabled && mode === 'auto') reasons.push('Project config has auto_continue.enabled=false');
  if (handoff.requires_user) reasons.push('Handoff requires user input');
  if (handoff.stop_reason !== null) reasons.push(`Handoff stop_reason: ${handoff.stop_reason}`);
  if (config.auto_continue.stop_on_open_questions && handoff.inputs.open_questions.length > 0) reasons.push('Open questions present');
  if (config.auto_continue.stop_on_low_confidence && handoff.confidence === 'low') reasons.push('Low confidence');
  if (config.auto_continue.stop_before_execute && handoff.next_skill === 'execute') reasons.push('Configured to stop before execute');
  if (!config.auto_continue.allowed_skills.includes(handoff.next_skill) && handoff.next_skill !== 'none') reasons.push(`Next skill ${handoff.next_skill} is not in auto_continue.allowed_skills`);
  if (config.auto_continue.stop_on_failed_validation && signals.failed_validation) reasons.push('Failed validation signal present');
  if (config.auto_continue.stop_on_blockers && signals.blockers) reasons.push('Blockers signal present');
  if (signals.destructive_or_risky) reasons.push('Destructive or risky action signal present');

  const decision = reasons.length ? 'pause' : 'continue';
  console.log(JSON.stringify({
    decision,
    workflow_mode: mode,
    current_skill: handoff.current_skill,
    next_skill: handoff.next_skill,
    reason: reasons.length ? reasons.join('; ') : 'Auto mode allowed and no stop conditions found',
    config_path: configPath,
    handoff
  }, null, 2));
}

main();
