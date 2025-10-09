import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserDisplay from '../components/UserDisplay';
import './SocialPage.css';

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
  tagged_users?: User[];
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

interface Story {
  id: number;
  content: string;
  background_color: string;
  created_at: string;
  user_id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  viewed: boolean;
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

interface Group {
  id: number;
  name: string;
  description: string;
  member_count: number;
  is_member: boolean;
  is_admin: boolean;
  privacy: 'public' | 'private';
  created_at: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location?: string;
  attendee_count: number;
  is_attending: boolean;
  created_by: number;
  created_by_username: string;
}

const SocialPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Post-related state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [comments, setComments] = useState<{ [postId: number]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>({});
  
  // Story-related state
  const [stories, setStories] = useState<Story[]>([]);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [newStoryContent, setNewStoryContent] = useState('');
  const [storyBackgroundColor, setStoryBackgroundColor] = useState('#00d97e');
  
  // Friend-related state
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<User[]>([]);
  
  // Group and Event state
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'groups' | 'events'>('feed');
  const [showCreateModal, setShowCreateModal] = useState<'post' | 'group' | 'event' | null>(null);
  
  // Friend search state
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState<User[]>([]);
  const [searchingFriends, setSearchingFriends] = useState(false);
  
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
        loadStories(),
        loadFriends(),
        loadFriendRequests(),
        loadSuggestedFriends(),
        loadGroups(),
        loadEvents()
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
    }
  };

  const loadStories = async () => {
    try {
      const response = await api.get('/social/stories');
      setStories(response.data);
    } catch (error) {
      // Stories API not implemented yet - use empty array
      setStories([]);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await api.get('/social/friends');
      setFriends(response.data);
    } catch (error) {
      // Friends API not implemented yet - use empty array
      setFriends([]);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await api.get('/social/friend-requests');
      setFriendRequests(response.data);
    } catch (error) {
      // Friend requests API not implemented yet - use empty array
      setFriendRequests([]);
    }
  };

  const loadSuggestedFriends = async () => {
    try {
      const response = await api.get('/social/suggested-friends');
      setSuggestedFriends(response.data);
    } catch (error) {
      // Suggested friends API not implemented yet - use empty array
      setSuggestedFriends([]);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await api.get('/social/groups');
      setGroups(response.data);
    } catch (error) {
      // Groups API not implemented yet - use empty array
      setGroups([]);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await api.get('/social/events');
      setEvents(response.data);
    } catch (error) {
      // Events API not implemented yet - use empty array
      setEvents([]);
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

  const createStory = async () => {
    if (!newStoryContent.trim()) return;

    try {
      await api.post('/social/stories', { 
        content: newStoryContent,
        background_color: storyBackgroundColor
      });
      setNewStoryContent('');
      setShowStoryModal(false);
      await loadStories();
    } catch (error: any) {
      console.error('Error creating story:', error);
      if (error.response?.status === 404) {
        alert('Stories feature is not yet implemented on the server. Please check back later!');
      } else {
        alert(error.response?.data?.error || 'Failed to create story');
      }
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

  const sharePost = async (postId: number, content?: string) => {
    try {
      await api.post(`/social/posts/${postId}/share`, { content });
      await loadFeed();
    } catch (error: any) {
      console.error('Error sharing post:', error);
      alert(error.response?.data?.error || 'Failed to share post');
    }
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      await api.post(`/social/friend-request`, { user_id: userId });
      
      // Update friend search results
      setFriendSearchResults(friendSearchResults.map(u => 
        u.id === userId ? { ...u, friend_request_sent: true } : u
      ));
      
      // Update suggested friends
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
      
      // Find the request to get the sender ID
      const request = friendRequests.find(r => r.id === requestId);
      if (request && action === 'accept') {
        // Update friend search results if the accepted user is in the search
        setFriendSearchResults(friendSearchResults.map(u => 
          u.id === request.sender_id ? { ...u, is_friend: true, friend_request_received: false } : u
        ));
        
        // Update suggested friends
        setSuggestedFriends(suggestedFriends.filter(u => u.id !== request.sender_id));
      }
      
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
    
    setSearchingFriends(true);
    try {
      // Try the new search endpoint first, fallback to discover
      let response;
      try {
        response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      } catch (searchError: any) {
        if (searchError.response?.status === 404) {
          // Fallback to existing discover endpoint
          response = await api.get('/users/discover');
          // Filter by search query
          response.data = response.data.filter((u: User) => 
            u.username.toLowerCase().includes(query.toLowerCase()) ||
            (u.minecraft_username && u.minecraft_username.toLowerCase().includes(query.toLowerCase()))
          );
        } else {
          throw searchError;
        }
      }
      
      // Filter out current user and existing friends
      const filtered = response.data.filter((u: User) => 
        u.id !== user?.id && !friends.some(f => f.id === u.id)
      );
      setFriendSearchResults(filtered);
    } catch (error) {
      console.error('Error searching friends:', error);
      setFriendSearchResults([]);
    } finally {
      setSearchingFriends(false);
    }
  };

  const createGroup = async (name: string, description: string, privacy: 'public' | 'private') => {
    try {
      await api.post('/social/groups', { name, description, privacy });
      await loadGroups();
      setShowCreateModal(null);
    } catch (error: any) {
      console.error('Error creating group:', error);
      if (error.response?.status === 404) {
        alert('Groups feature is not yet implemented on the server. Please check back later!');
      } else {
        alert(error.response?.data?.error || 'Failed to create group');
      }
      setShowCreateModal(null);
    }
  };

  const createEvent = async (title: string, description: string, date: string, location?: string) => {
    try {
      await api.post('/social/events', { title, description, date, location });
      await loadEvents();
      setShowCreateModal(null);
    } catch (error: any) {
      console.error('Error creating event:', error);
      if (error.response?.status === 404) {
        alert('Events feature is not yet implemented on the server. Please check back later!');
      } else {
        alert(error.response?.data?.error || 'Failed to create event');
      }
      setShowCreateModal(null);
    }
  };

  const joinGroup = async (groupId: number) => {
    try {
      await api.post(`/social/groups/${groupId}/join`);
      
      // Update groups list
      setGroups(groups.map(g => 
        g.id === groupId 
          ? { ...g, is_member: true, member_count: g.member_count + 1 }
          : g
      ));
    } catch (error: any) {
      console.error('Error joining group:', error);
      alert(error.response?.data?.error || 'Failed to join group');
    }
  };

  const leaveGroup = async (groupId: number) => {
    try {
      await api.post(`/social/groups/${groupId}/leave`);
      
      // Update groups list
      setGroups(groups.map(g => 
        g.id === groupId 
          ? { ...g, is_member: false, member_count: g.member_count - 1 }
          : g
      ));
    } catch (error: any) {
      console.error('Error leaving group:', error);
      alert(error.response?.data?.error || 'Failed to leave group');
    }
  };

  const attendEvent = async (eventId: number) => {
    try {
      await api.post(`/social/events/${eventId}/attend`);
      
      // Update events list
      setEvents(events.map(e => 
        e.id === eventId 
          ? { ...e, is_attending: true, attendee_count: e.attendee_count + 1 }
          : e
      ));
    } catch (error: any) {
      console.error('Error attending event:', error);
      alert(error.response?.data?.error || 'Failed to attend event');
    }
  };

  const unattendEvent = async (eventId: number) => {
    try {
      await api.post(`/social/events/${eventId}/unattend`);
      
      // Update events list
      setEvents(events.map(e => 
        e.id === eventId 
          ? { ...e, is_attending: false, attendee_count: e.attendee_count - 1 }
          : e
      ));
    } catch (error: any) {
      console.error('Error unattending event:', error);
      alert(error.response?.data?.error || 'Failed to unattend event');
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

    const originalComments = { ...comments };
    const originalPosts = [...posts];
    
    try {
      setComments({
        ...comments,
        [postId]: comments[postId].filter(c => c.id !== commentId)
      });
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p
      ));

      await api.delete(`/social/comments/${commentId}`);
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      setComments(originalComments);
      setPosts(originalPosts);
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

  const likeComment = async (commentId: number, postId: number) => {
    try {
      const response = await api.post(`/social/comments/${commentId}/like`);
      setComments({
        ...comments,
        [postId]: comments[postId].map(c => 
          c.id === commentId ? { ...c, ...response.data } : c
        )
      });
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const getUserAvatar = (u: User | Post | Comment | Story | FriendRequest) => {
    // Determine the username to use
    let username: string;
    if ('sender_minecraft_username' in u && u.sender_minecraft_username) {
      username = u.sender_minecraft_username;
    } else if ('sender_username' in u) {
      username = u.sender_username;
    } else if ('minecraft_username' in u && u.minecraft_username) {
      username = u.minecraft_username;
    } else {
      username = u.username;
    }
    
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

  const parsePostContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  if (!user) return null;

  return (
    <div className="social-page minecraft-theme">
      <div className="social-container">
        {/* Left Sidebar */}
        <div className="social-sidebar">
          <div className="sidebar-profile">
            <Link to={`/users/${user.id}`} className="sidebar-avatar-link">
              <img src={getUserAvatar(user)} alt={user.username} className="sidebar-avatar" />
            </Link>
            <div className="sidebar-user-info">
              <Link to={`/users/${user.id}`} className="sidebar-username">
                <UserDisplay
                  username={user.username}
                  minecraftUsername={user.minecraft_username}
                  totalDonated={user.total_donated}
                  donationRank={user.donation_rank}
                  size="medium"
                  showIcon={true}
                  showBadge={true}
                />
              </Link>
              <div className="user-stats">
                <span>{friends.length} friends</span>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button 
              className={`sidebar-nav-link ${activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => setActiveTab('feed')}
            >
              <span className="nav-icon">🏠</span>
              Feed
            </button>
            <button 
              className={`sidebar-nav-link ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              <span className="nav-icon">👥</span>
              Friends
              {friendRequests.length > 0 && (
                <span className="notification-badge">{friendRequests.length}</span>
              )}
            </button>
            <button 
              className={`sidebar-nav-link ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => setActiveTab('groups')}
            >
              <span className="nav-icon">🏘️</span>
              Groups
            </button>
            <button 
              className={`sidebar-nav-link ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              <span className="nav-icon">📅</span>
              Events
            </button>
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

        {/* Main Content */}
        <div className="social-feed">
          {activeTab === 'feed' && (
            <>
              {/* Stories Section */}
              <div className="stories-section">
                <div className="story-card create-story" onClick={() => setShowStoryModal(true)}>
                  <div className="story-avatar">
                    <img src={getUserAvatar(user)} alt={user.username} />
                    <div className="add-story-icon">+</div>
                  </div>
                  <span className="story-label">Create Story</span>
                </div>
                {stories.map((story) => (
                  <div key={story.id} className={`story-card ${story.viewed ? 'viewed' : ''}`}>
                    <div className="story-avatar">
                      <img src={getUserAvatar(story)} alt={story.username} />
                    </div>
                    <span className="story-label">
                      {story.minecraft_username || story.username}
                    </span>
                  </div>
                ))}
              </div>

              {/* Create Post */}
              <div className="create-post-card">
                <div className="create-post-header">
                  <img src={getUserAvatar(user)} alt={user.username} className="post-avatar" />
                  <form onSubmit={createPost} className="create-post-form">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="What's on your mind?"
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
              </div>

              {/* Posts Feed */}
              {loading ? (
                <div className="loading-posts">
                  <div className="spinner"></div>
                  <p>Loading feed...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="no-posts">
                  <div className="empty-icon">📭</div>
                  <h3>No posts yet</h3>
                  <p>Add some friends or create your first post!</p>
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

                    {post.shared_from && (
                      <div className="shared-post-indicator">
                        <span>🔄 Shared a post</span>
                      </div>
                    )}

                    <div className="post-content">{parsePostContent(post.content)}</div>

                    {post.shared_from && (
                      <div className="shared-post">
                        <div className="shared-post-header">
                          <img src={getUserAvatar(post.shared_from)} alt={post.shared_from.username} className="post-avatar-sm" />
                          <span className="shared-author">{post.shared_from.minecraft_username || post.shared_from.username}</span>
                        </div>
                        <div className="shared-post-content">{parsePostContent(post.shared_from.content)}</div>
                      </div>
                    )}

                    {/* Reaction Summary */}
                    <div className="post-stats">
                      <div className="reaction-summary">
                        {Object.entries(post.reactions || {}).map(([reaction, count]) => (
                          count > 0 && (
                            <span key={reaction} className="reaction-count">
                              {reactionEmojis[reaction as keyof typeof reactionEmojis]} {count}
                            </span>
                          )
                        ))}
                      </div>
                      <div className="engagement-stats">
                        <span>{post.comment_count} comments</span>
                        <span>{post.share_count} shares</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="post-actions-bar">
                      <div className="reaction-buttons">
                        {Object.entries(reactionEmojis).map(([reaction, emoji]) => (
                          <button
                            key={reaction}
                            className={`reaction-btn ${post.user_reactions?.[reaction] ? 'active' : ''}`}
                            onClick={() => reactToPost(post.id, reaction)}
                            title={reaction}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <button className="action-btn" onClick={() => toggleComments(post.id)}>
                        💬 Comment
                      </button>
                      <button className="action-btn" onClick={() => sharePost(post.id)}>
                        🔄 Share
                      </button>
                    </div>

                    {/* Comments Section */}
                    {expandedComments.includes(post.id) && (
                      <div className="comments-section">
                        {comments[post.id]?.map((comment) => (
                          <div key={comment.id} className="comment">
                            <Link to={`/users/${comment.user_id}`}>
                              <img src={getUserAvatar(comment)} alt={comment.username} className="comment-avatar" />
                            </Link>
                            <div className="comment-content">
                              <div className="comment-bubble">
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
                              </div>
                              <div className="comment-actions">
                                <button 
                                  className={`comment-like-btn ${comment.user_liked ? 'liked' : ''}`}
                                  onClick={() => likeComment(comment.id, post.id)}
                                >
                                  👍 {comment.like_count > 0 && comment.like_count}
                                </button>
                                <span className="comment-time">{formatTime(comment.created_at)}</span>
                              </div>
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
            </>
          )}

          {activeTab === 'friends' && (
            <div className="friends-section">
              {/* Friend Search */}
              <div className="friend-search-card">
                <h3>Find Friends</h3>
                <div className="search-bar-container">
                  <input
                    type="text"
                    placeholder="Search for users to add as friends..."
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="friend-search-input"
                  />
                  <span className="search-icon">🔍</span>
                </div>
                
                {searchingFriends && (
                  <div className="search-loading">
                    <div className="spinner"></div>
                    <p>Searching...</p>
                  </div>
                )}
                
                {friendSearchResults.length > 0 && (
                  <div className="search-results">
                    {friendSearchResults.map((searchUser) => (
                      <div key={searchUser.id} className="friend-suggestion">
                        <img src={getUserAvatar(searchUser)} alt={searchUser.username} className="friend-avatar" />
                        <div className="friend-info">
                          <span className="friend-name">{searchUser.minecraft_username || searchUser.username}</span>
                          {searchUser.mutual_friends && searchUser.mutual_friends > 0 && (
                            <span className="mutual-friends">{searchUser.mutual_friends} mutual friends</span>
                          )}
                        </div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => sendFriendRequest(searchUser.id)}
                          disabled={searchUser.friend_request_sent}
                        >
                          {searchUser.friend_request_sent ? 'Request Sent' : 'Add Friend'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {friendRequests.length > 0 && (
                <div className="friend-requests-card">
                  <h3>Friend Requests</h3>
                  {friendRequests.map((request) => (
                    <div key={request.id} className="friend-request">
                      <img src={getUserAvatar(request)} alt={request.sender_username} className="friend-avatar" />
                      <div className="friend-info">
                        <span className="friend-name">{request.sender_minecraft_username || request.sender_username}</span>
                        <span className="request-time">{formatTime(request.created_at)}</span>
                      </div>
                      <div className="friend-actions">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => respondToFriendRequest(request.id, 'accept')}
                        >
                          Accept
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => respondToFriendRequest(request.id, 'decline')}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="friends-list-card">
                <h3>Friends ({friends.length})</h3>
                <div className="friends-grid">
                  {friends.map((friend) => (
                    <Link key={friend.id} to={`/users/${friend.id}`} className="friend-card">
                      <img src={getUserAvatar(friend)} alt={friend.username} className="friend-avatar" />
                      <span className="friend-name">{friend.minecraft_username || friend.username}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {suggestedFriends.length > 0 && (
                <div className="suggested-friends-card">
                  <h3>People You May Know</h3>
                  {suggestedFriends.map((suggestion) => (
                    <div key={suggestion.id} className="friend-suggestion">
                      <img src={getUserAvatar(suggestion)} alt={suggestion.username} className="friend-avatar" />
                      <div className="friend-info">
                        <span className="friend-name">{suggestion.minecraft_username || suggestion.username}</span>
                        {suggestion.mutual_friends && suggestion.mutual_friends > 0 && (
                          <span className="mutual-friends">{suggestion.mutual_friends} mutual friends</span>
                        )}
                      </div>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => sendFriendRequest(suggestion.id)}
                        disabled={suggestion.friend_request_sent}
                      >
                        {suggestion.friend_request_sent ? 'Request Sent' : 'Add Friend'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="groups-section">
              <div className="section-header">
                <h2>Groups</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal('group')}
                >
                  Create Group
                </button>
              </div>
              <div className="groups-grid">
                {groups.map((group) => (
                  <div key={group.id} className="group-card">
                    <h3>
                      <Link to={`/groups/${group.id}`} className="group-name-link">
                        {group.name}
                      </Link>
                    </h3>
                    <p>{group.description}</p>
                    <div className="group-stats">
                      <span>{group.member_count} members</span>
                      <span className={`privacy-badge ${group.privacy}`}>{group.privacy}</span>
                    </div>
                    <div className="group-actions">
                      {group.is_member ? (
                        <div className="member-actions">
                          <span className="member-badge">Member</span>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => leaveGroup(group.id)}
                          >
                            Leave
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => joinGroup(group.id)}
                        >
                          Join Group
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="events-section">
              <div className="section-header">
                <h2>Events</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal('event')}
                >
                  Create Event
                </button>
              </div>
              <div className="events-list">
                {events.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-date">
                      <span className="event-day">{new Date(event.date).getDate()}</span>
                      <span className="event-month">{new Date(event.date).toLocaleDateString('en', {month: 'short'})}</span>
                    </div>
                    <div className="event-info">
                      <h3>
                        <Link to={`/events/${event.id}`} className="event-title-link">
                          {event.title}
                        </Link>
                      </h3>
                      <p>{event.description}</p>
                      {event.location && <span className="event-location">📍 {event.location}</span>}
                      <div className="event-stats">
                        <span>{event.attendee_count} attending</span>
                        <span>by {event.created_by_username}</span>
                      </div>
                    </div>
                    <div className="event-actions">
                      {event.is_attending ? (
                        <div className="attending-actions">
                          <span className="attending-badge">Attending</span>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => unattendEvent(event.id)}
                          >
                            Can't Attend
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => attendEvent(event.id)}
                        >
                          Attend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="social-suggestions">
          <div className="suggestions-card">
            <h3>🎮 Minecraft Network</h3>
            <p className="suggestions-hint">Connect with fellow miners and builders!</p>
            <Link to="/social/discover" className="btn btn-secondary btn-sm">
              Discover Players
            </Link>
          </div>

          {friends.slice(0, 5).length > 0 && (
            <div className="online-friends-card">
              <h3>Online Friends</h3>
              {friends.slice(0, 5).map((friend) => (
                <Link key={friend.id} to={`/users/${friend.id}`} className="online-friend">
                  <img src={getUserAvatar(friend)} alt={friend.username} className="friend-avatar-sm" />
                  <span className="friend-name">{friend.minecraft_username || friend.username}</span>
                  <div className="online-indicator"></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Story Modal */}
      {showStoryModal && (
        <div className="modal-overlay" onClick={() => setShowStoryModal(false)}>
          <div className="story-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Story</h3>
              <button className="modal-close" onClick={() => setShowStoryModal(false)}>×</button>
            </div>
            <div className="story-preview" style={{backgroundColor: storyBackgroundColor}}>
              <p>{newStoryContent || 'Your story text will appear here...'}</p>
            </div>
            <div className="story-controls">
              <div className="color-picker">
                {['#00d97e', '#6366f1', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                  <button
                    key={color}
                    className={`color-option ${storyBackgroundColor === color ? 'active' : ''}`}
                    style={{backgroundColor: color}}
                    onClick={() => setStoryBackgroundColor(color)}
                  />
                ))}
              </div>
              <textarea
                value={newStoryContent}
                onChange={(e) => setNewStoryContent(e.target.value)}
                placeholder="What's your story?"
                className="story-textarea"
                maxLength={200}
              />
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowStoryModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={createStory}
                  disabled={!newStoryContent.trim()}
                >
                  Share Story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal === 'group' && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(null)}>
          <div className="story-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Group</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(null)}>×</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;
              const privacy = formData.get('privacy') as 'public' | 'private';
              if (name.trim()) {
                createGroup(name, description, privacy);
              }
            }}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter group name..."
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Describe your group..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Privacy</label>
                <select name="privacy" className="form-input" defaultValue="public">
                  <option value="public">Public - Anyone can join</option>
                  <option value="private">Private - Invite only</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal === 'event' && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(null)}>
          <div className="story-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Event</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(null)}>×</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const title = formData.get('title') as string;
              const description = formData.get('description') as string;
              const date = formData.get('date') as string;
              const location = formData.get('location') as string;
              if (title.trim() && date) {
                createEvent(title, description, date, location || undefined);
              }
            }}>
              <div className="form-group">
                <label>Event Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter event title..."
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Describe your event..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  name="date"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Location (Optional)</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Enter location..."
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialPage;
