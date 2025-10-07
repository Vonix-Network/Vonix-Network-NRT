import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resolvedUuid, setResolvedUuid] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Resolve UUID from username if UUID is missing but username exists
  useEffect(() => {
    let cancelled = false;
    async function resolveUuid(username: string) {
      try {
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
        // ignore
      }
    }
    if (user && !user.minecraft_uuid && user.minecraft_username) {
      resolveUuid(user.minecraft_username);
    } else {
      setResolvedUuid(null);
    }
    return () => { cancelled = true; };
  }, [user?.minecraft_uuid, user?.minecraft_username]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setShowPasswordModal(false);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {(user.minecraft_uuid || resolvedUuid) ? (
              <img 
                src={`https://crafatar.com/renders/head/${(user.minecraft_uuid || resolvedUuid)}`}
                alt={user.username}
                className="minecraft-avatar-large"
              />
            ) : user.minecraft_username ? (
              <img 
                src={`https://mc-heads.net/avatar/${user.minecraft_username}/128`}
                alt={user.username}
                className="minecraft-avatar-large"
              />
            ) : (
              <div className="avatar-placeholder-large">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1 className="profile-username">{user.username}</h1>
            <div className="profile-badges">
              <span className={`badge badge-${user.role === 'admin' ? 'primary' : 'success'}`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2 className="section-title">Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label className="info-label">Username</label>
              <div className="info-value">{user.username}</div>
            </div>

            {user.minecraft_username && (
              <>
                <div className="info-item">
                  <label className="info-label">Minecraft Username</label>
                  <div className="info-value minecraft-username">
                    {(user.minecraft_uuid || resolvedUuid) ? (
                      <img 
                        src={`https://crafatar.com/renders/head/${(user.minecraft_uuid || resolvedUuid)}`}
                        alt={user.minecraft_username}
                        className="minecraft-head-small"
                      />
                    ) : (
                      <img 
                        src={`https://mc-heads.net/avatar/${user.minecraft_username}/24`}
                        alt={user.minecraft_username}
                        className="minecraft-head-small"
                      />
                    )}
                    {user.minecraft_username}
                  </div>
                </div>

                <div className="info-item">
                  <label className="info-label">Minecraft UUID</label>
                  <div className="info-value mono">{user.minecraft_uuid}</div>
                </div>
              </>
            )}

            <div className="info-item">
              <label className="info-label">Account Type</label>
              <div className="info-value">
                {user.minecraft_username ? 'Minecraft Account' : 'Standard Account'}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2 className="section-title">Security</h2>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </button>
        </div>

        <div className="profile-section">
          <h2 className="section-title">Actions</h2>
          <button 
            className="btn btn-danger"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Change Password</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowPasswordModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="modal-form">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                />
              </div>

              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
