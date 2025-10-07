import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './ReputationLeaderboard.css';

interface User {
  id: number;
  username: string;
  minecraft_username: string;
  minecraft_uuid: string;
  avatar_url: string;
  reputation: number;
  post_count: number;
  role: string;
  title: string;
  topics_created: number;
  posts_created: number;
  likes_received: number;
  best_answers: number;
  rank: number;
  tierInfo: {
    tier: string;
    icon: string;
    color: string;
  };
}

const ReputationLeaderboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const limit = 50;

  useEffect(() => {
    loadLeaderboard();
  }, [page]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const response = await api.get(`/reputation/leaderboard?limit=${limit}&offset=${offset}`);
      setUsers(response.data.users);
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (user: User) => {
    if (user.avatar_url) return user.avatar_url;
    if (user.minecraft_uuid) {
      return `https://crafatar.com/avatars/${user.minecraft_uuid}?size=128&overlay`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&size=128&background=random`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd700'; // Gold
    if (rank === 2) return '#c0c0c0'; // Silver
    if (rank === 3) return '#cd7f32'; // Bronze
    return '#6b7280';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading && page === 1) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-loading">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>🏆 Reputation Leaderboard</h1>
        <p className="leaderboard-subtitle">
          Top contributors ranked by reputation points
        </p>
      </div>

      <div className="leaderboard-content">
        {/* Top 3 Podium */}
        {page === 1 && users.length >= 3 && (
          <div className="podium">
            {/* 2nd Place */}
            <div className="podium-item podium-second">
              <Link to={`/users/${users[1].id}`} className="podium-user">
                <div className="podium-rank">🥈</div>
                <img src={getAvatarUrl(users[1])} alt={users[1].username} className="podium-avatar" />
                <div className="podium-username">{users[1].minecraft_username || users[1].username}</div>
                <div className="podium-reputation">
                  <span className="rep-icon">{users[1].tierInfo.icon}</span>
                  {users[1].reputation} pts
                </div>
                <div className="podium-tier" style={{ color: users[1].tierInfo.color }}>
                  {users[1].tierInfo.tier}
                </div>
              </Link>
            </div>

            {/* 1st Place */}
            <div className="podium-item podium-first">
              <Link to={`/users/${users[0].id}`} className="podium-user">
                <div className="podium-rank">👑</div>
                <img src={getAvatarUrl(users[0])} alt={users[0].username} className="podium-avatar" />
                <div className="podium-username">{users[0].minecraft_username || users[0].username}</div>
                <div className="podium-reputation">
                  <span className="rep-icon">{users[0].tierInfo.icon}</span>
                  {users[0].reputation} pts
                </div>
                <div className="podium-tier" style={{ color: users[0].tierInfo.color }}>
                  {users[0].tierInfo.tier}
                </div>
              </Link>
            </div>

            {/* 3rd Place */}
            <div className="podium-item podium-third">
              <Link to={`/users/${users[2].id}`} className="podium-user">
                <div className="podium-rank">🥉</div>
                <img src={getAvatarUrl(users[2])} alt={users[2].username} className="podium-avatar" />
                <div className="podium-username">{users[2].minecraft_username || users[2].username}</div>
                <div className="podium-reputation">
                  <span className="rep-icon">{users[2].tierInfo.icon}</span>
                  {users[2].reputation} pts
                </div>
                <div className="podium-tier" style={{ color: users[2].tierInfo.color }}>
                  {users[2].tierInfo.tier}
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="leaderboard-table">
          <div className="table-header">
            <div className="col-rank">Rank</div>
            <div className="col-user">User</div>
            <div className="col-reputation">Reputation</div>
            <div className="col-tier">Tier</div>
            <div className="col-stats">Stats</div>
          </div>

          {users.map((user) => (
            <div key={user.id} className="table-row">
              <div className="col-rank">
                <span className="rank-badge" style={{ color: getRankColor(user.rank) }}>
                  {getRankIcon(user.rank)}
                </span>
              </div>
              
              <div className="col-user">
                <Link to={`/users/${user.id}`} className="user-link">
                  <img src={getAvatarUrl(user)} alt={user.username} className="user-avatar" />
                  <div className="user-info">
                    <div className="username">
                      {user.minecraft_username || user.username}
                      {user.role === 'admin' && <span className="role-badge admin">Admin</span>}
                    </div>
                    {user.title && <div className="user-title">{user.title}</div>}
                  </div>
                </Link>
              </div>

              <div className="col-reputation">
                <span className="rep-value">{user.reputation}</span>
                <span className="rep-label">points</span>
              </div>

              <div className="col-tier">
                <span className="tier-badge" style={{ borderColor: user.tierInfo.color }}>
                  <span className="tier-icon">{user.tierInfo.icon}</span>
                  <span className="tier-name" style={{ color: user.tierInfo.color }}>
                    {user.tierInfo.tier}
                  </span>
                </span>
              </div>

              <div className="col-stats">
                <div className="stats-grid">
                  <span title="Topics Created">📝 {user.topics_created || 0}</span>
                  <span title="Posts Created">💬 {user.posts_created || 0}</span>
                  <span title="Likes Received">❤️ {user.likes_received || 0}</span>
                  {user.best_answers > 0 && (
                    <span title="Best Answers">✅ {user.best_answers}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="leaderboard-pagination">
          {page > 1 && (
            <button onClick={() => setPage(page - 1)} className="btn btn-secondary">
              Previous
            </button>
          )}
          <span className="page-info">Page {page}</span>
          {hasMore && (
            <button onClick={() => setPage(page + 1)} className="btn btn-secondary">
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReputationLeaderboard;
