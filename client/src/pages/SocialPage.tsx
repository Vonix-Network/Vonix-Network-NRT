import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './SocialPage.css';

interface User {
  id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
}

interface Post {
  id: number;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  like_count: number;
  comment_count: number;
  user_liked: number | null;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
}

const SocialPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadFeed();
  }, [user, navigate]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const response = await api.get('/social/feed');
      setPosts(response.data);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || posting) return;

    setPosting(true);
    try {
      await api.post('/social/posts', { content: newPostContent });
      setNewPostContent('');
      await loadFeed();
    } catch (error: any) {
      console.error('Error creating post:', error);
      alert(error.response?.data?.error || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId: number) => {
    try {
      const response = await api.post(`/social/posts/${postId}/like`);
      setPosts(posts.map(p => 
        p.id === postId
          ? { ...p, user_liked: response.data.liked ? 1 : null, like_count: p.like_count + (response.data.liked ? 1 : -1) }
          : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const deletePost = async (postId: number) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/social/posts/${postId}`);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(error.response?.data?.error || 'Failed to delete post');
    }
  };

  const deleteComment = async (postId: number, commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/social/comments/${commentId}`);
      setComments({
        ...comments,
        [postId]: comments[postId].filter(c => c.id !== commentId)
      });
      // Update comment count on post
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, comment_count: p.comment_count - 1 } : p
      ));
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      alert(error.response?.data?.error || 'Failed to delete comment');
    }
  };

  const toggleComments = async (postId: number) => {
    if (expandedComments.includes(postId)) {
      setExpandedComments(expandedComments.filter(id => id !== postId));
    } else {
      setExpandedComments([...expandedComments, postId]);
      if (!comments[postId]) {
        await loadComments(postId);
      }
    }
  };

  const loadComments = async (postId: number) => {
    try {
      const response = await api.get(`/social/posts/${postId}/comments`);
      setComments({ ...comments, [postId]: response.data });
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const addComment = async (postId: number) => {
    const content = newComment[postId]?.trim();
    if (!content) return;

    try {
      const response = await api.post(`/social/posts/${postId}/comments`, { content });
      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), response.data.comment]
      });
      setNewComment({ ...newComment, [postId]: '' });
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getUserAvatar = (u: User | Post | Comment) => {
    if ('minecraft_uuid' in u && u.minecraft_uuid) {
      return `https://crafatar.com/renders/head/${u.minecraft_uuid}`;
    }
    if ('minecraft_username' in u && u.minecraft_username) {
      return `https://mc-heads.net/avatar/${u.minecraft_username}/64`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=6366f1&color=fff`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const parsePostContent = (content: string) => {
    // Parse [img=url] syntax and convert to actual images
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const imgRegex = /\[img=([^\]]+)\]/g;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      // Add text before the image
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Validate URL to prevent XSS
      const url = match[1].trim();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        parts.push(
          <img 
            key={match.index} 
            src={url} 
            alt="Embedded" 
            className="embedded-post-image"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        );
      } else {
        // If invalid URL, show the original text
        parts.push(match[0]);
      }

      lastIndex = imgRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  if (!user) return null;

  return (
    <div className="social-page">
      <div className="social-container">
        <div className="social-sidebar">
          <div className="sidebar-profile">
            <Link to={`/users/${user.id}`} className="sidebar-avatar-link">
              <img src={getUserAvatar(user)} alt={user.username} className="sidebar-avatar" />
            </Link>
            <Link to={`/users/${user.id}`} className="sidebar-username">
              {user.minecraft_username || user.username}
            </Link>
          </div>

          <nav className="sidebar-nav">
            <Link to="/social" className="sidebar-nav-link active">
              <span className="nav-icon">🏠</span>
              Feed
            </Link>
            <Link to={`/users/${user.id}`} className="sidebar-nav-link">
              <span className="nav-icon">👤</span>
              Profile
            </Link>
            <Link to="/messages" className="sidebar-nav-link">
              <span className="nav-icon">💬</span>
              Messages
            </Link>
          </nav>
        </div>

        <div className="social-feed">
          <div className="create-post-card">
            <form onSubmit={createPost}>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind? (Use [img=https://...] to embed images)"
                className="post-textarea"
                rows={3}
                disabled={posting}
              />
              <div className="post-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!newPostContent.trim() || posting}
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>

          {loading ? (
            <div className="loading-posts">
              <div className="spinner"></div>
              <p>Loading feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="no-posts">
              <div className="empty-icon">📭</div>
              <h3>No posts yet</h3>
              <p>Follow some users or create your first post!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <Link to={`/users/${post.user_id}`} className="post-author-link">
                    <img src={getUserAvatar(post)} alt={post.username} className="post-avatar" />
                    <div className="post-author-info">
                      <span className="post-author-name">
                        {post.minecraft_username || post.username}
                      </span>
                      <span className="post-time">{formatTime(post.created_at)}</span>
                    </div>
                  </Link>
                  {(post.user_id === user.id || user.role === 'admin') && (
                    <button 
                      className="post-delete-btn" 
                      onClick={() => deletePost(post.id)}
                      title={user.role === 'admin' && post.user_id !== user.id ? 'Delete as Admin' : 'Delete post'}
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <div className="post-content">{parsePostContent(post.content)}</div>

                {post.image_url && (
                  <img src={post.image_url} alt="Post" className="post-image" />
                )}

                <div className="post-stats">
                  <span>{post.like_count} {post.like_count === 1 ? 'like' : 'likes'}</span>
                  <span>{post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
                </div>

                <div className="post-actions-bar">
                  <button
                    className={`action-btn ${post.user_liked ? 'liked' : ''}`}
                    onClick={() => toggleLike(post.id)}
                  >
                    {post.user_liked ? '❤️' : '🤍'} Like
                  </button>
                  <button className="action-btn" onClick={() => toggleComments(post.id)}>
                    💬 Comment
                  </button>
                </div>

                {expandedComments.includes(post.id) && (
                  <div className="comments-section">
                    {comments[post.id]?.map((comment) => (
                      <div key={comment.id} className="comment">
                        <Link to={`/users/${comment.user_id}`}>
                          <img src={getUserAvatar(comment)} alt={comment.username} className="comment-avatar" />
                        </Link>
                        <div className="comment-content">
                          <div className="comment-header">
                            <Link to={`/users/${comment.user_id}`} className="comment-author">
                              {comment.minecraft_username || comment.username}
                            </Link>
                            {(comment.user_id === user.id || user.role === 'admin') && (
                              <button 
                                className="comment-delete-btn" 
                                onClick={() => deleteComment(post.id, comment.id)}
                                title={user.role === 'admin' && comment.user_id !== user.id ? 'Delete as Admin' : 'Delete comment'}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                          <p>{comment.content}</p>
                          <span className="comment-time">{formatTime(comment.created_at)}</span>
                        </div>
                      </div>
                    ))}

                    <div className="comment-input-container">
                      <img src={getUserAvatar(user)} alt={user.username} className="comment-avatar" />
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                        className="comment-input"
                      />
                      <button 
                        className="comment-submit-btn"
                        onClick={() => addComment(post.id)}
                        disabled={!newComment[post.id]?.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="social-suggestions">
          <div className="suggestions-card">
            <h3>Discover</h3>
            <p className="suggestions-hint">Find and follow other players!</p>
            <Link to="/social/discover" className="btn btn-secondary btn-sm">
              Browse Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialPage;
