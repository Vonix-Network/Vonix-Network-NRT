const express = require('express');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/forum/search - Advanced forum search
router.get('/', (req, res) => {
  const db = getDatabase();
  const { 
    q,           // Search query
    type,        // 'topics', 'posts', 'all'
    forum_id,    // Filter by forum
    user_id,     // Filter by user
    sort,        // 'relevance', 'date', 'replies', 'views'
    page = 1,
    limit = 20
  } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  const searchTerm = `%${q.trim()}%`;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const searchType = type || 'all';

  try {
    let results = {
      topics: [],
      posts: [],
      total_results: 0
    };

    // Search topics
    if (searchType === 'all' || searchType === 'topics') {
      let topicQuery = `
        SELECT ft.id, ft.title, ft.slug, ft.views, ft.replies, ft.created_at,
               ft.pinned, ft.locked, ft.last_post_time,
               u.username as author, u.id as author_id,
               f.name as forum_name, f.id as forum_id
        FROM forum_topics ft
        JOIN users u ON ft.user_id = u.id
        JOIN forums f ON ft.forum_id = f.id
        WHERE (ft.title LIKE ? OR ft.slug LIKE ?)
      `;
      
      const params = [searchTerm, searchTerm];

      if (forum_id) {
        topicQuery += ' AND ft.forum_id = ?';
        params.push(forum_id);
      }

      if (user_id) {
        topicQuery += ' AND ft.user_id = ?';
        params.push(user_id);
      }

      // Sort
      if (sort === 'date') {
        topicQuery += ' ORDER BY ft.created_at DESC';
      } else if (sort === 'replies') {
        topicQuery += ' ORDER BY ft.replies DESC';
      } else if (sort === 'views') {
        topicQuery += ' ORDER BY ft.views DESC';
      } else {
        topicQuery += ' ORDER BY ft.created_at DESC'; // Default
      }

      topicQuery += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      results.topics = db.prepare(topicQuery).all(...params);
    }

    // Search posts
    if (searchType === 'all' || searchType === 'posts') {
      let postQuery = `
        SELECT fp.id, fp.content, fp.created_at,
               ft.id as topic_id, ft.title as topic_title, ft.slug as topic_slug,
               u.username as author, u.id as author_id,
               f.name as forum_name, f.id as forum_id
        FROM forum_posts fp
        JOIN forum_topics ft ON fp.topic_id = ft.id
        JOIN users u ON fp.user_id = u.id
        JOIN forums f ON ft.forum_id = f.id
        WHERE fp.content LIKE ?
      `;

      const params = [searchTerm];

      if (forum_id) {
        postQuery += ' AND f.id = ?';
        params.push(forum_id);
      }

      if (user_id) {
        postQuery += ' AND fp.user_id = ?';
        params.push(user_id);
      }

      postQuery += ' ORDER BY fp.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      results.posts = db.prepare(postQuery).all(...params);
    }

    results.total_results = results.topics.length + results.posts.length;

    res.json(results);
  } catch (error) {
    logger.error('Error searching forum:', error);
    res.status(500).json({ error: 'Failed to search forum' });
  }
});

module.exports = router;
