import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './GroupPage.css';

interface GroupMember {
  id: number;
  username: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  role: string;
  joined_at: string;
}

interface GroupDetails {
  id: number;
  name: string;
  description: string;
  privacy: string;
  created_at: string;
  created_by_username: string;
  member_count: number;
  user_role?: string;
  is_member: boolean;
  members: GroupMember[];
}

const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (groupId) {
      loadGroup();
    }
  }, [user, groupId, navigate]);

  const loadGroup = async () => {
    try {
      const response = await api.get(`/social/groups/${groupId}`);
      setGroup(response.data);
    } catch (error: any) {
      console.error('Error loading group:', error);
      if (error.response?.status === 404) {
        navigate('/social?tab=groups');
      }
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!group) return;
    try {
      await api.post(`/social/groups/${group.id}/join`);
      await loadGroup(); // Reload to get updated member list
    } catch (error: any) {
      console.error('Error joining group:', error);
      alert(error.response?.data?.error || 'Failed to join group');
    }
  };

  const leaveGroup = async () => {
    if (!group) return;
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    
    try {
      await api.post(`/social/groups/${group.id}/leave`);
      navigate('/social?tab=groups');
    } catch (error: any) {
      console.error('Error leaving group:', error);
      alert(error.response?.data?.error || 'Failed to leave group');
    }
  };

  const getUserAvatar = (member: GroupMember) => {
    const username = member.minecraft_username || member.username;
    const displayUsername = username === 'admin' ? 'maid' : username;
    return `https://mc-heads.net/head/${displayUsername}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'moderator': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="group-loading">
        <div className="spinner"></div>
        <p>Loading group...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-not-found">
        <h2>Group not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/social?tab=groups')}>
          Back to Groups
        </button>
      </div>
    );
  }

  return (
    <div className="group-page minecraft-theme">
      <div className="group-container">
        {/* Group Header */}
        <div className="group-header">
          <div className="group-info">
            <h1 className="group-name">{group.name}</h1>
            <div className="group-meta">
              <span className={`privacy-badge ${group.privacy}`}>
                {group.privacy}
              </span>
              <span className="member-count">{group.member_count} members</span>
              <span className="created-date">
                Created {formatTime(group.created_at)} by {group.created_by_username}
              </span>
            </div>
            {group.description && (
              <p className="group-description">{group.description}</p>
            )}
          </div>

          <div className="group-actions">
            {group.is_member ? (
              <div className="member-controls">
                <span className="member-status">
                  Member {group.user_role && `(${group.user_role})`}
                </span>
                {group.user_role !== 'admin' && (
                  <button className="btn btn-secondary" onClick={leaveGroup}>
                    Leave Group
                  </button>
                )}
              </div>
            ) : (
              <button className="btn btn-primary" onClick={joinGroup}>
                Join Group
              </button>
            )}
          </div>
        </div>

        {/* Group Members */}
        <div className="group-members-section">
          <h2>Members ({group.member_count})</h2>
          <div className="members-grid">
            {group.members.map((member) => (
              <div key={member.id} className="member-card">
                <img 
                  src={getUserAvatar(member)} 
                  alt={member.username} 
                  className="member-avatar"
                />
                <div className="member-info">
                  <span className="member-name">
                    {member.minecraft_username || member.username}
                  </span>
                  <span 
                    className="member-role"
                    style={{ color: getRoleColor(member.role) }}
                  >
                    {member.role}
                  </span>
                  <span className="member-joined">
                    Joined {formatTime(member.joined_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;
