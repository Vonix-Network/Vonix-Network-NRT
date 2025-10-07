const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile (auth required so we can compute isFollowing)
router.get('/profile/:userId', authenticateToken, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const db = getDatabase();
    
    const user = db.prepare(`
      SELECT u.id, u.username, u.minecraft_username, u.minecraft_uuid, u.created_at,
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
    
    
    res.json({
      ...user,
      followerCount,
      followingCount,
      postCount,
      isFollowing
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { bio, location, website, banner_image } = req.body;
    const db = getDatabase();
    
    // Check if profile exists
    const existing = db.prepare('SELECT user_id FROM user_profiles WHERE user_id = ?').get(req.user.id);
    
    if (existing) {
      db.prepare(`
        UPDATE user_profiles
        SET bio = ?, location = ?, website = ?, banner_image = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(bio, location, website, banner_image, req.user.id);
    } else {
      db.prepare(`
        INSERT INTO user_profiles (user_id, bio, location, website, banner_image)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.user.id, bio, location, website, banner_image);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Create a post
router.post('/posts', authenticateToken, (req, res) => {
  try {
    const { content, image_url } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content is required' });
    }
    
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO posts (user_id, content, image_url)
      VALUES (?, ?, ?)
    `).run(req.user.id, content.trim(), image_url || null);
    
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ success: true, post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get feed (posts from followed users + own posts)
router.get('/feed', authenticateToken, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const db = getDatabase();
    
    const posts = db.prepare(`
      SELECT 
        p.id, p.content, p.image_url, p.created_at, p.updated_at,
        u.id as user_id, u.username, u.minecraft_username, u.minecraft_uuid,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT id FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = ?
      ) OR p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, req.user.id, req.user.id, limit, offset);
    
    
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
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT id FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user?.id || 0, userId, limit, offset);
    
    
    
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
    
    // Allow deletion if user owns the post OR is an admin
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
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
        u.id as user_id, u.username, u.minecraft_username, u.minecraft_uuid
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId);
    
    res.json(comments);
  } catch (error) {
    console.error('Error loading comments:', error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// Add a comment
router.post('/posts/:postId/comments', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { content } = req.body;
    
    if (!content || !content.trim()) {
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
    `).run(postId, req.user.id, content.trim());
    
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
    
    // Allow deletion if user owns the comment OR is an admin
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
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

module.exports = router;
