const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { appendAuditEntry, readAuditEntries, sanitize } = require('../src/audit');

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'wf-audit-')); }

test('appendAuditEntry creates JSONL audit log', () => {
  const root = tmpdir();
  const fullPath = appendAuditEntry(root, '.pi/workflows/wf-1.jsonl', { current_skill: 'plan', next_skill: 'execute', decision: 'continue' });
  assert.equal(fs.existsSync(fullPath), true);
  const entries = readAuditEntries(root, '.pi/workflows/wf-1.jsonl');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].current_skill, 'plan');
  assert.equal(entries[0].next_skill, 'execute');
  assert.equal(entries[0].decision, 'continue');
  assert.ok(entries[0].timestamp);
});

test('appendAuditEntry appends multiple lines', () => {
  const root = tmpdir();
  appendAuditEntry(root, '.pi/workflows/wf-1.jsonl', { step: 1 });
  appendAuditEntry(root, '.pi/workflows/wf-1.jsonl', { step: 2 });
  assert.deepEqual(readAuditEntries(root, '.pi/workflows/wf-1.jsonl').map((e) => e.step), [1, 2]);
});

test('sanitize redacts obvious secret fields and strings', () => {
  const value = sanitize({ token: 'abc', nested: { password: 'p', text: 'api_key=12345' } });
  assert.equal(value.token, '<redacted>');
  assert.equal(value.nested.password, '<redacted>');
  assert.equal(value.nested.text, 'api_key=<redacted>');
});
