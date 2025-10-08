import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ModeratorDashboard.css';

interface ModeratorStats {
  totalTopics: number;
  totalPosts: number;
  deletedPosts: number;
  reportedPosts: number;
  recentTopics: number;
  recentPosts: number;
  recentReports: number;
  totalUsers: number;
  bannedUsers: number;
  warnedUsers: number;
  socialPosts: number;
  socialReports: number;
}

interface Report {
  id: number;
  action: string;
  reason: string;
  created_at: string;
  post_id?: number;
  topic_id?: number;
  reporter_username: string;
  post_content?: string;
  topic_title?: string;
  post_author_username?: string;
}

interface Activity {
  id: number;
  action: string;
  reason: string;
  created_at: string;
  moderator_username: string;
  target_username: string;
  target_content: string;
}

interface UserLookup {
  user: {
    id: number;
    username: string;
    role: string;
    created_at: string;
    minecraft_username?: string;
  };
  forumStats: {
    topicsCreated: number;
    postsCreated: number;
    deletedPosts: number;
    reputation: number;
  };
  moderationHistory: Array<{
    action: string;
    reason: string;
    created_at: string;
    moderator_username: string;
  }>;
  activeWarnings: Array<{
    reason: string;
    created_at: string;
    moderator_username: string;
  }>;
  activeBans: Array<{
    reason: string;
    created_at: string;
    expires_at?: string;
    moderator_username: string;
  }>;
}

const ModeratorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'activity' | 'lookup'>('dashboard');
  const [stats, setStats] = useState<ModeratorStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userLookup, setUserLookup] = useState<UserLookup | null>(null);
  const [lookupUsername, setLookupUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    if (user?.role !== 'moderator' && user?.role !== 'admin') {
      return;
    }
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/moderator/dashboard');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading moderator dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/moderator/pending-reports');
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      setLoading(true);
      const response = await api.get('/moderator/recent-activity');
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveReport = async (reportId: number, action: string, reason: string, duration?: number) => {
    try {
      setResolving(prev => ({ ...prev, [reportId]: true }));
      
      const payload: any = { action, reason };
      if (duration) payload.duration = duration;

      await api.post(`/moderator/resolve-report/${reportId}`, payload);
      
      // Remove resolved report from list
      setReports(prev => prev.filter(r => r.id !== reportId));
      
      alert(`Report resolved with action: ${action}`);
    } catch (error: any) {
      console.error('Error resolving report:', error);
      alert(error.response?.data?.error || 'Failed to resolve report');
    } finally {
      setResolving(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const lookupUser = async () => {
    if (!lookupUsername.trim()) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/moderator/user-lookup/${encodeURIComponent(lookupUsername.trim())}`);
      setUserLookup(response.data);
    } catch (error: any) {
      console.error('Error looking up user:', error);
      alert(error.response?.data?.error || 'Failed to lookup user');
      setUserLookup(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'reports' && reports.length === 0) {
      loadReports();
    } else if (tab === 'activity' && activities.length === 0) {
      loadActivity();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (user?.role !== 'moderator' && user?.role !== 'admin') {
    return (
      <div className="moderator-dashboard">
        <div className="access-denied">
          <h1>Access Denied</h1>
          <p>You need moderator or admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="moderator-dashboard">
      <div className="moderator-header">
        <h1>🛡️ Moderator Dashboard</h1>
        <p>Welcome, {user?.username}! Manage forum and social content.</p>
      </div>

      <div className="moderator-tabs">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => handleTabChange('reports')}
        >
          🚨 Reports ({reports.length})
        </button>
        <button 
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => handleTabChange('activity')}
        >
          📋 Activity
        </button>
        <button 
          className={`tab ${activeTab === 'lookup' ? 'active' : ''}`}
          onClick={() => handleTabChange('lookup')}
        >
          🔍 User Lookup
        </button>
      </div>

      <div className="moderator-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-tab">
            {loading ? (
              <div className="loading">Loading dashboard...</div>
            ) : stats ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">💬</div>
                    <div className="stat-content">
                      <div className="stat-value">{stats.totalPosts}</div>
                      <div className="stat-label">Total Posts</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-content">
                      <div className="stat-value">{stats.totalTopics}</div>
                      <div className="stat-label">Total Topics</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">🗑️</div>
                    <div className="stat-content">
                      <div className="stat-value">{stats.deletedPosts}</div>
                      <div className="stat-label">Deleted Posts</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">🚨</div>
                    <div className="stat-content">
                      <div className="stat-value">{stats.reportedPosts}</div>
                      <div className="stat-label">Pending Reports</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <div className="stat-value">{stats.totalUsers}</div>
                      <div className="stat-label">Total Users</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">🚫</div>
                    <div className="stat-content">
                      <div className="stat-value">{stats.bannedUsers}</div>
                      <div className="stat-label">Banned Users</div>
                    </div>
                  </div>
                </div>

                <div className="recent-activity-summary">
                  <h3>Recent Activity (24 hours)</h3>
                  <div className="activity-stats">
                    <div className="activity-stat">
                      <span className="activity-icon">📝</span>
                      <span>{stats.recentTopics} new topics</span>
                    </div>
                    <div className="activity-stat">
                      <span className="activity-icon">💬</span>
                      <span>{stats.recentPosts} new posts</span>
                    </div>
                    <div className="activity-stat">
                      <span className="activity-icon">🚨</span>
                      <span>{stats.recentReports} new reports</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="error">Failed to load dashboard statistics</div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-tab">
            <h3>Pending Reports</h3>
            {loading ? (
              <div className="loading">Loading reports...</div>
            ) : reports.length > 0 ? (
              <div className="reports-list">
                {reports.map(report => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <div className="report-info">
                        <strong>Report #{report.id}</strong>
                        <span className="report-date">{formatDate(report.created_at)}</span>
                      </div>
                      <div className="report-reporter">
                        Reported by: <strong>{report.reporter_username}</strong>
                      </div>
                    </div>
                    
                    <div className="report-content">
                      <div className="report-reason">
                        <strong>Reason:</strong> {report.reason}
                      </div>
                      
                      {report.post_content && (
                        <div className="reported-content">
                          <strong>Reported Content:</strong>
                          <div className="content-preview">{report.post_content}</div>
                          <div className="content-author">
                            By: <strong>{report.post_author_username}</strong>
                          </div>
                        </div>
                      )}
                      
                      {report.topic_title && (
                        <div className="reported-topic">
                          <strong>Topic:</strong> {report.topic_title}
                        </div>
                      )}
                    </div>
                    
                    <div className="report-actions">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => resolveReport(report.id, 'dismiss', 'No action needed')}
                        disabled={resolving[report.id]}
                      >
                        Dismiss
                      </button>
                      <button 
                        className="btn btn-warning"
                        onClick={() => {
                          const reason = prompt('Warning reason:');
                          if (reason) resolveReport(report.id, 'warn_user', reason);
                        }}
                        disabled={resolving[report.id]}
                      >
                        Warn User
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => {
                          const reason = prompt('Deletion reason:');
                          if (reason) resolveReport(report.id, 'delete_post', reason);
                        }}
                        disabled={resolving[report.id]}
                      >
                        Delete Post
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => {
                          const reason = prompt('Ban reason:');
                          const duration = prompt('Ban duration (days, leave empty for permanent):');
                          if (reason) resolveReport(report.id, 'ban_user', reason, duration ? parseInt(duration) : undefined);
                        }}
                        disabled={resolving[report.id]}
                      >
                        Ban User
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No pending reports</div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-tab">
            <h3>Recent Moderation Activity</h3>
            {loading ? (
              <div className="loading">Loading activity...</div>
            ) : activities.length > 0 ? (
              <div className="activity-list">
                {activities.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-header">
                      <strong>{activity.moderator_username}</strong>
                      <span className="activity-action">{activity.action.replace('_', ' ')}</span>
                      <span className="activity-target">{activity.target_username}</span>
                      <span className="activity-date">{formatDate(activity.created_at)}</span>
                    </div>
                    <div className="activity-reason">
                      <strong>Reason:</strong> {activity.reason}
                    </div>
                    {activity.target_content && activity.target_content !== 'N/A' && (
                      <div className="activity-content">
                        <strong>Content:</strong> {activity.target_content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No recent activity</div>
            )}
          </div>
        )}

        {activeTab === 'lookup' && (
          <div className="lookup-tab">
            <h3>User Lookup</h3>
            <div className="lookup-form">
              <input
                type="text"
                placeholder="Enter username or Minecraft username"
                value={lookupUsername}
                onChange={(e) => setLookupUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && lookupUser()}
              />
              <button onClick={lookupUser} disabled={loading}>
                {loading ? 'Searching...' : 'Lookup User'}
              </button>
            </div>

            {userLookup && (
              <div className="user-lookup-results">
                <div className="user-info">
                  <h4>User Information</h4>
                  <div className="info-grid">
                    <div><strong>Username:</strong> {userLookup.user.username}</div>
                    <div><strong>Role:</strong> {userLookup.user.role}</div>
                    <div><strong>Joined:</strong> {formatDate(userLookup.user.created_at)}</div>
                    {userLookup.user.minecraft_username && (
                      <div><strong>Minecraft:</strong> {userLookup.user.minecraft_username}</div>
                    )}
                  </div>
                </div>

                <div className="forum-stats">
                  <h4>Forum Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-value">{userLookup.forumStats.topicsCreated}</span>
                      <span className="stat-label">Topics Created</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{userLookup.forumStats.postsCreated}</span>
                      <span className="stat-label">Posts Created</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{userLookup.forumStats.deletedPosts}</span>
                      <span className="stat-label">Deleted Posts</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{userLookup.forumStats.reputation}</span>
                      <span className="stat-label">Reputation</span>
                    </div>
                  </div>
                </div>

                {userLookup.activeWarnings.length > 0 && (
                  <div className="warnings">
                    <h4>Active Warnings</h4>
                    {userLookup.activeWarnings.map((warning, index) => (
                      <div key={index} className="warning-item">
                        <div><strong>Reason:</strong> {warning.reason}</div>
                        <div><strong>Date:</strong> {formatDate(warning.created_at)}</div>
                        <div><strong>By:</strong> {warning.moderator_username}</div>
                      </div>
                    ))}
                  </div>
                )}

                {userLookup.activeBans.length > 0 && (
                  <div className="bans">
                    <h4>Active Bans</h4>
                    {userLookup.activeBans.map((ban, index) => (
                      <div key={index} className="ban-item">
                        <div><strong>Reason:</strong> {ban.reason}</div>
                        <div><strong>Date:</strong> {formatDate(ban.created_at)}</div>
                        <div><strong>Expires:</strong> {ban.expires_at ? formatDate(ban.expires_at) : 'Permanent'}</div>
                        <div><strong>By:</strong> {ban.moderator_username}</div>
                      </div>
                    ))}
                  </div>
                )}

                {userLookup.moderationHistory.length > 0 && (
                  <div className="moderation-history">
                    <h4>Moderation History</h4>
                    {userLookup.moderationHistory.slice(0, 10).map((action, index) => (
                      <div key={index} className="history-item">
                        <div><strong>Action:</strong> {action.action.replace('_', ' ')}</div>
                        <div><strong>Reason:</strong> {action.reason}</div>
                        <div><strong>Date:</strong> {formatDate(action.created_at)}</div>
                        <div><strong>By:</strong> {action.moderator_username}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorDashboard;
