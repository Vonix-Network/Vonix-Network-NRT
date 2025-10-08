const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware to ensure admin access
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// POST /api/admin/scripts/refresh-user-stats - Refresh all user activity statistics
router.post('/refresh-user-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    logger.info(`Admin ${req.user.username} initiated user stats refresh`);

    let updatedUsers = 0;
    let errors = 0;

    // Get all users
    const users = db.prepare('SELECT id, username FROM users').all();
    
    for (const user of users) {
      try {
        // Calculate real forum statistics
        const topicCount = db.prepare('SELECT COUNT(*) as count FROM forum_topics WHERE user_id = ?').get(user.id).count;
        const postCount = db.prepare('SELECT COUNT(*) as count FROM forum_posts WHERE user_id = ? AND deleted = 0').get(user.id).count;
        const likesReceived = db.prepare(`
          SELECT COUNT(*) as count FROM post_votes pv 
          JOIN forum_posts fp ON pv.post_id = fp.id 
          WHERE fp.user_id = ? AND pv.vote_type = 'up'
        `).get(user.id).count;
        const likesGiven = db.prepare('SELECT COUNT(*) as count FROM post_votes WHERE user_id = ? AND vote_type = \'up\'').get(user.id).count;

        // Calculate best answers (posts with high upvote ratios)
        const bestAnswers = db.prepare(`
          SELECT COUNT(*) as count FROM forum_posts fp
          WHERE fp.user_id = ? AND fp.deleted = 0
          AND (SELECT COUNT(*) FROM post_votes pv WHERE pv.post_id = fp.id AND pv.vote_type = 'up') >= 5
        `).get(user.id).count;

        // Update user post_count
        db.prepare('UPDATE users SET post_count = ? WHERE id = ?').run(postCount, user.id);

        // Update or create activity stats
        db.prepare(`
          INSERT OR REPLACE INTO user_activity_stats 
          (user_id, topics_created, posts_created, likes_received, likes_given, best_answers, days_active, last_post_at, join_date)
          VALUES (?, ?, ?, ?, ?, ?, 
                  COALESCE((SELECT days_active FROM user_activity_stats WHERE user_id = ?), 1),
                  (SELECT MAX(created_at) FROM forum_posts WHERE user_id = ? AND deleted = 0),
                  COALESCE((SELECT join_date FROM user_activity_stats WHERE user_id = ?), datetime('now')))
        `).run(user.id, topicCount, postCount, likesReceived, likesGiven, bestAnswers, user.id, user.id, user.id);

        updatedUsers++;
      } catch (userError) {
        logger.error(`Error updating stats for user ${user.username}:`, userError);
        errors++;
      }
    }

    logger.info(`User stats refresh completed: ${updatedUsers} users updated, ${errors} errors`);

    res.json({
      success: true,
      message: `Successfully refreshed stats for ${updatedUsers} users`,
      details: {
        totalUsers: users.length,
        updated: updatedUsers,
        errors: errors
      }
    });

  } catch (error) {
    logger.error('Error refreshing user stats:', error);
    res.status(500).json({ 
      error: 'Failed to refresh user statistics',
      details: error.message 
    });
  }
});

// POST /api/admin/scripts/cleanup-forum-data - Clean up orphaned forum data
router.post('/cleanup-forum-data', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    logger.info(`Admin ${req.user.username} initiated forum data cleanup`);

    let cleanupResults = {
      orphanedPosts: 0,
      orphanedVotes: 0,
      orphanedNotifications: 0,
      updatedForumCounts: 0
    };

    // Clean up orphaned posts (posts without valid topics)
    const orphanedPosts = db.prepare(`
      DELETE FROM forum_posts 
      WHERE topic_id NOT IN (SELECT id FROM forum_topics)
    `).run();
    cleanupResults.orphanedPosts = orphanedPosts.changes;

    // Clean up orphaned votes (votes on deleted posts)
    const orphanedVotes = db.prepare(`
      DELETE FROM post_votes 
      WHERE post_id NOT IN (SELECT id FROM forum_posts)
    `).run();
    cleanupResults.orphanedVotes = orphanedVotes.changes;

    // Clean up orphaned notifications
    const orphanedNotifications = db.prepare(`
      DELETE FROM forum_notifications 
      WHERE (topic_id IS NOT NULL AND topic_id NOT IN (SELECT id FROM forum_topics))
      OR (post_id IS NOT NULL AND post_id NOT IN (SELECT id FROM forum_posts))
    `).run();
    cleanupResults.orphanedNotifications = orphanedNotifications.changes;

    // Update forum topic and post counts
    const forums = db.prepare('SELECT id FROM forums').all();
    for (const forum of forums) {
      const topicCount = db.prepare('SELECT COUNT(*) as count FROM forum_topics WHERE forum_id = ?').get(forum.id).count;
      const postCount = db.prepare(`
        SELECT COUNT(*) as count FROM forum_posts fp
        JOIN forum_topics ft ON fp.topic_id = ft.id
        WHERE ft.forum_id = ? AND fp.deleted = 0
      `).get(forum.id).count;

      db.prepare(`
        UPDATE forums 
        SET topics_count = ?, posts_count = ?
        WHERE id = ?
      `).run(topicCount, postCount, forum.id);

      cleanupResults.updatedForumCounts++;
    }

    logger.info('Forum data cleanup completed:', cleanupResults);

    res.json({
      success: true,
      message: 'Forum data cleanup completed successfully',
      details: cleanupResults
    });

  } catch (error) {
    logger.error('Error cleaning up forum data:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup forum data',
      details: error.message 
    });
  }
});

