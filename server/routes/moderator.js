const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { authenticateToken, isAdminOrModerator } = require('../middleware/auth');
const logger = require('../utils/logger');

// All moderator routes require authentication and moderator/admin role
router.use(authenticateToken);
router.use(isAdminOrModerator);

// GET /api/moderator/dashboard - Get moderator dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const db = getDatabase();

    // Get moderation statistics with error handling
    const stats = {
      // Forum stats
      totalTopics: 0,
      totalPosts: 0,
      deletedPosts: 0,
      reportedPosts: 0,
      recentTopics: 0,
      recentPosts: 0,
      recentReports: 0,
      totalUsers: 0,
      bannedUsers: 0,
      warnedUsers: 0,
      socialPosts: 0,
      socialReports: 0
    };

    try {
      stats.totalTopics = db.prepare('SELECT COUNT(*) as count FROM forum_topics').get().count;
    } catch (e) { logger.warn('forum_topics table not found'); }

    try {
      stats.totalPosts = db.prepare('SELECT COUNT(*) as count FROM forum_posts WHERE deleted = 0').get().count;
    } catch (e) { logger.warn('forum_posts table not found'); }

    try {
      stats.deletedPosts = db.prepare('SELECT COUNT(*) as count FROM forum_posts WHERE deleted = 1').get().count;
    } catch (e) { logger.warn('forum_posts deleted count failed'); }

    try {
      stats.reportedPosts = db.prepare('SELECT COUNT(*) as count FROM forum_moderation_log WHERE action = ? AND resolved = 0').get('report').count;
    } catch (e) { logger.warn('forum_moderation_log table not found or query failed'); }

    try {
      stats.recentTopics = db.prepare(`
        SELECT COUNT(*) as count FROM forum_topics 
        WHERE created_at > datetime('now', '-24 hours')
      `).get().count;
    } catch (e) { logger.warn('recent topics query failed'); }

    try {
      stats.recentPosts = db.prepare(`
        SELECT COUNT(*) as count FROM forum_posts 
        WHERE created_at > datetime('now', '-24 hours') AND deleted = 0
      `).get().count;
    } catch (e) { logger.warn('recent posts query failed'); }

    try {
      stats.recentReports = db.prepare(`
        SELECT COUNT(*) as count FROM forum_moderation_log 
        WHERE created_at > datetime('now', '-24 hours') AND action = ?
      `).get('report').count;
    } catch (e) { logger.warn('recent reports query failed'); }

    try {
      stats.totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    } catch (e) { logger.warn('users count query failed'); }

    try {
      stats.bannedUsers = db.prepare('SELECT COUNT(*) as count FROM forum_bans WHERE expires_at > datetime("now") OR expires_at IS NULL').get().count;
    } catch (e) { logger.warn('forum_bans table not found'); }

    try {
      stats.warnedUsers = db.prepare('SELECT COUNT(*) as count FROM forum_warnings WHERE created_at > datetime("now", "-30 days")').get().count;
    } catch (e) { logger.warn('forum_warnings table not found'); }

    try {
      stats.socialPosts = db.prepare('SELECT COUNT(*) as count FROM social_posts WHERE deleted = 0').get().count;
    } catch (e) { logger.warn('social_posts table not found'); }

    try {
      stats.socialReports = db.prepare('SELECT COUNT(*) as count FROM social_reports WHERE resolved = 0').get().count;
    } catch (e) { logger.warn('social_reports table not found'); };

    // Get recent moderation actions by this moderator
    let recentActions = [];
    try {
      recentActions = db.prepare(`
        SELECT action, reason, created_at, 
               CASE 
                 WHEN topic_id IS NOT NULL THEN (SELECT title FROM forum_topics WHERE id = topic_id)
                 WHEN post_id IS NOT NULL THEN (SELECT content FROM forum_posts WHERE id = post_id LIMIT 50)
                 ELSE 'N/A'
               END as target_content
        FROM forum_moderation_log 
        WHERE moderator_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `).all(req.user.id);
    } catch (e) {
      logger.warn('Could not fetch recent moderation actions:', e.message);
      recentActions = [];
    }

    res.json({
      success: true,
      stats,
      recentActions,
      moderator: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    });

  } catch (error) {
    logger.error('Error fetching moderator dashboard:', error);
    res.status(500).json({ 
      error: 'Failed to load moderator dashboard',
      details: error.message 
    });
  }
});

