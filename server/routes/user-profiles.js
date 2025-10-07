const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/user-profiles/:userId - Get user profile with stats, badges, and achievements
router.get('/:userId', (req, res) => {
  const db = getDatabase();
  const { userId } = req.params;

  try {
    // Get user basic info
    const user = db.prepare(`
      SELECT id, username, email, minecraft_username, minecraft_uuid,
             avatar_url, reputation, post_count, 
             created_at, last_seen_at, role
      FROM users 
      WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get profile details
    const profile = db.prepare(`
      SELECT bio, location, website, banner_image, custom_banner, 
             avatar_border, title
      FROM user_profiles 
      WHERE user_id = ?
    `).get(userId);

    // Get activity stats
    const stats = db.prepare(`
      SELECT topics_created, posts_created, likes_received, likes_given,
             best_answers, days_active, last_post_at, join_date
      FROM user_activity_stats
      WHERE user_id = ?
    `).get(userId);

    // Get badges
    const badges = db.prepare(`
      SELECT badge_type, badge_name, badge_description, badge_icon,
             badge_color, earned_at
      FROM user_badges
      WHERE user_id = ?
      ORDER BY earned_at DESC
    `).all(userId);

    // Get achievements
    const achievements = db.prepare(`
      SELECT achievement_key, achievement_name, achievement_description,
             achievement_icon, achievement_rarity, points, unlocked_at
      FROM user_achievements
      WHERE user_id = ?
      ORDER BY unlocked_at DESC
    `).all(userId);

    // Get follower/following counts
    const followerCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(userId).count;
    const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(userId).count;

    // Flatten the response to match frontend expectations
    res.json({
      id: user.id,
      username: user.username,
      minecraft_username: user.minecraft_username || user.username,
      minecraft_uuid: user.minecraft_uuid,
      email: user.email || null,
      avatar_url: user.avatar_url,
      reputation: user.reputation || 0,
      postCount: user.post_count || 0,
      created_at: user.created_at,
      last_seen_at: user.last_seen_at,
      role: user.role,
      // Profile details
      bio: profile?.bio,
      location: profile?.location,
      website: profile?.website,
      banner_image: profile?.banner_image,
      custom_banner: profile?.custom_banner,
      avatar_border: profile?.avatar_border,
      title: profile?.title,
      // Counts
      followerCount: followerCount,
      followingCount: followingCount,
      isFollowing: false, // TODO: Check if current user follows this user
      // Activity stats
      stats: stats || {
        topics_created: 0,
        posts_created: 0,
        likes_received: 0,
        likes_given: 0,
        best_answers: 0,
        days_active: 0,
        last_post_at: null,
        join_date: user.created_at
      },
      badges: badges || [],
      achievements: achievements || []
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/user-profiles/:userId - Update user profile
router.put('/:userId', authenticateToken, (req, res) => {
  const db = getDatabase();
  const { userId } = req.params;
  const { bio, location, website, banner_image, custom_banner, avatar_border, title } = req.body;

  // Users can only edit their own profile (unless admin)
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to edit this profile' });
  }

  try {
    // Check if profile exists
    const existing = db.prepare('SELECT user_id FROM user_profiles WHERE user_id = ?').get(userId);

    if (existing) {
      // Update existing profile
      db.prepare(`
        UPDATE user_profiles 
        SET bio = ?, location = ?, website = ?, banner_image = ?,
            custom_banner = ?, avatar_border = ?, title = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(bio, location, website, banner_image, custom_banner, avatar_border, title, userId);
    } else {
      // Create new profile
      db.prepare(`
        INSERT INTO user_profiles 
        (user_id, bio, location, website, banner_image, custom_banner, avatar_border, title)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, bio, location, website, banner_image, custom_banner, avatar_border, title);
    }

    logger.info(`✅ Profile updated for user ${userId}`);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/user-profiles/:userId/badges - Award a badge (admin only)
router.post('/:userId/badges', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const db = getDatabase();
  const { userId } = req.params;
  const { badge_type, badge_name, badge_description, badge_icon, badge_color } = req.body;

  try {
    db.prepare(`
      INSERT INTO user_badges 
      (user_id, badge_type, badge_name, badge_description, badge_icon, badge_color)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, badge_type, badge_name, badge_description, badge_icon, badge_color);

    logger.info(`🏆 Badge "${badge_name}" awarded to user ${userId} by admin ${req.user.username}`);
    res.json({ success: true, message: 'Badge awarded successfully' });
  } catch (error) {
    logger.error('Error awarding badge:', error);
    res.status(500).json({ error: 'Failed to award badge' });
  }
});

// POST /api/user-profiles/:userId/achievements - Grant achievement
router.post('/:userId/achievements', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const db = getDatabase();
  const { userId } = req.params;
  const { achievement_key, achievement_name, achievement_description, achievement_icon, achievement_rarity, points } = req.body;

  try {
    db.prepare(`
      INSERT INTO user_achievements 
      (user_id, achievement_key, achievement_name, achievement_description, 
       achievement_icon, achievement_rarity, points)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, achievement_key, achievement_name, achievement_description, 
           achievement_icon, achievement_rarity, points || 0);

    // Update user reputation
    if (points) {
      db.prepare('UPDATE users SET reputation = reputation + ? WHERE id = ?')
        .run(points, userId);
    }

    logger.info(`🏆 Achievement "${achievement_name}" granted to user ${userId}`);
    res.json({ success: true, message: 'Achievement granted successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'User already has this achievement' });
    }
    logger.error('Error granting achievement:', error);
    res.status(500).json({ error: 'Failed to grant achievement' });
  }
});

// GET /api/user-profiles/:userId/activity - Get user activity timeline
router.get('/:userId/activity', (req, res) => {
  const db = getDatabase();
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 20;

  try {
    // Get recent forum posts
    const recentPosts = db.prepare(`
      SELECT fp.id, fp.content, fp.created_at, 
             ft.id as topic_id, ft.title as topic_title, ft.slug as topic_slug
      FROM forum_posts fp
      JOIN forum_topics ft ON fp.topic_id = ft.id
      WHERE fp.user_id = ?
      ORDER BY fp.created_at DESC
      LIMIT ?
    `).all(userId, limit);

    // Get recent topics created
    const recentTopics = db.prepare(`
      SELECT ft.id, ft.title, ft.slug, ft.created_at, ft.replies, ft.views,
             f.name as forum_name
      FROM forum_topics ft
      JOIN forums f ON ft.forum_id = f.id
      WHERE ft.user_id = ?
      ORDER BY ft.created_at DESC
      LIMIT ?
    `).all(userId, limit);

    res.json({
      recent_posts: recentPosts,
      recent_topics: recentTopics
    });
  } catch (error) {
    logger.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

module.exports = router;
