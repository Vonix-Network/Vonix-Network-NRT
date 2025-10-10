const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const DOMPurify = require('isomorphic-dompurify');

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

// Validate user ownership or admin privileges
const validateOwnership = (req, res, next) => {
  const { user } = req;
  const resourceUserId = parseInt(req.params.userId || req.body.user_id);
  
  if (user.id !== resourceUserId && user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};

// Rate limiting middleware
const createPostLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Increased from 10 to 15 for more active posting
  message: { error: 'Too many posts created, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const commentLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 comments per windowMs
  message: { error: 'Too many comments created, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const friendRequestLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25, // Reduced from 50 to 25 to prevent spam
  message: { error: 'Too many friend requests sent, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation helpers
const validateErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid input', details: errors.array() });
  }
  next();
};

// Enhanced content sanitization with caching
const contentCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const sanitizeContent = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  // Check cache first
  const cacheKey = `sanitize_${content.substring(0, 50)}_${content.length}`;
  const cached = contentCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.content;
  }
  
  // First pass: Remove dangerous HTML/JS
  let sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // No HTML tags allowed, only BB codes
    ALLOWED_ATTR: []
  });
  
  // Second pass: Additional security measures for BB codes
  sanitized = sanitized
    // Remove javascript: protocols from BB code URLs
    .replace(/\[url[^\]]*javascript:/gi, '[url=blocked:')
    .replace(/\[img[^\]]*javascript:/gi, '[img=blocked:')
    // Remove data: URLs (except safe image types)
    .replace(/\[url[^\]]*data:(?!image\/(png|jpg|jpeg|gif|webp))/gi, '[url=blocked:')
    .replace(/\[img[^\]]*data:(?!image\/(png|jpg|jpeg|gif|webp))/gi, '[img=blocked:')
    // Limit URL length in BB codes to prevent DoS
    .replace(/\[url=([^\]]{200,})\]/gi, '[url=blocked-too-long]')
    .replace(/\[img=([^\]]{200,})\]/gi, '[img=blocked-too-long]')
    // Remove nested BB codes to prevent parsing issues
    .replace(/\[([a-z]+)[^\]]*\[([a-z]+)/gi, '[$1][$2')
    .trim();
    
  // Limit total length
  if (sanitized.length > 2000) {
    sanitized = sanitized.substring(0, 2000);
  }
  
  // Cache the result
  contentCache.set(cacheKey, {
    content: sanitized,
    expires: Date.now() + CACHE_TTL
  });
  
  // Clean old cache entries periodically
  if (contentCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of contentCache.entries()) {
      if (value.expires <= now) {
        contentCache.delete(key);
      }
    }
  }
  
  return sanitized;
};

