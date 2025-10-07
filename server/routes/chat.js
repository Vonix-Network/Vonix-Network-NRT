const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Get recent chat messages
router.get('/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  
  const db = getDatabase();
  const messages = db.prepare(`
    SELECT * FROM chat_messages 
    ORDER BY timestamp DESC 
    LIMIT ?
  `).all(limit);

  // Reverse to get chronological order
  res.json(messages.reverse());
});

// Helper function to build avatar URL for Discord webhook
function buildAvatarUrl(user) {
  // If we have a Minecraft username, use mc-heads.net
  if (user.minecraft_username) {
    return `https://mc-heads.net/head/${user.minecraft_username}`;
  }
  
  // If we have a UUID but no username, use mc-heads.net with UUID
  if (user.minecraft_uuid) {
    const uuid = user.minecraft_uuid.replace(/-/g, '');
    return `https://mc-heads.net/head/${uuid}`;
  }
  
  // Fallback to UI Avatars
  const displayName = user.username || `User${user.id}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`;
}

// Send a message to Discord
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Validate message
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Get user from database
    const db = getDatabase();
    const user = db.prepare(
      'SELECT id, username, minecraft_username, minecraft_uuid FROM users WHERE id = ?'
    ).get(userId);

    if (!user) {
      console.error(`User ID ${userId} not found in database`);
      return res.status(404).json({ 
        error: 'User not found. Please log out and log in again.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Build display name and avatar URL
    const displayName = user.minecraft_username || user.username || `User${userId}`;
    const avatarUrl = buildAvatarUrl(user);

    console.log('💬 Processing chat message:', {
      userId: user.id,
      username: user.username,
      minecraft_username: user.minecraft_username,
      minecraft_uuid: user.minecraft_uuid,
      displayName,
      avatarUrl
    });

    // Send to Discord webhook if configured
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const discordPayload = {
          username: `[WEB] ${displayName}`,
          avatar_url: avatarUrl,
          content: message.trim()
        };

        console.log('📤 Sending to Discord webhook:', {
          webhook: webhookUrl.substring(0, 50) + '...',
          payload: discordPayload
        });

        const response = await axios.post(webhookUrl, discordPayload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });

        console.log(`✅ Discord webhook success (${response.status})`);
      } catch (webhookError) {
        console.error('❌ Discord webhook failed:', webhookError.message);
        if (webhookError.response) {
          console.error('❌ Response:', webhookError.response.status, webhookError.response.data);
        }
        // Don't fail the request, continue to save to DB
      }
    } else {
      console.warn('⚠️ DISCORD_WEBHOOK_URL not configured, skipping Discord send');
    }

    // Save to database
    const db2 = getDatabase();
    try {
      const stmt = db2.prepare(`
        INSERT INTO chat_messages 
        (discord_message_id, author_name, author_avatar, content, embeds, attachments, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        null, // discord_message_id
        displayName,
        avatarUrl,
        message.trim(),
        null, // embeds
        null, // attachments
        new Date().toISOString()
      );

      // Broadcast via WebSocket
      const savedMessage = db2.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid);
      if (savedMessage && global.broadcastChatMessage) {
        global.broadcastChatMessage(savedMessage);
      }

      console.log('💾 Message saved to database:', savedMessage.id);
    } catch (dbError) {
      console.error('❌ Database save failed:', dbError);
      throw dbError;
    } finally {
      // Do not close the singleton DB connection
    }

    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error('❌ Error in /send route:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Admin: Clear old chat messages (keep newest 20)
router.delete('/messages/clear-old', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const db = getDatabase();
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get the ID of the 20th newest message
    const threshold = db.prepare(`
      SELECT id FROM chat_messages
      ORDER BY timestamp DESC
      LIMIT 1 OFFSET 19
    `).get();

    if (!threshold) {
      return res.json({ message: 'Less than 20 messages exist, nothing to delete', deleted: 0 });
    }

    // Delete all messages older than the threshold
    const result = db.prepare(`
      DELETE FROM chat_messages
      WHERE id < ?
    `).run(threshold.id);

    // Do not close the singleton DB connection

    console.log(`🗑️ Admin ${req.user.username} cleared ${result.changes} old chat messages`);
    res.json({ 
      message: `Cleared ${result.changes} old messages, kept newest 20`,
      deleted: result.changes 
    });
  } catch (error) {
    console.error('Error clearing old messages:', error);
    res.status(500).json({ error: 'Failed to clear old messages' });
  }
});

module.exports = router;
