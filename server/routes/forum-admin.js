const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { verifyToken, isAdmin } = require('../middleware/auth');

// All routes require admin access
router.use(verifyToken, isAdmin);

// GET /api/forum-admin/stats - Get forum statistics
router.get('/stats', async (req, res) => {
  try {
    const db = getDatabase();
    
    const stats = {
      categories: db.prepare('SELECT COUNT(*) as count FROM forum_categories').get().count,
      forums: db.prepare('SELECT COUNT(*) as count FROM forums').get().count,
      topics: db.prepare('SELECT COUNT(*) as count FROM forum_topics').get().count,
      posts: db.prepare('SELECT COUNT(*) as count FROM forum_posts WHERE deleted = 0').get().count,
      users: db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM forum_posts').get().count,
      todayTopics: db.prepare(`
        SELECT COUNT(*) as count FROM forum_topics 
        WHERE DATE(created_at) = DATE('now')
      `).get().count,
      todayPosts: db.prepare(`
        SELECT COUNT(*) as count FROM forum_posts 
        WHERE DATE(created_at) = DATE('now') AND deleted = 0
      `).get().count,
      activeUsers: db.prepare(`
        SELECT COUNT(DISTINCT user_id) as count FROM forum_posts
        WHERE created_at >= datetime('now', '-7 days')
      `).get().count,
      totalViews: db.prepare('SELECT SUM(views) as total FROM forum_topics').get().total || 0
    };
    
    // Most active forums
    const activeForums = db.prepare(`
      SELECT f.*, fc.name as category_name
      FROM forums f
      JOIN forum_categories fc ON f.category_id = fc.id
      ORDER BY f.posts_count DESC
      LIMIT 5
    `).all();
    
    // Recent activity
    const recentTopics = db.prepare(`
      SELECT t.*, u.username, f.name as forum_name
      FROM forum_topics t
      JOIN users u ON t.user_id = u.id
      JOIN forums f ON t.forum_id = f.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `).all();
    
    res.json({
      stats,
      activeForums,
      recentTopics
    });
  } catch (error) {
    console.error('Error fetching forum stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ========================================
// CATEGORY MANAGEMENT
// ========================================

// GET /api/forum-admin/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    const db = getDatabase();
    
    const categories = db.prepare(`
      SELECT 
        c.*,
        COUNT(f.id) as forums_count
      FROM forum_categories c
      LEFT JOIN forums f ON c.id = f.category_id
      GROUP BY c.id
      ORDER BY c.order_index ASC
    `).all();
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/forum-admin/categories - Create category
router.post('/categories', async (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, orderIndex } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = db.prepare(`
      INSERT INTO forum_categories (name, description, order_index)
      VALUES (?, ?, ?)
    `).run(name, description || null, orderIndex || 0);
    
    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/forum-admin/categories/:id - Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const categoryId = parseInt(req.params.id);
    const { name, description, orderIndex } = req.body;
    
    db.prepare(`
      UPDATE forum_categories 
      SET name = ?, description = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, orderIndex, categoryId);
    
    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/forum-admin/categories/:id - Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const categoryId = parseInt(req.params.id);
    
    // Check if category has forums
    const forumCount = db.prepare(`
      SELECT COUNT(*) as count FROM forums WHERE category_id = ?
    `).get(categoryId).count;
    
    if (forumCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with forums' });
    }
    
    db.prepare('DELETE FROM forum_categories WHERE id = ?').run(categoryId);
    
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ========================================
// FORUM MANAGEMENT
// ========================================

// GET /api/forum-admin/forums - Get all forums
router.get('/forums', async (req, res) => {
  try {
    const db = getDatabase();
    
    const forums = db.prepare(`
      SELECT f.*, fc.name as category_name
      FROM forums f
      JOIN forum_categories fc ON f.category_id = fc.id
      ORDER BY fc.order_index, f.order_index
    `).all();
    
    res.json(forums);
  } catch (error) {
    console.error('Error fetching forums:', error);
    res.status(500).json({ error: 'Failed to fetch forums' });
  }
});

// POST /api/forum-admin/forums - Create forum
router.post('/forums', async (req, res) => {
  try {
    const db = getDatabase();
    const { categoryId, name, description, icon, orderIndex, locked } = req.body;
    
    if (!name || !categoryId) {
      return res.status(400).json({ error: 'Name and category are required' });
    }
    
    const result = db.prepare(`
      INSERT INTO forums (category_id, name, description, icon, order_index, locked)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(categoryId, name, description || null, icon || null, orderIndex || 0, locked ? 1 : 0);
    
    
    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating forum:', error);
    res.status(500).json({ error: 'Failed to create forum' });
  }
});

// PUT /api/forum-admin/forums/:id - Update forum
router.put('/forums/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const forumId = parseInt(req.params.id);
    const { categoryId, name, description, icon, orderIndex, locked } = req.body;
    
    db.prepare(`
      UPDATE forums 
      SET category_id = ?, name = ?, description = ?, icon = ?, 
          order_index = ?, locked = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(categoryId, name, description, icon, orderIndex, locked ? 1 : 0, forumId);
    
    res.json({ success: true, message: 'Forum updated' });
  } catch (error) {
    console.error('Error updating forum:', error);
    res.status(500).json({ error: 'Failed to update forum' });
  }
});

// DELETE /api/forum-admin/forums/:id - Delete forum
router.delete('/forums/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const forumId = parseInt(req.params.id);
    
    // Check if forum has topics
    const topicCount = db.prepare(`
      SELECT COUNT(*) as count FROM forum_topics WHERE forum_id = ?
    `).get(forumId).count;
    
    if (topicCount > 0 && !req.body.force) {
      return res.status(400).json({ 
        error: 'Forum has topics',
        message: 'Add force=true to delete anyway'
      });
    }
    
    db.prepare('DELETE FROM forums WHERE id = ?').run(forumId);
    
    res.json({ success: true, message: 'Forum deleted' });
  } catch (error) {
    console.error('Error deleting forum:', error);
    res.status(500).json({ error: 'Failed to delete forum' });
  }
});

// ========================================
// USER GROUPS MANAGEMENT
// ========================================

// GET /api/forum-admin/groups - Get all user groups
router.get('/groups', async (req, res) => {
  try {
    const db = getDatabase();
    
    const groups = db.prepare(`
      SELECT 
        g.*,
        COUNT(m.user_id) as members_count
      FROM user_groups g
      LEFT JOIN user_group_memberships m ON g.id = m.group_id
      GROUP BY g.id
      ORDER BY g.is_admin DESC, g.is_moderator DESC, g.name
    `).all();
    
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// POST /api/forum-admin/groups - Create user group
router.post('/groups', async (req, res) => {
  try {
    const db = getDatabase();
    const {
      name, description, color, isModerator, isAdmin,
      canModerate, canEditPosts, canDeletePosts,
      canLockTopics, canPinTopics, canMoveTopics, canBanUsers
    } = req.body;
    
    if (!name) {
      
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = db.prepare(`
      INSERT INTO user_groups (
        name, description, color, is_moderator, is_admin,
        can_moderate, can_edit_posts, can_delete_posts,
        can_lock_topics, can_pin_topics, can_move_topics, can_ban_users
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, description || null, color || null,
      isModerator ? 1 : 0, isAdmin ? 1 : 0,
      canModerate ? 1 : 0, canEditPosts ? 1 : 0, canDeletePosts ? 1 : 0,
      canLockTopics ? 1 : 0, canPinTopics ? 1 : 0, canMoveTopics ? 1 : 0, canBanUsers ? 1 : 0
    );
    
    
    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// PUT /api/forum-admin/groups/:id - Update user group
router.put('/groups/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const groupId = parseInt(req.params.id);
    const {
      name, description, color, isModerator, isAdmin,
      canModerate, canEditPosts, canDeletePosts,
      canLockTopics, canPinTopics, canMoveTopics, canBanUsers
    } = req.body;
    
    db.prepare(`
      UPDATE user_groups 
      SET name = ?, description = ?, color = ?, is_moderator = ?, is_admin = ?,
          can_moderate = ?, can_edit_posts = ?, can_delete_posts = ?,
          can_lock_topics = ?, can_pin_topics = ?, can_move_topics = ?, can_ban_users = ?
      WHERE id = ?
    `).run(
      name, description, color,
      isModerator ? 1 : 0, isAdmin ? 1 : 0,
      canModerate ? 1 : 0, canEditPosts ? 1 : 0, canDeletePosts ? 1 : 0,
      canLockTopics ? 1 : 0, canPinTopics ? 1 : 0, canMoveTopics ? 1 : 0, canBanUsers ? 1 : 0,
      groupId
    );
    
    res.json({ success: true, message: 'Group updated' });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// DELETE /api/forum-admin/groups/:id - Delete user group
router.delete('/groups/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const groupId = parseInt(req.params.id);
    
    db.prepare('DELETE FROM user_groups WHERE id = ?').run(groupId);
    
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// POST /api/forum-admin/users/:userId/groups - Add user to group
router.post('/users/:userId/groups', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = parseInt(req.params.userId);
    const { groupId, isPrimary } = req.body;
    
    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }
    
    // If setting as primary, unset other primary groups
    if (isPrimary) {
      db.prepare(`
        UPDATE user_group_memberships SET is_primary = 0 WHERE user_id = ?
      `).run(userId);
    }
    
    db.prepare(`
      INSERT OR REPLACE INTO user_group_memberships (user_id, group_id, is_primary)
      VALUES (?, ?, ?)
    `).run(userId, groupId, isPrimary ? 1 : 0);
    
    res.json({ success: true, message: 'User added to group' });
  } catch (error) {
    console.error('Error adding user to group:', error);
    res.status(500).json({ error: 'Failed to add user to group' });
  }
});

// DELETE /api/forum-admin/users/:userId/groups/:groupId - Remove user from group
router.delete('/users/:userId/groups/:groupId', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = parseInt(req.params.userId);
    const groupId = parseInt(req.params.groupId);
    
    db.prepare(`
      DELETE FROM user_group_memberships WHERE user_id = ? AND group_id = ?
    `).run(userId, groupId);
    
    res.json({ success: true, message: 'User removed from group' });
  } catch (error) {
    console.error('Error removing user from group:', error);
    res.status(500).json({ error: 'Failed to remove user from group' });
  }
});

// ========================================
// BULK OPERATIONS
// ========================================

// POST /api/forum-admin/bulk/recalculate - Recalculate forum statistics
router.post('/bulk/recalculate', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Recalculate all forum stats
    const forums = db.prepare('SELECT id FROM forums').all();
    
    for (const forum of forums) {
      const topicsCount = db.prepare(`
        SELECT COUNT(*) as count FROM forum_topics WHERE forum_id = ?
      `).get(forum.id).count;
      
      const postsCount = db.prepare(`
        SELECT COUNT(*) as count FROM forum_posts p
        JOIN forum_topics t ON p.topic_id = t.id
        WHERE t.forum_id = ? AND p.deleted = 0
      `).get(forum.id).count;
      
      db.prepare(`
        UPDATE forums SET topics_count = ?, posts_count = ? WHERE id = ?
      `).run(topicsCount, postsCount, forum.id);
    }
    
    // Recalculate topic reply counts
    const topics = db.prepare('SELECT id FROM forum_topics').all();
    
    for (const topic of topics) {
      const repliesCount = db.prepare(`
        SELECT COUNT(*) - 1 as count FROM forum_posts 
        WHERE topic_id = ? AND deleted = 0
      `).get(topic.id).count;
      
      db.prepare(`
        UPDATE forum_topics SET replies = ? WHERE id = ?
      `).run(Math.max(0, repliesCount), topic.id);
    }
    
    res.json({ success: true, message: 'Statistics recalculated' });
  } catch (error) {
    console.error('Error recalculating stats:', error);
    res.status(500).json({ error: 'Failed to recalculate statistics' });
  }
});

