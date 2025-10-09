const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Donation rank system constants
const DONATION_RANKS = {
  SUPPORTER: { 
    id: 'supporter', 
    name: 'Supporter', 
    minAmount: 5, 
    color: '#10b981',
    textColor: '#ffffff',
    icon: '🌟',
    badge: 'SUP',
    glow: false,
    duration: 30,
    subtitle: '$5 Monthly',
    perks: [
      'Custom username color',
      'Supporter badge',
      'Priority support',
      'Access to supporter-only channels'
    ],
    minecraftPerks: [
      'Supporter prefix in chat',
      'Access to /hat command',
      'Priority queue access'
    ]
  },
  PATRON: { 
    id: 'patron', 
    name: 'Patron', 
    minAmount: 10, 
    color: '#3b82f6',
    textColor: '#ffffff',
    icon: '💎',
    badge: 'PAT',
    glow: true,
    duration: 30,
    subtitle: '$10 Monthly — These people cover the cost of the Pixelmon server monthly',
    perks: [
      'All Supporter perks',
      'Custom username color with glow effect',
      'Patron badge',
      'Early access to new features',
      'Custom profile banner'
    ],
    minecraftPerks: [
      'All Supporter perks',
      'Patron prefix in chat',
      'Access to /fly command',
      'Access to /workbench command'
    ]
  },
  CHAMPION: { 
    id: 'champion', 
    name: 'Champion', 
    minAmount: 15, 
    color: '#8b5cf6',
    textColor: '#ffffff',
    icon: '👑',
    badge: 'CHA',
    glow: true,
    duration: 30,
    subtitle: '$15 Monthly',
    perks: [
      'All Patron perks',
      'Champion badge with crown',
      'Custom animated username effects',
      'Exclusive champion role',
      'Monthly exclusive content'
    ],
    minecraftPerks: [
      'All Patron perks',
      'Champion prefix in chat',
      'Access to /nick command',
      'Access to /enderchest command'
    ]
  },
  LEGEND: { 
    id: 'legend', 
    name: 'Legend', 
    minAmount: 20, 
    color: '#f59e0b',
    textColor: '#000000',
    icon: '🏆',
    badge: 'LEG',
    glow: true,
    duration: 30,
    subtitle: '$20 Monthly — These people cover the full cost of the BMC5 server monthly',
    perks: [
      'All Champion perks',
      'Legendary golden username',
      'Legend badge with trophy',
      'Exclusive legend title',
      'Direct line to staff',
      'Custom profile effects'
    ],
    minecraftPerks: [
      'All Champion perks',
      'Legend prefix in chat',
      'Access to all cosmetic commands',
      'Access to /heal and /feed commands'
    ]
  }
};

function getDonationRankByAmount(amount) {
  const ranks = Object.values(DONATION_RANKS).sort((a, b) => b.minAmount - a.minAmount);
  for (const rank of ranks) {
    if (amount >= rank.minAmount) {
      return rank;
    }
  }
  return null;
}

