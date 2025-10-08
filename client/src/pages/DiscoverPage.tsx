import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './DiscoverPage.css';

interface User {
  id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  bio?: string;
  followerCount?: number;
  isFollowing?: boolean;
  is_friend?: boolean;
  friend_request_sent?: boolean;
  friend_request_received?: boolean;
  mutual_friends?: number;
}

const DiscoverPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/discover');
      // Filter out current user and get additional info
      const filteredUsers = response.data.filter((u: User) => u.id !== currentUser?.id);
      
      // Load profile info for each user
      const usersWithInfo = await Promise.all(
        filteredUsers.map(async (u: User) => {
          try {
            const profileResp = await api.get(`/social/profile/${u.id}`);
            return { ...u, ...profileResp.data };
          } catch {
            return u;
          }
        })
      );
      
      setUsers(usersWithInfo);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (userId: number) => {
    try {
      const response = await api.post(`/social/follow/${userId}`);
      setUsers(users.map(u => 
        u.id === userId 
          ? { 
              ...u, 
              isFollowing: response.data.following,
              followerCount: (u.followerCount || 0) + (response.data.following ? 1 : -1)
            }
          : u
      ));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      await api.post(`/social/friend-request`, { user_id: userId });
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, friend_request_sent: true }
          : u
      ));
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      if (error.response?.status === 404) {
        alert('Friend request feature is not yet implemented on the server. Please check back later!');
      } else {
        alert(error.response?.data?.error || 'Failed to send friend request');
      }
    }
  };

  const respondToFriendRequest = async (userId: number, action: 'accept' | 'decline') => {
    try {
      // This endpoint doesn't exist yet, but the UI will update optimistically
      await api.post(`/social/friend-request/respond`, { user_id: userId, action });
      setUsers(users.map(u => 
        u.id === userId 
          ? { 
              ...u, 
              friend_request_received: false,
              is_friend: action === 'accept'
            }
          : u
      ));
    } catch (error: any) {
      console.error('Error responding to friend request:', error);
      if (error.response?.status === 404) {
        alert('Friend request response feature is not yet implemented on the server. Please use the social page to respond to requests.');
      } else {
        alert(error.response?.data?.error || 'Failed to respond to friend request');
      }
    }
  };

  const getUserAvatar = (u: User) => {
    // Use minecraft_username if available, otherwise fallback to username
    const username = u.minecraft_username || u.username;
    // Use "maid" if the username is "admin"
    const displayUsername = username === 'admin' ? 'maid' : username;
    return `https://mc-heads.net/head/${displayUsername}`;
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(query) ||
      (u.minecraft_username && u.minecraft_username.toLowerCase().includes(query)) ||
      (u.bio && u.bio.toLowerCase().includes(query))
    );
  });

  if (!currentUser) return null;

  return (
    <div className="discover-page">
      <div className="discover-container">
        <div className="discover-header">
          <h1>Discover Users</h1>
          <p className="discover-subtitle">Find and follow other members of the community</p>
        </div>

        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search users by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="discover-search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        {loading ? (
          <div className="discover-loading">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="no-users">
            <div className="empty-icon">👥</div>
            <h3>No users found</h3>
            <p>Try adjusting your search</p>
          </div>
        ) : (
          <div className="users-grid">
            {filteredUsers.map((u) => (
              <div key={u.id} className="user-card">
                <Link to={`/users/${u.id}`} className="user-card-avatar-link">
                  <img src={getUserAvatar(u)} alt={u.username} className="user-card-avatar" />
                </Link>
                
                <div className="user-card-info">
                  <Link to={`/users/${u.id}`} className="user-card-name">
                    {u.minecraft_username || u.username}
                  </Link>
                  {u.minecraft_username && u.username !== u.minecraft_username && (
                    <span className="user-card-handle">@{u.username}</span>
                  )}
                  {u.bio && (
                    <p className="user-card-bio">{u.bio}</p>
                  )}
                  <div className="user-card-stats">
                    {u.followerCount !== undefined && (
                      <span>{u.followerCount} {u.followerCount === 1 ? 'follower' : 'followers'}</span>
                    )}
                    {u.mutual_friends && u.mutual_friends > 0 && (
                      <span>{u.mutual_friends} mutual friends</span>
                    )}
                  </div>
                </div>

                <div className="user-card-actions">
                  {u.is_friend ? (
                    <span className="friend-badge">Friends</span>
                  ) : u.friend_request_received ? (
                    <div className="friend-request-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => respondToFriendRequest(u.id, 'accept')}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => respondToFriendRequest(u.id, 'decline')}
                      >
                        Decline
                      </button>
                    </div>
                  ) : u.friend_request_sent ? (
                    <span className="request-sent-badge">Request Sent</span>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => sendFriendRequest(u.id)}
                    >
                      Add Friend
                    </button>
                  )}
                  
                  <button
                    className={`btn ${u.isFollowing ? 'btn-secondary' : 'btn-outline'} btn-sm`}
                    onClick={() => toggleFollow(u.id)}
                  >
                    {u.isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  
                  <Link to={`/messages?user_id=${u.id}`} className="btn btn-secondary btn-sm">
                    Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
