import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../../context/AdminContext';
import { useAuth } from '../../../context/AuthContext';
import './AdminHeader.css';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

const AdminHeader: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const { state, actions } = useAdmin();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/admin/search?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      setSearchResults(results.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const unreadNotifications = state.notifications.filter(n => !n.read);
  const criticalAlerts = state.notifications.filter(n => !n.read && n.type === 'error').length;

  const getSystemHealthStatus = () => {
    if (!state.metrics) return 'unknown';
    
    const cpu = state.metrics.server.cpu_usage;
    const memory = state.metrics.server.memory_usage;
    const db = state.metrics.database.avg_response_time;
    
    if (cpu > 90 || memory > 95 || db > 1000) return 'critical';
    if (cpu > 80 || memory > 85 || db > 500) return 'warning';
    return 'healthy';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <header className="admin-header">
      {/* Left Section */}
      <div className="header-left">
        <button 
          className="mobile-menu-btn"
          onClick={onMobileMenuToggle}
          aria-label="Toggle mobile menu"
        >
          ☰
        </button>

        <div className="breadcrumb">
          <span className="breadcrumb-item">Admin</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-item active">
            {state.activeModule.charAt(0).toUpperCase() + state.activeModule.slice(1)}
          </span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="header-center" ref={searchRef}>
        <div className="global-search">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search users, content, settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="search-icon">🔍</div>
          </div>

          {/* Search Results */}
          {(searchResults.length > 0 || searchLoading) && (
            <div className="search-results">
              {searchLoading ? (
                <div className="search-loading">
                  <div className="loading-spinner small"></div>
                  Searching...
                </div>
              ) : (
                <>
                  {searchResults.map((result, index) => (
                    <Link
                      key={index}
                      to={result.url}
                      className="search-result-item"
                      onClick={() => setSearchResults([])}
                    >
                      <div className="result-icon">{result.icon}</div>
                      <div className="result-content">
                        <div className="result-title">{result.title}</div>
                        <div className="result-type">{result.type}</div>
                      </div>
                    </Link>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="no-results">No results found</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="header-right">
        {/* System Health Indicator */}
        <div className={`system-health ${getSystemHealthStatus()}`} title="System Health">
          <div className="health-dot"></div>
          {state.metrics && (
            <span className="health-text">
              {formatUptime(state.metrics.server.uptime)}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button 
            className="quick-action-btn"
            onClick={actions.refreshData}
            title="Refresh Data"
          >
            🔄
          </button>
          
          <Link 
            to="/admin/system/health"
            className="quick-action-btn"
            title="System Monitor"
          >
            📊
          </Link>
        </div>

        {/* Notifications */}
        <div className="notifications-container" ref={notificationRef}>
          <button
            className={`notifications-btn ${unreadNotifications.length > 0 ? 'has-notifications' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            🔔
            {unreadNotifications.length > 0 && (
              <span className="notification-count">{unreadNotifications.length}</span>
            )}
            {criticalAlerts > 0 && (
              <span className="critical-indicator">!</span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notifications</h3>
                <button 
                  className="mark-all-read"
                  onClick={() => {
                    unreadNotifications.forEach(n => actions.markNotificationRead(n.id));
                  }}
                >
                  Mark all read
                </button>
              </div>

              <div className="notifications-list">
                {unreadNotifications.length === 0 ? (
                  <div className="no-notifications">
                    <div className="no-notifications-icon">✅</div>
                    <p>All caught up!</p>
                  </div>
                ) : (
                  unreadNotifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${notification.type}`}
                      onClick={() => actions.markNotificationRead(notification.id)}
                    >
                      <div className="notification-icon">
                        {notification.type === 'error' && '🚨'}
                        {notification.type === 'warning' && '⚠️'}
                        {notification.type === 'info' && 'ℹ️'}
                        {notification.type === 'success' && '✅'}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      {notification.action && (
                        <Link 
                          to={notification.action.url}
                          className="notification-action"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {notification.action.label}
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>

              {unreadNotifications.length > 10 && (
                <div className="notifications-footer">
                  <Link to="/admin/notifications" className="view-all-link">
                    View all notifications
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="user-menu-container" ref={userMenuRef}>
          <button
            className="user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {state.currentAdmin?.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{state.currentAdmin?.username}</div>
              <div className="user-role">{state.currentAdmin?.role}</div>
            </div>
            <div className="dropdown-arrow">▼</div>
          </button>

          {showUserMenu && (
            <div className="user-menu-dropdown">
              <div className="user-menu-header">
                <div className="user-avatar large">
                  {state.currentAdmin?.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <div className="user-name">{state.currentAdmin?.username}</div>
                  <div className="user-email">{state.currentAdmin?.email}</div>
                  <div className="user-role-badge">
                    <span className={`role-badge ${state.currentAdmin?.role}`}>
                      {state.currentAdmin?.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="user-menu-items">
                <Link to="/profile" className="user-menu-item">
                  <span className="menu-icon">👤</span>
                  My Profile
                </Link>
                
                <Link to="/admin/settings/account" className="user-menu-item">
                  <span className="menu-icon">⚙️</span>
                  Account Settings
                </Link>
                
                <Link to="/admin/security/audit" className="user-menu-item">
                  <span className="menu-icon">📋</span>
                  My Activity
                </Link>
                
                <div className="menu-divider"></div>
                
                <Link to="/" className="user-menu-item">
                  <span className="menu-icon">🏠</span>
                  Back to Site
                </Link>
                
                <button 
                  className="user-menu-item logout"
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                >
                  <span className="menu-icon">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
