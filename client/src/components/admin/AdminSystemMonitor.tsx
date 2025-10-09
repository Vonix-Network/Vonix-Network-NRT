import React, { useState, useEffect } from 'react';
import { fetchCached, retryApiCall } from '../../utils/apiHelpers';
import { performanceMetrics } from '../../utils/performance';
import './AdminSystemMonitor.css';

interface SystemHealth {
  server: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
      load: number[];
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  database: {
    connections: number;
    queries_per_second: number;
    avg_response_time: number;
    slow_queries: number;
  };
  api: {
    requests_per_minute: number;
    error_rate: number;
    avg_response_time: number;
    active_sessions: number;
  };
  security: {
    failed_logins: number;
    blocked_ips: number;
    suspicious_activity: number;
  };
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  category: string;
  message: string;
  details?: any;
}

const AdminSystemMonitor: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('all');

  const loadSystemHealth = async () => {
    try {
      const health = await retryApiCall(() => 
        fetchCached<SystemHealth>('/admin/system/health', {}, 10000) // 10 second cache
      );
      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const logsData = await fetchCached<LogEntry[]>('/admin/system/logs', {
        level: selectedLogLevel === 'all' ? undefined : selectedLogLevel,
        limit: 100
      }, 5000); // 5 second cache
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadSystemHealth(), loadLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedLogLevel]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedLogLevel]);

  const getHealthStatus = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value <= thresholds.good) return 'healthy';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  };

  const getHealthColor = (status: string): string => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getLevelIcon = (level: string): string => {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🚨';
      default: return '📝';
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'info': return '#3b82f6';
      case 'warn': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="system-monitor-loading">
        <div className="loading-spinner"></div>
        <p>Loading system status...</p>
      </div>
    );
  }

  if (!systemHealth) {
    return (
      <div className="system-monitor-error">
        <p>Failed to load system health data</p>
        <button onClick={loadData} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-system-monitor">
      <div className="monitor-header">
        <h2>🖥️ System Monitor</h2>
        <div className="monitor-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto Refresh
          </label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
            className="refresh-interval-select"
          >
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
            <option value={300000}>5m</option>
          </select>
          <button onClick={loadData} className="manual-refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="health-overview">
        <div className="health-card">
          <div className="health-header">
            <h3>🖥️ Server Health</h3>
            <div className="health-status healthy">
              <span className="status-dot"></span>
              Operational
            </div>
          </div>
          <div className="health-metrics">
            <div className="metric">
              <span className="metric-label">Uptime</span>
              <span className="metric-value">{formatUptime(systemHealth.server.uptime)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Memory</span>
              <span className="metric-value" style={{
                color: getHealthColor(getHealthStatus(systemHealth.server.memory.percentage, { good: 70, warning: 85 }))
              }}>
                {systemHealth.server.memory.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">CPU</span>
              <span className="metric-value" style={{
                color: getHealthColor(getHealthStatus(systemHealth.server.cpu.usage, { good: 70, warning: 85 }))
              }}>
                {systemHealth.server.cpu.usage.toFixed(1)}%
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Disk</span>
              <span className="metric-value" style={{
                color: getHealthColor(getHealthStatus(systemHealth.server.disk.percentage, { good: 80, warning: 90 }))
              }}>
                {systemHealth.server.disk.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="health-card">
          <div className="health-header">
            <h3>🗄️ Database</h3>
            <div className={`health-status ${getHealthStatus(systemHealth.database.avg_response_time, { good: 100, warning: 500 })}`}>
              <span className="status-dot"></span>
              {systemHealth.database.avg_response_time < 100 ? 'Optimal' : 
               systemHealth.database.avg_response_time < 500 ? 'Slow' : 'Critical'}
            </div>
          </div>
          <div className="health-metrics">
            <div className="metric">
              <span className="metric-label">Connections</span>
              <span className="metric-value">{systemHealth.database.connections}</span>
            </div>
            <div className="metric">
              <span className="metric-label">QPS</span>
              <span className="metric-value">{systemHealth.database.queries_per_second.toFixed(1)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Avg Response</span>
              <span className="metric-value">{systemHealth.database.avg_response_time}ms</span>
            </div>
            <div className="metric">
              <span className="metric-label">Slow Queries</span>
              <span className="metric-value" style={{
                color: systemHealth.database.slow_queries > 0 ? '#ef4444' : '#10b981'
              }}>
                {systemHealth.database.slow_queries}
              </span>
            </div>
          </div>
        </div>

        <div className="health-card">
          <div className="health-header">
            <h3>🌐 API Performance</h3>
            <div className={`health-status ${getHealthStatus(systemHealth.api.error_rate, { good: 1, warning: 5 })}`}>
              <span className="status-dot"></span>
              {systemHealth.api.error_rate < 1 ? 'Excellent' : 
               systemHealth.api.error_rate < 5 ? 'Good' : 'Issues'}
            </div>
          </div>
          <div className="health-metrics">
            <div className="metric">
              <span className="metric-label">Requests/min</span>
              <span className="metric-value">{systemHealth.api.requests_per_minute}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Error Rate</span>
              <span className="metric-value" style={{
                color: getHealthColor(getHealthStatus(systemHealth.api.error_rate, { good: 1, warning: 5 }))
              }}>
                {systemHealth.api.error_rate.toFixed(2)}%
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Response Time</span>
              <span className="metric-value">{systemHealth.api.avg_response_time}ms</span>
            </div>
            <div className="metric">
              <span className="metric-label">Active Sessions</span>
              <span className="metric-value">{systemHealth.api.active_sessions}</span>
            </div>
          </div>
        </div>

        <div className="health-card">
          <div className="health-header">
            <h3>🔒 Security</h3>
            <div className={`health-status ${systemHealth.security.suspicious_activity > 10 ? 'critical' : 'healthy'}`}>
              <span className="status-dot"></span>
              {systemHealth.security.suspicious_activity > 10 ? 'Alert' : 'Secure'}
            </div>
          </div>
          <div className="health-metrics">
            <div className="metric">
              <span className="metric-label">Failed Logins</span>
              <span className="metric-value" style={{
                color: systemHealth.security.failed_logins > 50 ? '#ef4444' : '#10b981'
              }}>
                {systemHealth.security.failed_logins}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Blocked IPs</span>
              <span className="metric-value">{systemHealth.security.blocked_ips}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Suspicious Activity</span>
              <span className="metric-value" style={{
                color: systemHealth.security.suspicious_activity > 10 ? '#ef4444' : '#10b981'
              }}>
                {systemHealth.security.suspicious_activity}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="system-logs">
        <div className="logs-header">
          <h3>📋 System Logs</h3>
          <div className="logs-controls">
            <select
              value={selectedLogLevel}
              onChange={(e) => setSelectedLogLevel(e.target.value)}
              className="log-level-select"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div className="logs-container">
          {logs.length === 0 ? (
            <div className="no-logs">No logs found for the selected level</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={`log-entry log-${log.level}`}>
                <div className="log-header">
                  <span className="log-icon">{getLevelIcon(log.level)}</span>
                  <span className="log-timestamp">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className="log-category">{log.category}</span>
                  <span className="log-level" style={{ color: getLevelColor(log.level) }}>
                    {log.level.toUpperCase()}
                  </span>
                </div>
                <div className="log-message">{log.message}</div>
                {log.details && (
                  <details className="log-details">
                    <summary>Details</summary>
                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSystemMonitor;
