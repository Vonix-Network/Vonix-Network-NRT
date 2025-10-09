import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { fetchCached } from '../../utils/apiHelpers';
import './AdminMetrics.css';

interface MetricsData {
  users: {
    total: number;
    active: number;
    new_today: number;
    new_this_week: number;
    growth_rate: number;
  };
  content: {
    posts: number;
    comments: number;
    forum_topics: number;
    forum_posts: number;
  };
  engagement: {
    daily_active_users: number;
    avg_session_duration: number;
    page_views: number;
    bounce_rate: number;
  };
  revenue: {
    total: number;
    monthly: number;
    transactions: number;
    avg_donation: number;
  };
  system: {
    uptime: number;
    response_time: number;
    error_rate: number;
    memory_usage: number;
  };
}

interface TimeSeriesData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

const AdminMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [userGrowth, setUserGrowth] = useState<TimeSeriesData | null>(null);
  const [revenueData, setRevenueData] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [refreshInterval, setRefreshInterval] = useState<number>(300000); // 5 minutes

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Load cached metrics data
      const [metricsRes, growthRes, revenueRes] = await Promise.all([
        fetchCached<MetricsData>('/admin/metrics/overview', { range: timeRange }, 60000), // 1 min cache
        fetchCached<TimeSeriesData>('/admin/metrics/user-growth', { range: timeRange }, 300000), // 5 min cache
        fetchCached<TimeSeriesData>('/admin/metrics/revenue', { range: timeRange }, 300000)
      ]);

      setMetrics(metricsRes);
      setUserGrowth(growthRes);
      setRevenueData(revenueRes);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    
    // Set up auto-refresh
    const interval = setInterval(loadMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [timeRange, refreshInterval]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff'
      }
    },
    scales: {
      x: {
        ticks: { color: '#cccccc' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: '#cccccc' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  }), []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value >= thresholds.good) return '#10b981';
    if (value >= thresholds.warning) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="admin-metrics-loading">
        <div className="loading-spinner"></div>
        <p>Loading metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="admin-metrics-error">
        <p>Failed to load metrics data</p>
        <button onClick={loadMetrics} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-metrics">
      <div className="metrics-header">
        <h2>📊 System Metrics</h2>
        <div className="metrics-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="time-range-select"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button onClick={loadMetrics} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <h3>Total Users</h3>
            <div className="kpi-value">{formatNumber(metrics.users.total)}</div>
            <div className="kpi-change positive">
              +{metrics.users.growth_rate.toFixed(1)}% growth
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">🎯</div>
          <div className="kpi-content">
            <h3>Daily Active Users</h3>
            <div className="kpi-value">{formatNumber(metrics.engagement.daily_active_users)}</div>
            <div className="kpi-subtitle">
              {((metrics.engagement.daily_active_users / metrics.users.total) * 100).toFixed(1)}% of total
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>Monthly Revenue</h3>
            <div className="kpi-value">{formatCurrency(metrics.revenue.monthly)}</div>
            <div className="kpi-subtitle">
              {metrics.revenue.transactions} transactions
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">⚡</div>
          <div className="kpi-content">
            <h3>System Health</h3>
            <div className="kpi-value" style={{ 
              color: getStatusColor(metrics.system.uptime, { good: 99, warning: 95 })
            }}>
              {metrics.system.uptime.toFixed(2)}%
            </div>
            <div className="kpi-subtitle">Uptime</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>📈 User Growth Trend</h3>
          <div className="chart-container">
            <div className="simple-chart">
              <div className="chart-placeholder">
                📈 User Growth Chart
                <p>Interactive charts coming soon</p>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>💵 Revenue Analytics</h3>
          <div className="chart-container">
            <div className="simple-chart">
              <div className="chart-placeholder">
                💵 Revenue Chart
                <p>Interactive charts coming soon</p>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>📊 Content Distribution</h3>
          <div className="chart-container">
            <div className="content-stats">
              <div className="stat-item">
                <span className="stat-label">Forum Posts</span>
                <span className="stat-value">{formatNumber(metrics.content.forum_posts)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Social Posts</span>
                <span className="stat-value">{formatNumber(metrics.content.posts)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Comments</span>
                <span className="stat-value">{formatNumber(metrics.content.comments)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Topics</span>
                <span className="stat-value">{formatNumber(metrics.content.forum_topics)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card system-status">
          <h3>🖥️ System Status</h3>
          <div className="status-metrics">
            <div className="status-item">
              <span className="status-label">Response Time</span>
              <span className="status-value" style={{
                color: getStatusColor(200 - metrics.system.response_time, { good: 150, warning: 100 })
              }}>
                {metrics.system.response_time}ms
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Error Rate</span>
              <span className="status-value" style={{
                color: getStatusColor(5 - metrics.system.error_rate, { good: 4, warning: 2 })
              }}>
                {metrics.system.error_rate.toFixed(2)}%
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Memory Usage</span>
              <span className="status-value" style={{
                color: getStatusColor(100 - metrics.system.memory_usage, { good: 30, warning: 15 })
              }}>
                {metrics.system.memory_usage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <div className="activity-feed">
        <h3>🔴 Live Activity</h3>
        <div className="activity-items">
          <div className="activity-item">
            <span className="activity-time">2m ago</span>
            <span className="activity-text">New user registration: john_doe</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">5m ago</span>
            <span className="activity-text">Donation received: $25.00</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">8m ago</span>
            <span className="activity-text">Forum post created in General Discussion</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMetrics;
