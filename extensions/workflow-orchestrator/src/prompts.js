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

function buildStartPrompt({ mode, goal, workflowId, artifactLog, firstSkill }) {
  return buildSkillPrompt(firstSkill || firstSkillForGoal(goal), {
    goal,
    mode,
    workflowId,
    artifactLog,
    instructions: 'Use the workflow handoff protocol. Persist important artifacts in the project workflow log when available.',
  });
}

function buildOnboardPrompt({ mode, workflowId, artifactLog, projectMap }) {
  return buildSkillPrompt('project-intake', {
    goal: 'Map and onboard this existing codebase before feature work.',
    mode,
    workflowId,
    artifactLog,
    context: [
      `Project map path: ${projectMap?.path || '.pi/project-map'}`,
      `Agent guidance path: ${projectMap?.agent_guidance || '.pi/project-map/agent-guidance.md'}`,
      `Graph output path: ${projectMap?.graph?.path || '.pi/project-map/graph'}`,
    ],
    instructions: [
      'Use graphify from the beginning of the intake flow.',
      'Create or update .pi/project-map/ files.',
      'Write graphify outputs under .pi/project-map/graph/.',
      'Do not modify source code.',
    ].join('\n'),
  });
}

function buildRefreshPrompt({ mode, projectMap }) {
  return buildSkillPrompt('project-intake', {
    goal: 'Refresh the existing project map. The codebase may have changed since the last onboarding.',
    mode,
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
    context: [`Resume from current skill: ${active.current_skill || 'unknown'}`, `Next skill: ${active.next_skill}`],
  });
}

module.exports = { buildSkillPrompt, buildStartPrompt, buildOnboardPrompt, buildRefreshPrompt, buildContinuePrompt, firstSkillForGoal };
