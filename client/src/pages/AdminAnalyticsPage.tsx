import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Stats {
  users: {
    total: number;
    new_today: number;
    new_week: number;
    new_month: number;
    active_today: number;
  };
  forum: {
    total_topics: number;
    total_posts: number;
    topics_today: number;
    posts_today: number;
    topics_week: number;
    posts_week: number;
  };
  servers: {
    total: number;
    online: number;
  };
  blog: {
    total_posts: number;
    published: number;
  };
  registration: {
    total_codes: number;
    used_codes: number;
    active_codes: number;
  };
}

interface ActivityData {
  date: string;
  count: number;
}

const AdminAnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [userActivity, setUserActivity] = useState<{ registrations: ActivityData[], active_users: ActivityData[] } | null>(null);
  const [forumActivity, setForumActivity] = useState<{ topics: ActivityData[], posts: ActivityData[] } | null>(null);
  const [topUsers, setTopUsers] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, userActRes, forumActRes, topUsersRes, recentActRes] = await Promise.all([
        axios.get(`${API_URL}/admin/analytics/overview`, { headers }),
        axios.get(`${API_URL}/admin/analytics/user-activity?period=${period}`, { headers }),
        axios.get(`${API_URL}/admin/analytics/forum-activity?period=${period}`, { headers }),
        axios.get(`${API_URL}/admin/analytics/top-users?limit=10`, { headers }),
        axios.get(`${API_URL}/admin/analytics/recent-activity?limit=15`, { headers })
      ]);

      setStats(statsRes.data);
      setUserActivity(userActRes.data);
      setForumActivity(forumActRes.data);
      setTopUsers(topUsersRes.data);
      setRecentActivity(recentActRes.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="manage-section">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">
            <span className="title-icon">📊</span>
            <span className="title-text">Analytics Dashboard</span>
          </h1>
          <p className="section-subtitle">
            Comprehensive analytics and insights about your community
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      {stats && (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{stats.users.total}</div>
                <div className="stat-label">Total Users</div>
                <small>+{stats.users.new_today} today, +{stats.users.new_week} this week</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <div className="stat-content">
                <div className="stat-value">{stats.forum.total_topics}</div>
                <div className="stat-label">Forum Topics</div>
                <small>+{stats.forum.topics_today} today, +{stats.forum.topics_week} this week</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <div className="stat-value">{stats.forum.total_posts}</div>
                <div className="stat-label">Forum Posts</div>
                <small>+{stats.forum.posts_today} today, +{stats.forum.posts_week} this week</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎮</div>
              <div className="stat-content">
                <div className="stat-value">{stats.servers.online}/{stats.servers.total}</div>
                <div className="stat-label">Servers Online</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📰</div>
              <div className="stat-content">
                <div className="stat-value">{stats.blog.published}</div>
                <div className="stat-label">Published Blog Posts</div>
                <small>{stats.blog.total_posts} total</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✨</div>
              <div className="stat-content">
                <div className="stat-value">{stats.users.active_today}</div>
                <div className="stat-label">Active Users Today</div>
                <small>{Math.round((stats.users.active_today / stats.users.total) * 100)}% of total</small>
              </div>
            </div>
          </div>

          {/* Period Selector */}
          <div className="settings-card" style={{marginTop: '2rem'}}>
            <div className="settings-card-header">
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <label style={{fontWeight: 600}}>Time Period:</label>
                <select className="form-control" style={{width: 'auto'}} value={period} onChange={(e) => setPeriod(e.target.value)}>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="60">Last 60 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activity Charts */}
          <div className="settings-card" style={{marginTop: '2rem'}}>
            <div className="settings-card-header">
              <h2 className="settings-card-title">📈 User Activity</h2>
            </div>
            <div className="settings-card-body">
              <div className="chart-container">
                <div className="simple-chart">
                  <h3>New Registrations</h3>
                  {userActivity?.registrations.map((item, idx) => (
                    <div key={idx} className="chart-bar">
                      <span className="chart-label">{new Date(item.date).toLocaleDateString()}</span>
                      <div className="chart-bar-fill" style={{width: `${(item.count / Math.max(...userActivity.registrations.map(i => i.count))) * 100}%`}}>
                        <span className="chart-value">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="simple-chart">
                  <h3>Active Users</h3>
                  {userActivity?.active_users.map((item, idx) => (
                    <div key={idx} className="chart-bar">
                      <span className="chart-label">{new Date(item.date).toLocaleDateString()}</span>
                      <div className="chart-bar-fill" style={{width: `${(item.count / Math.max(...userActivity.active_users.map(i => i.count))) * 100}%`}}>
                        <span className="chart-value">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="settings-card" style={{marginTop: '2rem'}}>
            <div className="settings-card-header">
              <h2 className="settings-card-title">💬 Forum Activity</h2>
            </div>
            <div className="settings-card-body">
              <div className="chart-container">
                <div className="simple-chart">
                  <h3>Topics Created</h3>
                  {forumActivity?.topics.map((item, idx) => (
                    <div key={idx} className="chart-bar">
                      <span className="chart-label">{new Date(item.date).toLocaleDateString()}</span>
                      <div className="chart-bar-fill" style={{width: `${(item.count / Math.max(...forumActivity.topics.map(i => i.count))) * 100}%`}}>
                        <span className="chart-value">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="simple-chart">
                  <h3>Posts Created</h3>
                  {forumActivity?.posts.map((item, idx) => (
                    <div key={idx} className="chart-bar">
                      <span className="chart-label">{new Date(item.date).toLocaleDateString()}</span>
                      <div className="chart-bar-fill" style={{width: `${(item.count / Math.max(...forumActivity.posts.map(i => i.count))) * 100}%`}}>
                        <span className="chart-value">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Users */}
          {topUsers && (
            <div className="settings-card" style={{marginTop: '2rem'}}>
              <div className="settings-card-header">
                <h2 className="settings-card-title">🏆 Top Users</h2>
              </div>
              <div className="settings-card-body">
                <div className="top-users-grid">
                  <div className="top-users-card">
                    <h3>By Reputation</h3>
                    <div className="user-list">
                      {topUsers.by_reputation.map((user: any, idx: number) => (
                        <div key={user.id} className="user-item">
                          <span className="rank">#{idx + 1}</span>
                          <span className="username">{user.username}</span>
                          <span className="value">⭐ {user.reputation}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="top-users-card">
                    <h3>By Posts</h3>
                    <div className="user-list">
                      {topUsers.by_posts.map((user: any, idx: number) => (
                        <div key={user.id} className="user-item">
                          <span className="rank">#{idx + 1}</span>
                          <span className="username">{user.username}</span>
                          <span className="value">📝 {user.post_count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="top-users-card">
                    <h3>By Topics</h3>
                    <div className="user-list">
                      {topUsers.by_topics.map((user: any, idx: number) => (
                        <div key={user.id} className="user-item">
                          <span className="rank">#{idx + 1}</span>
                          <span className="username">{user.username}</span>
                          <span className="value">💬 {user.topic_count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="settings-card" style={{marginTop: '2rem'}}>
            <div className="settings-card-header">
              <h2 className="settings-card-title">🕒 Recent Activity</h2>
            </div>
            <div className="settings-card-body">
              <div className="activity-feed">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="activity-item">
                    <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                    <div className="activity-content">
                      <div className="activity-text">
                        {getActivityText(activity)}
                      </div>
                      <div className="activity-time">
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function getActivityIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'user_registered': '👤',
    'topic_created': '💬',
    'post_created': '📝',
    'blog_post_created': '📰'
  };
  return icons[type] || '•';
}

function getActivityText(activity: any): string {
  switch (activity.type) {
    case 'user_registered':
      return `${activity.username} joined the community`;
    case 'topic_created':
      return `${activity.username} created topic "${activity.title}"`;
    case 'post_created':
      return `${activity.username} replied in "${activity.topic_title}"`;
    case 'blog_post_created':
      return `${activity.username} published blog post "${activity.title}"`;
    default:
      return 'Activity occurred';
  }
}

export default AdminAnalyticsPage;
