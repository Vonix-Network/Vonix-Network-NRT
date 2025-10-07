const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { verifyToken } = require('../middleware/auth');

// POST /api/forum-actions/subscribe/topic/:id - Subscribe to topic
router.post('/subscribe/topic/:id', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    const topicId = parseInt(req.params.id);
    
    // Check if already subscribed
    const existing = db.prepare(`
      SELECT * FROM forum_subscriptions WHERE user_id = ? AND topic_id = ?
    `).get(req.user.id, topicId);
    
    if (existing) {
      // Unsubscribe
      db.prepare(`
        DELETE FROM forum_subscriptions WHERE user_id = ? AND topic_id = ?
      `).run(req.user.id, topicId);
      
      
      return res.json({ success: true, subscribed: false, message: 'Unsubscribed from topic' });
    }
    
    // Subscribe
    db.prepare(`
      INSERT INTO forum_subscriptions (user_id, topic_id, notify_replies)
      VALUES (?, ?, 1)
    `).run(req.user.id, topicId);
    
    
    res.json({ success: true, subscribed: true, message: 'Subscribed to topic' });
  } catch (error) {
    console.error('Error toggling subscription:', error);
    res.status(500).json({ error: 'Failed to toggle subscription' });
  }
});

// POST /api/forum-actions/subscribe/forum/:id - Subscribe to forum
router.post('/subscribe/forum/:id', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    const forumId = parseInt(req.params.id);
    
    // Check if already subscribed
    const existing = db.prepare(`
      SELECT * FROM forum_subscriptions WHERE user_id = ? AND forum_id = ?
    `).get(req.user.id, forumId);
    
    if (existing) {
      // Unsubscribe
      db.prepare(`
        DELETE FROM forum_subscriptions WHERE user_id = ? AND forum_id = ?
      `).run(req.user.id, forumId);
      
      
      return res.json({ success: true, subscribed: false, message: 'Unsubscribed from forum' });
    }
    
    // Subscribe
    db.prepare(`
      INSERT INTO forum_subscriptions (user_id, forum_id, notify_replies)
      VALUES (?, ?, 1)
    `).run(req.user.id, forumId);
    
    
    res.json({ success: true, subscribed: true, message: 'Subscribed to forum' });
  } catch (error) {
    console.error('Error toggling forum subscription:', error);
    res.status(500).json({ error: 'Failed to toggle subscription' });
  }
});

