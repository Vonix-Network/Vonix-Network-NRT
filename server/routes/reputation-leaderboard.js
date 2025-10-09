const express = require('express');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

// Donation rank system constants
const DONATION_RANKS = {
  SUPPORTER: { 
    id: 'supporter', 
    name: 'Supporter', 
    minAmount: 5, 
    color: '#10b981',
    textColor: '#ffffff',
    icon: '🌟',
    badge: 'SUP',
    glow: false
  },
  PATRON: { 
    id: 'patron', 
    name: 'Patron', 
    minAmount: 10, 
    color: '#3b82f6',
    textColor: '#ffffff',
    icon: '💎',
    badge: 'PAT',
    glow: true
  },
  CHAMPION: { 
    id: 'champion', 
    name: 'Champion', 
    minAmount: 15, 
    color: '#8b5cf6',
    textColor: '#ffffff',
    icon: '👑',
    badge: 'CHA',
    glow: true
  },
  LEGEND: { 
    id: 'legend', 
    name: 'Legend', 
    minAmount: 20, 
    color: '#f59e0b',
    textColor: '#000000',
    icon: '🏆',
    badge: 'LEG',
    glow: true
  }
};

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
        u.total_donated,
        u.donation_rank_id,
        up.title,
        -- Calculate real forum engagement metrics
        COALESCE((SELECT COUNT(*) FROM forum_topics WHERE user_id = u.id), 0) as topics_created,
        COALESCE((SELECT COUNT(*) FROM forum_posts WHERE user_id = u.id AND deleted = 0), 0) as posts_created,
        COALESCE((SELECT COUNT(*) FROM post_votes pv 
                  JOIN forum_posts fp ON pv.post_id = fp.id 
                  WHERE fp.user_id = u.id AND pv.vote_type = 'up'), 0) as likes_received,
        COALESCE((SELECT COUNT(*) FROM forum_posts fp
                  JOIN post_votes pv ON fp.id = pv.post_id
                  WHERE fp.user_id = u.id AND pv.vote_type = 'up'
                  GROUP BY fp.user_id), 0) as best_answers,
        -- Calculate total forum engagement score
        (COALESCE((SELECT COUNT(*) FROM forum_topics WHERE user_id = u.id), 0) * 5 +
         COALESCE((SELECT COUNT(*) FROM forum_posts WHERE user_id = u.id AND deleted = 0), 0) * 2 +
         COALESCE((SELECT COUNT(*) FROM post_votes pv 
                   JOIN forum_posts fp ON pv.post_id = fp.id 
                   WHERE fp.user_id = u.id AND pv.vote_type = 'up'), 0)) as forum_engagement_score
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id IS NOT NULL
      ORDER BY u.reputation DESC, forum_engagement_score DESC, u.post_count DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    // Get total count
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE id IS NOT NULL
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

    // Add tier info and donation rank info to each user
    const usersWithTiers = topUsers.map((user, index) => {
      const userWithTier = {
        ...user,
        rank: offset + index + 1,
        tierInfo: getReputationTier(user.reputation || 0)
      };

      // Add donation rank information
      if (user.donation_rank_id) {
        const donationRank = DONATION_RANKS[user.donation_rank_id.toUpperCase()];
        if (donationRank) {
          userWithTier.donation_rank = donationRank;
        }
      }

      return userWithTier;
    });

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
        u.minecraft_username,
        u.reputation,
        u.post_count,
        u.total_donated,
        u.donation_rank_id
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

    // Add donation rank information
    if (user.donation_rank_id) {
      const donationRank = DONATION_RANKS[user.donation_rank_id.toUpperCase()];
      if (donationRank) {
        user.donation_rank = donationRank;
      }
    }

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
