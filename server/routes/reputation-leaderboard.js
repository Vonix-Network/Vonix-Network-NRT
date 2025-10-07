const express = require('express');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/reputation/leaderboard - Get top users by reputation
router.get('/leaderboard', (req, res) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const topUsers = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.minecraft_username,
        u.minecraft_uuid,
        u.avatar_url,
        u.reputation,
        u.post_count,
        u.role,
        up.title,
        uas.topics_created,
        uas.posts_created,
        uas.likes_received,
        uas.best_answers
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN user_activity_stats uas ON u.id = uas.user_id
      WHERE u.reputation > 0
      ORDER BY u.reputation DESC, u.post_count DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    // Get total count
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE reputation > 0
    `).get().count;

    // Get reputation tiers
    const getReputationTier = (reputation) => {
      if (reputation >= 5000) return { tier: 'Legend', icon: '💎', color: '#8b5cf6' };
      if (reputation >= 2500) return { tier: 'Expert', icon: '🏆', color: '#f59e0b' };
      if (reputation >= 1000) return { tier: 'Veteran', icon: '🥇', color: '#eab308' };
      if (reputation >= 500) return { tier: 'Respected', icon: '🥈', color: '#6b7280' };
      if (reputation >= 100) return { tier: 'Rising Star', icon: '🥉', color: '#cd7f32' };
      return { tier: 'Newcomer', icon: '🌱', color: '#10b981' };
    };

    // Add tier info to each user
    const usersWithTiers = topUsers.map((user, index) => ({
      ...user,
      rank: offset + index + 1,
      tierInfo: getReputationTier(user.reputation || 0)
    }));

    res.json({
      users: usersWithTiers,
      total: totalCount,
      page: Math.floor(offset / limit) + 1,
      limit: limit,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    logger.error('Error fetching reputation leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/reputation/user/:userId - Get user's reputation details and rank
router.get('/user/:userId', (req, res) => {
  try {
    const db = getDatabase();
    const { userId } = req.params;

    // Get user's reputation and stats
    const user = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.reputation,
        u.post_count
      FROM users u
      WHERE u.id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's rank
    const rank = db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM users
      WHERE reputation > ? OR (reputation = ? AND post_count > ?)
    `).get(user.reputation, user.reputation, user.post_count).rank;

    // Get reputation history
    const history = db.prepare(`
      SELECT action, points, reason, created_at
      FROM user_reputation_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(userId);

    res.json({
      user,
      rank,
      history
    });
  } catch (error) {
    logger.error('Error fetching user reputation:', error);
    res.status(500).json({ error: 'Failed to fetch user reputation' });
  }
});

module.exports = router;