// GET /api/moderator/pending-reports - Get pending reports for review
router.get('/pending-reports', async (req, res) => {
  try {
    const db = getDatabase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get pending forum reports
    const forumReports = db.prepare(`
      SELECT 
        fml.id,
        fml.action,
        fml.reason,
        fml.created_at,
        fml.post_id,
        fml.topic_id,
        u.username as reporter_username,
        fp.content as post_content,
        ft.title as topic_title,
        post_author.username as post_author_username
      FROM forum_moderation_log fml
      LEFT JOIN users u ON fml.user_id = u.id
      LEFT JOIN forum_posts fp ON fml.post_id = fp.id
      LEFT JOIN forum_topics ft ON fml.topic_id = ft.id
      LEFT JOIN users post_author ON fp.user_id = post_author.id
      WHERE fml.action = 'report' AND fml.resolved = 0
      ORDER BY fml.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    // Get total count for pagination
    const totalReports = db.prepare(`
      SELECT COUNT(*) as count FROM forum_moderation_log 
      WHERE action = 'report' AND resolved = 0
    `).get().count;

    res.json({
      success: true,
      reports: forumReports,
      pagination: {
        page,
        limit,
        total: totalReports,
        pages: Math.ceil(totalReports / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching pending reports:', error);
    res.status(500).json({ 
      error: 'Failed to load pending reports',
      details: error.message 
    });
  }
});

// POST /api/moderator/resolve-report/:id - Resolve a report
router.post('/resolve-report/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const reportId = parseInt(req.params.id);
    const { action, reason } = req.body; // action: 'dismiss', 'delete_post', 'warn_user', 'ban_user'

    // Get the report details
    const report = db.prepare(`
      SELECT * FROM forum_moderation_log 
      WHERE id = ? AND action = 'report' AND resolved = 0
    `).get(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found or already resolved' });
    }

    // Mark report as resolved
    db.prepare(`
      UPDATE forum_moderation_log 
      SET resolved = 1, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolution_action = ?, resolution_reason = ?
      WHERE id = ?
    `).run(req.user.id, action, reason, reportId);

    // Take action based on moderator decision
    if (action === 'delete_post' && report.post_id) {
      // Soft delete the post
      db.prepare('UPDATE forum_posts SET deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(req.user.id, report.post_id);
      
      // Log the deletion
      db.prepare(`
        INSERT INTO forum_moderation_log (moderator_id, user_id, post_id, action, reason, created_at)
        VALUES (?, ?, ?, 'delete_post', ?, CURRENT_TIMESTAMP)
      `).run(req.user.id, report.user_id, report.post_id, reason);

    } else if (action === 'warn_user' && report.user_id) {
      // Issue a warning
      db.prepare(`
        INSERT INTO forum_warnings (user_id, moderator_id, reason, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).run(report.user_id, req.user.id, reason);

      // Log the warning
      db.prepare(`
        INSERT INTO forum_moderation_log (moderator_id, user_id, action, reason, created_at)
        VALUES (?, ?, 'warn_user', ?, CURRENT_TIMESTAMP)
      `).run(req.user.id, report.user_id, reason);

    } else if (action === 'ban_user' && report.user_id) {
      const { duration } = req.body; // duration in days, null for permanent
      const expiresAt = duration ? `datetime('now', '+${duration} days')` : null;

      // Issue a ban
      db.prepare(`
        INSERT INTO forum_bans (user_id, moderator_id, reason, expires_at, created_at)
        VALUES (?, ?, ?, ${expiresAt ? expiresAt : 'NULL'}, CURRENT_TIMESTAMP)
      `).run(report.user_id, req.user.id, reason);

      // Log the ban
      db.prepare(`
        INSERT INTO forum_moderation_log (moderator_id, user_id, action, reason, created_at)
        VALUES (?, ?, 'ban_user', ?, CURRENT_TIMESTAMP)
      `).run(req.user.id, report.user_id, reason);
    }

    logger.info(`Moderator ${req.user.username} resolved report ${reportId} with action: ${action}`);

    res.json({
      success: true,
      message: `Report resolved with action: ${action}`,
      reportId,
      action
    });

  } catch (error) {
    logger.error('Error resolving report:', error);
    res.status(500).json({ 
      error: 'Failed to resolve report',
      details: error.message 
    });
  }
});