function updateUserDonationRank(db, userId) {
  try {
    // Calculate total donations for user
    const totalResult = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM donation_transactions 
      WHERE user_id = ? AND status = 'completed'
    `).get(userId);
    
    const totalDonated = totalResult.total || 0;
    const rank = getDonationRankByAmount(totalDonated);
    
    // Update user's donation info
    db.prepare(`
      UPDATE users 
      SET total_donated = ?, donation_rank_id = ?
      WHERE id = ?
    `).run(totalDonated, rank ? rank.id : null, userId);
    
    return { totalDonated, rank };
  } catch (error) {
    console.error('Error updating user donation rank:', error);
    return null;
  }
}

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

// New donation rank endpoints
// (Removed old static ranks endpoint - now using database-driven endpoint below)

// Admin: create donation transaction
router.post('/transactions', authenticateToken, isAdmin, (req, res) => {
  const { 
    user_id, 
    minecraft_username, 
    minecraft_uuid, 
    amount, 
    currency = 'USD', 
    payment_method, 
    payment_id, 
    status = 'completed',
    message,
    anonymous = 0
  } = req.body;

  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  const db = getDatabase();
  try {
    db.exec('BEGIN TRANSACTION');

    // Insert donation transaction
    const stmt = db.prepare(`
      INSERT INTO donation_transactions (
        user_id, minecraft_username, minecraft_uuid, amount, currency, 
        payment_method, payment_id, status, message, anonymous
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      user_id || null, 
      minecraft_username || null, 
      minecraft_uuid || null, 
      amount, 
      currency, 
      payment_method || null, 
      payment_id || null, 
      status, 
      message || null, 
      anonymous ? 1 : 0
    );

    // Update user donation rank if user_id provided and transaction is completed
    let rankUpdate = null;
    if (user_id && status === 'completed') {
      rankUpdate = updateUserDonationRank(db, user_id);
    }

    db.exec('COMMIT');

    const transaction = db.prepare('SELECT * FROM donation_transactions WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({
      transaction,
      rankUpdate
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error creating donation transaction:', err);
    res.status(500).json({ error: 'Failed to create donation transaction' });
  }
});

// Admin: get donation transactions
router.get('/transactions', authenticateToken, isAdmin, (req, res) => {
  const db = getDatabase();
  try {
    const transactions = db.prepare(`
      SELECT 
        dt.*,
        u.username,
        u.minecraft_username as user_minecraft_username
      FROM donation_transactions dt
      LEFT JOIN users u ON dt.user_id = u.id
      ORDER BY dt.created_at DESC
    `).all();
    
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching donation transactions:', err);
    res.status(500).json({ error: 'Failed to fetch donation transactions' });
  }
});

// Admin: update donation transaction status
router.put('/transactions/:id(\\d+)/status', authenticateToken, isAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const db = getDatabase();
  try {
    db.exec('BEGIN TRANSACTION');

    const transaction = db.prepare('SELECT * FROM donation_transactions WHERE id = ?').get(id);
    if (!transaction) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction status
    db.prepare(`
      UPDATE donation_transactions 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(status, id);

    // Update user donation rank if user_id exists
    let rankUpdate = null;
    if (transaction.user_id) {
      rankUpdate = updateUserDonationRank(db, transaction.user_id);
    }

    db.exec('COMMIT');

    const updatedTransaction = db.prepare('SELECT * FROM donation_transactions WHERE id = ?').get(id);
    
    res.json({
      transaction: updatedTransaction,
      rankUpdate
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error updating transaction status:', err);
    res.status(500).json({ error: 'Failed to update transaction status' });
  }
});

// Public: get user donation info
router.get('/user/:userId(\\d+)', (req, res) => {
  const userId = parseInt(req.params.userId);
  const db = getDatabase();
  
  try {
    const user = db.prepare(`
      SELECT 
        id, username, minecraft_username, total_donated, donation_rank_id
      FROM users 
      WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rank = user.donation_rank_id ? DONATION_RANKS[user.donation_rank_id.toUpperCase()] : null;
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        minecraft_username: user.minecraft_username,
        total_donated: user.total_donated || 0
      },
      rank
    });
  } catch (err) {
    console.error('Error fetching user donation info:', err);
    res.status(500).json({ error: 'Failed to fetch user donation info' });
  }
});

