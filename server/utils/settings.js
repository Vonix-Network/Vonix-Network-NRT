const { getDatabase } = require('../database/init');

function getSetting(key, defaultValue = null) {
  const db = getDatabase();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!row) return defaultValue;
  return row.value;
}

function setSetting(key, value) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(key, value);
}

function getSettings(keys = []) {
  const db = getDatabase();
  if (keys.length === 0) {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }
  const placeholders = keys.map(() => '?').join(',');
  const rows = db.prepare(`SELECT key, value FROM settings WHERE key IN (${placeholders})`).all(...keys);
  const result = {};
  keys.forEach(k => { result[k] = null; });
  rows.forEach(r => { result[r.key] = r.value; });
  return result;
}

module.exports = {
  getSetting,
  setSetting,
  getSettings,
};
