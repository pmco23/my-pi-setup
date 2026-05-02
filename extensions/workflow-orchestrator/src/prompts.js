function workflowReminder(payload = {}) {
  if (!payload.workflowId && !payload.mode) return null;
  const allowed = payload.allowedNext && payload.allowedNext.length ? payload.allowedNext.join(', ') : 'use the skill guidance';
  return [
    'Workflow reminder:',
    `- Current skill: ${payload.currentSkill || 'unknown'}`,
    `- Allowed next skills: ${allowed}`,
    '- End the final response with `## Next Step`.',
    '- Include recommended skill, reason, user prompt, and compact auto handoff JSON.',
    '- If standalone or uncertain, ask the user before continuing.',
  ].join('\n');
}

function buildSkillPrompt(skillName, payload = {}) {
  const lines = [`/skill:${skillName}`];
  if (payload.goal) lines.push('', `Goal: ${payload.goal}`);
  if (payload.mode) lines.push(`Workflow mode: ${payload.mode}`);
  if (payload.workflowId) lines.push(`Workflow ID: ${payload.workflowId}`);
  if (payload.artifactLog) lines.push(`Artifact log: ${payload.artifactLog}`);
  if (payload.context && payload.context.length) {
    lines.push('', 'Context:');
    for (const item of payload.context) lines.push(`- ${item}`);
  }
  const reminder = workflowReminder({ ...payload, currentSkill: payload.currentSkill || skillName });
  if (reminder) lines.push('', reminder);
  if (payload.instructions) lines.push('', payload.instructions);
  return lines.join('\n');
}

function firstSkillForGoal(goal = '') {
  const text = goal.toLowerCase();
  if (/code review|engineering review/.test(text)) return 'code-review';
  if (/review|verify|against plan/.test(text)) return 'review-against-plan';
  if (/implement|fix|execute|add|refactor/.test(text)) return 'plan';
  return 'brainstorm-spec';
}

function buildStartPrompt({ mode, goal, workflowId, artifactLog, firstSkill, allowedNext }) {
  return buildSkillPrompt(firstSkill || firstSkillForGoal(goal), {
    goal,
    mode,
    workflowId,
    artifactLog,
    allowedNext,
    instructions: 'Persist important artifacts in the project workflow log when available.',
  });
}

function buildOnboardPrompt({ mode, workflowId, artifactLog, projectMap, goal, allowedNext }) {
  const onboardGoal = goal
    ? `Map and onboard this existing codebase before feature work. After onboarding, prepare to plan this goal: ${goal}`
    : 'Map and onboard this existing codebase before feature work.';
  return buildSkillPrompt('project-intake', {
    goal: onboardGoal,
    mode,
    workflowId,
    artifactLog,
    allowedNext,
    context: [
      `Project map path: ${projectMap?.path || '.pi/project-map'}`,
      `Agent guidance path: ${projectMap?.agent_guidance || '.pi/project-map/agent-guidance.md'}`,
      `Graph output path: ${projectMap?.graph?.path || '.pi/project-map/graph'}`,
    ],
    instructions: [
      'Use graphify from the beginning of the intake flow.',
      'Create or update .pi/project-map/ files.',
      'Write graphify outputs under .pi/project-map/graph/.',
      goal ? `User goal after onboarding: ${goal}` : null,
      goal ? 'If onboarding succeeds and the goal is actionable, recommend `plan` next.' : null,
      'Do not modify source code.',
    ].filter(Boolean).join('\n'),
  });
}

function buildRefreshPrompt({ mode, projectMap, allowedNext }) {
  return buildSkillPrompt('project-intake', {
    goal: 'Refresh the existing project map. The codebase may have changed since the last onboarding.',
    mode,
    allowedNext,
    context: [
      `Project map path: ${projectMap?.path || '.pi/project-map'}`,
      `Agent guidance path: ${projectMap?.agent_guidance || '.pi/project-map/agent-guidance.md'}`,
      `Graph output path: ${projectMap?.graph?.path || '.pi/project-map/graph'}`,
      `Last updated: ${projectMap?.last_updated || 'unknown'}`,
    ],
    instructions: [
      'This is a refresh, not initial onboarding.',
      'Use graphify from the beginning to detect structural changes.',
      'Update all .pi/project-map/ files with current codebase state.',
      'Write graphify outputs under .pi/project-map/graph/.',
      'Preserve useful historical context in agent-guidance.md when still valid.',
      'Do not modify source code.',
    ].join('\n'),
  });
}

function buildContinuePrompt(config) {
  const active = config.active_workflow || {};
  if (!active.next_skill) throw new Error('No active workflow next_skill to continue');
  return buildSkillPrompt(active.next_skill, {
    mode: active.mode || config.default_mode,
    workflowId: active.id,
    artifactLog: active.artifact_log,
    allowedNext: config.transitions?.[active.next_skill] || [],
    context: [`Resume from current skill: ${active.current_skill || 'unknown'}`, `Next skill: ${active.next_skill}`],
  });
}

module.exports = { workflowReminder, buildSkillPrompt, buildStartPrompt, buildOnboardPrompt, buildRefreshPrompt, buildContinuePrompt, firstSkillForGoal };
