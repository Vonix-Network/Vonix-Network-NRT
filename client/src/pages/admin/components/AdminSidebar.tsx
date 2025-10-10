import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdmin } from '../../../context/AdminContext';
import './AdminSidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  permission?: string;
  badge?: string | number;
  children?: NavItem[];
}

const AdminSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { state, dispatch, actions } = useAdmin();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: '📊',
      path: '/admin/overview',
    },
    {
      id: 'users',
      label: 'User Management',
      icon: '👥',
      path: '/admin/users',
      permission: 'admin:users',
      badge: state.stats?.users.banned || 0,
      children: [
        { id: 'users-list', label: 'All Users', icon: '📋', path: '/admin/users/list' },
        { id: 'users-roles', label: 'Roles & Permissions', icon: '🔐', path: '/admin/users/roles' },
        { id: 'users-banned', label: 'Banned Users', icon: '🚫', path: '/admin/users/banned' },
        { id: 'users-activity', label: 'User Activity', icon: '📈', path: '/admin/users/activity' },
      ],
    },
    {
      id: 'content',
      label: 'Content Moderation',
      icon: '📝',
      path: '/admin/content',
      permission: 'admin:content',
      badge: state.stats?.content.reports_pending || 0,
      children: [
        { id: 'content-posts', label: 'Posts & Comments', icon: '💬', path: '/admin/content/posts' },
        { id: 'content-reports', label: 'Reports', icon: '🚨', path: '/admin/content/reports' },
        { id: 'content-moderation', label: 'Moderation Queue', icon: '⚖️', path: '/admin/content/moderation' },
        { id: 'content-automod', label: 'Auto Moderation', icon: '🤖', path: '/admin/content/automod' },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      path: '/admin/analytics',
      permission: 'admin:analytics',
      children: [
        { id: 'analytics-overview', label: 'Overview', icon: '📊', path: '/admin/analytics/overview' },
        { id: 'analytics-users', label: 'User Analytics', icon: '👤', path: '/admin/analytics/users' },
        { id: 'analytics-content', label: 'Content Analytics', icon: '📄', path: '/admin/analytics/content' },
        { id: 'analytics-revenue', label: 'Revenue Analytics', icon: '💰', path: '/admin/analytics/revenue' },
      ],
    },
    {
      id: 'security',
      label: 'Security',
      icon: '🔒',
      path: '/admin/security',
      permission: 'admin:security',
      badge: state.stats?.system.alerts || 0,
      children: [
        { id: 'security-overview', label: 'Security Overview', icon: '🛡️', path: '/admin/security/overview' },
        { id: 'security-threats', label: 'Threat Detection', icon: '⚠️', path: '/admin/security/threats' },
        { id: 'security-access', label: 'Access Control', icon: '🔑', path: '/admin/security/access' },
        { id: 'security-audit', label: 'Audit Logs', icon: '📋', path: '/admin/security/audit' },
      ],
    },
    {
      id: 'system',
      label: 'System',
      icon: '⚙️',
      path: '/admin/system',
      permission: 'admin:system',
      children: [
        { id: 'system-health', label: 'System Health', icon: '💓', path: '/admin/system/health' },
        { id: 'system-performance', label: 'Performance', icon: '⚡', path: '/admin/system/performance' },
        { id: 'system-backups', label: 'Backups', icon: '💾', path: '/admin/system/backups' },
        { id: 'system-maintenance', label: 'Maintenance', icon: '🔧', path: '/admin/system/maintenance' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      path: '/admin/settings',
      permission: 'admin:settings',
      children: [
        { id: 'settings-general', label: 'General', icon: '🔧', path: '/admin/settings/general' },
        { id: 'settings-features', label: 'Features', icon: '🎛️', path: '/admin/settings/features' },
        { id: 'settings-integrations', label: 'Integrations', icon: '🔗', path: '/admin/settings/integrations' },
        { id: 'settings-email', label: 'Email', icon: '📧', path: '/admin/settings/email' },
      ],
    },
    {
      id: 'logs',
      label: 'System Logs',
      icon: '📋',
      path: '/admin/logs',
      permission: 'admin:logs',
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.permission || actions.hasPermission(item.permission)
  );

  const isActiveRoute = (path: string): boolean => {
    return location.pathname.startsWith(path);
  };

  const handleSidebarToggle = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''} ${state.sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🏢</div>
          {!state.sidebarCollapsed && (
            <div className="logo-text">
              <h2>Admin Panel</h2>
              <span>Vonix Network</span>
            </div>
          )}
        </div>
        
        <div className="sidebar-controls">
          <button 
            className="collapse-btn"
            onClick={handleSidebarToggle}
            title={state.sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {state.sidebarCollapsed ? '→' : '←'}
          </button>
          
          <button 
            className="mobile-close-btn"
            onClick={onClose}
            title="Close Menu"
          >
            ×
          </button>
        </div>
      </div>

      {/* Admin Info */}
      <div className="admin-info">
        <div className="admin-avatar">
          <div className="avatar-circle">
            {state.currentAdmin?.username.charAt(0).toUpperCase()}
          </div>
        </div>
        
        {!state.sidebarCollapsed && (
          <div className="admin-details">
            <div className="admin-name">{state.currentAdmin?.username}</div>
            <div className="admin-role">
              <span className={`role-badge ${state.currentAdmin?.role}`}>
                {state.currentAdmin?.role}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {filteredNavItems.map((item) => (
            <li key={item.id} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
                onClick={onClose}
                title={state.sidebarCollapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!state.sidebarCollapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </>
                )}
              </Link>
              
              {/* Sub-navigation */}
              {item.children && !state.sidebarCollapsed && isActiveRoute(item.path) && (
                <ul className="sub-nav">
                  {item.children.map((child) => (
                    <li key={child.id} className="sub-nav-item">
                      <Link
                        to={child.path}
                        className={`sub-nav-link ${location.pathname === child.path ? 'active' : ''}`}
                        onClick={onClose}
                      >
                        <span className="sub-nav-icon">{child.icon}</span>
                        <span className="sub-nav-label">{child.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* System Status */}
      <div className="sidebar-footer">
        {!state.sidebarCollapsed && (
          <div className="system-status">
            <div className="status-item">
              <span className="status-label">System Health</span>
              <div className="status-indicators">
                <div className={`indicator ${state.metrics?.server.cpu_usage && state.metrics.server.cpu_usage < 80 ? 'good' : 'warning'}`} title="CPU Usage"></div>
                <div className={`indicator ${state.metrics?.server.memory_usage && state.metrics.server.memory_usage < 85 ? 'good' : 'warning'}`} title="Memory Usage"></div>
                <div className={`indicator ${state.metrics?.database.avg_response_time && state.metrics.database.avg_response_time < 100 ? 'good' : 'warning'}`} title="Database Response"></div>
              </div>
            </div>
            
            <div className="last-update">
              Last updated: {new Date(state.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        )}
        
        {state.sidebarCollapsed && (
          <div className="collapsed-status">
            <div className="status-dots">
              <div className={`dot ${state.connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}></div>
              <div className={`dot ${state.metrics?.server.cpu_usage && state.metrics.server.cpu_usage < 80 ? 'good' : 'warning'}`}></div>
              <div className={`dot ${state.metrics?.database.avg_response_time && state.metrics.database.avg_response_time < 100 ? 'good' : 'warning'}`}></div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