// Get user profile (auth required so we can compute isFollowing)
router.get('/profile/:userId', authenticateToken, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const db = getDatabase();
    
    const user = db.prepare(`
      SELECT u.id, u.username, u.minecraft_username, u.minecraft_uuid, u.created_at,
             u.total_donated, u.donation_rank_id,
             p.bio, p.location, p.website, p.banner_image
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = ?
    `).get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get follower/following counts
    const followerCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(userId).count;
    const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(userId).count;
    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(userId).count;
    
    // Check if current user follows this user
    const followCheck = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, userId);
    const isFollowing = !!followCheck;
    
    // Check friend status
    const friendCheck = db.prepare(`
      SELECT id FROM friends 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `).get(req.user.id, userId, userId, req.user.id);
    const is_friend = !!friendCheck;
    
    // Check friend request status
    const sentRequest = db.prepare(`
      SELECT id FROM friend_requests 
      WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
    `).get(req.user.id, userId);
    const friend_request_sent = !!sentRequest;
    
    const receivedRequest = db.prepare(`
      SELECT id FROM friend_requests 
      WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
    `).get(userId, req.user.id);
    const friend_request_received = !!receivedRequest;
    
    // Add donation rank information
    let donationRank = null;
    if (user.donation_rank_id) {
      const rank = DONATION_RANKS[user.donation_rank_id.toUpperCase()];
      if (rank) {
        donationRank = rank;
      }
    }

    res.json({
      ...user,
      donation_rank: donationRank,
      followerCount,
      followingCount,
      postCount,
      isFollowing,
      is_friend,
      friend_request_sent,
      friend_request_received
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('location').optional().isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('banner_image').optional().isURL().withMessage('Banner image must be a valid URL'),
  validateErrors
], (req, res) => {
  try {
    const { bio, location, website, banner_image } = req.body;
    const db = getDatabase();
    
    // Sanitize inputs
    const sanitizedBio = sanitizeContent(bio);
    const sanitizedLocation = sanitizeContent(location);
    
    // Check if profile exists
    const existing = db.prepare('SELECT user_id FROM user_profiles WHERE user_id = ?').get(req.user.id);
    
    if (existing) {
      db.prepare(`
        UPDATE user_profiles
        SET bio = ?, location = ?, website = ?, banner_image = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(sanitizedBio, sanitizedLocation, website, banner_image, req.user.id);
    } else {
      db.prepare(`
        INSERT INTO user_profiles (user_id, bio, location, website, banner_image)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.user.id, sanitizedBio, sanitizedLocation, website, banner_image);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Create a post
router.post('/posts', [
  createPostLimit,
  authenticateToken,
  body('content').isLength({ min: 1, max: 2000 }).withMessage('Post content must be between 1 and 2000 characters'),
  body('image_url').optional().isURL().withMessage('Image URL must be valid'),
  validateErrors
], (req, res) => {
  try {
    const { content, image_url } = req.body;
    
    // Sanitize content
    const sanitizedContent = sanitizeContent(content);
    
    if (!sanitizedContent || !sanitizedContent.trim()) {
      return res.status(400).json({ error: 'Post content is required' });
    }
    
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO posts (user_id, content, image_url)
      VALUES (?, ?, ?)
    `).run(req.user.id, sanitizedContent, image_url || null);
    
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ success: true, post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get feed (posts from friends + own posts)
router.get('/feed', authenticateToken, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const db = getDatabase();
    
    const posts = db.prepare(`
      SELECT 
        p.id, p.content, p.image_url, p.created_at, p.updated_at,
        u.id as user_id, u.username, u.minecraft_username, u.minecraft_uuid,
        u.donation_rank_id, dr.name as rank_name, dr.color as rank_color, 
        dr.text_color as rank_text_color, dr.icon as rank_icon, dr.badge as rank_badge, dr.glow as rank_glow,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM post_shares WHERE original_post_id = p.id) as share_count,
        (SELECT id FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN donation_ranks dr ON u.donation_rank_id = dr.id
      WHERE p.user_id IN (
        SELECT CASE WHEN f.user1_id = ? THEN f.user2_id ELSE f.user1_id END
        FROM friends f WHERE f.user1_id = ? OR f.user2_id = ?
      ) OR p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, limit, offset);
    
    // Get reaction counts for each post
    for (let post of posts) {
      const reactions = db.prepare(`
        SELECT reaction_type, COUNT(*) as count
        FROM post_reactions WHERE post_id = ?
        GROUP BY reaction_type
      `).all(post.id);
      
      post.reactions = {};
      reactions.forEach(r => {
        post.reactions[r.reaction_type] = r.count;
      });
      
      // Get user's reactions for this post
      const userReactions = db.prepare(`
        SELECT reaction_type FROM post_reactions 
        WHERE post_id = ? AND user_id = ?
      `).all(post.id, req.user.id);
      
      post.user_reactions = {};
      userReactions.forEach(r => {
        post.user_reactions[r.reaction_type] = true;
      });
      
      // Format donation rank data
      if (post.donation_rank_id && post.rank_name) {
        post.donation_rank = {
          id: String(post.donation_rank_id),
          name: post.rank_name,
          color: post.rank_color,
          textColor: post.rank_text_color,
          icon: post.rank_icon || '',
          badge: post.rank_badge || '',
          glow: Boolean(post.rank_glow)
        };
      }
      
      // Clean up the raw rank fields
      delete post.donation_rank_id;
      delete post.rank_name;
      delete post.rank_color;
      delete post.rank_text_color;
      delete post.rank_icon;
      delete post.rank_badge;
      delete post.rank_glow;
    }
    
    res.json(posts);
  } catch (error) {
    console.error('Error loading feed:', error);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

// Get user's posts
router.get('/posts/user/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const db = getDatabase();
    
    const posts = db.prepare(`
      SELECT 
        p.id, p.content, p.image_url, p.created_at, p.updated_at,
        u.id as user_id, u.username, u.minecraft_username, u.minecraft_uuid,
        u.donation_rank_id, dr.name as rank_name, dr.color as rank_color, 
        dr.text_color as rank_text_color, dr.icon as rank_icon, dr.badge as rank_badge, dr.glow as rank_glow,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT id FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN donation_ranks dr ON u.donation_rank_id = dr.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user?.id || 0, userId, limit, offset);
    
    // Format donation rank data for posts
    for (let post of posts) {
      if (post.donation_rank_id && post.rank_name) {
        post.donation_rank = {
          id: String(post.donation_rank_id),
          name: post.rank_name,
          color: post.rank_color,
          textColor: post.rank_text_color,
          icon: post.rank_icon || '',
          badge: post.rank_badge || '',
          glow: Boolean(post.rank_glow)
        };
      }
      
      // Clean up the raw rank fields
      delete post.donation_rank_id;
      delete post.rank_name;
      delete post.rank_color;
      delete post.rank_text_color;
      delete post.rank_icon;
      delete post.rank_badge;
      delete post.rank_glow;
    }
    
    res.json(posts);
  } catch (error) {
    console.error('Error loading user posts:', error);
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

// Delete a post (own posts or admin can delete any)
router.delete('/posts/:postId', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const db = getDatabase();
    
    const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Allow deletion if user owns the post OR is an admin/moderator
    if (post.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like a post
router.post('/posts/:postId/like', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const db = getDatabase();
    
    // Check if post exists
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if already liked
    const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(req.user.id, postId);
    
    if (existing) {
      // Unlike
      db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
      return res.json({ success: true, liked: false });
    } else {
      // Like
      db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(req.user.id, postId);
      return res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Get comments for a post
router.get('/posts/:postId/comments', (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const db = getDatabase();
    
    const comments = db.prepare(`
      SELECT 
        c.id, c.content, c.created_at,
        u.id as user_id, u.username, u.minecraft_username, u.minecraft_uuid,
        u.donation_rank_id, dr.name as rank_name, dr.color as rank_color, 
        dr.text_color as rank_text_color, dr.icon as rank_icon, dr.badge as rank_badge, dr.glow as rank_glow,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND user_id = ?) > 0 as user_liked
      FROM comments c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN donation_ranks dr ON u.donation_rank_id = dr.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(req.user?.id || 0, postId);
    
    // Format donation rank data for comments
    for (let comment of comments) {
      if (comment.donation_rank_id && comment.rank_name) {
        comment.donation_rank = {
          id: String(comment.donation_rank_id),
          name: comment.rank_name,
          color: comment.rank_color,
          textColor: comment.rank_text_color,
          icon: comment.rank_icon || '',
          badge: comment.rank_badge || '',
          glow: Boolean(comment.rank_glow)
        };
      }
      
      // Clean up the raw rank fields
      delete comment.donation_rank_id;
      delete comment.rank_name;
      delete comment.rank_color;
      delete comment.rank_text_color;
      delete comment.rank_icon;
      delete comment.rank_badge;
      delete comment.rank_glow;
    }
    
    res.json(comments);
  } catch (error) {
    console.error('Error loading comments:', error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// Add a comment
router.post('/posts/:postId/comments', [
  commentLimit,
  authenticateToken,
  param('postId').isInt({ min: 1 }).withMessage('Invalid post ID'),
  body('content').isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
  validateErrors
], (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { content } = req.body;
    
    // Sanitize content
    const sanitizedContent = sanitizeContent(content);
    
    if (!sanitizedContent || !sanitizedContent.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const db = getDatabase();
    
    // Check if post exists
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const result = db.prepare(`
      INSERT INTO comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(postId, req.user.id, sanitizedContent);
    
    const comment = db.prepare(`
      SELECT 
        c.id, c.content, c.created_at,
        u.id as user_id, u.username, u.minecraft_username, u.minecraft_uuid
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);
    
    res.json({ success: true, comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Delete a comment (own comments or admin can delete any)
router.delete('/comments/:commentId', authenticateToken, (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const db = getDatabase();
    
    const comment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Allow deletion if user owns the comment OR is an admin/moderator
    if (comment.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Follow a user
router.post('/follow/:userId', authenticateToken, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    const db = getDatabase();
    
    // Check if target user exists
    const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already following
    const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, targetUserId);
    
    if (existing) {
      // Unfollow
      db.prepare('DELETE FROM follows WHERE id = ?').run(existing.id);
      return res.json({ success: true, following: false });
    } else {
      // Follow
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.id, targetUserId);
      return res.json({ success: true, following: true });
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ error: 'Failed to toggle follow' });
  }
});

// Get followers
router.get('/followers/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const db = getDatabase();
    
    const followers = db.prepare(`
      SELECT u.id, u.username, u.minecraft_username, u.minecraft_uuid
      FROM follows f
      JOIN users u ON u.id = f.follower_id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `).all(userId);
    
    res.json(followers);
  } catch (error) {
    console.error('Error loading followers:', error);
    res.status(500).json({ error: 'Failed to load followers' });
  }
});

// Get following
router.get('/following/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const db = getDatabase();
    
    const following = db.prepare(`
      SELECT u.id, u.username, u.minecraft_username, u.minecraft_uuid
      FROM follows f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `).all(userId);
    
    res.json(following);
  } catch (error) {
    console.error('Error loading following:', error);
    res.status(500).json({ error: 'Failed to load following' });
  }
});

// ========================================
// STORIES ENDPOINTS
// ========================================

// Get stories from friends and own stories
router.get('/stories', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    // Clean up expired stories first
    db.prepare('DELETE FROM stories WHERE expires_at < datetime("now")').run();
    
    const stories = db.prepare(`
      SELECT 
        s.id, s.content, s.background_color, s.created_at, s.expires_at,
        u.id as user_id, u.username, u.minecraft_username, u.minecraft_uuid,
        (SELECT COUNT(*) FROM story_views WHERE story_id = s.id AND user_id = ?) > 0 as viewed
      FROM stories s
      JOIN users u ON u.id = s.user_id
      WHERE s.user_id IN (
        SELECT user2_id FROM friends WHERE user1_id = ?
        UNION
        SELECT user1_id FROM friends WHERE user2_id = ?
      ) OR s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id);
    
    res.json(stories);
  } catch (error) {
    console.error('Error loading stories:', error);
    res.status(500).json({ error: 'Failed to load stories' });
  }
});

// Create a story
router.post('/stories', authenticateToken, (req, res) => {
  try {
    const { content, background_color } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Story content is required' });
    }
    
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO stories (user_id, content, background_color)
      VALUES (?, ?, ?)
    `).run(req.user.id, content.trim(), background_color || '#00d97e');
    
    const story = db.prepare(`
      SELECT 
        s.id, s.content, s.background_color, s.created_at, s.expires_at,
        u.id as user_id, u.username, u.minecraft_username, u.minecraft_uuid
      FROM stories s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);
    
    res.json({ success: true, story });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
});

// ========================================
// FRIENDS ENDPOINTS
// ========================================

// Get friends list
router.get('/friends', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    const friends = db.prepare(`
      SELECT 
        u.id, u.username, u.minecraft_username, u.minecraft_uuid,
        f.created_at as friendship_date
      FROM friends f
      JOIN users u ON (u.id = f.user1_id OR u.id = f.user2_id)
      WHERE (f.user1_id = ? OR f.user2_id = ?) AND u.id != ?
      ORDER BY f.created_at DESC
    `).all(req.user.id, req.user.id, req.user.id);
    
    res.json(friends);
  } catch (error) {
    console.error('Error loading friends:', error);
    res.status(500).json({ error: 'Failed to load friends' });
  }
});

// Get friend requests
router.get('/friend-requests', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    const requests = db.prepare(`
      SELECT 
        fr.id, fr.created_at,
        u.id as sender_id, u.username as sender_username, 
        u.minecraft_username as sender_minecraft_username,
        u.minecraft_uuid as sender_minecraft_uuid
      FROM friend_requests fr
      JOIN users u ON u.id = fr.sender_id
      WHERE fr.receiver_id = ? AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `).all(req.user.id);
    
    res.json(requests);
  } catch (error) {
    console.error('Error loading friend requests:', error);
    res.status(500).json({ error: 'Failed to load friend requests' });
  }
});

// Send friend request
router.post('/friend-request', authenticateToken, (req, res) => {
  try {
    const { user_id } = req.body;
    const targetUserId = parseInt(user_id);
    
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }
    
    const db = getDatabase();
    
    // Check if target user exists
    const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already friends
    const existingFriendship = db.prepare(`
      SELECT id FROM friends 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `).get(req.user.id, targetUserId, targetUserId, req.user.id);
    
    if (existingFriendship) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }
    
    // Check if request already exists
    const existingRequest = db.prepare(`
      SELECT id FROM friend_requests 
      WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
      AND status = 'pending'
    `).get(req.user.id, targetUserId, targetUserId, req.user.id);
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }
    
    // Create friend request
    db.prepare(`
      INSERT INTO friend_requests (sender_id, receiver_id)
      VALUES (?, ?)
    `).run(req.user.id, targetUserId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Respond to friend request by user ID (alternative endpoint)
router.post('/friend-request/respond', authenticateToken, (req, res) => {
  try {
    const { user_id, action } = req.body;
    const senderId = parseInt(user_id);
    
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const db = getDatabase();
    
    // Get the friend request
    const request = db.prepare(`
      SELECT id, sender_id, receiver_id FROM friend_requests 
      WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
    `).get(senderId, req.user.id);
    
    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    
    if (action === 'accept') {
      // Create friendship (ensure user1_id < user2_id for consistency)
      const user1 = Math.min(request.sender_id, request.receiver_id);
      const user2 = Math.max(request.sender_id, request.receiver_id);
      
      db.prepare(`
        INSERT INTO friends (user1_id, user2_id)
        VALUES (?, ?)
      `).run(user1, user2);
    }
    
    // Update request status
    db.prepare(`
      UPDATE friend_requests 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(action === 'accept' ? 'accepted' : 'declined', request.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error responding to friend request:', error);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// Respond to friend request
router.post('/friend-request/:requestId/:action', authenticateToken, (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    const action = req.params.action;
    
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const db = getDatabase();
    
    // Get the friend request
    const request = db.prepare(`
      SELECT sender_id, receiver_id FROM friend_requests 
      WHERE id = ? AND receiver_id = ? AND status = 'pending'
    `).get(requestId, req.user.id);
    
    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    
    if (action === 'accept') {
      // Create friendship (ensure user1_id < user2_id for consistency)
      const user1 = Math.min(request.sender_id, request.receiver_id);
      const user2 = Math.max(request.sender_id, request.receiver_id);
      
      db.prepare(`
        INSERT INTO friends (user1_id, user2_id)
        VALUES (?, ?)
      `).run(user1, user2);
    }
    
    // Update request status
    db.prepare(`
      UPDATE friend_requests 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(action === 'accept' ? 'accepted' : 'declined', requestId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error responding to friend request:', error);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// Get suggested friends
router.get('/suggested-friends', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    // Get users who are not already friends and haven't been sent requests
    const suggestions = db.prepare(`
      SELECT 
        u.id, u.username, u.minecraft_username, u.minecraft_uuid,
        COUNT(DISTINCT CASE
          WHEN f2.user1_id = u.id THEN f2.user2_id
          WHEN f2.user2_id = u.id THEN f2.user1_id
        END) as mutual_friends
      FROM users u
      LEFT JOIN friends f2 ON (
        (f2.user1_id = u.id AND f2.user2_id IN (
          SELECT CASE WHEN f.user1_id = ? THEN f.user2_id ELSE f.user1_id END
          FROM friends f WHERE f.user1_id = ? OR f.user2_id = ?
        )) OR
        (f2.user2_id = u.id AND f2.user1_id IN (
          SELECT CASE WHEN f.user1_id = ? THEN f.user2_id ELSE f.user1_id END
          FROM friends f WHERE f.user1_id = ? OR f.user2_id = ?
        ))
      )
      WHERE u.id != ?
      AND u.id NOT IN (
        SELECT CASE WHEN f.user1_id = ? THEN f.user2_id ELSE f.user1_id END
        FROM friends f WHERE f.user1_id = ? OR f.user2_id = ?
      )
      AND u.id NOT IN (
        SELECT receiver_id FROM friend_requests WHERE sender_id = ? AND status = 'pending'
      )
      AND u.id NOT IN (
        SELECT sender_id FROM friend_requests WHERE receiver_id = ? AND status = 'pending'
      )
      GROUP BY u.id
      ORDER BY mutual_friends DESC, RANDOM()
      LIMIT 10
    `).all(
      req.user.id, req.user.id, req.user.id, 
      req.user.id, req.user.id, req.user.id,
      req.user.id, req.user.id, req.user.id, req.user.id,
      req.user.id, req.user.id
    );
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error loading suggested friends:', error);
    res.status(500).json({ error: 'Failed to load suggested friends' });
  }
});

// ========================================
// GROUPS ENDPOINTS
// ========================================

// Get groups
router.get('/groups', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    const groups = db.prepare(`
      SELECT 
        g.id, g.name, g.description, g.privacy, g.created_at,
        u.username as created_by_username,
        COUNT(gm.user_id) as member_count,
        MAX(CASE WHEN gm.user_id = ? THEN 1 ELSE 0 END) as is_member
      FROM social_groups g
      JOIN users u ON u.id = g.created_by
      LEFT JOIN group_members gm ON gm.group_id = g.id
      WHERE g.privacy = 'public' OR g.id IN (
        SELECT group_id FROM group_members WHERE user_id = ?
      )
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `).all(req.user.id, req.user.id);
    
    res.json(groups);
  } catch (error) {
    console.error('Error loading groups:', error);
    res.status(500).json({ error: 'Failed to load groups' });
  }
});

// Create group
router.post('/groups', authenticateToken, (req, res) => {
  try {
    const { name, description, privacy } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    if (!['public', 'private'].includes(privacy)) {
      return res.status(400).json({ error: 'Invalid privacy setting' });
    }
    
    const db = getDatabase();
    
    const result = db.prepare(`
      INSERT INTO social_groups (name, description, privacy, created_by)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), description || '', privacy, req.user.id);
    
    // Add creator as admin member
    db.prepare(`
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (?, ?, 'admin')
    `).run(result.lastInsertRowid, req.user.id);
    
    res.json({ success: true, group_id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Join group
router.post('/groups/:groupId/join', authenticateToken, (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const db = getDatabase();
    
    // Check if group exists
    const group = db.prepare('SELECT id, privacy FROM social_groups WHERE id = ?').get(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if already a member
    const existingMember = db.prepare(`
      SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
    `).get(groupId, req.user.id);
    
    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }
    
    // For private groups, you might want to add approval logic here
    // For now, allow direct joining of public groups
    if (group.privacy === 'private') {
      return res.status(403).json({ error: 'Cannot join private group without invitation' });
    }
    
    // Add user to group
    db.prepare(`
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (?, ?, 'member')
    `).run(groupId, req.user.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Leave group
router.post('/groups/:groupId/leave', authenticateToken, (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const db = getDatabase();
    
    // Check if user is a member
    const membership = db.prepare(`
      SELECT id, role FROM group_members WHERE group_id = ? AND user_id = ?
    `).get(groupId, req.user.id);
    
    if (!membership) {
      return res.status(400).json({ error: 'Not a member of this group' });
    }
    
    // Don't allow admin to leave if they're the only admin
    if (membership.role === 'admin') {
      const adminCount = db.prepare(`
        SELECT COUNT(*) as count FROM group_members 
        WHERE group_id = ? AND role = 'admin'
      `).get(groupId).count;
      
      if (adminCount === 1) {
        return res.status(400).json({ error: 'Cannot leave group as the only admin' });
      }
    }
    
    // Remove user from group
    db.prepare('DELETE FROM group_members WHERE id = ?').run(membership.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// Get group details
router.get('/groups/:groupId', authenticateToken, (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const db = getDatabase();
    
    const group = db.prepare(`
      SELECT 
        g.id, g.name, g.description, g.privacy, g.created_at,
        u.username as created_by_username,
        COUNT(gm.user_id) as member_count,
        MAX(CASE WHEN gm.user_id = ? THEN gm.role ELSE NULL END) as user_role
      FROM social_groups g
      JOIN users u ON u.id = g.created_by
      LEFT JOIN group_members gm ON gm.group_id = g.id
      WHERE g.id = ?
      GROUP BY g.id
    `).get(req.user.id, groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user can view this group
    if (group.privacy === 'private' && !group.user_role) {
      return res.status(403).json({ error: 'Access denied to private group' });
    }
    
    // Get group members
    const members = db.prepare(`
      SELECT 
        u.id, u.username, u.minecraft_username, u.minecraft_uuid,
        gm.role, gm.joined_at
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ?
      ORDER BY 
        CASE gm.role 
          WHEN 'admin' THEN 1 
          WHEN 'moderator' THEN 2 
          ELSE 3 
        END,
        gm.joined_at ASC
    `).all(groupId);
    
    res.json({
      ...group,
      members,
      is_member: !!group.user_role
    });
  } catch (error) {
    console.error('Error loading group details:', error);
    res.status(500).json({ error: 'Failed to load group details' });
  }
});

// ========================================
// EVENTS ENDPOINTS
// ========================================

// Get events
router.get('/events', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    const events = db.prepare(`
      SELECT 
        e.id, e.title, e.description, e.date, e.location, e.created_at,
        u.username as created_by_username,
        COUNT(ea.user_id) as attendee_count,
        MAX(CASE WHEN ea.user_id = ? THEN 1 ELSE 0 END) as is_attending
      FROM events e
      JOIN users u ON u.id = e.created_by
      LEFT JOIN event_attendees ea ON ea.event_id = e.id AND ea.status = 'attending'
      WHERE e.date >= datetime('now', '-1 day')
      GROUP BY e.id
      ORDER BY e.date ASC
    `).all(req.user.id);
    
    res.json(events);
  } catch (error) {
    console.error('Error loading events:', error);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// Create event
router.post('/events', authenticateToken, (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Event title is required' });
    }
    
    if (!date) {
      return res.status(400).json({ error: 'Event date is required' });
    }
    
    const db = getDatabase();
    
    const result = db.prepare(`
      INSERT INTO events (title, description, date, location, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(title.trim(), description || '', date, location || null, req.user.id);
    
    // Add creator as attending
    db.prepare(`
      INSERT INTO event_attendees (event_id, user_id, status)
      VALUES (?, ?, 'attending')
    `).run(result.lastInsertRowid, req.user.id);
    
    res.json({ success: true, event_id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Join event (attend)
router.post('/events/:eventId/attend', authenticateToken, (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const db = getDatabase();
    
    // Check if event exists
    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check if already attending
    const existingAttendee = db.prepare(`
      SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?
    `).get(eventId, req.user.id);
    
    if (existingAttendee) {
      return res.status(400).json({ error: 'Already attending this event' });
    }
    
    // Add user to event
    db.prepare(`
      INSERT INTO event_attendees (event_id, user_id, status)
      VALUES (?, ?, 'attending')
    `).run(eventId, req.user.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error attending event:', error);
    res.status(500).json({ error: 'Failed to attend event' });
  }
});

// Leave event (unattend)
router.post('/events/:eventId/unattend', authenticateToken, (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const db = getDatabase();
    
    // Check if user is attending
    const attendance = db.prepare(`
      SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?
    `).get(eventId, req.user.id);
    
    if (!attendance) {
      return res.status(400).json({ error: 'Not attending this event' });
    }
    
    // Don't allow creator to unattend their own event
    const event = db.prepare('SELECT created_by FROM events WHERE id = ?').get(eventId);
    if (event && event.created_by === req.user.id) {
      return res.status(400).json({ error: 'Event creator cannot unattend their own event' });
    }
    
    // Remove user from event
    db.prepare('DELETE FROM event_attendees WHERE id = ?').run(attendance.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error unattending event:', error);
    res.status(500).json({ error: 'Failed to unattend event' });
  }
});

// Get event details
router.get('/events/:eventId', authenticateToken, (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const db = getDatabase();
    
    const event = db.prepare(`
      SELECT 
        e.id, e.title, e.description, e.date, e.location, e.created_at,
        u.username as created_by_username,
        COUNT(ea.user_id) as attendee_count,
        MAX(CASE WHEN ea.user_id = ? THEN 1 ELSE 0 END) as is_attending,
        CASE WHEN e.created_by = ? THEN 1 ELSE 0 END as is_creator
      FROM events e
      JOIN users u ON u.id = e.created_by
      LEFT JOIN event_attendees ea ON ea.event_id = e.id AND ea.status = 'attending'
      WHERE e.id = ?
      GROUP BY e.id
    `).get(req.user.id, req.user.id, eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get event attendees
    const attendees = db.prepare(`
      SELECT 
        u.id, u.username, u.minecraft_username, u.minecraft_uuid,
        ea.status, ea.joined_at
      FROM event_attendees ea
      JOIN users u ON u.id = ea.user_id
      WHERE ea.event_id = ?
      ORDER BY ea.joined_at ASC
    `).all(eventId);
    
    res.json({
      ...event,
      attendees
    });
  } catch (error) {
    console.error('Error loading event details:', error);
    res.status(500).json({ error: 'Failed to load event details' });
  }
});

// ========================================
// ENHANCED REACTIONS & COMMENTS
// ========================================

// React to post (extended reactions)
router.post('/posts/:postId/react', [
  authenticateToken,
  param('postId').isInt({ min: 1 }).withMessage('Invalid post ID'),
  body('reaction').isIn(['like', 'love', 'laugh', 'wow', 'sad', 'angry']).withMessage('Invalid reaction type'),
  validateErrors
], (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { reaction } = req.body;
    
    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }
    
    const db = getDatabase();
    
    // Check if post exists
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if user already reacted
    const existing = db.prepare(`
      SELECT id, reaction_type FROM post_reactions 
      WHERE user_id = ? AND post_id = ?
    `).get(req.user.id, postId);
    
    if (existing) {
      if (existing.reaction_type === reaction) {
        // Remove reaction if same
        db.prepare('DELETE FROM post_reactions WHERE id = ?').run(existing.id);
      } else {
        // Update reaction if different
        db.prepare(`
          UPDATE post_reactions SET reaction_type = ?, created_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(reaction, existing.id);
      }
    } else {
      // Add new reaction
      db.prepare(`
        INSERT INTO post_reactions (user_id, post_id, reaction_type)
        VALUES (?, ?, ?)
      `).run(req.user.id, postId, reaction);
    }
    
    // Get updated reaction counts
    const reactions = db.prepare(`
      SELECT reaction_type, COUNT(*) as count
      FROM post_reactions WHERE post_id = ?
      GROUP BY reaction_type
    `).all(postId);
    
    const reactionCounts = {};
    reactions.forEach(r => {
      reactionCounts[r.reaction_type] = r.count;
    });
    
    // Get user's current reactions
    const userReactions = db.prepare(`
      SELECT reaction_type FROM post_reactions 
      WHERE post_id = ? AND user_id = ?
    `).all(postId, req.user.id);
    
    const userReactionMap = {};
    userReactions.forEach(r => {
      userReactionMap[r.reaction_type] = true;
    });
    
    res.json({ 
      success: true, 
      reactions: reactionCounts,
      user_reactions: userReactionMap
    });
  } catch (error) {
    console.error('Error reacting to post:', error);
    res.status(500).json({ error: 'Failed to react to post' });
  }
});

// Like comment
router.post('/comments/:commentId/like', authenticateToken, (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const db = getDatabase();
    
    // Check if comment exists
    const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if already liked
    const existing = db.prepare(`
      SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?
    `).get(req.user.id, commentId);
    
    if (existing) {
      // Unlike
      db.prepare('DELETE FROM comment_likes WHERE id = ?').run(existing.id);
    } else {
      // Like
      db.prepare(`
        INSERT INTO comment_likes (user_id, comment_id)
        VALUES (?, ?)
      `).run(req.user.id, commentId);
    }
    
    // Get updated like count
    const likeCount = db.prepare(`
      SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?
    `).get(commentId).count;
    
    const userLiked = !existing;
    
    res.json({ 
      success: true, 
      like_count: likeCount,
      user_liked: userLiked
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

module.exports = router;
