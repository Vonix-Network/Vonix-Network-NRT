import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import UserDisplay from '../components/UserDisplay';
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
  forum_engagement_score: number;
  rank: number;
  total_donated?: number;
  donation_rank?: {
    id: string;
    name: string;
    color: string;
    textColor: string;
    icon: string;
    badge: string;
    glow: boolean;
  };
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
    
    // Use mc-heads.net API for Minecraft avatars
    const username = user.minecraft_username || user.username;
    const avatarUsername = username === 'admin' ? 'maid' : username;
    return `https://mc-heads.net/head/${avatarUsername}`;
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
        <h1 className="leaderboard-title">Reputation Leaderboard</h1>
        <p className="leaderboard-subtitle">Top players ranked by community reputation</p>
      </div>

      <div className="leaderboard-content">
        {/* Top 3 Podium - Show if we have users */}
        {page === 1 && users.length > 0 && (
          <div className="podium-container">
            {/* 2nd Place - Only show if we have at least 2 users */}
            {users.length >= 2 && (
              <div className="podium-position podium-second">
                <div className="podium-rank-number">2</div>
                <Link to={`/users/${users[1].id}`} className="podium-card">
                  <div className="podium-avatar-container">
                    <img src={getAvatarUrl(users[1])} alt={users[1].username} className="podium-avatar" />
                  </div>
                  <div className="podium-info">
                    <UserDisplay
                      username={users[1].username}
                      minecraftUsername={users[1].minecraft_username}
                      totalDonated={users[1].total_donated}
                      donationRank={users[1].donation_rank}
                      size="small"
                      className="podium-user-display"
                    />
                    <div className="podium-tier">{users[1].tierInfo.tier}</div>
                    <div className="podium-points">{users[1].reputation} pts</div>
                  </div>
                </Link>
              </div>
            )}

            {/* 1st Place - Always show if we have users */}
            <div className="podium-position podium-first">
              <div className="podium-rank-number">1</div>
              <Link to={`/users/${users[0].id}`} className="podium-card podium-winner">
                <div className="podium-avatar-container">
                  <img src={getAvatarUrl(users[0])} alt={users[0].username} className="podium-avatar" />
                  <div className="winner-crown">🏆</div>
                </div>
                <div className="podium-info">
                  <UserDisplay
                    username={users[0].username}
                    minecraftUsername={users[0].minecraft_username}
                    totalDonated={users[0].total_donated}
                    donationRank={users[0].donation_rank}
                    size="medium"
                    className="podium-user-display winner"
                  />
                  <div className="podium-tier winner-tier">{users[0].tierInfo.tier}</div>
                  <div className="podium-points winner-points">{users[0].reputation} pts</div>
                </div>
              </Link>
            </div>

            {/* 3rd Place - Only show if we have at least 3 users */}
            {users.length >= 3 && (
              <div className="podium-position podium-third">
                <div className="podium-rank-number">3</div>
                <Link to={`/users/${users[2].id}`} className="podium-card">
                  <div className="podium-avatar-container">
                    <img src={getAvatarUrl(users[2])} alt={users[2].username} className="podium-avatar" />
                  </div>
                  <div className="podium-info">
                    <UserDisplay
                      username={users[2].username}
                      minecraftUsername={users[2].minecraft_username}
                      totalDonated={users[2].total_donated}
                      donationRank={users[2].donation_rank}
                      size="small"
                      className="podium-user-display"
                    />
                    <div className="podium-tier">{users[2].tierInfo.tier}</div>
                    <div className="podium-points">{users[2].reputation} pts</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Full Rankings Table */}
        <div className="full-rankings">
          <h2 className="rankings-title">Full Rankings</h2>
          
          <div className="rankings-table">
            <div className="rankings-header">
              <div className="col-rank">RANK</div>
              <div className="col-player">PLAYER</div>
              <div className="col-tier">TIER</div>
              <div className="col-reputation">REPUTATION</div>
              <div className="col-posts">POSTS</div>
              <div className="col-engagement">FORUM ENGAGEMENT</div>
            </div>

            {users.map((user, index) => (
              <div key={user.id} className="rankings-row">
                <div className="col-rank">
                  <span className="rank-number">#{user.rank || (index + 1)}</span>
                </div>
                
                <div className="col-player">
                  <Link to={`/users/${user.id}`} className="player-link">
                    <div className="player-avatar">
                      <img src={getAvatarUrl(user)} alt={user.username} />
                    </div>
                    <UserDisplay
                      username={user.username}
                      minecraftUsername={user.minecraft_username}
                      totalDonated={user.total_donated}
                      donationRank={user.donation_rank}
                      size="small"
                      className="player-user-display"
                    />
                  </Link>
                </div>

                <div className="col-tier">
                  <span className="tier-badge" style={{ backgroundColor: user.tierInfo.color }}>
                    {user.tierInfo.tier}
                  </span>
                </div>

                <div className="col-reputation">
                  <span className="reputation-value">{user.reputation.toLocaleString()}</span>
                </div>

                <div className="col-posts">
                  <span className="posts-count">{user.post_count || user.posts_created || 0}</span>
                </div>

                <div className="col-engagement">
                  <div className="engagement-stats">
                    <div className="engagement-score">
                      <span className="score-value">{user.forum_engagement_score || 0}</span>
                      <span className="score-label">pts</span>
                    </div>
                    <div className="engagement-breakdown">
                      <span className="stat-item" title="Topics Created">📝 {user.topics_created || 0}</span>
                      <span className="stat-item" title="Posts Created">💬 {user.posts_created || 0}</span>
                      <span className="stat-item" title="Likes Received">👍 {user.likes_received || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {(page > 1 || hasMore) && (
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
        )}
      </div>
    </div>
  );
};

export default ReputationLeaderboard;
