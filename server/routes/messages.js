const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { validateSearch, validateMessage } = require('../middleware/validation');

const router = express.Router();

// Search users (for starting conversations)
router.get('/search-users', authenticateToken, validateSearch, (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const db = getDatabase();
    const users = db.prepare(`
      SELECT id, username, minecraft_username, minecraft_uuid
      FROM users
      WHERE (username LIKE ? OR minecraft_username LIKE ?)
        AND id != ?
      LIMIT 10
    `).all(`%${q}%`, `%${q}%`, req.user.id);
    

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get conversations list with last message
router.get('/conversations', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    // Get all users I've messaged with and their last message
    const conversations = db.prepare(`
      SELECT 
        u.id as user_id,
        u.username,
        u.minecraft_username,
        u.minecraft_uuid,
        last_msg.content as last_message,
        last_msg.created_at as last_message_at,
        last_msg.sender_id as last_sender_id,
        unread_count.count as unread_count
      FROM (
        SELECT DISTINCT
          CASE
            WHEN sender_id = ? THEN recipient_id
            ELSE sender_id
          END as other_user_id
        FROM private_messages
        WHERE sender_id = ? OR recipient_id = ?
      ) as convos
      JOIN users u ON u.id = convos.other_user_id
      LEFT JOIN (
        SELECT 
          CASE
            WHEN sender_id = ? THEN recipient_id
            ELSE sender_id
          END as other_user_id,
          content,
          created_at,
          sender_id,
          ROW_NUMBER() OVER (
            PARTITION BY CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END
            ORDER BY created_at DESC
          ) as rn
        FROM private_messages
        WHERE sender_id = ? OR recipient_id = ?
      ) last_msg ON last_msg.other_user_id = convos.other_user_id AND last_msg.rn = 1
      LEFT JOIN (
        SELECT recipient_id, COUNT(*) as count
        FROM private_messages
        WHERE recipient_id = ? AND read = 0
        GROUP BY recipient_id
      ) unread_count ON 1=1
      ORDER BY last_msg.created_at DESC
    `).all(
      req.user.id, req.user.id, req.user.id,
      req.user.id, req.user.id, req.user.id, req.user.id,
      req.user.id
    );
    
    
    res.json(conversations);
  } catch (error) {
    console.error('Error loading conversations:', error);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// Get messages with a specific user
router.get('/with/:userId', authenticateToken, (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);
    
    if (isNaN(otherUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const db = getDatabase();
    
    // Get the other user's info
    const otherUser = db.prepare(`
      SELECT id, username, minecraft_username, minecraft_uuid
      FROM users
      WHERE id = ?
    `).get(otherUserId);
    
    if (!otherUser) {
      
      return res.status(404).json({ error: 'User not found' });
    }

    // Get messages between the two users
    const messages = db.prepare(`
      SELECT id, sender_id, recipient_id, content, read, created_at
      FROM private_messages
      WHERE (sender_id = ? AND recipient_id = ?)
         OR (sender_id = ? AND recipient_id = ?)
      ORDER BY created_at ASC
    `).all(req.user.id, otherUserId, otherUserId, req.user.id);

    // Mark messages from other user as read
    db.prepare(`
      UPDATE private_messages
      SET read = 1
      WHERE sender_id = ? AND recipient_id = ? AND read = 0
    `).run(otherUserId, req.user.id);

    

    res.json({
      user: otherUser,
      messages
    });
  } catch (error) {
    console.error('Error loading messages:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Send a message
router.post('/send', authenticateToken, validateMessage, (req, res) => {
  try {
    const { recipient_id, content } = req.body;

    if (!recipient_id || !content || !content.trim()) {
      return res.status(400).json({ error: 'Recipient and message content required' });
    }

    if (recipient_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    const db = getDatabase();

    // Check if recipient exists
    const recipient = db.prepare('SELECT id FROM users WHERE id = ?').get(recipient_id);
    if (!recipient) {
      
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Insert message
    const result = db.prepare(`
      INSERT INTO private_messages (sender_id, recipient_id, content)
      VALUES (?, ?, ?)
    `).run(req.user.id, recipient_id, content.trim());

    const message = db.prepare('SELECT * FROM private_messages WHERE id = ?').get(result.lastInsertRowid);
    
    

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM private_messages
      WHERE recipient_id = ? AND read = 0
    `).get(req.user.id);
    

    res.json({ count: result.count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

module.exports = router;
