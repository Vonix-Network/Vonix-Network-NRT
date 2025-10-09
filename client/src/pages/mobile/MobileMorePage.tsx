import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFeatures } from '../../context/FeatureContext';
import './MobileMorePage.css';

const MobileMorePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { flags } = useFeatures();

  const menuSections = [
    {
      title: 'Community',
      items: [
        { path: '/leaderboard', label: 'Leaderboard', icon: '🏆', description: 'Top players' },
        ...(flags.social ? [{ path: '/social/discover', label: 'Discover', icon: '🔍', description: 'Find new friends' }] : []),
        { path: '/donations', label: 'Donations', icon: '💝', description: 'Support the server' },
        { path: '/ranks', label: 'Ranks', icon: '👑', description: 'Unlock perks' },
      ]
    },
    ...(user ? [{
      title: 'Your Account',
      items: [
        { path: '/profile', label: 'Profile', icon: '👤', description: 'Manage your account' },
        ...(flags.messages ? [{ path: '/messages', label: 'Messages', icon: '💌', description: 'Your inbox' }] : []),
        ...(flags.social ? [{ path: '/social', label: 'Social Feed', icon: '📱', description: 'Latest updates' }] : []),
      ]
    }] : []),
    ...(user && (user.role === 'admin' || user.role === 'moderator') ? [{
      title: 'Staff Tools',
      items: [
        ...(user.role === 'admin' ? [{ path: '/admin', label: 'Admin Panel', icon: '⚙️', description: 'Server management' }] : []),
        ...(user.role === 'moderator' || user.role === 'admin' ? [{ path: '/moderator', label: 'Moderator Tools', icon: '🛡️', description: 'Community moderation' }] : []),
      ]
    }] : []),
    {
      title: 'Information',
      items: [
        { path: '/blog', label: 'News & Updates', icon: '📰', description: 'Latest announcements' },
        { path: '/about', label: 'About Us', icon: 'ℹ️', description: 'Learn more' },
        { path: '/rules', label: 'Community Rules', icon: '📋', description: 'Server guidelines' },
        { path: '/contact', label: 'Contact', icon: '📧', description: 'Get in touch' },
      ]
    }
  ];

  return (
    <div className="mobile-content">
      <div className="mobile-more">
        <div className="mobile-more-header">
          <h1>More Options</h1>
          <p>Explore all features and settings</p>
        </div>

        {!user && (
          <div className="mobile-auth-section">
            <div className="mobile-auth-card">
              <div className="mobile-auth-content">
                <h2>Join the Community</h2>
                <p>Create an account to unlock all features</p>
              </div>
              <div className="mobile-auth-buttons">
                <Link to="/register" className="mobile-btn mobile-btn-primary">
                  Sign Up
                </Link>
                <Link to="/login" className="mobile-btn mobile-btn-secondary">
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mobile-menu-sections">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mobile-menu-section">
              <h2 className="mobile-section-title">{section.title}</h2>
              <div className="mobile-menu-items">
                {section.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    to={item.path}
                    className="mobile-menu-item"
                  >
                    <div className="mobile-menu-item-icon">{item.icon}</div>
                    <div className="mobile-menu-item-content">
                      <h3>{item.label}</h3>
                      <p>{item.description}</p>
                    </div>
                    <div className="mobile-menu-item-arrow">→</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {user && (
          <div className="mobile-logout-section">
            <button 
              className="mobile-logout-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to logout?')) {
                  logout();
                }
              }}
            >
              <span className="mobile-logout-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        )}

        <div className="mobile-app-info">
          <div className="mobile-app-version">
            <p>Vonix Network Mobile</p>
            <p>Version 2.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMorePage;
