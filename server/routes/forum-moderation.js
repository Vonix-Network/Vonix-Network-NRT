const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { authenticateToken, verifyToken, isAdminOrModerator } = require('../middleware/auth');
const { clearCache } = require('../middleware/cache');
const logger = require('../utils/logger');

// Use the new middleware for consistency
const isModerator = isAdminOrModerator;

// POST /api/forum-mod/topic/:id/lock - Lock/unlock topic
router.post('/topic/:id/lock', verifyToken, isModerator, async (req, res) => {
  try {
    const db = getDatabase();
    const topicId = parseInt(req.params.id);
    const { locked, reason } = req.body;
    
    const topic = db.prepare('SELECT * FROM forum_topics WHERE id = ?').get(topicId);
    
    if (!topic) {
      
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    db.prepare('UPDATE forum_topics SET locked = ? WHERE id = ?').run(locked ? 1 : 0, topicId);
    
    // Log action
    db.prepare(`
      INSERT INTO forum_moderation_log (moderator_id, action, target_type, target_id, reason)
      VALUES (?, ?, 'topic', ?, ?)
    `).run(req.user.id, locked ? 'lock' : 'unlock', topicId, reason || null);
    
    
    res.json({ success: true, message: `Topic ${locked ? 'locked' : 'unlocked'}` });
  } catch (error) {
    console.error('Error locking topic:', error);
    res.status(500).json({ error: 'Failed to lock topic' });
  }
});

// POST /api/forum-mod/topic/:id/pin - Pin/unpin topic
router.post('/topic/:id/pin', verifyToken, isModerator, async (req, res) => {
  try {
    const db = getDatabase();
    const topicId = parseInt(req.params.id);
    const { pinned, reason } = req.body;
    
    const topic = db.prepare('SELECT * FROM forum_topics WHERE id = ?').get(topicId);
    
    if (!topic) {
      
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    db.prepare('UPDATE forum_topics SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, topicId);
    
    // Log action
    db.prepare(`
      INSERT INTO forum_moderation_log (moderator_id, action, target_type, target_id, reason)
      VALUES (?, ?, 'topic', ?, ?)
    `).run(req.user.id, pinned ? 'pin' : 'unpin', topicId, reason || null);
    
    
    res.json({ success: true, message: `Topic ${pinned ? 'pinned' : 'unpinned'}` });
  } catch (error) {
    console.error('Error pinning topic:', error);
    res.status(500).json({ error: 'Failed to pin topic' });
  }
});

// POST /api/forum-mod/topic/:id/move - Move topic to different forum
router.post('/topic/:id/move', verifyToken, isModerator, async (req, res) => {
  try {
    const db = getDatabase();
    const topicId = parseInt(req.params.id);
    const { forumId, reason } = req.body;
    
    if (!forumId) {
      
      return res.status(400).json({ error: 'Target forum ID is required' });
    }
    
    const topic = db.prepare('SELECT * FROM forum_topics WHERE id = ?').get(topicId);
    const targetForum = db.prepare('SELECT * FROM forums WHERE id = ?').get(forumId);
    
    if (!topic || !targetForum) {
      
      return res.status(404).json({ error: 'Topic or target forum not found' });
    }
    
    const oldForumId = topic.forum_id;
    
    // Update topic
    db.prepare('UPDATE forum_topics SET forum_id = ? WHERE id = ?').run(forumId, topicId);
    
    // Update old forum stats
    db.prepare(`
      UPDATE forums 
      SET topics_count = topics_count - 1,
          posts_count = posts_count - (? + 1)
      WHERE id = ?
    `).run(topic.replies, oldForumId);
    
    // Update new forum stats
    db.prepare(`
      UPDATE forums 
      SET topics_count = topics_count + 1,
          posts_count = posts_count + (? + 1)
      WHERE id = ?
    `).run(topic.replies, forumId);
    
    // Log action
    db.prepare(`
      INSERT INTO forum_moderation_log (moderator_id, action, target_type, target_id, reason, details)
      VALUES (?, 'move', 'topic', ?, ?, ?)
    `).run(req.user.id, topicId, reason || null, `Moved from forum ${oldForumId} to ${forumId}`);
    
    
    res.json({ success: true, message: 'Topic moved successfully' });
  } catch (error) {
    console.error('Error moving topic:', error);
    res.status(500).json({ error: 'Failed to move topic' });
  }
});

// DELETE /api/forum-mod/topic/:id - Delete topic
router.delete('/topic/:id', verifyToken, isModerator, async (req, res) => {
  try {
    const db = getDatabase();
    const topicId = parseInt(req.params.id);
    const { reason } = req.body;
    
    const topic = db.prepare('SELECT * FROM forum_topics WHERE id = ?').get(topicId);
    
    if (!topic) {
      
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Delete topic (cascade will delete posts)
    db.prepare('DELETE FROM forum_topics WHERE id = ?').run(topicId);
    
    // Update forum stats (ensure counts don't go below 0)
    db.prepare(`
      UPDATE forums 
      SET topics_count = MAX(0, topics_count - 1),
          posts_count = MAX(0, posts_count - (? + 1))
      WHERE id = ?
    `).run(topic.replies, topic.forum_id);
    
    // Log action
    db.prepare(`
      INSERT INTO forum_moderation_log (moderator_id, action, target_type, target_id, reason, details)
      VALUES (?, 'delete', 'topic', ?, ?, ?)
    `).run(req.user.id, topicId, reason || null, `Deleted topic: ${topic.title}`);
    
    // Clear cache so deletion reflects immediately
    clearCache('/api/forum'); // Clear forum list
    clearCache(`/api/forum/forum/${topic.forum_id}`); // Clear specific forum
    
    res.json({ success: true, message: 'Topic deleted' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

// POST /api/forum-mod/post/:id/delete - Delete post (moderator)
router.post('/post/:id/delete', verifyToken, isModerator, async (req, res) => {
  try {
    const db = getDatabase();
    const postId = parseInt(req.params.id);
    const { reason } = req.body;
    
    const post = db.prepare('SELECT * FROM forum_posts WHERE id = ?').get(postId);
    
    if (!post) {
      
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Soft delete
    db.prepare(`
      UPDATE forum_posts 
      SET deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, postId);
    
    // Log action
    db.prepare(`
      INSERT INTO forum_moderation_log (moderator_id, action, target_type, target_id, reason)
      VALUES (?, 'delete', 'post', ?, ?)
    `).run(req.user.id, postId, reason || null);
    
    
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /api/forum-mod/post/:id/restore - Restore deleted post
router.post('/post/:id/restore', verifyToken, isModerator, async (req, res) => {
  try {
    const db = getDatabase();
    const postId = parseInt(req.params.id);
    
    db.prepare(`
      UPDATE forum_posts 
      SET deleted = 0, deleted_by = NULL, deleted_at = NULL
      WHERE id = ?
    `).run(postId);
    
    // Log action
    db.prepare(`
      INSERT INTO forum_moderation_log (moderator_id, action, target_type, target_id)
      VALUES (?, 'restore', 'post', ?)
    `).run(req.user.id, postId);
    
    
    res.json({ success: true, message: 'Post restored' });
  } catch (error) {
    console.error('Error restoring post:', error);
    res.status(500).json({ error: 'Failed to restore post' });
  }
});

// POST /api/forum-mod/user/:id/warn - Warn user
router.post('/user/:id/warn', verifyToken, isModerator, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = parseInt(req.params.id);
    const { reason, points, expiresAt } = req.body;
    
    if (!reason) {
      
      return res.status(400).json({ error: 'Reason is required' });
    }
    
    db.prepare(`
      INSERT INTO forum_warnings (user_id, moderator_id, reason, points, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, req.user.id, reason, points || 1, expiresAt || null);
    
    // Log action
    db.prepare(`
      INSERT INTO forum_moderation_log (moderator_id, action, target_type, target_id, reason, details)
      VALUES (?, 'warn', 'user', ?, ?, ?)
    `).run(req.user.id, userId, reason, `Warning points: ${points || 1}`);
    
    // Notify user
    db.prepare(`
      INSERT INTO forum_notifications (user_id, type, from_user_id, content)
      VALUES (?, 'warning', ?, ?)
    `).run(userId, req.user.id, `You have received a warning: ${reason}`);
    
    
    res.json({ success: true, message: 'User warned' });
  } catch (error) {
    console.error('Error warning user:', error);
    res.status(500).json({ error: 'Failed to warn user' });
  }
});

// POST /api/forum-mod/user/:id/ban - Ban user
router.post('/user/:id/ban', verifyToken, isModerator, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = parseInt(req.params.id);
    const { reason, banType, expiresAt } = req.body;
    
    if (!reason) {
      
      return res.status(400).json({ error: 'Reason is required' });
    }
    
    // Check if user is already banned
    const existingBan = db.prepare(`
      SELECT * FROM forum_bans WHERE user_id = ? AND active = 1
    `).get(userId);
    
    if (existingBan) {
      
      return res.status(400).json({ error: 'User is already banned' });
    }
    
    db.prepare(`
      INSERT INTO forum_bans (user_id, banned_by, reason, ban_type, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, req.user.id, reason, banType || 'temporary', expiresAt || null);
    
    // Log action
    db.prepare(`
      INSERT INTO forum_moderation_log (moderator_id, action, target_type, target_id, reason, details)
      VALUES (?, 'ban', 'user', ?, ?, ?)
    `).run(req.user.id, userId, reason, `Ban type: ${banType || 'temporary'}`);
    
    // Notify user
    db.prepare(`
      INSERT INTO forum_notifications (user_id, type, from_user_id, content)
      VALUES (?, 'ban', ?, ?)
    `).run(userId, req.user.id, `You have been banned: ${reason}`);
    
    
    res.json({ success: true, message: 'User banned' });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// POST /api/forum-mod/user/:id/unban - Unban user
router.post('/user/:id/unban', verifyToken, isModerator, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = parseInt(req.params.id);
    
    db.prepare(`
      UPDATE forum_bans SET active = 0 WHERE user_id = ? AND active = 1
    `).run(userId);
    
    // Log action
    db.prepare(`
      INSERT INTO forum_moderation_log (moderator_id, action, target_type, target_id)
      VALUES (?, 'unban', 'user', ?)
    `).run(req.user.id, userId);
    
    
    res.json({ success: true, message: 'User unbanned' });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// GET /api/forum-mod/logs - Get moderation logs
router.get('/logs', verifyToken, isModerator, async (req, res) => {
  try {
    const db = getDatabase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const logs = db.prepare(`
      SELECT 
        l.*,
        u.username as moderator_username,
        u.minecraft_uuid as moderator_uuid
      FROM forum_moderation_log l
      JOIN users u ON l.moderator_id = u.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM forum_moderation_log
    `).get().count;
    
    
    res.json({
      logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching moderation logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /api/forum-mod/reports - Get reported content (placeholder for future)
router.get('/reports', verifyToken, isModerator, async (req, res) => {
  try {
    // Placeholder for content reporting system
    res.json({ reports: [], message: 'Report system coming soon' });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

module.exports = router;
