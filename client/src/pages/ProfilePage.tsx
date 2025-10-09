import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import UserDisplay from '../components/UserDisplay';
import DonationSubscription from '../components/DonationSubscription';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
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
            <img 
              src={`https://mc-heads.net/avatar/${encodeURIComponent(user.username)}/128`}
              alt={user.username}
              className="minecraft-avatar-large"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
            <div 
              className="profile-avatar-placeholder"
              style={{ display: 'none' }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="profile-info">
            <UserDisplay
              username={user.username}
              minecraftUsername={user.minecraft_username}
              totalDonated={user.total_donated}
              donationRank={user.donation_rank}
              size="large"
              showIcon={true}
              showBadge={true}
            />
          </div>
          <div className="profile-badges">
            <span className={`badge badge-${user.role === 'admin' ? 'primary' : 'success'}`}>
              {user.role}
            </span>
          </div>
          {(user.total_donated !== undefined && user.total_donated > 0) || user.donation_rank && (
            <div className="donation-subscription-section">
              <DonationSubscription 
                totalDonated={user.total_donated}
                donationRank={user.donation_rank}
                donationRankExpiresAt={user.donation_rank_expires_at}
                showPerks={true}
              />
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2 className="section-title">Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label className="info-label">Username</label>
              <div className="info-value">{user.username}</div>
            </div>

            <div className="info-item">
              <label className="info-label">Minecraft Username</label>
              <div className="info-value minecraft-username">
                <img 
                  src={`https://mc-heads.net/head/${encodeURIComponent(user.username)}/24`}
                  alt={user.username}
                  className="minecraft-head-small"
                />
                {user.username}
              </div>
            </div>

            {user.minecraft_uuid && (
              <div className="info-item">
                <label className="info-label">Minecraft UUID</label>
                <div className="info-value mono">{user.minecraft_uuid}</div>
              </div>
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
