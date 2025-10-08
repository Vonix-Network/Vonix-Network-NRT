const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { initializeDatabase, getDatabase } = require('../database/init');
const { handleRouteError } = require('../utils/route-logger');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  const db = getDatabase();
  const users = db.prepare('SELECT id, username, role, created_at, updated_at FROM users').all();
  res.json(users);
});

// Get users for discovery (all authenticated users)
router.get('/discover', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    const users = db.prepare(`
      SELECT 
        u.id, u.username, u.minecraft_username, u.minecraft_uuid, u.created_at,
        CASE 
          WHEN f.id IS NOT NULL THEN 1 
          ELSE 0 
        END as is_friend,
        CASE 
          WHEN fr_sent.id IS NOT NULL THEN 1 
          ELSE 0 
        END as friend_request_sent,
        CASE 
          WHEN fr_received.id IS NOT NULL THEN 1 
          ELSE 0 
        END as friend_request_received
      FROM users u
      LEFT JOIN friends f ON (
        (f.user1_id = ? AND f.user2_id = u.id) OR 
        (f.user2_id = ? AND f.user1_id = u.id)
      )
      LEFT JOIN friend_requests fr_sent ON (
        fr_sent.sender_id = ? AND fr_sent.receiver_id = u.id AND fr_sent.status = 'pending'
      )
      LEFT JOIN friend_requests fr_received ON (
        fr_received.sender_id = u.id AND fr_received.receiver_id = ? AND fr_received.status = 'pending'
      )
      WHERE u.id != ?
      ORDER BY u.created_at DESC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
    
    res.json(users);
  } catch (error) {
    console.error('Error loading users for discovery:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// Search users by username or minecraft username
router.get('/search', authenticateToken, (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const db = getDatabase();
    const searchTerm = `%${q.trim()}%`;
    
    const users = db.prepare(`
      SELECT 
        u.id, u.username, u.minecraft_username, u.minecraft_uuid, u.created_at,
        CASE 
          WHEN f.id IS NOT NULL THEN 1 
          ELSE 0 
        END as is_friend,
        CASE 
          WHEN fr_sent.id IS NOT NULL THEN 1 
          ELSE 0 
        END as friend_request_sent,
        CASE 
          WHEN fr_received.id IS NOT NULL THEN 1 
          ELSE 0 
        END as friend_request_received
      FROM users u
      LEFT JOIN friends f ON (
        (f.user1_id = ? AND f.user2_id = u.id) OR 
        (f.user2_id = ? AND f.user1_id = u.id)
      )
      LEFT JOIN friend_requests fr_sent ON (
        fr_sent.sender_id = ? AND fr_sent.receiver_id = u.id AND fr_sent.status = 'pending'
      )
      LEFT JOIN friend_requests fr_received ON (
        fr_received.sender_id = u.id AND fr_received.receiver_id = ? AND fr_received.status = 'pending'
      )
      WHERE (u.username LIKE ? OR u.minecraft_username LIKE ?)
      AND u.id != ?
      ORDER BY 
        CASE 
          WHEN u.username = ? THEN 1
          WHEN u.minecraft_username = ? THEN 2
          WHEN u.username LIKE ? THEN 3
          WHEN u.minecraft_username LIKE ? THEN 4
          ELSE 5
        END,
        u.username ASC
      LIMIT 20
    `).all(
      req.user.id, req.user.id, req.user.id, req.user.id,
      searchTerm, searchTerm, req.user.id,
      q.trim(), q.trim(), 
      `${q.trim()}%`, `${q.trim()}%`
    );
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
  const db = getDatabase();
  try {
    const user = db.prepare('SELECT id, username, role, minecraft_username, minecraft_uuid, must_change_password FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    
    // If column doesn't exist, try without minecraft columns
    try {
      const db2 = getDatabase();
      const user = db2.prepare('SELECT id, username, role, must_change_password FROM users WHERE id = ?').get(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ ...user, minecraft_username: null, minecraft_uuid: null });
    } catch (fallbackError) {
      handleRouteError(fallbackError, res, 'Failed to fetch user data');
    }
  }
});

// Create new user (admin only)
router.post('/', authenticateToken, isAdmin, (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDatabase();

    // Check if username exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, password, role, must_change_password)
      VALUES (?, ?, ?, 1)
    `);

    const result = stmt.run(username, hashedPassword, role || 'user');
    const newUser = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(newUser);
  } catch (error) {
    handleRouteError(error, res, 'Failed to create user');
  }
});

// Update user (admin can update anyone, users can update themselves)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const currentUserId = req.user.id;
    const isAdminUser = req.user.role === 'admin';

    // Users can only update themselves unless they're admin
    if (!isAdminUser && targetUserId !== currentUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { username, password, role } = req.body;

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if username is being changed
    if (username && username !== user.username) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, targetUserId);
      if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Only admins can change roles
    const newRole = (isAdminUser && role) ? role : user.role;
    const newUsername = username || user.username;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      const hashedPassword = bcrypt.hashSync(password, 10);
      const stmt = db.prepare(`
        UPDATE users 
        SET username = ?, password = ?, role = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(newUsername, hashedPassword, newRole, targetUserId);
    } else {
      const stmt = db.prepare(`
        UPDATE users 
        SET username = ?, role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(newUsername, newRole, targetUserId);
    }

    const updatedUser = db.prepare('SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?').get(targetUserId);

    res.json(updatedUser);
  } catch (error) {
    handleRouteError(error, res, 'Failed to update user');
  }
});

// Delete user (admin only, cannot delete self)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(targetUserId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    handleRouteError(error, res, 'Failed to delete user');
  }
});

module.exports = router;
