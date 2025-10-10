import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';

// Admin Components
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import AdminOverview from './modules/AdminOverview';
import AdminUsers from './modules/AdminUsers';
import AdminContent from './modules/AdminContent';
import AdminAnalytics from './modules/AdminAnalytics';
import AdminSecurity from './modules/AdminSecurity';
import AdminSystem from './modules/AdminSystem';
import AdminSettings from './modules/AdminSettings';
import AdminLogs from './modules/AdminLogs';

import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { state, dispatch, actions } = useAdmin();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check admin permissions
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'moderator')) {
      dispatch({ 
        type: 'SET_ADMIN', 
        payload: {
          id: user.id,
          username: user.username,
          email: user.email || '',
          role: user.role as 'admin' | 'moderator',
          permissions: user.role === 'admin' 
            ? ['admin:all'] 
            : ['moderator:users', 'moderator:content', 'moderator:reports'],
          last_login: new Date().toISOString(),
          created_at: user.created_at || new Date().toISOString(),
        }
      });
    }
  }, [user, dispatch]);

  // Update active module based on route
  useEffect(() => {
    const path = location.pathname.split('/').pop() || 'overview';
    dispatch({ type: 'SET_ACTIVE_MODULE', payload: path });
  }, [location.pathname, dispatch]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Redirect non-admin users
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return <Navigate to="/" replace />;
  }

  if (!state.isAuthenticated) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Initializing admin dashboard...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`admin-dashboard ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <AdminSidebar 
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <div className="admin-main">
          {/* Header */}
          <AdminHeader 
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          {/* Content Area */}
          <main className="admin-content">
            <ErrorBoundary fallback={
              <div className="module-error">
                <h2>Module Error</h2>
                <p>This admin module encountered an error. Please refresh the page.</p>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Navigate to="/admin/overview" replace />} />
                <Route path="/overview" element={<AdminOverview />} />
                <Route path="/users/*" element={<AdminUsers />} />
                <Route path="/content/*" element={<AdminContent />} />
                <Route path="/analytics/*" element={<AdminAnalytics />} />
                <Route path="/security/*" element={<AdminSecurity />} />
                <Route path="/system/*" element={<AdminSystem />} />
                <Route path="/settings/*" element={<AdminSettings />} />
                <Route path="/logs" element={<AdminLogs />} />
                <Route path="*" element={<Navigate to="/admin/overview" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>

        {/* Connection Status Indicator */}
        <div className={`connection-status ${state.connectionStatus}`}>
          <div className="status-indicator">
            {state.connectionStatus === 'connected' && '🟢'}
            {state.connectionStatus === 'disconnected' && '🔴'}
            {state.connectionStatus === 'reconnecting' && '🟡'}
          </div>
          <span className="status-text">
            {state.connectionStatus === 'connected' && 'Connected'}
            {state.connectionStatus === 'disconnected' && 'Disconnected'}
            {state.connectionStatus === 'reconnecting' && 'Reconnecting...'}
          </span>
        </div>

        {/* Global Notifications */}
        {state.notifications.filter(n => !n.read).length > 0 && (
          <div className="global-notifications">
            {state.notifications
              .filter(n => !n.read)
              .slice(0, 3)
              .map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification notification-${notification.type}`}
                  onClick={() => actions.markNotificationRead(notification.id)}
                >
                  <div className="notification-content">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                  </div>
                  <button className="notification-close">×</button>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;