// POST /api/admin/scripts/recalculate-reputation - Recalculate all user reputation scores
router.post('/recalculate-reputation', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    logger.info(`Admin ${req.user.username} initiated reputation recalculation`);

    let updatedUsers = 0;

    // Get all users
    const users = db.prepare('SELECT id, username FROM users').all();
    
    for (const user of users) {
      try {
        // Calculate reputation from reputation log
        const totalReputation = db.prepare(`
          SELECT COALESCE(SUM(points), 0) as total 
          FROM user_reputation_log 
          WHERE user_id = ?
        `).get(user.id).total;

        // Update user reputation
        db.prepare('UPDATE users SET reputation = ? WHERE id = ?').run(totalReputation, user.id);
        updatedUsers++;
      } catch (userError) {
        logger.error(`Error recalculating reputation for user ${user.username}:`, userError);
      }
    }

    logger.info(`Reputation recalculation completed: ${updatedUsers} users updated`);

    res.json({
      success: true,
      message: `Successfully recalculated reputation for ${updatedUsers} users`,
      details: {
        totalUsers: users.length,
        updated: updatedUsers
      }
    });

  } catch (error) {
    logger.error('Error recalculating reputation:', error);
    res.status(500).json({ 
      error: 'Failed to recalculate reputation',
      details: error.message 
    });
  }
});

// POST /api/admin/scripts/optimize-database - Run database optimization
router.post('/optimize-database', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    logger.info(`Admin ${req.user.username} initiated database optimization`);

    // Run VACUUM to reclaim space and defragment
    db.exec('VACUUM');
    
    // Analyze tables for better query planning
    db.exec('ANALYZE');
    
    // Update statistics
    db.exec('PRAGMA optimize');

    logger.info('Database optimization completed');

    res.json({
      success: true,
      message: 'Database optimization completed successfully',
      details: {
        operations: ['VACUUM', 'ANALYZE', 'PRAGMA optimize']
      }
    });

  } catch (error) {
    logger.error('Error optimizing database:', error);
    res.status(500).json({ 
      error: 'Failed to optimize database',
      details: error.message 
    });
  }
});

// GET /api/admin/scripts/status - Get system status and statistics
router.get('/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();

    // Get database statistics
    const stats = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      forumTopics: db.prepare('SELECT COUNT(*) as count FROM forum_topics').get().count,
      forumPosts: db.prepare('SELECT COUNT(*) as count FROM forum_posts WHERE deleted = 0').get().count,
      postVotes: db.prepare('SELECT COUNT(*) as count FROM post_votes').get().count,
      blogPosts: db.prepare('SELECT COUNT(*) as count FROM blog_posts').get().count,
      servers: db.prepare('SELECT COUNT(*) as count FROM servers').get().count
    };

    // Get database size (approximate)
    const dbSize = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get().size;

    // Get recent activity
    const recentActivity = {
      recentPosts: db.prepare(`
        SELECT COUNT(*) as count FROM forum_posts 
        WHERE created_at > datetime('now', '-24 hours') AND deleted = 0
      `).get().count,
      recentUsers: db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at > datetime('now', '-7 days')
      `).get().count,
      recentTopics: db.prepare(`
        SELECT COUNT(*) as count FROM forum_topics 
        WHERE created_at > datetime('now', '-24 hours')
      `).get().count
    };

    res.json({
      success: true,
      stats,
      recentActivity,
      database: {
        size: dbSize,
        sizeFormatted: formatBytes(dbSize)
      }
    });

  } catch (error) {
    logger.error('Error getting system status:', error);
    res.status(500).json({ 
      error: 'Failed to get system status',
      details: error.message 
    });
  }
});

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = router;