// POST /api/forum-actions/bookmark/:id - Bookmark topic
router.post('/bookmark/:id', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    const topicId = parseInt(req.params.id);
    
    // Check if already bookmarked
    const existing = db.prepare(`
      SELECT * FROM forum_bookmarks WHERE user_id = ? AND topic_id = ?
    `).get(req.user.id, topicId);
    
    if (existing) {
      // Remove bookmark
      db.prepare(`
        DELETE FROM forum_bookmarks WHERE user_id = ? AND topic_id = ?
      `).run(req.user.id, topicId);
      
      
      return res.json({ success: true, bookmarked: false, message: 'Bookmark removed' });
    }
    
    // Add bookmark
    db.prepare(`
      INSERT INTO forum_bookmarks (user_id, topic_id)
      VALUES (?, ?)
    `).run(req.user.id, topicId);
    
    
    res.json({ success: true, bookmarked: true, message: 'Topic bookmarked' });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

// GET /api/forum-actions/bookmarks - Get user's bookmarks
router.get('/bookmarks', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    const bookmarks = db.prepare(`
      SELECT 
        t.*,
        u.username as author_username,
        u.minecraft_uuid as author_uuid,
        f.name as forum_name,
        fb.created_at as bookmarked_at
      FROM forum_bookmarks fb
      JOIN forum_topics t ON fb.topic_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN forums f ON t.forum_id = f.id
      WHERE fb.user_id = ?
      ORDER BY fb.created_at DESC
    `).all(req.user.id);
    
    
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// POST /api/forum-actions/poll/:id/vote - Vote on poll
router.post('/poll/:id/vote', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    const pollId = parseInt(req.params.id);
    const { optionId } = req.body;
    
    if (!optionId) {
      
      return res.status(400).json({ error: 'Option ID is required' });
    }
    
    // Get poll details
    const poll = db.prepare('SELECT * FROM forum_polls WHERE id = ?').get(pollId);
    
    if (!poll) {
      
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    // Check if poll has ended
    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
      
      return res.status(400).json({ error: 'This poll has ended' });
    }
    
    // Check if user has already voted
    const existingVote = db.prepare(`
      SELECT * FROM forum_poll_votes WHERE poll_id = ? AND user_id = ?
    `).get(pollId, req.user.id);
    
    if (existingVote) {
      if (!poll.allow_revote) {
        
        return res.status(400).json({ error: 'You have already voted on this poll' });
      }
      
      // Remove old vote
      db.prepare(`
        DELETE FROM forum_poll_votes WHERE poll_id = ? AND user_id = ?
      `).run(pollId, req.user.id);
      
      // Decrement old option count
      db.prepare(`
        UPDATE forum_poll_options SET votes = votes - 1 WHERE id = ?
      `).run(existingVote.option_id);
    }
    
    // Verify option exists
    const option = db.prepare(`
      SELECT * FROM forum_poll_options WHERE id = ? AND poll_id = ?
    `).get(optionId, pollId);
    
    if (!option) {
      
      return res.status(404).json({ error: 'Invalid poll option' });
    }
    
    // Add vote
    db.prepare(`
      INSERT INTO forum_poll_votes (poll_id, option_id, user_id)
      VALUES (?, ?, ?)
    `).run(pollId, optionId, req.user.id);
    
    // Increment option count
    db.prepare(`
      UPDATE forum_poll_options SET votes = votes + 1 WHERE id = ?
    `).run(optionId);
    
    // Get updated results
    const results = db.prepare(`
      SELECT * FROM forum_poll_options WHERE poll_id = ? ORDER BY order_index
    `).all(pollId);
    
    
    res.json({ success: true, results, message: 'Vote recorded' });
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// GET /api/forum-actions/notifications - Get user notifications
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const notifications = db.prepare(`
      SELECT 
        n.*,
        t.title as topic_title,
        t.slug as topic_slug,
        u.username as from_username,
        u.minecraft_uuid as from_user_uuid
      FROM forum_notifications n
      LEFT JOIN forum_topics t ON n.topic_id = t.id
      LEFT JOIN users u ON n.from_user_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, limit, offset);
    
    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM forum_notifications
      WHERE user_id = ? AND read = 0
    `).get(req.user.id).count;
    
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM forum_notifications WHERE user_id = ?
    `).get(req.user.id).count;
    
    
    res.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/forum-actions/notifications/:id/read - Mark notification as read
router.post('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    const notificationId = parseInt(req.params.id);
    
    db.prepare(`
      UPDATE forum_notifications SET read = 1 WHERE id = ? AND user_id = ?
    `).run(notificationId, req.user.id);
    
    
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/forum-actions/notifications/read-all - Mark all notifications as read
router.post('/notifications/read-all', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    db.prepare(`
      UPDATE forum_notifications SET read = 1 WHERE user_id = ?
    `).run(req.user.id);
    
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// GET /api/forum-actions/user-stats - Get user's forum statistics
router.get('/user-stats', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    const topicsCount = db.prepare(`
      SELECT COUNT(*) as count FROM forum_topics WHERE user_id = ?
    `).get(req.user.id).count;
    
    const postsCount = db.prepare(`
      SELECT COUNT(*) as count FROM forum_posts WHERE user_id = ? AND deleted = 0
    `).get(req.user.id).count;
    
    const subscriptionsCount = db.prepare(`
      SELECT COUNT(*) as count FROM forum_subscriptions WHERE user_id = ?
    `).get(req.user.id).count;
    
    const bookmarksCount = db.prepare(`
      SELECT COUNT(*) as count FROM forum_bookmarks WHERE user_id = ?
    `).get(req.user.id).count;
    
    const warningsCount = db.prepare(`
      SELECT COUNT(*) as count FROM forum_warnings WHERE user_id = ? AND active = 1
    `).get(req.user.id).count;
    
    const recentTopics = db.prepare(`
      SELECT t.*, f.name as forum_name
      FROM forum_topics t
      JOIN forums f ON t.forum_id = f.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT 5
    `).all(req.user.id);
    
    
    res.json({
      topicsCount,
      postsCount,
      subscriptionsCount,
      bookmarksCount,
      warningsCount,
      recentTopics
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;
