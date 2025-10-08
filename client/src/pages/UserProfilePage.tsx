import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './UserProfilePage.css';

interface UserProfile {
  id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  created_at: string;
  bio?: string;
  location?: string;
  website?: string;
  banner_image?: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing: boolean;
  is_friend?: boolean;
  friend_request_sent?: boolean;
  friend_request_received?: boolean;
  mutual_friends?: number;
  // Enhanced profile data
  reputation?: number;
  avatar_url?: string;
  last_seen_at?: string;
  role?: string;
  // Profile details
  custom_banner?: string;
  avatar_border?: string;
  title?: string;
  // Activity stats
  stats?: {
    topics_created: number;
    posts_created: number;
    likes_received: number;
    likes_given: number;
    best_answers: number;
    days_active: number;
    last_post_at: string;
    join_date: string;
  };
  // Badges and achievements
  badges?: Array<{
    badge_type: string;
    badge_name: string;
    badge_description: string;
    badge_icon: string;
    badge_color: string;
    earned_at: string;
  }>;
  achievements?: Array<{
    achievement_key: string;
    achievement_name: string;
    achievement_description: string;
    achievement_icon: string;
    achievement_rarity: string;
    points: number;
    unlocked_at: string;
  }>;
}

interface Post {
  id: number;
  content: string;
  image_url?: string;
  created_at: string;
  user_id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  like_count: number;
  comment_count: number;
  share_count?: number;
  user_liked: boolean;
}

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', location: '', website: '' });
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');

  const loadProfile = useCallback(async () => {
    try {
      // Always use social API as it includes follow status and friend status
      const response = await api.get(`/social/profile/${userId}`);
      setProfile(response.data);
      setEditForm({
        bio: response.data.bio || '',
        location: response.data.location || '',
        website: response.data.website || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadPosts = useCallback(async () => {
    try {
      const response = await api.get(`/social/posts/user/${userId}`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    loadProfile();
    loadPosts();
  }, [userId, loadProfile, loadPosts]);

  const toggleFollow = async () => {
    if (!profile) return;
    try {
      const response = await api.post(`/social/follow/${profile.id}`);
      setProfile({
        ...profile,
        isFollowing: response.data.following,
        followerCount: profile.followerCount + (response.data.following ? 1 : -1)
      });
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const sendFriendRequest = async () => {
    if (!profile) return;
    try {
      await api.post(`/social/friend-request`, { user_id: profile.id });
      setProfile({
        ...profile,
        friend_request_sent: true
      });
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      if (error.response?.status === 404) {
        alert('Friend request feature is not yet implemented on the server. Please check back later!');
      } else {
        alert(error.response?.data?.error || 'Failed to send friend request');
      }
    }
  };

  const respondToFriendRequest = async (action: 'accept' | 'decline') => {
    if (!profile) return;
    try {
      // This endpoint doesn't exist yet, but the UI will update optimistically
      await api.post(`/social/friend-request/respond`, { user_id: profile.id, action });
      setProfile({
        ...profile,
        friend_request_received: false,
        is_friend: action === 'accept'
      });
    } catch (error: any) {
      console.error('Error responding to friend request:', error);
      if (error.response?.status === 404) {
        alert('Friend request response feature is not yet implemented on the server. Please use the social page to respond to requests.');
      } else {
        alert(error.response?.data?.error || 'Failed to respond to friend request');
      }
    }
  };

  const saveProfile = async () => {
    try {
      await api.put('/social/profile', editForm);
      setEditing(false);
      await loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    }
  };

  const toggleLike = async (postId: number) => {
    try {
      const response = await api.post(`/social/posts/${postId}/like`);
      setPosts(posts.map(p => 
        p.id === postId
          ? { ...p, user_liked: response.data.liked, like_count: p.like_count + (response.data.liked ? 1 : -1) }
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

  const getUserAvatar = (u: UserProfile | Post) => {
    // Use minecraft_username if available, otherwise fallback to username
    const username = u.minecraft_username || u.username;
    // Use "maid" if the username is "admin"
    const displayUsername = username === 'admin' ? 'maid' : username;
    return `https://mc-heads.net/head/${displayUsername}`;
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

  const getReputationTier = (reputation: number) => {
    if (reputation >= 5000) return { tier: 'Legend', icon: '💎', color: '#8b5cf6' };
    if (reputation >= 2500) return { tier: 'Expert', icon: '🏆', color: '#f59e0b' };
    if (reputation >= 1000) return { tier: 'Veteran', icon: '🥇', color: '#eab308' };
    if (reputation >= 500) return { tier: 'Respected', icon: '🥈', color: '#6b7280' };
    if (reputation >= 100) return { tier: 'Rising Star', icon: '🥉', color: '#cd7f32' };
    return { tier: 'Newcomer', icon: '🌱', color: '#10b981' };
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

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-not-found">
        <h2>User not found</h2>
        <Link to="/social" className="btn btn-primary">Back to Feed</Link>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === profile.id;

  return (
    <div className="user-profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <img src={getUserAvatar(profile)} alt={profile.username} className="profile-avatar-large" />
          </div>

          <div className="profile-info">
            <div className="profile-name-section">
              <h1 className="profile-name">{profile.minecraft_username || profile.username}</h1>
              {profile.reputation !== undefined && profile.reputation > 0 && (
                <div className="reputation-badge">
                  <span className="reputation-icon">⭐</span>
                  <span className="reputation-score">{profile.reputation}</span>
                  <span className="reputation-tier">{getReputationTier(profile.reputation).tier}</span>
                </div>
              )}
            </div>
            {profile.minecraft_username && (
              <p className="profile-handle">@{profile.username}</p>
            )}
            {profile.title && (
              <p className="profile-title">{profile.title}</p>
            )}
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-meta">
              {profile.location && (
                <span className="meta-item">
                  📍 {profile.location}
                </span>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="meta-item">
                  🔗 {profile.website}
                </a>
              )}
              <span className="meta-item">
                📅 Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            ) : (
              <>
                {profile.is_friend ? (
                  <span className="friend-status-badge">Friends</span>
                ) : profile.friend_request_received ? (
                  <div className="friend-request-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => respondToFriendRequest('accept')}
                    >
                      Accept Friend Request
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => respondToFriendRequest('decline')}
                    >
                      Decline
                    </button>
                  </div>
                ) : profile.friend_request_sent ? (
                  <span className="request-sent-status">Friend Request Sent</span>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={sendFriendRequest}
                  >
                    Add Friend
                  </button>
                )}
                
                <button
                  className={`btn ${profile.isFollowing ? 'btn-secondary' : 'btn-outline'}`}
                  onClick={toggleFollow}
                >
                  {profile.isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                
                <Link to={`/messages?user_id=${profile.id}`} className="btn btn-secondary">
                  Message
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{profile.stats?.posts_created || profile.postCount}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.stats?.topics_created || 0}</span>
            <span className="stat-label">Topics</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.followerCount}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.followingCount}</span>
            <span className="stat-label">Following</span>
          </div>
          {profile.stats?.likes_received !== undefined && (
            <div className="stat-item">
              <span className="stat-value">{profile.stats.likes_received}</span>
              <span className="stat-label">Likes</span>
            </div>
          )}
          {profile.stats?.best_answers !== undefined && profile.stats.best_answers > 0 && (
            <div className="stat-item">
              <span className="stat-value">{profile.stats.best_answers}</span>
              <span className="stat-label">Best Answers</span>
            </div>
          )}
        </div>

        {/* Badges Section */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="profile-badges">
            <h3>Badges</h3>
            <div className="badges-grid">
              {profile.badges.map((badge, index) => (
                <div key={index} className="badge-item" style={{ borderColor: badge.badge_color }}>
                  <span className="badge-icon">{badge.badge_icon}</span>
                  <div className="badge-info">
                    <span className="badge-name">{badge.badge_name}</span>
                    <span className="badge-description">{badge.badge_description}</span>
                    <span className="badge-earned">Earned {formatTime(badge.earned_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Section */}
        {profile.achievements && profile.achievements.length > 0 && (
          <div className="profile-achievements">
            <h3>Achievements</h3>
            <div className="achievements-grid">
              {profile.achievements.map((achievement, index) => (
                <div key={index} className={`achievement-item rarity-${achievement.achievement_rarity}`}>
                  <span className="achievement-icon">{achievement.achievement_icon}</span>
                  <div className="achievement-info">
                    <span className="achievement-name">{achievement.achievement_name}</span>
                    <span className="achievement-description">{achievement.achievement_description}</span>
                    <div className="achievement-meta">
                      <span className="achievement-points">+{achievement.points} points</span>
                      <span className="achievement-unlocked">Unlocked {formatTime(achievement.unlocked_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'posts' && (
            <div className="posts-section">
              {posts.length === 0 ? (
                <div className="no-posts">
                  <div className="no-posts-icon">📝</div>
                  <h3>{isOwnProfile ? "No posts yet" : `${profile?.username} hasn't posted anything yet`}</h3>
                  <p>{isOwnProfile ? "Share your first post to get started!" : "Check back later for updates"}</p>
                </div>
              ) : (
                <div className="posts-feed">
                  {posts.map((post) => (
                    <article key={post.id} className="profile-post">
                      <div className="post-header">
                        <div className="post-author">
                          <img 
                            src={getUserAvatar(post)} 
                            alt={post.username} 
                            className="post-author-avatar"
                          />
                          <div className="post-author-info">
                            <span className="post-author-name">
                              {post.minecraft_username || post.username}
                            </span>
                            <time className="post-timestamp" dateTime={post.created_at}>
                              {formatTime(post.created_at)}
                            </time>
                          </div>
                        </div>
                        {currentUser && (post.user_id === currentUser.id || currentUser.role === 'admin') && (
                          <div className="post-actions">
                            <button 
                              className="post-delete-btn" 
                              onClick={() => deletePost(post.id)}
                              title={currentUser.role === 'admin' && post.user_id !== currentUser.id ? 'Delete as Admin' : 'Delete post'}
                            >
                              <span className="delete-icon">🗑️</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="post-body">
                        <div className="post-content">{parsePostContent(post.content)}</div>
                        {post.image_url && (
                          <div className="post-media">
                            <img src={post.image_url} alt="Post media" className="post-image" />
                          </div>
                        )}
                      </div>

                      <div className="post-footer">
                        <div className="post-engagement">
                          <button
                            className={`engagement-btn like-btn ${post.user_liked ? 'active' : ''}`}
                            onClick={() => toggleLike(post.id)}
                          >
                            <span className="engagement-icon">
                              {post.user_liked ? '❤️' : '🤍'}
                            </span>
                            <span className="engagement-count">{post.like_count}</span>
                          </button>
                          
                          <div className="engagement-item">
                            <span className="engagement-icon">💬</span>
                            <span className="engagement-count">{post.comment_count}</span>
                          </div>

                          {post.share_count > 0 && (
                            <div className="engagement-item">
                              <span className="engagement-icon">🔄</span>
                              <span className="engagement-count">{post.share_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={200}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="Where are you from?"
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveProfile}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