// POST /api/forum-admin/bulk/rebuild-search - Rebuild search index
router.post('/bulk/rebuild-search', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Clear existing index
    db.prepare('DELETE FROM forum_search_index').run();
    
    // Rebuild from all posts
    const posts = db.prepare(`
      SELECT p.id, p.topic_id, p.user_id, p.content
      FROM forum_posts p
      WHERE p.deleted = 0
    `).all();
    
    const insertStmt = db.prepare(`
      INSERT INTO forum_search_index (post_id, topic_id, user_id, content_text)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const post of posts) {
      insertStmt.run(post.id, post.topic_id, post.user_id, post.content);
    }
    
    res.json({ success: true, message: 'Search index rebuilt', indexed: posts.length });
  } catch (error) {
    console.error('Error rebuilding search index:', error);
    res.status(500).json({ error: 'Failed to rebuild search index' });
  }
});

// POST /api/forum-admin/bulk/recalculate-stats - Recalculate all forum statistics
router.post('/bulk/recalculate-stats', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get all forums
    const forums = db.prepare('SELECT id FROM forums').all();
    
    for (const forum of forums) {
      // Count non-deleted topics
      const topicsCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM forum_topics 
        WHERE forum_id = ?
      `).get(forum.id).count;
      
      // Count non-deleted posts in this forum
      const postsCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM forum_posts p
        JOIN forum_topics t ON p.topic_id = t.id
        WHERE t.forum_id = ? AND p.deleted = 0
      `).get(forum.id).count;
      
      // Get last post
      const lastPost = db.prepare(`
        SELECT p.id, p.topic_id, p.user_id, p.created_at
        FROM forum_posts p
        JOIN forum_topics t ON p.topic_id = t.id
        WHERE t.forum_id = ? AND p.deleted = 0
        ORDER BY p.created_at DESC
        LIMIT 1
      `).get(forum.id);
      
      // Update forum stats
      if (lastPost) {
        db.prepare(`
          UPDATE forums
          SET topics_count = ?,
              posts_count = ?,
              last_post_id = ?,
              last_post_topic_id = ?,
              last_post_user_id = ?,
              last_post_time = ?
          WHERE id = ?
        `).run(topicsCount, postsCount, lastPost.id, lastPost.topic_id, lastPost.user_id, lastPost.created_at, forum.id);
      } else {
        db.prepare(`
          UPDATE forums
          SET topics_count = ?,
              posts_count = ?,
              last_post_id = NULL,
              last_post_topic_id = NULL,
              last_post_user_id = NULL,
              last_post_time = NULL
          WHERE id = ?
        `).run(topicsCount, postsCount, forum.id);
      }
    }
    
    // Get all topics
    const topics = db.prepare('SELECT id FROM forum_topics').all();
    
    for (const topic of topics) {
      // Count non-deleted posts (excluding first post)
      const repliesCount = db.prepare(`
        SELECT COUNT(*) - 1 as count
        FROM forum_posts
        WHERE topic_id = ? AND deleted = 0
      `).get(topic.id).count;
      
      // Get last post
      const lastPost = db.prepare(`
        SELECT id, user_id, created_at
        FROM forum_posts
        WHERE topic_id = ? AND deleted = 0
        ORDER BY created_at DESC
        LIMIT 1
      `).get(topic.id);
      
      // Update topic stats
      if (lastPost) {
        db.prepare(`
          UPDATE forum_topics
          SET replies = ?,
              last_post_id = ?,
              last_post_user_id = ?,
              last_post_time = ?
          WHERE id = ?
        `).run(Math.max(0, repliesCount), lastPost.id, lastPost.user_id, lastPost.created_at, topic.id);
      } else {
        db.prepare(`
          UPDATE forum_topics
          SET replies = 0,
              last_post_id = NULL,
              last_post_user_id = NULL,
              last_post_time = NULL
          WHERE id = ?
        `).run(topic.id);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Forum statistics recalculated', 
      forumsUpdated: forums.length,
      topicsUpdated: topics.length 
    });
  } catch (error) {
    console.error('Error recalculating statistics:', error);
    res.status(500).json({ error: 'Failed to recalculate statistics' });
  }
});

// ========================================
// MODERATION QUEUE
// ========================================

// GET /api/forum-admin/moderation/queue - Get all topics pending moderation
router.get('/moderation/queue', async (req, res) => {
  try {
    const db = getDatabase();
    
    const topics = db.prepare(`
      SELECT 
        t.*,
        u.username as author_username,
        u.minecraft_uuid as author_uuid,
        f.name as forum_name,
        fc.name as category_name,
        (SELECT content FROM forum_posts WHERE topic_id = t.id ORDER BY created_at ASC LIMIT 1) as first_post_content
      FROM forum_topics t
      JOIN users u ON t.user_id = u.id
      JOIN forums f ON t.forum_id = f.id
      JOIN forum_categories fc ON f.category_id = fc.id
      ORDER BY t.created_at DESC
    `).all();
    
    res.json(topics);
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({ error: 'Failed to fetch moderation queue' });
  }
});

// GET /api/forum-admin/moderation/recent - Get recent topics from all forums
router.get('/moderation/recent', async (req, res) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit) || 50;
    
    const topics = db.prepare(`
      SELECT 
        t.*,
        u.username as author_username,
        u.minecraft_uuid as author_uuid,
        u.role as author_role,
        f.name as forum_name,
        fc.name as category_name,
        (SELECT content FROM forum_posts WHERE topic_id = t.id ORDER BY created_at ASC LIMIT 1) as first_post_content,
        (SELECT COUNT(*) FROM forum_posts WHERE topic_id = t.id AND deleted = 0) - 1 as reply_count
      FROM forum_topics t
      JOIN users u ON t.user_id = u.id
      JOIN forums f ON t.forum_id = f.id
      JOIN forum_categories fc ON f.category_id = fc.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `).all(limit);
    
    
    res.json(topics);
  } catch (error) {
    console.error('Error fetching recent topics:', error);
    res.status(500).json({ error: 'Failed to fetch recent topics' });
  }
});

// ========================================
// FORUM PERMISSIONS MANAGEMENT
// ========================================

// GET /api/forum-admin/permissions/:forumId - Get permissions for a forum
router.get('/permissions/:forumId', async (req, res) => {
  try {
    const db = getDatabase();
    const forumId = parseInt(req.params.forumId);
    
    const permissions = db.prepare(`
      SELECT 
        fp.*,
        ug.name as group_name,
        ug.color as group_color
      FROM forum_permissions fp
      JOIN user_groups ug ON fp.group_id = ug.id
      WHERE fp.forum_id = ?
      ORDER BY ug.is_admin DESC, ug.is_moderator DESC, ug.name
    `).all(forumId);
    
    // Map database column names to frontend expected names
    const mappedPermissions = permissions.map(p => ({
      ...p,
      can_create_topic: p.can_post_topics,
      can_reply: p.can_post_replies
    }));
    
    // Also get all groups for adding new permissions
    const allGroups = db.prepare(`
      SELECT * FROM user_groups 
      ORDER BY is_admin DESC, is_moderator DESC, name
    `).all();
    
    res.json({ permissions: mappedPermissions, allGroups });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// POST /api/forum-admin/permissions - Set forum permissions for a group
router.post('/permissions', async (req, res) => {
  try {
    const db = getDatabase();
    const { forumId, groupId, canView, canCreateTopic, canReply, canEditOwn, canDeleteOwn } = req.body;
    
    if (!forumId || !groupId) {
      return res.status(400).json({ error: 'Forum ID and Group ID are required' });
    }
    
    db.prepare(`
      INSERT OR REPLACE INTO forum_permissions 
      (forum_id, group_id, can_view, can_post_topics, can_post_replies, can_edit_own, can_delete_own)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      forumId, groupId,
      canView ? 1 : 0,
      canCreateTopic ? 1 : 0,
      canReply ? 1 : 0,
      canEditOwn ? 1 : 0,
      canDeleteOwn ? 1 : 0
    );
    
    res.json({ success: true, message: 'Permissions updated' });
  } catch (error) {
    console.error('Error setting permissions:', error);
    res.status(500).json({ error: 'Failed to set permissions' });
  }
});

// DELETE /api/forum-admin/permissions/:forumId/:groupId - Remove forum permissions for a group
router.delete('/permissions/:forumId/:groupId', async (req, res) => {
  try {
    const db = getDatabase();
    const forumId = parseInt(req.params.forumId);
    const groupId = parseInt(req.params.groupId);
    
    db.prepare(`
      DELETE FROM forum_permissions WHERE forum_id = ? AND group_id = ?
    `).run(forumId, groupId);
    
    res.json({ success: true, message: 'Permissions removed' });
  } catch (error) {
    console.error('Error removing permissions:', error);
    res.status(500).json({ error: 'Failed to remove permissions' });
  }
});

module.exports = router;
