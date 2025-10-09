import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFeatures } from '../../context/FeatureContext';
import { BRAND_NAME } from '../../config/appConfig';
import './MobileNavbar.css';

const MobileNavbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { flags } = useFeatures();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const mainTabs = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/blog', label: 'Blog', icon: '📝' },
    ...(flags.forum ? [{ path: '/forum', label: 'Forum', icon: '💬' }] : []),
    ...(flags.servers ? [{ path: '/servers', label: 'Servers', icon: '🎮' }] : []),
    { path: '/more', label: 'More', icon: '⋯' }
  ];

  return (
    <>
      {/* Top Header */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <Link to="/" className="mobile-logo">
            <span className="mobile-logo-icon">⚡</span>
            <span className="mobile-logo-text">{BRAND_NAME}</span>
          </Link>
          
          {user ? (
            <button 
              className="mobile-user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img
                src={`https://mc-heads.net/head/${encodeURIComponent(user.username)}/32`}
                alt={user.username}
                className="mobile-user-avatar"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <span className="mobile-username">{user.username}</span>
            </button>
          ) : (
            <div className="mobile-auth-buttons">
              <Link to="/login" className="mobile-btn mobile-btn-primary">Login</Link>
            </div>
          )}
        </div>
      </header>

      {/* User Menu Overlay */}
      {showUserMenu && user && (
        <div className="mobile-user-menu-overlay" onClick={() => setShowUserMenu(false)}>
          <div className="mobile-user-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-user-menu-header">
              <img
                src={`https://mc-heads.net/head/${encodeURIComponent(user.username)}/64`}
                alt={user.username}
                className="mobile-user-menu-avatar"
              />
              <div className="mobile-user-menu-info">
                <h3>{user.username}</h3>
                <p>{user.role}</p>
              </div>
            </div>
            
            <div className="mobile-user-menu-links">
              <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                👤 Profile
              </Link>
              {flags.messages && (
                <Link to="/messages" onClick={() => setShowUserMenu(false)}>
                  💌 Messages
                </Link>
              )}
              {flags.social && (
                <Link to="/social" onClick={() => setShowUserMenu(false)}>
                  👥 Social
                </Link>
              )}
              <Link to="/donations" onClick={() => setShowUserMenu(false)}>
                💝 Donations
              </Link>
              <Link to="/ranks" onClick={() => setShowUserMenu(false)}>
                🏆 Ranks
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setShowUserMenu(false)}>
                  ⚙️ Admin
                </Link>
              )}
              {(user.role === 'moderator' || user.role === 'admin') && (
                <Link to="/moderator" onClick={() => setShowUserMenu(false)}>
                  🛡️ Moderator
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {mainTabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`mobile-nav-tab ${isActive(tab.path) ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{tab.icon}</span>
            <span className="mobile-nav-label">{tab.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

export default MobileNavbar;
