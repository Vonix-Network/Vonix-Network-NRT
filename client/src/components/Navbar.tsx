import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import { BRAND_NAME } from '../config/appConfig';
import { useFeatures } from '../context/FeatureContext';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { flags } = useFeatures();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">{BRAND_NAME}</span>
        </Link>

        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          {flags.servers && (
            <Link
              to="/servers"
              className={`nav-link ${isActive('/servers') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Servers
            </Link>
          )}
          <Link
            to="/blog"
            className={`nav-link ${isActive('/blog') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Blog
          </Link>
          <Link
            to="/leaderboard"
            className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Leaderboard
          </Link>
          {flags.forum && (
            <Link
              to="/forum"
              className={`nav-link ${isActive('/forum') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Forum
            </Link>
          )}
          <Link
            to="/donations"
            className={`nav-link ${isActive('/donations') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Donations
          </Link>
          <Link
            to="/ranks"
            className={`nav-link ${isActive('/ranks') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Ranks
          </Link>

          {user ? (
            <>
              {flags.social && (
                <Link
                  to="/social"
                  className={`nav-link ${isActive('/social') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Social
                </Link>
              )}
              {flags.messages && (
                <Link
                  to="/messages"
                  className={`nav-link ${isActive('/messages') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messages
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              {(user.role === 'moderator' || user.role === 'admin') && (
                <Link
                  to="/moderator"
                  className={`nav-link ${isActive('/moderator') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🛡️ Moderator
                </Link>
              )}
              <Link to="/profile" className="user-card" onClick={() => setMobileMenuOpen(false)}>
                <div className="user-avatar-container">
                  <img
                    src={`https://mc-heads.net/head/${encodeURIComponent(user.username)}/32`}
                    alt={user.username}
                    className="user-avatar"
                    onError={(e) => {
                      // Hide broken image if it fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <span className="user-name">{user.username}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="btn btn-secondary btn-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
              <Link
                to="/login"
                className="btn btn-primary btn-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
