import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserDisplay from '../../components/UserDisplay';
import api from '../../services/api';
import { parsePostContent, formatTimeAgo } from '../../utils/bbCodeParser';
import './MobileSocialPage.css';

interface User {
  id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  is_friend?: boolean;
  friend_request_sent?: boolean;
  friend_request_received?: boolean;
  mutual_friends?: number;
}

interface Post {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  user_liked: number | null;
  user_reactions: { [key: string]: number };
  reactions: { [key: string]: number };
  shared_from?: Post;
  donation_rank?: {
    id: string;
    name: string;
    color: string;
    textColor: string;
    icon: string;
    badge: string;
    glow: boolean;
  };
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  like_count: number;
  user_liked: boolean;
}

interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender_username: string;
  sender_minecraft_username?: string;
  sender_minecraft_uuid?: string;
  created_at: string;
}

const MobileSocialPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'discover'>('feed');
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>({});
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState<User[]>([]);

  // Reaction emojis
  const reactionEmojis = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😠'
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadInitialData();
  }, [user, navigate]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (friendSearchQuery.trim().length >= 2) {
        searchFriends(friendSearchQuery);
      } else {
        setFriendSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [friendSearchQuery]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFeed(),
        loadFriends(),
        loadFriendRequests(),
        loadSuggestedFriends()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeed = async () => {
    try {
      const response = await api.get('/social/feed');
      setPosts(response.data);
    } catch (error) {
      console.error('Error loading feed:', error);
      setPosts([]);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await api.get('/social/friends');
      setFriends(response.data);
    } catch (error) {
      setFriends([]);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await api.get('/social/friend-requests');
      setFriendRequests(response.data);
    } catch (error) {
      setFriendRequests([]);
    }
  };

  const loadSuggestedFriends = async () => {
    try {
      const response = await api.get('/social/suggested-friends');
      setSuggestedFriends(response.data);
    } catch (error) {
      setSuggestedFriends([]);
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

  const reactToPost = async (postId: number, reaction: string) => {
    try {
      const response = await api.post(`/social/posts/${postId}/react`, { reaction });
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, ...response.data } : p
      ));
    } catch (error) {
      console.error('Error reacting to post:', error);
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

  const sendFriendRequest = async (userId: number) => {
    try {
      await api.post(`/social/friend-request`, { user_id: userId });
      
      setFriendSearchResults(friendSearchResults.map(u => 
        u.id === userId ? { ...u, friend_request_sent: true } : u
      ));
      
      setSuggestedFriends(suggestedFriends.map(u => 
        u.id === userId ? { ...u, friend_request_sent: true } : u
      ));
      
      await loadSuggestedFriends();
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      if (error.response?.status === 404) {
        alert('Friend request feature is not yet implemented on the server. Please check back later!');
      } else {
        alert(error.response?.data?.error || 'Failed to send friend request');
      }
    }
  };

  const respondToFriendRequest = async (requestId: number, action: 'accept' | 'decline') => {
    try {
      await api.post(`/social/friend-request/${requestId}/${action}`);
      await loadFriendRequests();
      await loadFriends();
      await loadSuggestedFriends();
    } catch (error: any) {
      console.error('Error responding to friend request:', error);
      alert(error.response?.data?.error || 'Failed to respond to friend request');
    }
  };

  const searchFriends = async (query: string) => {
    if (query.trim().length < 2) {
      setFriendSearchResults([]);
      return;
    }
    
    try {
      let response;
      try {
        response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      } catch (searchError: any) {
        if (searchError.response?.status === 404) {
          response = await api.get('/users/discover');
          response.data = response.data.filter((u: User) => 
            u.username.toLowerCase().includes(query.toLowerCase()) ||
            (u.minecraft_username && u.minecraft_username.toLowerCase().includes(query.toLowerCase()))
          );
        } else {
          throw searchError;
        }
      }
      
      const filtered = response.data.filter((u: User) => 
        u.id !== user?.id && !friends.some(f => f.id === u.id)
      );
      setFriendSearchResults(filtered);
    } catch (error) {
      console.error('Error searching friends:', error);
      setFriendSearchResults([]);
    }
  };

  // Memoized user avatar helper
  const getUserAvatar = useCallback((u: any) => {
    let username;
    if (u?.minecraft_username) {
      username = u.minecraft_username;
    } else {
      username = u?.username || 'steve';
    }
    
    const displayUsername = username === 'admin' ? 'maid' : username;
    return `https://mc-heads.net/head/${displayUsername}`;
  }, []);

  if (!user) return null;

  if (loading) {
    return (
      <div className="mobile-content">
        <div className="mobile-loading">
          <div className="mobile-spinner"></div>
          <p>Loading social feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-content">
      <div className="mobile-social">
        {/* Tab Navigation */}
        <div className="mobile-social-tabs">
          <button
            className={`mobile-tab ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <span className="mobile-tab-icon">🏠</span>
            <span className="mobile-tab-label">Feed</span>
          </button>
          <button
            className={`mobile-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <span className="mobile-tab-icon">👥</span>
            <span className="mobile-tab-label">Friends</span>
            {friendRequests.length > 0 && (
              <span className="mobile-notification-badge">{friendRequests.length}</span>
            )}
          </button>
          <button
            className={`mobile-tab ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <span className="mobile-tab-icon">🔍</span>
            <span className="mobile-tab-label">Discover</span>
          </button>
        </div>

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div className="mobile-feed">
            {/* Create Post */}
            <div className="mobile-create-post">
              <div className="mobile-post-header">
                <img src={getUserAvatar(user)} alt={user.username} className="mobile-post-avatar" />
                <form onSubmit={createPost} className="mobile-post-form">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="mobile-post-textarea"
                    rows={3}
                    disabled={posting}
                  />
                  <button 
                    type="submit" 
                    className="mobile-post-btn"
                    disabled={!newPostContent.trim() || posting}
                  >
                    {posting ? 'Posting...' : 'Post'}
                  </button>
                </form>
              </div>
            </div>

            {/* Posts */}
            {posts.length === 0 ? (
              <div className="mobile-no-posts">
                <div className="mobile-empty-icon">📭</div>
                <h3>No posts yet</h3>
                <p>Add some friends or create your first post!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="mobile-post-card">
                  <div className="mobile-post-header">
                    <Link to={`/users/${post.user_id}`} className="mobile-post-author">
                      <img src={getUserAvatar(post)} alt={post.username} className="mobile-post-avatar" />
                      <div className="mobile-post-author-info">
                        <div className="mobile-post-author-name">
                          <UserDisplay
                            username={post.username}
                            minecraftUsername={post.minecraft_username}
                            donationRank={post.donation_rank}
                            size="small"
                            showIcon={true}
                            showBadge={false}
                          />
                        </div>
                        <span className="mobile-post-time">{formatTimeAgo(post.created_at)}</span>
                      </div>
                    </Link>
                  </div>

                  <div className="mobile-post-content">{parsePostContent(post.content)}</div>

                  {/* Post Stats */}
                  {(Object.values(post.reactions || {}).some(count => count > 0) || post.comment_count > 0) && (
                    <div className="mobile-post-stats">
                      <div className="mobile-reaction-summary">
                        {Object.entries(post.reactions || {}).map(([reaction, count]) => (
                          count > 0 && (
                            <span key={reaction} className="mobile-reaction-count">
                              {reactionEmojis[reaction as keyof typeof reactionEmojis]} {count}
                            </span>
                          )
                        ))}
                      </div>
                      <div className="mobile-engagement-stats">
                        {post.comment_count > 0 && (
                          <span>{post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reaction Buttons */}
                  <div className="mobile-reaction-bar">
                    {Object.entries(reactionEmojis).map(([reaction, emoji]) => (
                      <button
                        key={reaction}
                        className={`mobile-reaction-btn ${post.user_reactions?.[reaction] ? 'active' : ''}`}
                        onClick={() => reactToPost(post.id, reaction)}
                        title={reaction}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mobile-post-actions">
                    <button 
                      className="mobile-action-btn" 
                      onClick={() => toggleComments(post.id)}
                    >
                      💬 Comment
                    </button>
                  </div>

                  {/* Comments */}
                  {expandedComments.includes(post.id) && (
                    <div className="mobile-comments">
                      {comments[post.id]?.map((comment) => (
                        <div key={comment.id} className="mobile-comment">
                          <Link to={`/users/${comment.user_id}`}>
                            <img src={getUserAvatar(comment)} alt={comment.username} className="mobile-comment-avatar" />
                          </Link>
                          <div className="mobile-comment-content">
                            <div className="mobile-comment-bubble">
                              <Link to={`/users/${comment.user_id}`} className="mobile-comment-author">
                                {comment.minecraft_username || comment.username}
                              </Link>
                              <div className="mobile-comment-text">{parsePostContent(comment.content)}</div>
                            </div>
                            <div className="mobile-comment-actions">
                              <span className="mobile-comment-time">{formatTimeAgo(comment.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add Comment */}
                      <div className="mobile-add-comment">
                        <img src={getUserAvatar(user)} alt={user.username} className="mobile-comment-avatar" />
                        <div className="mobile-comment-input">
                          <input
                            type="text"
                            value={newComment[post.id] || ''}
                            onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                            placeholder="Write a comment..."
                            onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                          />
                          <button 
                            onClick={() => addComment(post.id)}
                            disabled={!newComment[post.id]?.trim()}
                            className="mobile-comment-send"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="mobile-friends">
            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="mobile-friend-requests">
                <h3 className="mobile-section-title">Friend Requests</h3>
                {friendRequests.map((request) => (
                  <div key={request.id} className="mobile-friend-request">
                    <Link to={`/users/${request.sender_id}`}>
                      <img src={getUserAvatar(request)} alt={request.sender_username} className="mobile-friend-avatar" />
                    </Link>
                    <div className="mobile-friend-info">
                      <Link to={`/users/${request.sender_id}`} className="mobile-friend-name">
                        {request.sender_minecraft_username || request.sender_username}
                      </Link>
                      <div className="mobile-friend-actions">
                        <button 
                          className="mobile-btn mobile-btn-primary mobile-btn-sm"
                          onClick={() => respondToFriendRequest(request.id, 'accept')}
                        >
                          Accept
                        </button>
                        <button 
                          className="mobile-btn mobile-btn-secondary mobile-btn-sm"
                          onClick={() => respondToFriendRequest(request.id, 'decline')}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Friends List */}
            <div className="mobile-friends-list">
              <h3 className="mobile-section-title">Friends ({friends.length})</h3>
              {friends.length === 0 ? (
                <div className="mobile-no-friends">
                  <div className="mobile-empty-icon">👥</div>
                  <p>No friends yet. Start connecting!</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div key={friend.id} className="mobile-friend-item">
                    <Link to={`/users/${friend.id}`}>
                      <img src={getUserAvatar(friend)} alt={friend.username} className="mobile-friend-avatar" />
                    </Link>
                    <div className="mobile-friend-info">
                      <Link to={`/users/${friend.id}`} className="mobile-friend-name">
                        {friend.minecraft_username || friend.username}
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div className="mobile-discover">
            {/* Search */}
            <div className="mobile-search">
              <input
                type="text"
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                placeholder="Search for friends..."
                className="mobile-search-input"
              />
            </div>

            {/* Search Results */}
            {friendSearchResults.length > 0 && (
              <div className="mobile-search-results">
                <h3 className="mobile-section-title">Search Results</h3>
                {friendSearchResults.map((user) => (
                  <div key={user.id} className="mobile-discover-item">
                    <Link to={`/users/${user.id}`}>
                      <img src={getUserAvatar(user)} alt={user.username} className="mobile-friend-avatar" />
                    </Link>
                    <div className="mobile-friend-info">
                      <Link to={`/users/${user.id}`} className="mobile-friend-name">
                        {user.minecraft_username || user.username}
                      </Link>
                      {!user.is_friend && !user.friend_request_sent && (
                        <button 
                          className="mobile-btn mobile-btn-primary mobile-btn-sm"
                          onClick={() => sendFriendRequest(user.id)}
                        >
                          Add Friend
                        </button>
                      )}
                      {user.friend_request_sent && (
                        <span className="mobile-request-sent">Request Sent</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested Friends */}
            {suggestedFriends.length > 0 && (
              <div className="mobile-suggested-friends">
                <h3 className="mobile-section-title">People You May Know</h3>
                {suggestedFriends.map((user) => (
                  <div key={user.id} className="mobile-discover-item">
                    <Link to={`/users/${user.id}`}>
                      <img src={getUserAvatar(user)} alt={user.username} className="mobile-friend-avatar" />
                    </Link>
                    <div className="mobile-friend-info">
                      <Link to={`/users/${user.id}`} className="mobile-friend-name">
                        {user.minecraft_username || user.username}
                      </Link>
                      {user.mutual_friends && (
                        <span className="mobile-mutual-friends">
                          {user.mutual_friends} mutual friends
                        </span>
                      )}
                      {!user.is_friend && !user.friend_request_sent && (
                        <button 
                          className="mobile-btn mobile-btn-primary mobile-btn-sm"
                          onClick={() => sendFriendRequest(user.id)}
                        >
                          Add Friend
                        </button>
                      )}
                      {user.friend_request_sent && (
                        <span className="mobile-request-sent">Request Sent</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSocialPage;
