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
  const [resolvedUuid, setResolvedUuid] = useState<string | null>(null);

  // Resolve UUID from username if UUID is missing but username exists
  useEffect(() => {
    let cancelled = false;
    async function resolveUuid(username: string) {
      try {
        // Check cache first
        const cacheKey = `uuid_cache_${username.toLowerCase()}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          if (!cancelled) setResolvedUuid(cached);
          return;
        }
        const resp = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
        if (resp.ok) {
          const data = await resp.json();
          const id: string | undefined = data?.id;
          if (id && !cancelled) {
            localStorage.setItem(cacheKey, id);
            setResolvedUuid(id);
          }
        }
      } catch {
        // ignore resolution errors
      }
    }

    if (!user) return;
    if (!user.minecraft_uuid && user.minecraft_username) {
      resolveUuid(user.minecraft_username);
    } else {
      setResolvedUuid(null);
    }
    return () => { cancelled = true; };
  }, [user]);

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
                {(user.minecraft_uuid || resolvedUuid) ? (
                  <img 
                    src={`https://crafatar.com/renders/head/${(user.minecraft_uuid || resolvedUuid)}`}
                    alt={user.username}
                    className="user-avatar"
                  />
                ) : (
                  <div className="user-avatar-placeholder">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
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
