function workflowReminder(payload = {}) {
  if (!payload.workflowId) return null;
  const allowed = payload.allowedNext && payload.allowedNext.length ? payload.allowedNext.join(', ') : 'use the skill guidance';
  const lines = [
    'Workflow reminder:',
    `- Current skill: ${payload.currentSkill || 'unknown'}`,
    `- Allowed next skills: ${allowed}`,
    '- End the final response with `## Next Step`.',
    '- Include recommended skill, reason, user prompt, and compact auto handoff JSON.',
    '- If standalone or uncertain, ask the user before continuing.',
  ];
  if (payload.previousArtifact) {
    lines.push('- If `Previous artifact:` path is present, read it before starting.');
  }
  return lines.join('\n');
}

function buildSkillPrompt(skillName, payload = {}) {
  const lines = [`/skill:${skillName}`];
  if (payload.goal) lines.push('', `Goal: ${payload.goal}`);
  if (payload.mode) lines.push(`Workflow mode: ${payload.mode}`);
  if (payload.workflowId) lines.push(`Workflow ID: ${payload.workflowId}`);
  if (payload.artifactLog) lines.push(`Artifact log: ${payload.artifactLog}`);
  if (payload.artifactDir) lines.push(`Artifact dir: ${payload.artifactDir}`);
  if (payload.step != null) lines.push(`Step: ${payload.step}`);
  if (payload.previousArtifact) lines.push(`Previous artifact: ${payload.previousArtifact}`);
  if (payload.context && payload.context.length) {
    lines.push('', 'Context:');
    for (const item of payload.context) lines.push(`- ${item}`);
  }
  const reminder = workflowReminder({ ...payload, currentSkill: payload.currentSkill || skillName });
  if (reminder) lines.push('', reminder);
  if (payload.instructions) lines.push('', payload.instructions);
  return lines.join('\n');
}

function artifactDir(workflowId) {
  if (!workflowId) return null;
  return `.pi/workflows/${workflowId}/`;
}

function buildContinuePrompt(config) {
  const active = config.active_workflow || {};
  if (!active.next_skill) throw new Error('No active workflow next_skill to continue');
  return buildSkillPrompt(active.next_skill, {
    mode: config.mode,
    workflowId: active.id,
    artifactLog: active.artifact_log,
    artifactDir: artifactDir(active.id),
    step: (active.step_number || 0) + 1,
    previousArtifact: active.last_artifact || null,
    allowedNext: config.transitions?.[active.next_skill] || [],
    context: [
      active.goal ? `Goal: ${active.goal}` : null,
      active.current_skill ? `Previous skill: ${active.current_skill}` : null,
    ].filter(Boolean),
  });
}

function buildWorkflowSystemPrompt(config) {
  const active = config?.active_workflow;
  if (!active?.id) return null;
  const transitions = config.transitions?.[active.next_skill] || [];
  const lines = [
    '[Active Workflow]',
    `ID: ${active.id}`,
    active.goal ? `Goal: ${active.goal}` : null,
    `Step: ${active.step_number || 0}`,
    `Current skill: ${active.current_skill || '(none)'}`,
    `Next skill: ${active.next_skill || '(none)'}`,
    active.last_artifact ? `Last artifact: ${active.last_artifact}` : null,
    `Mode: ${config.mode}`,
    transitions.length ? `Allowed transitions from ${active.next_skill}: ${transitions.join(', ')}` : null,
  ].filter(Boolean);
  return lines.join('\n');
}

module.exports = { workflowReminder, buildSkillPrompt, buildContinuePrompt, buildWorkflowSystemPrompt, artifactDir };
