const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { authenticateToken, optionalAuth, verifyToken } = require('../middleware/auth');
const { awardReputation } = require('../services/reputation');
const { cacheMiddleware, clearCache } = require('../middleware/cache');
const { parseBBCode } = require('../utils/bbcode');
const { validateTopicCreation, validatePostContent, validateId, validateSearch } = require('../middleware/validation');
const logger = require('../utils/logger');
// Helper function to generate slug
function generateSlug(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now()
  );
}

// Helper: permissions to post in a forum
function canUserPostInForum(db, userId, forumId, userRole) {
  if (userRole === 'admin') return true;

  const forum = db.prepare('SELECT locked, name FROM forums WHERE id = ?').get(forumId);
  if (!forum) return false;
  if (forum.locked === 1) return false;

  if (forum.name === 'Announcements') {
    const isModerator = db
      .prepare(`
        SELECT COUNT(*) as count FROM user_group_memberships ugm
        JOIN user_groups ug ON ugm.group_id = ug.id
        WHERE ugm.user_id = ? AND (ug.is_moderator = 1 OR ug.is_admin = 1)
      `)
      .get(userId)?.count > 0;
    return isModerator;
  }

  const permission = db
    .prepare(`
      SELECT can_post_topics FROM forum_permissions
      WHERE forum_id = ? AND group_id IN (
        SELECT group_id FROM user_group_memberships WHERE user_id = ?
      )
      ORDER BY can_post_topics DESC
      LIMIT 1
    `)
    .get(forumId, userId);
  return permission ? permission.can_post_topics === 1 : true;
}

// GET /api/forum - categories with forums
router.get('/', cacheMiddleware(60), async (req, res) => {
  try {
    const db = getDatabase();
    const categories = db.prepare(`
      SELECT * FROM forum_categories 
      ORDER BY order_index ASC, id ASC
    `).all();

    const forums = db.prepare(`
      SELECT 
        f.*,
        u.username as last_post_username,
        u.minecraft_uuid as last_post_user_uuid,
        t.title as last_post_topic_title,
        t.slug as last_post_topic_slug,
        f.last_post_time
      FROM forums f
      LEFT JOIN users u ON f.last_post_user_id = u.id
      LEFT JOIN forum_topics t ON f.last_post_topic_id = t.id
      ORDER BY f.order_index ASC, f.id ASC
    `).all();

    const categoriesWithForums = categories.map(c => ({
      ...c,
      forums: forums.filter(f => f.category_id === c.id)
    }));

    res.json(categoriesWithForums);
  } catch (error) {
    logger.error('Error fetching forum structure:', error);
    res.status(500).json({ error: 'Failed to fetch forums' });
  }
});

