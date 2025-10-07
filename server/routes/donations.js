const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Public: list donations marked for display
router.get('/public', (req, res) => {
  const db = getDatabase();
  try {
    const donations = db.prepare(`
      SELECT id, minecraft_username, minecraft_uuid, amount, currency, method, message, created_at
      FROM donations
      WHERE displayed = 1
      ORDER BY created_at DESC
    `).all();
    res.json(donations);
  } catch (err) {
    console.error('Error fetching public donations:', err);
    res.status(500).json({ error: 'Failed to fetch donations' });
  } finally {
    
  }
});

// Admin: list all donations
router.get('/', authenticateToken, isAdmin, (req, res) => {
  const db = getDatabase();
  try {
    const donations = db.prepare(`
      SELECT * FROM donations ORDER BY created_at DESC
    `).all();
    res.json(donations);
  } catch (err) {
    console.error('Error fetching donations:', err);
    res.status(500).json({ error: 'Failed to fetch donations' });
  } finally {
    
  }
});

// Admin: create donation (manual entry)
router.post('/', authenticateToken, isAdmin, (req, res) => {
  const { minecraft_username, minecraft_uuid, amount, currency = 'USD', method, message, displayed = 1 } = req.body;
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return res.status(400).json({ error: 'Amount must be a number' });
  }
  const db = getDatabase();
  try {
    const stmt = db.prepare(`
      INSERT INTO donations (minecraft_username, minecraft_uuid, amount, currency, method, message, displayed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(minecraft_username || null, minecraft_uuid || null, amount, currency, method || null, message || null, displayed ? 1 : 0);
    const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(donation);
  } catch (err) {
    console.error('Error creating donation:', err);
    res.status(500).json({ error: 'Failed to create donation' });
  } finally {
    
  }
});

// Admin: update donation
router.put('/:id(\\d+)', authenticateToken, isAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { minecraft_username, minecraft_uuid, amount, currency, method, message, displayed } = req.body;
  const db = getDatabase();
  try {
    const existing = db.prepare('SELECT * FROM donations WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    const stmt = db.prepare(`
      UPDATE donations
      SET minecraft_username = ?,
          minecraft_uuid = ?,
          amount = ?,
          currency = ?,
          method = ?,
          message = ?,
          displayed = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      minecraft_username ?? existing.minecraft_username,
      minecraft_uuid ?? existing.minecraft_uuid,
      (amount ?? existing.amount),
      currency ?? existing.currency,
      method ?? existing.method,
      message ?? existing.message,
      (typeof displayed === 'number' ? displayed : (displayed ? 1 : 0)) ?? existing.displayed,
      id
    );
    const updated = db.prepare('SELECT * FROM donations WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    console.error('Error updating donation:', err);
    res.status(500).json({ error: 'Failed to update donation' });
  } finally {
    
  }
});

// Admin: delete donation
router.delete('/:id(\\d+)', authenticateToken, isAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const db = getDatabase();
  try {
    const stmt = db.prepare('DELETE FROM donations WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    res.json({ message: 'Donation deleted' });
  } catch (err) {
    console.error('Error deleting donation:', err);
    res.status(500).json({ error: 'Failed to delete donation' });
  } finally {
    
  }
});

// Settings helpers
function getSetting(db, key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(db, key, value) {
  const existing = db.prepare('SELECT key FROM settings WHERE key = ?').get(key);
  if (existing) {
    db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(value, key);
  } else {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }
}

// Public: donation settings (for showing links)
router.get('/settings/public', (req, res) => {
  const db = getDatabase();
  try {
    const paypalEmail = getSetting(db, 'donation_paypal_email');
    const paypalMe = getSetting(db, 'donation_paypal_me');
    const cryptoJson = getSetting(db, 'donation_crypto');
    res.json({
      paypal_email: paypalEmail || null,
      paypal_me: paypalMe || null,
      crypto: cryptoJson ? JSON.parse(cryptoJson) : {}
    });
  } catch (err) {
    console.error('Error reading donation settings:', err);
    res.status(500).json({ error: 'Failed to read donation settings' });
  } finally {
    
  }
});

// Admin: get donation settings
router.get('/settings', authenticateToken, isAdmin, (req, res) => {
  const db = getDatabase();
  try {
    const paypalEmail = getSetting(db, 'donation_paypal_email');
    const paypalMe = getSetting(db, 'donation_paypal_me');
    const cryptoJson = getSetting(db, 'donation_crypto');
    res.json({
      paypal_email: paypalEmail || '',
      paypal_me: paypalMe || '',
      crypto: cryptoJson ? JSON.parse(cryptoJson) : {}
    });
  } catch (err) {
    console.error('Error reading donation settings:', err);
    res.status(500).json({ error: 'Failed to read donation settings' });
  } finally {
    
  }
});

// Admin: update donation settings
router.put('/settings', authenticateToken, isAdmin, (req, res) => {
  const { paypal_email, paypal_me, crypto } = req.body;
  const db = getDatabase();
  try {
    if (paypal_email !== undefined) setSetting(db, 'donation_paypal_email', paypal_email || '');
    if (paypal_me !== undefined) setSetting(db, 'donation_paypal_me', paypal_me || '');
    if (crypto !== undefined) setSetting(db, 'donation_crypto', JSON.stringify(crypto || {}));
    res.json({ message: 'Settings updated' });
  } catch (err) {
    console.error('Error updating donation settings:', err);
    res.status(500).json({ error: 'Failed to update donation settings' });
  } finally {
    
  }
});

module.exports = router;
