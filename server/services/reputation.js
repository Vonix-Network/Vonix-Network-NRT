const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

/**
 * Reputation System Service
 * Handles automatic reputation calculation and awarding
 */

// Reputation point values for different actions
const REPUTATION_VALUES = {
  TOPIC_CREATED: 5,
  POST_CREATED: 2,
  POST_LIKED: 3,
  POST_DISLIKED: -1,
  HELPFUL_ANSWER: 15,
  BEST_ANSWER: 25,
  TOPIC_PINNED: 10,
  POST_REPORTED: -5,
  ACCOUNT_VERIFIED: 10,
  FIRST_POST: 5,
  DAILY_LOGIN: 1,
  WEEKLY_ACTIVE: 5
};

/**
 * Award reputation points to a user
 * @param {number} userId - User ID
 * @param {string} action - Action type (key from REPUTATION_VALUES)
 * @param {string} reason - Human-readable reason
 * @param {number} relatedId - Related post/topic ID (optional)
 */
function awardReputation(userId, action, reason, relatedId = null) {
  const db = getDatabase();
  const points = REPUTATION_VALUES[action];
  
  if (!points) {
    logger.warn(`Unknown reputation action: ${action}`);
    return false;
  }

  try {
    // Update user's total reputation
    db.prepare(`
      UPDATE users 
      SET reputation = reputation + ? 
      WHERE id = ?
    `).run(points, userId);

    // Log the reputation change
    db.prepare(`
      INSERT INTO user_reputation_log (user_id, action, points, reason, related_id, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(userId, action, points, reason, relatedId);

    logger.info(`Awarded ${points} reputation to user ${userId} for ${action}: ${reason}`);
    
    // Check for reputation-based achievements
    checkReputationAchievements(userId);
    
    return true;
  } catch (error) {
    logger.error('Error awarding reputation:', error);
    return false;
  }
}

/**
 * Get user's reputation history
 * @param {number} userId - User ID
 * @param {number} limit - Number of records to return
 */
function getReputationHistory(userId, limit = 50) {
  const db = getDatabase();
  
  try {
    return db.prepare(`
      SELECT action, points, reason, related_id, created_at
      FROM user_reputation_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);
  } catch (error) {
    logger.error('Error fetching reputation history:', error);
    return [];
  }
}

/**
 * Get reputation leaderboard
 * @param {number} limit - Number of users to return
 */
function getReputationLeaderboard(limit = 10) {
  const db = getDatabase();
  
  try {
    return db.prepare(`
      SELECT id, username, reputation, minecraft_uuid
      FROM users
      WHERE reputation > 0
      ORDER BY reputation DESC
      LIMIT ?
    `).all(limit);
  } catch (error) {
    logger.error('Error fetching reputation leaderboard:', error);
    return [];
  }
}

/**
 * Check and award reputation-based achievements
 * @param {number} userId - User ID
 */
function checkReputationAchievements(userId) {
  const db = getDatabase();
  
  try {
    const user = db.prepare('SELECT reputation FROM users WHERE id = ?').get(userId);
    if (!user) return;

    const achievements = [];
    
    // Define reputation milestones
    const milestones = [
      { threshold: 100, badge: 'REPUTATION_100', name: 'Rising Star', description: 'Earned 100 reputation points' },
      { threshold: 500, badge: 'REPUTATION_500', name: 'Respected Member', description: 'Earned 500 reputation points' },
      { threshold: 1000, badge: 'REPUTATION_1000', name: 'Community Veteran', description: 'Earned 1000 reputation points' },
      { threshold: 2500, badge: 'REPUTATION_2500', name: 'Expert Contributor', description: 'Earned 2500 reputation points' },
      { threshold: 5000, badge: 'REPUTATION_5000', name: 'Community Legend', description: 'Earned 5000 reputation points' }
    ];

    for (const milestone of milestones) {
      if (user.reputation >= milestone.threshold) {
        // Check if user already has this badge
        const existingBadge = db.prepare(`
          SELECT id FROM user_badges 
          WHERE user_id = ? AND badge_type = ?
        `).get(userId, milestone.badge);

        if (!existingBadge) {
          // Award the badge
          db.prepare(`
            INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description, badge_icon, badge_color, earned_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).run(userId, milestone.badge, milestone.name, milestone.description, '⭐', '#fbbf24');
          
          achievements.push(milestone);
          logger.info(`Awarded ${milestone.name} badge to user ${userId}`);
        }
      }
    }

    return achievements;
  } catch (error) {
    logger.error('Error checking reputation achievements:', error);
    return [];
  }
}

/**
 * Get reputation tier info for a user
 * @param {number} reputation - User's reputation points
 */
function getReputationTier(reputation) {
  if (reputation >= 5000) return { tier: 'Legend', icon: '💎', color: '#8b5cf6' };
  if (reputation >= 2500) return { tier: 'Expert', icon: '🏆', color: '#f59e0b' };
  if (reputation >= 1000) return { tier: 'Veteran', icon: '🥇', color: '#eab308' };
  if (reputation >= 500) return { tier: 'Respected', icon: '🥈', color: '#6b7280' };
  if (reputation >= 100) return { tier: 'Rising Star', icon: '🥉', color: '#cd7f32' };
  return { tier: 'Newcomer', icon: '🌱', color: '#10b981' };
}

/**
 * Auto-award reputation for forum actions
 */
function setupReputationTriggers() {
  // This would be called from forum action routes
  logger.info('Reputation system initialized');
}

module.exports = {
  awardReputation,
  getReputationHistory,
  getReputationLeaderboard,
  getReputationTier,
  checkReputationAchievements,
  setupReputationTriggers,
  REPUTATION_VALUES
};