// GET /api/moderator/recent-activity - Get recent moderation activity
router.get('/recent-activity', async (req, res) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit) || 50;

    const activities = db.prepare(`
      SELECT 
        fml.id,
        fml.action,
        fml.reason,
        fml.created_at,
        m.username as moderator_username,
        u.username as target_username,
        CASE 
          WHEN fml.topic_id IS NOT NULL THEN (SELECT title FROM forum_topics WHERE id = fml.topic_id)
          WHEN fml.post_id IS NOT NULL THEN SUBSTR((SELECT content FROM forum_posts WHERE id = fml.post_id), 1, 100) || '...'
          ELSE 'N/A'
        END as target_content
      FROM forum_moderation_log fml
      LEFT JOIN users m ON fml.moderator_id = m.id
      LEFT JOIN users u ON fml.user_id = u.id
      WHERE fml.action != 'report'
      ORDER BY fml.created_at DESC
      LIMIT ?
    `).all(limit);

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      error: 'Failed to load recent activity',
      details: error.message 
    });
  }
});

// GET /api/moderator/user-lookup/:username - Look up user information
router.get('/user-lookup/:username', async (req, res) => {
  try {
    const db = getDatabase();
    const username = req.params.username;

    // Get user info (case-insensitive for regular usernames, case-sensitive for Minecraft usernames)
    const user = db.prepare(`
      SELECT id, username, role, created_at, minecraft_username
      FROM users 
      WHERE LOWER(username) = LOWER(?) OR minecraft_username = ?
    `).get(username, username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's forum activity with error handling
    const forumStats = {
      topicsCreated: 0,
      postsCreated: 0,
      deletedPosts: 0,
      reputation: 0
    };

    try {
      forumStats.topicsCreated = db.prepare('SELECT COUNT(*) as count FROM forum_topics WHERE user_id = ?').get(user.id).count;
    } catch (e) { logger.warn('Could not get topics created count'); }

    try {
      forumStats.postsCreated = db.prepare('SELECT COUNT(*) as count FROM forum_posts WHERE user_id = ? AND deleted = 0').get(user.id).count;
    } catch (e) { logger.warn('Could not get posts created count'); }

    try {
      forumStats.deletedPosts = db.prepare('SELECT COUNT(*) as count FROM forum_posts WHERE user_id = ? AND deleted = 1').get(user.id).count;
    } catch (e) { logger.warn('Could not get deleted posts count'); }

    try {
      forumStats.reputation = db.prepare('SELECT reputation FROM users WHERE id = ?').get(user.id).reputation || 0;
    } catch (e) { logger.warn('Could not get user reputation'); }

    // Get moderation history with error handling
    let moderationHistory = [];
    try {
      moderationHistory = db.prepare(`
        SELECT action, reason, created_at, moderator_id,
               (SELECT username FROM users WHERE id = moderator_id) as moderator_username
        FROM forum_moderation_log 
        WHERE user_id = ? AND action != ?
        ORDER BY created_at DESC
        LIMIT 20
      `).all(user.id, 'report');
    } catch (e) {
      logger.warn('Could not get moderation history');
    }

    // Get active warnings and bans with error handling
    let activeWarnings = [];
    try {
      activeWarnings = db.prepare(`
        SELECT reason, created_at, 
               (SELECT username FROM users WHERE id = moderator_id) as moderator_username
        FROM forum_warnings 
        WHERE user_id = ? AND created_at > datetime('now', '-30 days')
        ORDER BY created_at DESC
      `).all(user.id);
    } catch (e) {
      logger.warn('Could not get active warnings');
    }

    let activeBans = [];
    try {
      activeBans = db.prepare(`
        SELECT reason, created_at, expires_at,
               (SELECT username FROM users WHERE id = moderator_id) as moderator_username
        FROM forum_bans 
        WHERE user_id = ? AND (expires_at > datetime('now') OR expires_at IS NULL)
        ORDER BY created_at DESC
      `).all(user.id);
    } catch (e) {
      logger.warn('Could not get active bans');
    }

    res.json({
      success: true,
      user,
      forumStats,
      moderationHistory,
      activeWarnings,
      activeBans
    });

  } catch (error) {
    logger.error('Error looking up user:', error);
    res.status(500).json({ 
      error: 'Failed to lookup user',
      details: error.message 
    });
  }
});

module.exports = router;