// GET /api/forum/forum/:id - forum details with topics (paged)
router.get('/forum/:id', optionalAuth, cacheMiddleware(45), async (req, res) => {
  try {
    const db = getDatabase();
    const forumId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const forum = db.prepare(`
      SELECT f.*, fc.name as category_name
      FROM forums f
      JOIN forum_categories fc ON f.category_id = fc.id
      WHERE f.id = ?
    `).get(forumId);
    if (!forum) return res.status(404).json({ error: 'Forum not found' });

    const topics = db.prepare(`
      SELECT 
        t.*,
        u.username as author_username,
        u.minecraft_uuid as author_uuid,
        lu.username as last_post_username,
        lu.minecraft_uuid as last_post_user_uuid
      FROM forum_topics t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users lu ON t.last_post_user_id = lu.id
      WHERE t.forum_id = ?
      ORDER BY t.pinned DESC, t.announcement DESC, t.last_post_time DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(forumId, limit, offset);

    const totalCount = db
      .prepare('SELECT COUNT(*) as count FROM forum_topics WHERE forum_id = ?')
      .get(forumId).count;

    let topicsWithReadStatus = topics;
    if (req.user) {
      topicsWithReadStatus = topics.map(topic => {
        const view = db
          .prepare(`
            SELECT viewed_at, last_post_id FROM forum_topic_views
            WHERE user_id = ? AND topic_id = ?
          `)
          .get(req.user.id, topic.id);
        const hasUnread = view
          ? topic.last_post_id > view.last_post_id || new Date(topic.last_post_time) > new Date(view.viewed_at)
          : topic.replies > 0;
        return { ...topic, hasUnread };
      });
    }

    res.json({
      forum,
      topics: topicsWithReadStatus,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching forum topics:', error);
    res.status(500).json({ error: 'Failed to fetch forum' });
  }
});

// GET /api/forum/topic/:slug - topic with posts (paged)
router.get('/topic/:slug', optionalAuth, cacheMiddleware(30), async (req, res) => {
  try {
    const db = getDatabase();
    const slug = req.params.slug;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    const topic = db.prepare(`
      SELECT 
        t.*,
        u.username as author_username,
        u.minecraft_uuid as author_uuid,
        f.name as forum_name,
        f.id as forum_id,
        fc.name as category_name
      FROM forum_topics t
      JOIN users u ON t.user_id = u.id
      JOIN forums f ON t.forum_id = f.id
      JOIN forum_categories fc ON f.category_id = fc.id
      WHERE t.slug = ?
    `).get(slug);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    db.prepare('UPDATE forum_topics SET views = views + 1 WHERE id = ?').run(topic.id);

    const posts = db.prepare(`
      SELECT 
        p.*,
        u.username,
        u.minecraft_uuid,
        u.role,
        up.bio,
        (SELECT COUNT(*) FROM forum_posts WHERE user_id = u.id) as user_post_count,
        eu.username as edited_by_username,
        (SELECT COUNT(*) FROM post_votes WHERE post_id = p.id AND vote_type = 'up') as upvotes,
        (SELECT COUNT(*) FROM post_votes WHERE post_id = p.id AND vote_type = 'down') as downvotes,
        (SELECT vote_type FROM post_votes WHERE post_id = p.id AND user_id = ?) as user_vote
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN users eu ON p.edited_by = eu.id
      WHERE p.topic_id = ? AND p.deleted = 0
      ORDER BY p.created_at ASC
      LIMIT ? OFFSET ?
    `).all(req.user?.id || null, topic.id, limit, offset);

    const postsWithParsed = posts.map(p => ({ ...p, content_html: parseBBCode(p.content) }));

    const totalCount = db
      .prepare('SELECT COUNT(*) as count FROM forum_posts WHERE topic_id = ? AND deleted = 0')
      .get(topic.id).count;

    // poll (optional)
    let poll = null;
    if (topic.poll_id) {
      poll = db.prepare('SELECT * FROM forum_polls WHERE id = ?').get(topic.poll_id);
      if (poll) {
        poll.options = db
          .prepare('SELECT * FROM forum_poll_options WHERE poll_id = ? ORDER BY order_index')
          .all(poll.id);
        let userVote = null;
        if (req.user) {
          userVote = db
            .prepare('SELECT option_id FROM forum_poll_votes WHERE poll_id = ? AND user_id = ?')
            .get(poll.id, req.user.id);
        }
        poll.userVoted = !!userVote;
        poll.userVote = userVote?.option_id;
      }
    }

    if (req.user) {
      const lastPostId = posts.length > 0 ? posts[posts.length - 1].id : null;
      db.prepare(`
        INSERT INTO forum_topic_views (user_id, topic_id, last_post_id, viewed_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, topic_id)
        DO UPDATE SET last_post_id = ?, viewed_at = CURRENT_TIMESTAMP
      `).run(req.user.id, topic.id, lastPostId, lastPostId);

      const subscription = db
        .prepare('SELECT 1 FROM forum_subscriptions WHERE user_id = ? AND topic_id = ?')
        .get(req.user.id, topic.id);
      topic.isSubscribed = !!subscription;

      const bookmark = db
        .prepare('SELECT 1 FROM forum_bookmarks WHERE user_id = ? AND topic_id = ?')
        .get(req.user.id, topic.id);
      topic.isBookmarked = !!bookmark;
    }

    res.json({
      topic,
      posts: postsWithParsed,
      poll,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching topic:', error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

// POST /api/forum/forum/:id/topic - create topic
router.post('/forum/:id/topic', verifyToken, validateTopicCreation, async (req, res) => {
  try {
    const db = getDatabase();
    const forumId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { title, content, poll } = req.body;

    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    const forum = db.prepare('SELECT * FROM forums WHERE id = ?').get(forumId);
    if (!forum) return res.status(404).json({ error: 'Forum not found' });
    if (forum.locked && req.user.role !== 'admin') return res.status(403).json({ error: 'This forum is locked' });
    if (!canUserPostInForum(db, userId, forumId, userRole)) return res.status(403).json({ error: 'You do not have permission to post in this forum' });

    const slug = generateSlug(title);
    const topicResult = db
      .prepare('INSERT INTO forum_topics (forum_id, user_id, title, slug) VALUES (?, ?, ?, ?)')
      .run(forumId, userId, title, slug);
    const topicId = topicResult.lastInsertRowid;

    const postResult = db
      .prepare('INSERT INTO forum_posts (topic_id, user_id, content, bbcode_content) VALUES (?, ?, ?, ?)')
      .run(topicId, userId, content, content);
    const postId = postResult.lastInsertRowid;

    db.prepare(`
      UPDATE forum_topics 
      SET last_post_id = ?, last_post_user_id = ?, last_post_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(postId, userId, topicId);

    db.prepare(`
      UPDATE forums 
      SET topics_count = topics_count + 1,
          posts_count = posts_count + 1,
          last_post_id = ?,
          last_post_topic_id = ?,
          last_post_user_id = ?,
          last_post_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(postId, topicId, userId, forumId);

    // Award reputation for creating a topic
    awardReputation(userId, 'TOPIC_CREATED', `Created topic: ${title}`, topicId);
    // Award reputation for creating a post
    awardReputation(userId, 'POST_CREATED', `Posted in topic: ${title}`, postId);

    if (poll && poll.question && poll.options && poll.options.length >= 2) {
      const pollResult = db
        .prepare('INSERT INTO forum_polls (topic_id, question, max_votes, allow_revote, ends_at) VALUES (?, ?, ?, ?, ?)')
        .run(topicId, poll.question, poll.maxVotes || 1, poll.allowRevote ? 1 : 0, poll.endsAt || null);
      const pollId = pollResult.lastInsertRowid;
      const optionStmt = db.prepare('INSERT INTO forum_poll_options (poll_id, option_text, order_index) VALUES (?, ?, ?)');
      poll.options.forEach((opt, idx) => optionStmt.run(pollId, opt, idx));
      db.prepare('UPDATE forum_topics SET poll_id = ? WHERE id = ?').run(pollId, topicId);
    }

    db.prepare('INSERT INTO forum_search_index (post_id, topic_id, user_id, content_text) VALUES (?, ?, ?, ?)')
      .run(postId, topicId, userId, content);

    // Clear cache so new topic appears immediately
    clearCache('/api/forum'); // Clear forum list
    clearCache(`/api/forum/forum/${forumId}`); // Clear specific forum

    res.status(201).json({ success: true, topicId, slug, message: 'Topic created successfully' });
  } catch (error) {
    logger.error('Error creating topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// POST /api/forum/topic/:id/reply - reply to topic
router.post('/topic/:id/reply', verifyToken, validatePostContent, async (req, res) => {
  try {
    const db = getDatabase();
    const topicId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const topic = db
      .prepare(`
        SELECT t.*, f.locked as forum_locked
        FROM forum_topics t
        JOIN forums f ON t.forum_id = f.id
        WHERE t.id = ?
      `)
      .get(topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    if ((topic.locked || topic.forum_locked) && req.user.role !== 'admin') return res.status(403).json({ error: 'This topic is locked' });

    const postResult = db
      .prepare('INSERT INTO forum_posts (topic_id, user_id, content, bbcode_content) VALUES (?, ?, ?, ?)')
      .run(topicId, req.user.id, content, content);
    const postId = postResult.lastInsertRowid;

    db.prepare(`
      UPDATE forum_topics 
      SET replies = replies + 1,
          last_post_id = ?,
          last_post_user_id = ?,
          last_post_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(postId, req.user.id, topicId);

    db.prepare(`
      UPDATE forums 
      SET posts_count = posts_count + 1,
          last_post_id = ?,
          last_post_topic_id = ?,
          last_post_user_id = ?,
          last_post_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(postId, topicId, req.user.id, topic.forum_id);

    db.prepare('INSERT INTO forum_search_index (post_id, topic_id, user_id, content_text) VALUES (?, ?, ?, ?)')
      .run(postId, topicId, req.user.id, content);

    const subscribers = db
      .prepare('SELECT DISTINCT user_id FROM forum_subscriptions WHERE topic_id = ? AND user_id != ?')
      .all(topicId, req.user.id);
    const notifyStmt = db.prepare(
      `INSERT INTO forum_notifications (user_id, type, topic_id, post_id, from_user_id, content)
       VALUES (?, 'reply', ?, ?, ?, ?)`
    );
    subscribers.forEach(s => notifyStmt.run(s.user_id, topicId, postId, req.user.id, `New reply in: ${topic.title}`));

    // Clear cache so new reply appears immediately
    clearCache('/api/forum'); // Clear forum list
    clearCache(`/api/forum/forum/${topic.forum_id}`); // Clear specific forum
    clearCache(`/api/forum/topic/${topic.slug}`); // Clear topic page

    res.status(201).json({ success: true, postId, message: 'Reply posted successfully' });
  } catch (error) {
    logger.error('Error posting reply:', error);
    res.status(500).json({ error: 'Failed to post reply' });
  }
});

// PUT /api/forum/post/:id - edit post
router.put('/post/:id', verifyToken, validatePostContent, async (req, res) => {
  try {
    const db = getDatabase();
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const post = db.prepare('SELECT * FROM forum_posts WHERE id = ?').get(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized to edit this post' });

    db.prepare(`
      UPDATE forum_posts 
      SET content = ?, bbcode_content = ?, edited_by = ?, edited_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(content, content, req.user.id, postId);
    db.prepare('UPDATE forum_search_index SET content_text = ? WHERE post_id = ?').run(content, postId);

    res.json({ success: true, message: 'Post updated successfully' });
  } catch (error) {
    logger.error('Error editing post:', error);
    res.status(500).json({ error: 'Failed to edit post' });
  }
});

// DELETE /api/forum/post/:id - delete post
router.delete('/post/:id', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    const postId = parseInt(req.params.id);
    const post = db
      .prepare(`
        SELECT p.*, t.forum_id, t.id as topic_id 
        FROM forum_posts p
        JOIN forum_topics t ON p.topic_id = t.id
        WHERE p.id = ?
      `)
      .get(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized to delete this post' });
    if (post.deleted === 1) return res.status(400).json({ error: 'Post already deleted' });

    db.prepare('UPDATE forum_posts SET deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(req.user.id, postId);

    db.prepare('UPDATE forum_topics SET replies = CASE WHEN replies > 0 THEN replies - 1 ELSE 0 END WHERE id = ?')
      .run(post.topic_id);
    db.prepare('UPDATE forums SET posts_count = CASE WHEN posts_count > 0 THEN posts_count - 1 ELSE 0 END WHERE id = ?')
      .run(post.forum_id);

    const topicLastPost = db
      .prepare(`
        SELECT id, user_id, created_at
        FROM forum_posts
        WHERE topic_id = ? AND deleted = 0
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .get(post.topic_id);
    if (topicLastPost) {
      db.prepare(`
        UPDATE forum_topics
        SET last_post_id = ?, last_post_user_id = ?, last_post_time = ?
        WHERE id = ?
      `).run(topicLastPost.id, topicLastPost.user_id, topicLastPost.created_at, post.topic_id);
    } else {
      db.prepare(`
        UPDATE forum_topics
        SET last_post_id = NULL, last_post_user_id = NULL, last_post_time = NULL
        WHERE id = ?
      `).run(post.topic_id);
    }

    const forumLastPost = db
      .prepare(`
        SELECT p.id, p.topic_id, p.user_id, p.created_at
        FROM forum_posts p
        JOIN forum_topics t ON p.topic_id = t.id
        WHERE t.forum_id = ? AND p.deleted = 0
        ORDER BY p.created_at DESC
        LIMIT 1
      `)
      .get(post.forum_id);
    if (forumLastPost) {
      db.prepare(`
        UPDATE forums
        SET last_post_id = ?, last_post_topic_id = ?, last_post_user_id = ?, last_post_time = ?
        WHERE id = ?
      `).run(forumLastPost.id, forumLastPost.topic_id, forumLastPost.user_id, forumLastPost.created_at, post.forum_id);
    } else {
      db.prepare(`
        UPDATE forums
        SET last_post_id = NULL, last_post_topic_id = NULL, last_post_user_id = NULL, last_post_time = NULL
        WHERE id = ?
      `).run(post.forum_id);
    }

    // Clear cache so changes appear immediately
    clearCache('/api/forum'); // Clear forum list
    clearCache(`/api/forum/forum/${post.forum_id}`); // Clear specific forum

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// DELETE /api/forum/topic/:id - delete topic
router.delete('/topic/:id', verifyToken, async (req, res) => {
  try {
    const db = getDatabase();
    const topicId = parseInt(req.params.id);
    const topic = db.prepare('SELECT * FROM forum_topics WHERE id = ?').get(topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    if (topic.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized to delete this topic' });

    const postCount = db
      .prepare('SELECT COUNT(*) as count FROM forum_posts WHERE topic_id = ? AND deleted = 0')
      .get(topicId);
    db.prepare('DELETE FROM forum_topics WHERE id = ?').run(topicId);

    db.prepare(`
      UPDATE forums 
      SET topics_count = MAX(0, topics_count - 1),
          posts_count = MAX(0, posts_count - ?)
      WHERE id = ?
    `).run(postCount.count, topic.forum_id);

    const lastPost = db
      .prepare(`
        SELECT p.id, p.topic_id, p.user_id, p.created_at
        FROM forum_posts p
        JOIN forum_topics t ON p.topic_id = t.id
        WHERE t.forum_id = ? AND p.deleted = 0
        ORDER BY p.created_at DESC
        LIMIT 1
      `)
      .get(topic.forum_id);
    if (lastPost) {
      db.prepare(`
        UPDATE forums
        SET last_post_id = ?, last_post_topic_id = ?, last_post_user_id = ?, last_post_time = ?
        WHERE id = ?
      `).run(lastPost.id, lastPost.topic_id, lastPost.user_id, lastPost.created_at, topic.forum_id);
    } else {
      db.prepare(`
        UPDATE forums
        SET last_post_id = NULL, last_post_topic_id = NULL, last_post_user_id = NULL, last_post_time = NULL
        WHERE id = ?
      `).run(topic.forum_id);
    }

    // Clear cache so deletion reflects immediately
    clearCache('/api/forum'); // Clear forum list
    clearCache(`/api/forum/forum/${topic.forum_id}`); // Clear specific forum

    res.json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    logger.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

// GET /api/forum/search - search forums (short cache)
router.get('/search', cacheMiddleware(20), validateSearch, async (req, res) => {
  try {
    const db = getDatabase();
    const { q, forum, author, sortBy = 'relevance' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (!q || q.length < 3) return res.status(400).json({ error: 'Search query must be at least 3 characters' });

    let query = `
      SELECT DISTINCT
        t.id,
        t.title,
        t.slug,
        t.views,
        t.replies,
        t.created_at,
        u.username as author_username,
        u.minecraft_uuid as author_uuid,
        f.name as forum_name,
        f.id as forum_id
      FROM forum_search_index si
      JOIN forum_topics t ON si.topic_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN forums f ON t.forum_id = f.id
      WHERE si.content_text LIKE ?
    `;
    const params = [`%${q}%`];
    if (forum) {
      query += ' AND t.forum_id = ?';
      params.push(parseInt(forum));
    }
    if (author) {
      query += ' AND u.username LIKE ?';
      params.push(`%${author}%`);
    }
    if (sortBy === 'recent') query += ' ORDER BY t.created_at DESC';
    else if (sortBy === 'replies') query += ' ORDER BY t.replies DESC';
    else query += ' ORDER BY t.views DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = db.prepare(query).all(...params);

    let countQuery = `
      SELECT COUNT(DISTINCT t.id) as count
      FROM forum_search_index si
      JOIN forum_topics t ON si.topic_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE si.content_text LIKE ?
    `;
    const countParams = [`%${q}%`];
    if (forum) {
      countQuery += ' AND t.forum_id = ?';
      countParams.push(parseInt(forum));
    }
    if (author) {
      countQuery += ' AND u.username LIKE ?';
      countParams.push(`%${author}%`);
    }
    const totalCount = db.prepare(countQuery).get(...countParams).count;

    res.json({
      results,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error('Error searching forums:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// POST /api/forum/post/:postId/vote - Vote on a post
router.post('/post/:postId/vote', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const { postId } = req.params;
    const { voteType } = req.body; // 'up' or 'down'
    const userId = req.user.id;

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    // Get the post and its author
    const post = db.prepare(`
      SELECT id, user_id, content 
      FROM forum_posts 
      WHERE id = ?
    `).get(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Can't vote on your own posts
    if (post.user_id === userId) {
      return res.status(400).json({ error: 'Cannot vote on your own posts' });
    }

    db.transaction(() => {
      // Check if user has already voted on this post
      const existingVote = db.prepare(`
        SELECT vote_type FROM post_votes 
        WHERE post_id = ? AND user_id = ?
      `).get(postId, userId);

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if clicking same button
          db.prepare('DELETE FROM post_votes WHERE post_id = ? AND user_id = ?')
            .run(postId, userId);
          
          // Update reputation (reverse the previous vote)
          const reputationChange = existingVote.vote_type === 'up' ? -3 : 1;
          awardReputation(post.user_id, reputationChange, `Post vote removed`);
        } else {
          // Change vote type
          db.prepare(`
            UPDATE post_votes 
            SET vote_type = ?, created_at = CURRENT_TIMESTAMP 
            WHERE post_id = ? AND user_id = ?
          `).run(voteType, postId, userId);
          
          // Update reputation (reverse old vote and apply new vote)
          const oldReputationChange = existingVote.vote_type === 'up' ? -3 : 1;
          const newReputationChange = voteType === 'up' ? 3 : -1;
          const totalChange = oldReputationChange + newReputationChange;
          awardReputation(post.user_id, totalChange, `Post vote changed to ${voteType}vote`);
        }
      } else {
        // New vote
        db.prepare(`
          INSERT INTO post_votes (post_id, user_id, vote_type, created_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(postId, userId, voteType);
        
        // Award reputation
        const reputationChange = voteType === 'up' ? 3 : -1;
        awardReputation(post.user_id, reputationChange, `Post ${voteType}voted`);
      }
    })();

    // Get updated vote counts and user's current vote
    const voteCounts = db.prepare(`
      SELECT 
        SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END) as upvotes,
        SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END) as downvotes
      FROM post_votes 
      WHERE post_id = ?
    `).get(postId);

    const userVote = db.prepare(`
      SELECT vote_type FROM post_votes 
      WHERE post_id = ? AND user_id = ?
    `).get(postId, userId);

    res.json({
      upvotes: voteCounts.upvotes || 0,
      downvotes: voteCounts.downvotes || 0,
      user_vote: userVote ? userVote.vote_type : null
    });

  } catch (error) {
    logger.error('Error voting on post:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

module.exports = router;


