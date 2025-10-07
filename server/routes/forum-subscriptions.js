const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/forum/subscriptions - Get user's subscriptions
router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();

  try {
    const subscriptions = db.prepare(`
      SELECT fs.id, fs.topic_id, fs.forum_id, fs.notify_replies, 
             fs.email_notifications, fs.subscribed_at,
             ft.title as topic_title, ft.slug as topic_slug,
             f.name as forum_name
      FROM forum_subscriptions fs
      LEFT JOIN forum_topics ft ON fs.topic_id = ft.id
      LEFT JOIN forums f ON fs.forum_id = f.id
      WHERE fs.user_id = ?
      ORDER BY fs.subscribed_at DESC
    `).all(req.user.id);

    res.json(subscriptions);
  } catch (error) {
    logger.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// POST /api/forum/subscriptions/topic/:topicId - Subscribe to topic
router.post('/topic/:topicId', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { topicId } = req.params;
  const { email_notifications = true } = req.body;

  try {
    // Check if already subscribed
    const existing = db.prepare(`
      SELECT id FROM forum_subscriptions 
      WHERE user_id = ? AND topic_id = ?
    `).get(req.user.id, topicId);

    if (existing) {
      return res.status(400).json({ error: 'Already subscribed to this topic' });
    }

    // Create subscription
    db.prepare(`
      INSERT INTO forum_subscriptions 
      (user_id, topic_id, notify_replies, email_notifications)
      VALUES (?, ?, 1, ?)
    `).run(req.user.id, topicId, email_notifications ? 1 : 0);

    logger.info(`✅ User ${req.user.username} subscribed to topic ${topicId}`);
    res.json({ success: true, message: 'Subscribed to topic' });
  } catch (error) {
    logger.error('Error subscribing to topic:', error);
    res.status(500).json({ error: 'Failed to subscribe to topic' });
  }
});

// DELETE /api/forum/subscriptions/topic/:topicId - Unsubscribe from topic
router.delete('/topic/:topicId', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { topicId } = req.params;

  try {
    const result = db.prepare(`
      DELETE FROM forum_subscriptions 
      WHERE user_id = ? AND topic_id = ?
    `).run(req.user.id, topicId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    logger.info(`✅ User ${req.user.username} unsubscribed from topic ${topicId}`);
    res.json({ success: true, message: 'Unsubscribed from topic' });
  } catch (error) {
    logger.error('Error unsubscribing from topic:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// POST /api/forum/subscriptions/forum/:forumId - Subscribe to forum
router.post('/forum/:forumId', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { forumId } = req.params;
  const { email_notifications = true } = req.body;

  try {
    // Check if already subscribed
    const existing = db.prepare(`
      SELECT id FROM forum_subscriptions 
      WHERE user_id = ? AND forum_id = ?
    `).get(req.user.id, forumId);

    if (existing) {
      return res.status(400).json({ error: 'Already subscribed to this forum' });
    }

    // Create subscription
    db.prepare(`
      INSERT INTO forum_subscriptions 
      (user_id, forum_id, notify_replies, email_notifications)
      VALUES (?, ?, 1, ?)
    `).run(req.user.id, forumId, email_notifications ? 1 : 0);

    logger.info(`✅ User ${req.user.username} subscribed to forum ${forumId}`);
    res.json({ success: true, message: 'Subscribed to forum' });
  } catch (error) {
    logger.error('Error subscribing to forum:', error);
    res.status(500).json({ error: 'Failed to subscribe to forum' });
  }
});

// DELETE /api/forum/subscriptions/forum/:forumId - Unsubscribe from forum
router.delete('/forum/:forumId', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { forumId } = req.params;

  try {
    const result = db.prepare(`
      DELETE FROM forum_subscriptions 
      WHERE user_id = ? AND forum_id = ?
    `).run(req.user.id, forumId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    logger.info(`✅ User ${req.user.username} unsubscribed from forum ${forumId}`);
    res.json({ success: true, message: 'Unsubscribed from forum' });
  } catch (error) {
    logger.error('Error unsubscribing from forum:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// PUT /api/forum/subscriptions/:subscriptionId - Update subscription settings
router.put('/:subscriptionId', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { subscriptionId } = req.params;
  const { email_notifications, notify_replies } = req.body;

  try {
    // Verify ownership
    const subscription = db.prepare(`
      SELECT user_id FROM forum_subscriptions WHERE id = ?
    `).get(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update settings
    db.prepare(`
      UPDATE forum_subscriptions 
      SET email_notifications = ?, notify_replies = ?
      WHERE id = ?
    `).run(
      email_notifications !== undefined ? (email_notifications ? 1 : 0) : subscription.email_notifications,
      notify_replies !== undefined ? (notify_replies ? 1 : 0) : subscription.notify_replies,
      subscriptionId
    );

    logger.info(`✅ Subscription ${subscriptionId} settings updated`);
    res.json({ success: true, message: 'Subscription settings updated' });
  } catch (error) {
    logger.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// GET /api/forum/subscriptions/check/:topicId - Check if user is subscribed to topic
router.get('/check/:topicId', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { topicId } = req.params;

  try {
    const subscription = db.prepare(`
      SELECT id, email_notifications, notify_replies 
      FROM forum_subscriptions 
      WHERE user_id = ? AND topic_id = ?
    `).get(req.user.id, topicId);

    res.json({
      subscribed: !!subscription,
      subscription: subscription || null
    });
  } catch (error) {
    logger.error('Error checking subscription:', error);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

module.exports = router;
