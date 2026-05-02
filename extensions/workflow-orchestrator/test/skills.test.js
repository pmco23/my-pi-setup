const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { defaultConfig } = require('../src/config');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const skillsRoot = path.join(repoRoot, 'skills');

function parseFrontmatter(text) {
  assert.ok(text.startsWith('---\n'), 'skill must start with frontmatter');
  const end = text.indexOf('\n---', 4);
  assert.ok(end > 0, 'skill frontmatter must close');
  const raw = text.slice(4, end).trim();
  const data = {};
  let current = null;
  for (const line of raw.split('\n')) {
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (match) {
      current = match[1];
      data[current] = match[2].replace(/^>-?\s*$/, '').trim();
    } else if (current && line.trim()) {
      data[current] += `${data[current] ? '\n' : ''}${line.trim()}`;
    }
  }
  return data;
}

function skillDirs() {
  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(skillsRoot, entry.name, 'SKILL.md')))
    .map((entry) => entry.name);
}

test('all skills have valid minimal frontmatter', () => {
  for (const name of skillDirs()) {
    const text = fs.readFileSync(path.join(skillsRoot, name, 'SKILL.md'), 'utf8');
    const fm = parseFrontmatter(text);
    assert.equal(fm.name, name, `${name} frontmatter name must match directory`);
    assert.ok(fm.description, `${name} description required`);
    assert.ok(fm.description.length <= 1024, `${name} description too long`);
    assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${name} must use lowercase hyphenated name`);
  }
});

test('configured workflow skills exist and mention next step', () => {
  const config = defaultConfig('auto');
  const workflowSkills = new Set(['project-intake', ...config.default_sequence]);
  for (const name of workflowSkills) {
    const file = path.join(skillsRoot, name, 'SKILL.md');
    assert.equal(fs.existsSync(file), true, `${name} skill must exist`);
    assert.match(fs.readFileSync(file, 'utf8'), /## Next Step|## Next Skill Guidance/, `${name} should describe next step behavior`);
  }
});

test('config transitions and support skill references point to existing skills or none', () => {
  const config = defaultConfig('auto');
  const names = new Set(skillDirs());
  names.add('workflow-orchestrator');
  names.add('none');

  for (const [from, tos] of Object.entries(config.transitions)) {
    assert.ok(names.has(from), `transition source ${from} must exist`);
    for (const to of tos) assert.ok(names.has(to), `transition target ${to} from ${from} must exist`);
  }

  for (const [name, support] of Object.entries(config.support_skills)) {
    assert.ok(names.has(name), `support skill ${name} must exist`);
    for (const allowed of support.allowed_in) assert.ok(names.has(allowed), `${name}.allowed_in ${allowed} must exist`);
  }
});

test('bundled graphify skill version matches installed package (warns on drift)', () => {
  const { execFileSync } = require('node:child_process');
  const versionFile = path.join(skillsRoot, 'graphify', '.graphify_version');
  if (!fs.existsSync(versionFile)) return; // no bundled version file, skip

  const repoVersion = fs.readFileSync(versionFile, 'utf8').trim();

  let installedVersion = null;
  try {
    const graphifyBin = execFileSync('which', ['graphify'], { encoding: 'utf8' }).trim();
    const piSkillVersion = path.join(path.dirname(graphifyBin), '..', 'share', 'graphify', '.graphify_version');
    const piAgentVersion = path.join(process.env.HOME, '.pi', 'agent', 'skills', 'graphify', '.graphify_version');
    if (fs.existsSync(piAgentVersion)) {
      installedVersion = fs.readFileSync(piAgentVersion, 'utf8').trim();
    } else if (fs.existsSync(piSkillVersion)) {
      installedVersion = fs.readFileSync(piSkillVersion, 'utf8').trim();
    }
  } catch {
    // graphify not installed — skip version check
    return;
  }

  if (installedVersion && installedVersion !== repoVersion) {
    // Soft warning: print but do not fail the test suite.
    // Run ./scripts/install.sh to auto-sync, or manually copy the updated skill.
    console.warn(`[warn] bundled graphify skill version mismatch: repo=${repoVersion} installed=${installedVersion}. Run ./scripts/install.sh to sync.`);
  }
});
