const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const { validateBlogPost, validateId } = require('../middleware/validation');

const router = express.Router();

// Get all published blog posts (public)
router.get('/', cacheMiddleware(60), async (req, res) => {
  const db = getDatabase();
  const posts = db.prepare(`
    SELECT 
      p.*,
      u.username as author_name
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.published = 1
    ORDER BY p.created_at DESC
  `).all();
  
  res.json(posts);
});

// Get single blog post by slug (public)
router.get('/slug/:slug', cacheMiddleware(120), async (req, res) => {
  const db = getDatabase();
  const post = db.prepare(`
    SELECT 
      p.*,
      u.username as author_name
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.slug = ? AND p.published = 1
  `).get(req.params.slug);
  

  if (!post) {
    return res.status(404).json({ error: 'Blog post not found' });
  }

  res.json(post);
});

// Get all blog posts including drafts (admin only)
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
  const db = getDatabase();
  const posts = db.prepare(`
    SELECT 
      p.*,
      u.username as author_name
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    ORDER BY p.created_at DESC
  `).all();
  
  res.json(posts);
});

// Get single blog post by ID (admin only)
router.get('/admin/:id', authenticateToken, isAdmin, async (req, res) => {
  const db = getDatabase();
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  

  if (!post) {
    return res.status(404).json({ error: 'Blog post not found' });
  }

  res.json(post);
});

// Create blog post (admin only)
router.post('/', authenticateToken, isAdmin, validateBlogPost, (req, res) => {
  const { title, slug, excerpt, content, published, featured_image } = req.body;

  if (!title || !slug || !content) {
    return res.status(400).json({ error: 'Title, slug, and content are required' });
  }

  const db = getDatabase();

  // Check if slug already exists
  const existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(slug);
  if (existing) {
    
    return res.status(400).json({ error: 'A blog post with this slug already exists' });
  }

  const stmt = db.prepare(`
    INSERT INTO blog_posts (title, slug, excerpt, content, author_id, published, featured_image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    title,
    slug,
    excerpt || '',
    content,
    req.user.id,
    published ? 1 : 0,
    featured_image || null
  );

  const newPost = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(result.lastInsertRowid);
  

  res.status(201).json(newPost);
});

// Update blog post (admin only)
router.put('/:id', authenticateToken, isAdmin, validateId, validateBlogPost, (req, res) => {
  const { title, slug, excerpt, content, published, featured_image } = req.body;

  const db = getDatabase();
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);

  if (!post) {
    
    return res.status(404).json({ error: 'Blog post not found' });
  }

  // Check if slug is being changed and if it conflicts
  if (slug && slug !== post.slug) {
    const existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ? AND id != ?').get(slug, req.params.id);
    if (existing) {
      
      return res.status(400).json({ error: 'A blog post with this slug already exists' });
    }
  }

  const stmt = db.prepare(`
    UPDATE blog_posts
    SET title = ?, slug = ?, excerpt = ?, content = ?, published = ?, 
        featured_image = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    title || post.title,
    slug || post.slug,
    excerpt !== undefined ? excerpt : post.excerpt,
    content || post.content,
    published !== undefined ? (published ? 1 : 0) : post.published,
    featured_image !== undefined ? featured_image : post.featured_image,
    req.params.id
  );

  const updatedPost = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  

  res.json(updatedPost);
});

// Delete blog post (admin only)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM blog_posts WHERE id = ?');
  const result = stmt.run(req.params.id);
  

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Blog post not found' });
  }

  res.json({ message: 'Blog post deleted successfully' });
});

module.exports = router;
