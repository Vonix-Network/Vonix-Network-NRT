const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/admin/analytics/overview - Dashboard overview stats
router.get('/overview', authenticateToken, isAdmin, (req, res) => {
  const db = getDatabase();

  try {
    const stats = {
      users: {
        total: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        new_today: db.prepare("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = DATE('now')").get().count,
        new_week: db.prepare("SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')").get().count,
        new_month: db.prepare("SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-30 days')").get().count,
        active_today: db.prepare("SELECT COUNT(*) as count FROM users WHERE DATE(last_seen_at) = DATE('now')").get().count
      },
      forum: {
        total_topics: db.prepare('SELECT COUNT(*) as count FROM forum_topics').get().count,
        total_posts: db.prepare('SELECT COUNT(*) as count FROM forum_posts').get().count,
        topics_today: db.prepare("SELECT COUNT(*) as count FROM forum_topics WHERE DATE(created_at) = DATE('now')").get().count,
        posts_today: db.prepare("SELECT COUNT(*) as count FROM forum_posts WHERE DATE(created_at) = DATE('now')").get().count,
        topics_week: db.prepare("SELECT COUNT(*) as count FROM forum_topics WHERE created_at >= datetime('now', '-7 days')").get().count,
        posts_week: db.prepare("SELECT COUNT(*) as count FROM forum_posts WHERE created_at >= datetime('now', '-7 days')").get().count
      },
      servers: {
        total: db.prepare('SELECT COUNT(*) as count FROM servers').get().count,
        online: db.prepare("SELECT COUNT(*) as count FROM servers WHERE status = 'online'").get().count
      },
      blog: {
        total_posts: db.prepare('SELECT COUNT(*) as count FROM blog_posts').get().count,
        published: db.prepare('SELECT COUNT(*) as count FROM blog_posts WHERE published = 1').get().count
      },
      registration: {
        total_codes: db.prepare('SELECT COUNT(*) as count FROM registration_codes').get().count,
        used_codes: db.prepare('SELECT COUNT(*) as count FROM registration_codes WHERE used = 1').get().count,
        active_codes: db.prepare("SELECT COUNT(*) as count FROM registration_codes WHERE used = 0 AND expires_at > datetime('now')").get().count
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/admin/analytics/user-activity - User activity over time
router.get('/user-activity', authenticateToken, isAdmin, (req, res) => {
  const db = getDatabase();
  const { period = '30' } = req.query; // days

  try {
    // User registrations over time
    const registrations = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= datetime('now', '-${parseInt(period)} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    // Active users over time (based on last_seen_at)
    const activeUsers = db.prepare(`
      SELECT DATE(last_seen_at) as date, COUNT(*) as count
      FROM users
      WHERE last_seen_at >= datetime('now', '-${parseInt(period)} days')
      GROUP BY DATE(last_seen_at)
      ORDER BY date ASC
    `).all();

    res.json({
      registrations,
      active_users: activeUsers
    });
  } catch (error) {
    logger.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// GET /api/admin/analytics/forum-activity - Forum activity over time
router.get('/forum-activity', authenticateToken, isAdmin, (req, res) => {
  const db = getDatabase();
  const { period = '30' } = req.query; // days

  try {
    // Topics created over time
    const topics = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM forum_topics
      WHERE created_at >= datetime('now', '-${parseInt(period)} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    // Posts created over time
    const posts = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM forum_posts
      WHERE created_at >= datetime('now', '-${parseInt(period)} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    res.json({
      topics,
      posts
    });
  } catch (error) {
    logger.error('Error fetching forum activity:', error);
    res.status(500).json({ error: 'Failed to fetch forum activity' });
  }
});

// GET /api/admin/analytics/top-users - Top users by various metrics
router.get('/top-users', authenticateToken, isAdmin, (req, res) => {
  const db = getDatabase();
  const limit = parseInt(req.query.limit) || 10;

  try {
    const topByReputation = db.prepare(`
      SELECT id, username, reputation, post_count
      FROM users
      ORDER BY reputation DESC
      LIMIT ?
    `).all(limit);

    const topByPosts = db.prepare(`
      SELECT u.id, u.username, COUNT(fp.id) as post_count
      FROM users u
      LEFT JOIN forum_posts fp ON u.id = fp.user_id
      GROUP BY u.id
      ORDER BY post_count DESC
      LIMIT ?
    `).all(limit);

    const topByTopics = db.prepare(`
      SELECT u.id, u.username, COUNT(ft.id) as topic_count
      FROM users u
      LEFT JOIN forum_topics ft ON u.id = ft.user_id
      GROUP BY u.id
      ORDER BY topic_count DESC
      LIMIT ?
    `).all(limit);

    res.json({
      by_reputation: topByReputation,
      by_posts: topByPosts,
      by_topics: topByTopics
    });
  } catch (error) {
    logger.error('Error fetching top users:', error);
    res.status(500).json({ error: 'Failed to fetch top users' });
  }
});

// GET /api/admin/analytics/popular-forums - Most active forums
router.get('/popular-forums', authenticateToken, isAdmin, (req, res) => {
  const db = getDatabase();
  const limit = parseInt(req.query.limit) || 10;

  try {
    const popularForums = db.prepare(`
      SELECT f.id, f.name, f.topics_count, f.posts_count,
             fc.name as category_name
      FROM forums f
      JOIN forum_categories fc ON f.category_id = fc.id
      ORDER BY f.posts_count DESC
      LIMIT ?
    `).all(limit);

    res.json(popularForums);
  } catch (error) {
    logger.error('Error fetching popular forums:', error);
    res.status(500).json({ error: 'Failed to fetch popular forums' });
  }
});

// GET /api/admin/analytics/recent-activity - Recent activity feed
router.get('/recent-activity', authenticateToken, isAdmin, (req, res) => {
  const db = getDatabase();
  const limit = parseInt(req.query.limit) || 20;

  try {
    // Recent user registrations
    const recentUsers = db.prepare(`
      SELECT id, username, created_at, 'user_registered' as type
      FROM users
      ORDER BY created_at DESC
      LIMIT ?
    `).all(Math.floor(limit / 4));

    // Recent topics
    const recentTopics = db.prepare(`
      SELECT ft.id, ft.title, ft.created_at, u.username, 'topic_created' as type
      FROM forum_topics ft
      JOIN users u ON ft.user_id = u.id
      ORDER BY ft.created_at DESC
      LIMIT ?
    `).all(Math.floor(limit / 4));

    // Recent posts
    const recentPosts = db.prepare(`
      SELECT fp.id, fp.content, fp.created_at, u.username, 
             ft.title as topic_title, 'post_created' as type
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      JOIN forum_topics ft ON fp.topic_id = ft.id
      ORDER BY fp.created_at DESC
      LIMIT ?
    `).all(Math.floor(limit / 4));

    // Recent blog posts
    const recentBlogPosts = db.prepare(`
      SELECT bp.id, bp.title, bp.created_at, u.username, 'blog_post_created' as type
      FROM blog_posts bp
      JOIN users u ON bp.author_id = u.id
      ORDER BY bp.created_at DESC
      LIMIT ?
    `).all(Math.floor(limit / 4));

    // Combine and sort by date
    const allActivity = [
      ...recentUsers,
      ...recentTopics,
      ...recentPosts,
      ...recentBlogPosts
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allActivity.slice(0, limit));
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

module.exports = router;