// Admin: recalculate all user donation ranks
router.post('/recalculate-ranks', authenticateToken, isAdmin, (req, res) => {
  const db = getDatabase();
  
  try {
    db.exec('BEGIN TRANSACTION');

    // Get all users with donations
    const users = db.prepare(`
      SELECT DISTINCT user_id 
      FROM donation_transactions 
      WHERE user_id IS NOT NULL
    `).all();

    let updated = 0;
    for (const { user_id } of users) {
      const result = updateUserDonationRank(db, user_id);
      if (result) updated++;
    }

    db.exec('COMMIT');

    res.json({ 
      message: `Successfully recalculated donation ranks for ${updated} users`,
      updated
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error recalculating donation ranks:', err);
    res.status(500).json({ error: 'Failed to recalculate donation ranks' });
  }
});

// Admin: get all users with donation ranks for management
router.get('/admin/users', authenticateToken, isAdmin, (req, res) => {
  console.log('🔄 Admin users endpoint called by user:', req.user?.id);
  const db = getDatabase();
  
  try {
    // Get all users and include donation information
    const users = db.prepare(`
      SELECT 
        u.id, u.username, u.minecraft_username, u.minecraft_uuid,
        COALESCE(u.total_donated, 0) as total_donated, 
        u.donation_rank_id, u.donation_rank_expires_at,
        u.donation_rank_granted_by, u.created_at,
        granter.username as granted_by_username,
        CASE 
          WHEN u.donation_rank_expires_at IS NULL THEN 0
          WHEN datetime(u.donation_rank_expires_at) < datetime('now') THEN 1
          ELSE 0
        END as isExpired,
        CASE 
          WHEN u.donation_rank_expires_at IS NULL THEN NULL
          ELSE CAST((julianday(u.donation_rank_expires_at) - julianday('now')) AS INTEGER)
        END as daysUntilExpiration
      FROM users u
      LEFT JOIN users granter ON u.donation_rank_granted_by = granter.id
      ORDER BY u.total_donated DESC, u.username ASC
    `).all();

    console.log('📊 Query returned', users.length, 'users');

    // Add rank info
    const usersWithRankInfo = users.map(user => {
      const rank = user.donation_rank_id ? DONATION_RANKS[user.donation_rank_id.toUpperCase()] : null;
      
      return {
        ...user,
        rank,
        isExpired: Boolean(user.isExpired),
        daysUntilExpiration: user.daysUntilExpiration
      };
    });

    console.log('✅ Found', usersWithRankInfo.length, 'users for donation management');
    res.json(usersWithRankInfo);
  } catch (err) {
    console.error('❌ Error fetching users with donation ranks:', err);
    
    // Fallback: try to get basic users if the complex query fails
    try {
      console.log('🔄 Trying fallback: basic users query...');
      const basicUsers = db.prepare(`
        SELECT id, username, minecraft_username, created_at 
        FROM users 
        ORDER BY username ASC
      `).all();
      console.log('✅ Fallback found', basicUsers.length, 'basic users');
      
      const usersWithDefaults = basicUsers.map(user => ({
        ...user,
        total_donated: 0,
        donation_rank_id: null,
        donation_rank_expires_at: null,
        donation_rank_granted_by: null,
        granted_by_username: null,
        rank: null,
        isExpired: false,
        daysUntilExpiration: null
      }));
      
      res.json(usersWithDefaults);
    } catch (fallbackErr) {
      console.error('❌ Fallback also failed:', fallbackErr);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
});

// Admin: grant or change user donation rank
router.post('/admin/users/:userId/rank', authenticateToken, isAdmin, (req, res) => {
  const userId = parseInt(req.params.userId);
  const { rankId, expirationDays, reason } = req.body;
  const adminId = req.user.id;

  if (!rankId || !DONATION_RANKS[rankId.toUpperCase()]) {
    return res.status(400).json({ error: 'Invalid rank ID' });
  }

  const db = getDatabase();
  
  try {
    db.exec('BEGIN TRANSACTION');

    // Get current user data
    const user = db.prepare(`
      SELECT id, username, donation_rank_id, donation_rank_expires_at 
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const newExpirationDate = expirationDays ? 
      new Date(Date.now() + (expirationDays * 24 * 60 * 60 * 1000)).toISOString() : null;

    // Update user rank
    db.prepare(`
      UPDATE users 
      SET donation_rank_id = ?, 
          donation_rank_expires_at = ?,
          donation_rank_granted_by = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rankId.toLowerCase(), newExpirationDate, adminId, userId);

    // Log the action in history
    db.prepare(`
      INSERT INTO donation_rank_history (
        user_id, old_rank_id, new_rank_id, old_expires_at, new_expires_at,
        action_type, reason, granted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      user.donation_rank_id,
      rankId.toLowerCase(),
      user.donation_rank_expires_at,
      newExpirationDate,
      user.donation_rank_id ? 'changed' : 'granted',
      reason || null,
      adminId
    );

    db.exec('COMMIT');

    res.json({ 
      message: `Successfully ${user.donation_rank_id ? 'changed' : 'granted'} rank for ${user.username}. Note: User will see changes when they refresh their page or switch browser tabs.`,
      user: {
        ...user,
        donation_rank_id: rankId.toLowerCase(),
        donation_rank_expires_at: newExpirationDate
      },
      // Signal that this user's session should be refreshed
      refreshRequired: true
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error updating user rank:', err);
    res.status(500).json({ error: 'Failed to update user rank' });
  }
});

// Admin: add days to user's current rank
router.post('/admin/users/:userId/extend', authenticateToken, isAdmin, (req, res) => {
  const userId = parseInt(req.params.userId);
  const { days, reason } = req.body;
  const adminId = req.user.id;

  if (!days || days <= 0) {
    return res.status(400).json({ error: 'Days must be a positive number' });
  }

  const db = getDatabase();
  
  try {
    db.exec('BEGIN TRANSACTION');

    // Get current user data
    const user = db.prepare(`
      SELECT id, username, donation_rank_id, donation_rank_expires_at 
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.donation_rank_id) {
      db.exec('ROLLBACK');
      return res.status(400).json({ error: 'User does not have a donation rank' });
    }

    // Calculate new expiration date
    const currentExpiration = user.donation_rank_expires_at ? 
      new Date(user.donation_rank_expires_at) : new Date();
    const newExpirationDate = new Date(currentExpiration.getTime() + (days * 24 * 60 * 60 * 1000));

    // Update user expiration
    db.prepare(`
      UPDATE users 
      SET donation_rank_expires_at = ?
      WHERE id = ?
    `).run(newExpirationDate.toISOString(), userId);

    // Log the action in history
    db.prepare(`
      INSERT INTO donation_rank_history (
        user_id, old_rank_id, new_rank_id, old_expires_at, new_expires_at,
        action_type, days_added, reason, granted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      user.donation_rank_id,
      user.donation_rank_id,
      user.donation_rank_expires_at,
      newExpirationDate.toISOString(),
      'extended',
      days,
      reason || null,
      adminId
    );

    db.exec('COMMIT');

    res.json({ 
      message: `Successfully added ${days} days to ${user.username}'s rank`,
      user: {
        ...user,
        donation_rank_expires_at: newExpirationDate.toISOString()
      }
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error extending user rank:', err);
    res.status(500).json({ error: 'Failed to extend user rank' });
  }
});

// Admin: revoke user's donation rank
router.delete('/admin/users/:userId/rank', authenticateToken, isAdmin, (req, res) => {
  const userId = parseInt(req.params.userId);
  const { reason } = req.body;
  const adminId = req.user.id;

  const db = getDatabase();
  
  try {
    db.exec('BEGIN TRANSACTION');

    // Get current user data
    const user = db.prepare(`
      SELECT id, username, donation_rank_id, donation_rank_expires_at 
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.donation_rank_id) {
      db.exec('ROLLBACK');
      return res.status(400).json({ error: 'User does not have a donation rank' });
    }

    // Remove user rank
    db.prepare(`
      UPDATE users 
      SET donation_rank_id = NULL, 
          donation_rank_expires_at = NULL,
          donation_rank_granted_by = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId);

    // Log the action in history
    db.prepare(`
      INSERT INTO donation_rank_history (
        user_id, old_rank_id, new_rank_id, old_expires_at, new_expires_at,
        action_type, reason, granted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      user.donation_rank_id,
      null,
      user.donation_rank_expires_at,
      null,
      'revoked',
      reason || null,
      adminId
    );

    db.exec('COMMIT');

    res.json({ 
      message: `Successfully revoked rank for ${user.username}. Note: User will see changes when they refresh their page or switch browser tabs.`,
      user: {
        ...user,
        donation_rank_id: null,
        donation_rank_expires_at: null
      },
      // Signal that this user's session should be refreshed
      refreshRequired: true
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error revoking user rank:', err);
    res.status(500).json({ error: 'Failed to revoke user rank' });
  }
});

// Admin: get rank history for a user
router.get('/admin/users/:userId/history', authenticateToken, isAdmin, (req, res) => {
  const userId = parseInt(req.params.userId);
  const db = getDatabase();
  
  try {
    const history = db.prepare(`
      SELECT 
        drh.*,
        granter.username as granted_by_username
      FROM donation_rank_history drh
      LEFT JOIN users granter ON drh.granted_by = granter.id
      WHERE drh.user_id = ?
      ORDER BY drh.created_at DESC
    `).all(userId);

    // Add rank names to history
    const historyWithRankNames = history.map(entry => ({
      ...entry,
      old_rank_name: entry.old_rank_id ? DONATION_RANKS[entry.old_rank_id.toUpperCase()]?.name : null,
      new_rank_name: entry.new_rank_id ? DONATION_RANKS[entry.new_rank_id.toUpperCase()]?.name : null
    }));

    res.json(historyWithRankNames);
  } catch (err) {
    console.error('Error fetching user rank history:', err);
    res.status(500).json({ error: 'Failed to fetch rank history' });
  }
});

// Admin: manage rank expiration service
const rankExpirationService = require('../services/rankExpirationService');

router.get('/admin/expiration-service/status', authenticateToken, isAdmin, (req, res) => {
  try {
    const status = rankExpirationService.getStatus();
    res.json(status);
  } catch (err) {
    console.error('Error getting expiration service status:', err);
    res.status(500).json({ error: 'Failed to get service status' });
  }
});

router.post('/admin/expiration-service/start', authenticateToken, isAdmin, (req, res) => {
  try {
    rankExpirationService.start();
    res.json({ message: 'Rank expiration service started' });
  } catch (err) {
    console.error('Error starting expiration service:', err);
    res.status(500).json({ error: 'Failed to start service' });
  }
});

router.post('/admin/expiration-service/stop', authenticateToken, isAdmin, (req, res) => {
  try {
    rankExpirationService.stop();
    res.json({ message: 'Rank expiration service stopped' });
  } catch (err) {
    console.error('Error stopping expiration service:', err);
    res.status(500).json({ error: 'Failed to stop service' });
  }
});

router.post('/admin/expiration-service/check', authenticateToken, isAdmin, (req, res) => {
  try {
    rankExpirationService.forceCheck();
    res.json({ message: 'Manual rank expiration check triggered' });
  } catch (err) {
    console.error('Error triggering manual check:', err);
    res.status(500).json({ error: 'Failed to trigger check' });
  }
});

router.put('/admin/expiration-service/interval', authenticateToken, isAdmin, (req, res) => {
  const { minutes } = req.body;
  
  if (!minutes || minutes < 1) {
    return res.status(400).json({ error: 'Minutes must be at least 1' });
  }
  
  try {
    rankExpirationService.setCheckInterval(minutes);
    res.json({ message: `Check interval updated to ${minutes} minutes` });
  } catch (err) {
    console.error('Error updating check interval:', err);
    res.status(500).json({ error: 'Failed to update interval' });
  }
});

// Get donation ranks configuration
router.get('/ranks', (req, res) => {
  try {
    const db = getDatabase();
    
    // Ensure table exists
    db.prepare(`
      CREATE TABLE IF NOT EXISTS donation_rank_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        min_amount INTEGER NOT NULL,
        subtitle TEXT,
        color TEXT NOT NULL,
        text_color TEXT NOT NULL,
        icon TEXT NOT NULL,
        badge TEXT NOT NULL,
        glow INTEGER NOT NULL DEFAULT 0,
        perks TEXT,
        minecraft_perks TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // Try to get ranks from database first
    let ranks;
    try {
      const dbRanks = db.prepare(`
        SELECT id, name, min_amount as minAmount, subtitle, color, text_color as textColor, 
               icon, badge, glow, perks, minecraft_perks as minecraftPerks, duration
        FROM donation_rank_configs 
        ORDER BY min_amount ASC
      `).all();
      
      if (dbRanks.length > 0) {
        // Parse JSON fields and convert glow to boolean
        ranks = dbRanks.map(rank => ({
          ...rank,
          glow: rank.glow === 1,
          perks: JSON.parse(rank.perks || '[]'),
          minecraftPerks: JSON.parse(rank.minecraftPerks || '[]')
        }));
      } else {
        // Auto-initialize with static ranks for backward compatibility
        console.log(`🔄 Auto-initializing database with default ranks`);
        
        const defaultRanks = Object.values(DONATION_RANKS);
        const stmt = db.prepare(`
          INSERT INTO donation_rank_configs 
          (id, name, min_amount, subtitle, color, text_color, icon, badge, glow, perks, minecraft_perks)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const rank of defaultRanks) {
          stmt.run(
            rank.id,
            rank.name,
            rank.minAmount,
            rank.subtitle || `$${rank.minAmount} Monthly`,
            rank.color,
            rank.textColor || '#ffffff',
            rank.icon,
            rank.badge,
            rank.glow ? 1 : 0,
            JSON.stringify(rank.perks || []),
            JSON.stringify(rank.minecraftPerks || [])
          );
        }
        
        // Now get the initialized ranks
        const initializedRanks = db.prepare(`
          SELECT id, name, min_amount as minAmount, subtitle, color, text_color as textColor, 
                 icon, badge, glow, perks, minecraft_perks as minecraftPerks, duration
          FROM donation_rank_configs 
          ORDER BY min_amount ASC
        `).all();
        
        ranks = initializedRanks.map(rank => ({
          ...rank,
          glow: rank.glow === 1,
          perks: JSON.parse(rank.perks || '[]'),
          minecraftPerks: JSON.parse(rank.minecraftPerks || '[]')
        }));
        
        console.log(`✅ Auto-initialized ${ranks.length} ranks in database`);
      }
    } catch (dbError) {
      // If database error, fall back to static ranks
      console.log('Database error, using static ranks:', dbError.message);
      ranks = Object.values(DONATION_RANKS);
    }
    
    res.json(ranks);
  } catch (err) {
    console.error('Error getting ranks:', err);
    res.status(500).json({ error: 'Failed to get ranks' });
  }
});


// Set user's total donated amount (admin only)
router.post('/admin/users/:userId/set-donated', authenticateToken, isAdmin, (req, res) => {
  const userId = parseInt(req.params.userId);
  const { amount } = req.body;
  const db = getDatabase();
  
  if (!amount || amount < 0) {
    return res.status(400).json({ error: 'Invalid donation amount' });
  }
  
  try {
    db.exec('BEGIN TRANSACTION');
    
    // Update total donated
    db.prepare(`
      UPDATE users 
      SET total_donated = ?
      WHERE id = ?
    `).run(amount, userId);
    
    // Get user info
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
    
    // Log the action
    console.log(`Admin ${req.user.id} set total donated for user ${user.username} to $${amount}`);
    
    db.exec('COMMIT');
    
    res.json({ 
      message: `Set total donated to $${amount} for ${user.username}`,
      amount: amount
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error setting total donated:', err);
    res.status(500).json({ error: 'Failed to set total donated' });
  }
});

// Update donation rank configuration (admin only)
router.put('/ranks/:rankId', authenticateToken, isAdmin, (req, res) => {
  try {
    const { rankId } = req.params;
    const { name, minAmount, subtitle, color, textColor, icon, badge, glow, perks, minecraftPerks } = req.body;
    const db = getDatabase();
    
    // Create table if it doesn't exist
    db.prepare(`
      CREATE TABLE IF NOT EXISTS donation_rank_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        min_amount INTEGER NOT NULL,
        subtitle TEXT,
        color TEXT NOT NULL,
        text_color TEXT NOT NULL,
        icon TEXT NOT NULL,
        badge TEXT NOT NULL,
        glow INTEGER NOT NULL DEFAULT 0,
        perks TEXT, -- JSON array
        minecraft_perks TEXT, -- JSON array
        duration INTEGER NOT NULL DEFAULT 30,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // Insert or update rank configuration
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO donation_rank_configs 
      (id, name, min_amount, subtitle, color, text_color, icon, badge, glow, perks, minecraft_perks, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      rankId,
      name,
      minAmount,
      subtitle || null,
      color,
      textColor || '#ffffff',
      icon,
      badge || name.substring(0, 3).toUpperCase(),
      glow ? 1 : 0,
      JSON.stringify(perks || []),
      JSON.stringify(minecraftPerks || [])
    );
    
    console.log(`Admin ${req.user.id} updated rank ${rankId}`);
    
    res.json({ 
      message: 'Rank configuration updated successfully',
      rank: {
        id: rankId,
        name,
        minAmount,
        subtitle,
        color,
        textColor,
        icon,
        badge,
        glow,
        perks,
        minecraftPerks
      }
    });
  } catch (err) {
    console.error('Error updating rank:', err);
    res.status(500).json({ error: 'Failed to update rank' });
  }
});

// Create new donation rank (admin only)
router.post('/ranks', authenticateToken, isAdmin, (req, res) => {
  try {
    const { id, name, minAmount, subtitle, color, textColor, icon, badge, glow, perks, minecraftPerks } = req.body;
    const db = getDatabase();
    
    if (!id || !name || !minAmount) {
      return res.status(400).json({ error: 'Missing required fields: id, name, minAmount' });
    }
    
    // Create table if it doesn't exist
    db.prepare(`
      CREATE TABLE IF NOT EXISTS donation_rank_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        min_amount INTEGER NOT NULL,
        subtitle TEXT,
        color TEXT NOT NULL,
        text_color TEXT NOT NULL,
        icon TEXT NOT NULL,
        badge TEXT NOT NULL,
        glow INTEGER NOT NULL DEFAULT 0,
        perks TEXT, -- JSON array
        minecraft_perks TEXT, -- JSON array
        duration INTEGER NOT NULL DEFAULT 30,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // Insert new rank configuration
    const stmt = db.prepare(`
      INSERT INTO donation_rank_configs 
      (id, name, min_amount, subtitle, color, text_color, icon, badge, glow, perks, minecraft_perks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      name,
      minAmount,
      subtitle || null,
      color || '#10b981',
      textColor || '#ffffff',
      icon || '🌟',
      badge || name.substring(0, 3).toUpperCase(),
      glow ? 1 : 0,
      JSON.stringify(perks || []),
      JSON.stringify(minecraftPerks || [])
    );
    
    console.log(`Admin ${req.user.id} created new rank ${id}`);
    
    res.json({ 
      message: 'New rank created successfully',
      rank: {
        id,
        name,
        minAmount,
        subtitle,
        color,
        textColor,
        icon,
        badge,
        glow,
        perks,
        minecraftPerks
      }
    });
  } catch (err) {
    console.error('Error creating rank:', err);
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      res.status(400).json({ error: 'Rank with this ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create rank' });
    }
  }
});

// Initialize default ranks in database (admin only)
router.post('/ranks/initialize', authenticateToken, isAdmin, (req, res) => {
  try {
    const db = getDatabase();
    
    // Create table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS donation_rank_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        min_amount INTEGER NOT NULL,
        subtitle TEXT,
        color TEXT NOT NULL,
        text_color TEXT NOT NULL,
        icon TEXT NOT NULL,
        badge TEXT NOT NULL,
        glow INTEGER NOT NULL DEFAULT 0,
        perks TEXT,
        minecraft_perks TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // Check if ranks already exist
    const existing = db.prepare('SELECT COUNT(*) as count FROM donation_rank_configs').get();
    
    if (existing.count > 0) {
      return res.json({ message: 'Ranks already initialized', count: existing.count });
    }
    
    // Default ranks
    const defaultRanks = [
      {
        id: 'supporter',
        name: 'Supporter',
        minAmount: 5,
        subtitle: '$5 Monthly',
        color: '#10b981',
        textColor: '#ffffff',
        icon: '🌟',
        badge: 'SUP',
        glow: false,
        perks: ['Custom username color', 'Supporter badge', 'Priority support', 'Access to supporter-only channels'],
        minecraftPerks: ['Supporter prefix in chat', 'Access to /hat command', 'Priority queue access']
      },
      {
        id: 'patron',
        name: 'Patron',
        minAmount: 10,
        subtitle: '$10 Monthly — Covers Pixelmon server costs',
        color: '#3b82f6',
        textColor: '#ffffff',
        icon: '💎',
        badge: 'PAT',
        glow: true,
        perks: ['All Supporter perks', 'Patron badge with glow effect', 'Early access to new features', 'Custom profile themes'],
        minecraftPerks: ['Patron prefix in chat', 'Access to /fly command', 'Access to /workbench command', 'Priority queue access']
      },
      {
        id: 'champion',
        name: 'Champion',
        minAmount: 15,
        subtitle: '$15 Monthly',
        color: '#8b5cf6',
        textColor: '#ffffff',
        icon: '👑',
        badge: 'CHA',
        glow: true,
        perks: ['All Patron perks', 'Champion badge with crown', 'Beta access to features', 'Custom username animations'],
        minecraftPerks: ['Champion prefix in chat', 'Access to /nick command', 'Access to /heal command', 'Priority queue access']
      },
      {
        id: 'legend',
        name: 'Legend',
        minAmount: 20,
        subtitle: '$20 Monthly — Covers full BMC5 server costs',
        color: '#f59e0b',
        textColor: '#ffffff',
        icon: '🏆',
        badge: 'LEG',
        glow: true,
        perks: ['All Champion perks', 'Legend badge with trophy', 'Alpha access to features', 'Custom profile effects', 'Direct developer contact'],
        minecraftPerks: ['Legend prefix in chat', 'Access to all cosmetic commands', 'Access to /god command', 'Highest priority queue access']
      }
    ];
    
    // Insert ranks
    const stmt = db.prepare(`
      INSERT INTO donation_rank_configs 
      (id, name, min_amount, subtitle, color, text_color, icon, badge, glow, perks, minecraft_perks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const rank of defaultRanks) {
      stmt.run(
        rank.id,
        rank.name,
        rank.minAmount,
        rank.subtitle,
        rank.color,
        rank.textColor,
        rank.icon,
        rank.badge,
        rank.glow ? 1 : 0,
        JSON.stringify(rank.perks),
        JSON.stringify(rank.minecraftPerks)
      );
    }
    
    console.log(`✅ Initialized ${defaultRanks.length} default ranks in database`);
    
    res.json({ 
      message: 'Default ranks initialized successfully',
      count: defaultRanks.length,
      ranks: defaultRanks.map(r => r.name)
    });
  } catch (err) {
    console.error('Error initializing ranks:', err);
    res.status(500).json({ error: 'Failed to initialize ranks' });
  }
});

module.exports = router;
