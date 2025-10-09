const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

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
    glow: false
  },
  PATRON: { 
    id: 'patron', 
    name: 'Patron', 
    minAmount: 10, 
    color: '#3b82f6',
    textColor: '#ffffff',
    icon: '💎',
    badge: 'PAT',
    glow: true
  },
  CHAMPION: { 
    id: 'champion', 
    name: 'Champion', 
    minAmount: 15, 
    color: '#8b5cf6',
    textColor: '#ffffff',
    icon: '👑',
    badge: 'CHA',
    glow: true
  },
  LEGEND: { 
    id: 'legend', 
    name: 'Legend', 
    minAmount: 20, 
    color: '#f59e0b',
    textColor: '#000000',
    icon: '🏆',
    badge: 'LEG',
    glow: true
  }
};

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 Login attempt for username:', username);

  if (!username || !password) {
    console.log('❌ Missing username or password');
    return res.status(400).json({ error: 'Username and password required' });
  }

  let db;
  try {
    db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR minecraft_username = ?').get(username, username);

    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ User found:', user.username, 'Role:', user.role);

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Password valid for user:', username);

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for:', username);

    // Add donation rank information
    let donationRank = null;
    if (user.donation_rank_id) {
      const rank = DONATION_RANKS[user.donation_rank_id.toUpperCase()];
      if (rank) {
        donationRank = rank;
      }
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        mustChangePassword: user.must_change_password === 1,
        minecraft_username: user.minecraft_username || null,
        minecraft_uuid: user.minecraft_uuid || null,
        total_donated: user.total_donated || 0,
        donation_rank_id: user.donation_rank_id || null,
        donation_rank_expires_at: user.donation_rank_expires_at || null,
        donation_rank: donationRank
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Change password
router.post('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const validPassword = bcrypt.compareSync(currentPassword, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  const stmt = db.prepare(`
    UPDATE users 
    SET password = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(hashedPassword, req.user.id);

  res.json({ message: 'Password changed successfully' });
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  const db = getDatabase();
  const user = db.prepare('SELECT id, username, role, must_change_password, minecraft_username, minecraft_uuid, total_donated, donation_rank_id, donation_rank_expires_at FROM users WHERE id = ?').get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Add donation rank information
  let donationRank = null;
  if (user.donation_rank_id) {
    const rank = DONATION_RANKS[user.donation_rank_id.toUpperCase()];
    if (rank) {
      donationRank = rank;
    }
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      mustChangePassword: user.must_change_password === 1,
      minecraft_username: user.minecraft_username || null,
      minecraft_uuid: user.minecraft_uuid || null,
      total_donated: user.total_donated || 0,
      donation_rank_id: user.donation_rank_id || null,
      donation_rank_expires_at: user.donation_rank_expires_at || null,
      donation_rank: donationRank
    }
  });
});

module.exports = router;
