const fs = require('node:fs');
const path = require('node:path');

function sanitize(value) {
  if (typeof value === 'string') {
    return value.replace(/(api[_-]?key|token(?!s)|secret|password)\s*[:=]\s*\S+/gi, '$1=<redacted>');
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, /api[_-]?key|token(?!s)|secret|password/i.test(k) ? '<redacted>' : sanitize(v)]));
  }
  return value;
}

function appendAuditEntry(projectRoot, artifactLog, entry) {
  if (!artifactLog) throw new Error('artifactLog is required');
  const fullPath = path.isAbsolute(artifactLog) ? artifactLog : path.join(projectRoot, artifactLog);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  const safeEntry = sanitize({ timestamp: new Date().toISOString(), ...entry });
  fs.appendFileSync(fullPath, JSON.stringify(safeEntry) + '\n');
  return fullPath;
}

function readAuditEntries(projectRoot, artifactLog) {
  const fullPath = path.isAbsolute(artifactLog) ? artifactLog : path.join(projectRoot, artifactLog);
  if (!fs.existsSync(fullPath)) return [];
  return fs.readFileSync(fullPath, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

module.exports = { sanitize, appendAuditEntry, readAuditEntries };
