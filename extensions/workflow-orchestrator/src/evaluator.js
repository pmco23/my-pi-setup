const VALID_MODES = new Set(['auto', 'user-in-the-loop']);
const VALID_CONFIDENCE = new Set(['high', 'medium', 'low']);

function validateConfig(config) {
  const errors = [];
  if (!config || typeof config !== 'object') errors.push('config must be an object');
  if (config?.version !== 2) errors.push('config.version must be 2');
  if (!VALID_MODES.has(config?.mode)) errors.push('config.mode must be auto or user-in-the-loop');
  if (!config?.auto_continue || typeof config.auto_continue !== 'object') errors.push('config.auto_continue is required');
  if (!config?.transitions || typeof config.transitions !== 'object') errors.push('config.transitions is required');
  if (!config?.active_workflow || typeof config.active_workflow !== 'object') errors.push('config.active_workflow is required');
  return errors;
}

function validateHandoff(handoff) {
  const errors = [];
  if (!handoff || typeof handoff !== 'object') errors.push('handoff must be an object');
  if (!VALID_MODES.has(handoff?.workflow_mode)) errors.push('workflow_mode must be auto or user-in-the-loop');
  if (typeof handoff?.current_skill !== 'string' || !handoff.current_skill) errors.push('current_skill is required');
  if (typeof handoff?.next_skill !== 'string' || !handoff.next_skill) errors.push('next_skill is required');
  if (typeof handoff?.requires_user !== 'boolean') errors.push('requires_user must be boolean');
  if (!(handoff?.stop_reason === null || typeof handoff?.stop_reason === 'string')) errors.push('stop_reason must be null or string');
  if (!VALID_CONFIDENCE.has(handoff?.confidence)) errors.push('confidence must be high, medium, or low');
  if (!handoff?.inputs || typeof handoff.inputs !== 'object') errors.push('inputs is required');
  if (handoff?.inputs) {
    if (!Array.isArray(handoff.inputs.open_questions)) errors.push('inputs.open_questions must be an array');
    if (!Array.isArray(handoff.inputs.required_context)) errors.push('inputs.required_context must be an array');
  }
  return errors;
}

// In v2, mode is always config.mode — no active_workflow.mode or modeOverride fallback chain needed.
function resolveMode({ config, modeOverride }) {
  return modeOverride || config?.mode;
}

function evaluateHandoff({ config, handoff, modeOverride }) {
  const errors = [...validateConfig(config), ...validateHandoff(handoff)];
  if (errors.length) {
    return {
      decision: 'pause',
      reason: 'Schema validation failed',
      next_skill: handoff?.next_skill ?? null,
      errors,
    };
  }

  const mode = resolveMode({ config, modeOverride });
  const allowedNext = config.transitions[handoff.current_skill] || [];

  if (!allowedNext.includes(handoff.next_skill)) {
    return {
      decision: 'pause',
      workflow_mode: mode,
      current_skill: handoff.current_skill,
      next_skill: handoff.next_skill,
      reason: `Invalid transition ${handoff.current_skill} -> ${handoff.next_skill}`,
      errors: [],
      handoff,
    };
  }

  if (handoff.next_skill === 'none') {
    return {
      decision: 'complete',
      workflow_mode: mode,
      current_skill: handoff.current_skill,
      next_skill: handoff.next_skill,
      reason: handoff.stop_reason || 'Workflow complete',
      errors: [],
      handoff,
    };
  }

  const reasons = [];
  const signals = handoff.signals || {};
  const auto = config.auto_continue;

  if (handoff.requires_user) reasons.push('Handoff requires user input');
  if (handoff.stop_reason !== null) reasons.push(`Handoff stop_reason: ${handoff.stop_reason}`);
  if (auto.stop_on_open_questions && handoff.inputs.open_questions.length > 0) reasons.push('Open questions present');
  if (auto.stop_on_low_confidence && handoff.confidence === 'low') reasons.push('Low confidence');
  if (auto.stop_before_execute && handoff.next_skill === 'execute') reasons.push('Configured to stop before execute');
  if (auto.stop_on_failed_validation && signals.failed_validation) reasons.push('Failed validation signal present');
  if (auto.stop_on_blockers && signals.blockers) reasons.push('Blockers signal present');
  if (signals.destructive_or_risky) reasons.push('Destructive or risky action signal present');

  return {
    decision: reasons.length ? 'pause' : 'continue',
    workflow_mode: mode,
    current_skill: handoff.current_skill,
    next_skill: handoff.next_skill,
    reason: reasons.length ? reasons.join('; ') : 'No stop conditions found',
    errors: [],
    handoff,
  };
}

module.exports = { evaluateHandoff, resolveMode, validateConfig, validateHandoff };
