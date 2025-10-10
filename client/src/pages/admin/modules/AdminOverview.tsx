import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../../context/AdminContext';
import { formatTimeAgo } from '../../../utils/bbCodeParser';
import './AdminOverview.css';

interface QuickStat {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  link?: string;
}

interface RecentActivity {
  id: string;
  type: 'user_join' | 'post_create' | 'donation' | 'report' | 'ban' | 'system';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  action?: string;
  actionUrl?: string;
}

const AdminOverview: React.FC = () => {
  const { state, actions } = useAdmin();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      
      // Load recent activity and alerts
      const [activityRes, alertsRes] = await Promise.all([
        fetch('/admin/activity/recent?limit=10'),
        fetch('/admin/alerts/active')
      ]);

      if (activityRes.ok) {
        const activity = await activityRes.json();
        setRecentActivity(activity);
      }

      if (alertsRes.ok) {
        const alerts = await alertsRes.json();
        setSystemAlerts(alerts);
      }
    } catch (error) {
      console.error('Failed to load overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickStats: QuickStat[] = [
    {
      id: 'total_users',
      label: 'Total Users',
      value: state.stats?.users.total || 0,
      change: 12.5,
      changeType: 'increase',
      icon: '👥',
      color: '#3b82f6',
      link: '/admin/users/list'
    },
    {
      id: 'active_today',
      label: 'Active Today',
      value: state.stats?.users.active_today || 0,
      change: 8.3,
      changeType: 'increase',
      icon: '🟢',
      color: '#10b981',
      link: '/admin/users/activity'
    },
    {
      id: 'revenue_month',
      label: 'Revenue (Month)',
      value: state.stats?.revenue.this_month ? `$${state.stats.revenue.this_month.toFixed(2)}` : '$0.00',
      change: 15.7,
      changeType: 'increase',
      icon: '💰',
      color: '#f59e0b',
      link: '/admin/analytics/revenue'
    },
    {
      id: 'pending_reports',
      label: 'Pending Reports',
      value: state.stats?.content.reports_pending || 0,
      change: -5.2,
      changeType: 'decrease',
      icon: '🚨',
      color: '#ef4444',
      link: '/admin/content/reports'
    },
    {
      id: 'system_health',
      label: 'System Health',
      value: state.metrics ? `${(100 - (state.metrics.server.cpu_usage + state.metrics.server.memory_usage) / 2).toFixed(1)}%` : 'N/A',
      change: 2.1,
      changeType: 'increase',
      icon: '💓',
      color: '#8b5cf6',
      link: '/admin/system/health'
    },
    {
      id: 'response_time',
      label: 'Avg Response',
      value: state.metrics ? `${state.metrics.application.avg_response_time}ms` : 'N/A',
      change: -8.4,
      changeType: 'decrease',
      icon: '⚡',
      color: '#06b6d4',
      link: '/admin/system/performance'
    }
  ];

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'user_join': return '👋';
      case 'post_create': return '📝';
      case 'donation': return '💎';
      case 'report': return '🚨';
      case 'ban': return '🔒';
      case 'system': return '⚙️';
      default: return '📋';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'user_join': return '#10b981';
      case 'post_create': return '#3b82f6';
      case 'donation': return '#f59e0b';
      case 'report': return '#ef4444';
      case 'ban': return '#dc2626';
      case 'system': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity?: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="admin-overview loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-overview">
      {/* Header */}
      <div className="overview-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {state.currentAdmin?.username}! Here's what's happening with your platform.</p>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={() => {
              actions.refreshData();
              loadOverviewData();
            }}
          >
            🔄 Refresh
          </button>
          <Link to="/admin/system/health" className="health-btn">
            📊 System Monitor
          </Link>
        </div>
      </div>

      {/* Critical Alerts */}
      {systemAlerts.filter(a => a.type === 'error').length > 0 && (
        <div className="critical-alerts">
          <div className="alert-header">
            <h2>🚨 Critical Alerts</h2>
            <span className="alert-count">
              {systemAlerts.filter(a => a.type === 'error').length} active
            </span>
          </div>
          <div className="alerts-list">
            {systemAlerts
              .filter(a => a.type === 'error')
              .slice(0, 3)
              .map((alert) => (
                <div key={alert.id} className="alert-item critical">
                  <div className="alert-content">
                    <div className="alert-title">{alert.title}</div>
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-time">{formatTimeAgo(alert.timestamp)}</div>
                  </div>
                  {alert.action && alert.actionUrl && (
                    <Link to={alert.actionUrl} className="alert-action">
                      {alert.action}
                    </Link>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="quick-stats-grid">
        {quickStats.map((stat) => (
          <div key={stat.id} className="stat-card" style={{ borderTopColor: stat.color }}>
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-change">
                <span className={`change-value ${stat.changeType}`}>
                  {stat.changeType === 'increase' ? '+' : ''}
                  {stat.change}%
                </span>
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
            {stat.link && (
              <Link to={stat.link} className="stat-link">
                View Details →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="overview-grid">
        {/* System Health */}
        <div className="overview-card system-health">
          <div className="card-header">
            <h3>🖥️ System Health</h3>
            <Link to="/admin/system/health" className="card-action">View Details</Link>
          </div>
          <div className="health-metrics">
            {state.metrics ? (
              <>
                <div className="health-metric">
                  <div className="metric-label">CPU Usage</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ 
                        width: `${state.metrics.server.cpu_usage}%`,
                        backgroundColor: state.metrics.server.cpu_usage > 80 ? '#ef4444' : '#10b981'
                      }}
                    ></div>
                  </div>
                  <div className="metric-value">{state.metrics.server.cpu_usage.toFixed(1)}%</div>
                </div>
                
                <div className="health-metric">
                  <div className="metric-label">Memory Usage</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ 
                        width: `${state.metrics.server.memory_usage}%`,
                        backgroundColor: state.metrics.server.memory_usage > 85 ? '#ef4444' : '#10b981'
                      }}
                    ></div>
                  </div>
                  <div className="metric-value">{state.metrics.server.memory_usage.toFixed(1)}%</div>
                </div>
                
                <div className="health-metric">
                  <div className="metric-label">Database Response</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ 
                        width: `${Math.min(state.metrics.database.avg_response_time / 10, 100)}%`,
                        backgroundColor: state.metrics.database.avg_response_time > 500 ? '#ef4444' : '#10b981'
                      }}
                    ></div>
                  </div>
                  <div className="metric-value">{state.metrics.database.avg_response_time}ms</div>
                </div>
              </>
            ) : (
              <div className="no-data">System metrics unavailable</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="overview-card recent-activity">
          <div className="card-header">
            <h3>📋 Recent Activity</h3>
            <Link to="/admin/logs" className="card-action">View All</Link>
          </div>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div 
                    className="activity-icon"
                    style={{ backgroundColor: `${getActivityColor(activity.type)}20`, color: getActivityColor(activity.type) }}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-description">{activity.description}</div>
                    <div className="activity-meta">
                      {activity.user && <span className="activity-user">by {activity.user}</span>}
                      <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                  {activity.severity && (
                    <div 
                      className="activity-severity"
                      style={{ backgroundColor: getSeverityColor(activity.severity) }}
                    >
                      {activity.severity}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-data">No recent activity</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overview-card quick-actions">
          <div className="card-header">
            <h3>⚡ Quick Actions</h3>
          </div>
          <div className="actions-grid">
            <Link to="/admin/users/list" className="action-btn">
              <div className="action-icon">👥</div>
              <div className="action-label">Manage Users</div>
            </Link>
            
            <Link to="/admin/content/reports" className="action-btn">
              <div className="action-icon">🚨</div>
              <div className="action-label">Review Reports</div>
            </Link>
            
            <Link to="/admin/analytics/overview" className="action-btn">
              <div className="action-icon">📊</div>
              <div className="action-label">View Analytics</div>
            </Link>
            
            <Link to="/admin/system/backups" className="action-btn">
              <div className="action-icon">💾</div>
              <div className="action-label">System Backup</div>
            </Link>
            
            <Link to="/admin/settings/general" className="action-btn">
              <div className="action-icon">⚙️</div>
              <div className="action-label">Settings</div>
            </Link>
            
            <Link to="/admin/security/overview" className="action-btn">
              <div className="action-icon">🔒</div>
              <div className="action-label">Security Center</div>
            </Link>
          </div>
        </div>

        {/* Donation Ranks Management */}
        <div className="overview-card donation-ranks">
          <div className="card-header">
            <h3>💎 Donation Ranks</h3>
            <Link to="/admin/ranks" className="card-action">Manage Ranks</Link>
          </div>
          <div className="ranks-summary">
            <div className="rank-stat">
              <div className="rank-label">Monthly Revenue</div>
              <div className="rank-value">${state.stats?.revenue.this_month?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="rank-stat">
              <div className="rank-label">Active Subscribers</div>
              <div className="rank-value">{state.stats?.users.total || 0}</div>
            </div>
            <div className="rank-stat">
              <div className="rank-label">Avg Donation</div>
              <div className="rank-value">${state.stats?.revenue.avg_donation?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
          <div className="ranks-actions">
            <Link to="/admin/ranks/settings" className="rank-action">
              ⚙️ Rank Settings
            </Link>
            <Link to="/admin/ranks/users" className="rank-action">
              👥 User Management
            </Link>
            <Link to="/admin/ranks/history" className="rank-action">
              📋 Audit Trail
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
