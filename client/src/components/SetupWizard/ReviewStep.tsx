import React, { useState } from 'react';
import { SetupData } from './SetupWizard';
import api from '../../services/api';

interface ReviewStepProps {
  data: SetupData;
  onPrev: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ data, onPrev }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasDiscordConfig = data.discord_bot_token || data.discord_channel_id || data.discord_webhook_url;

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      const setupPayload = {
        username: data.username,
        password: data.password,
        discord_bot_token: data.discord_bot_token,
        discord_channel_id: data.discord_channel_id,
        discord_webhook_url: data.discord_webhook_url
      };

      await api.post('/setup/init', setupPayload);
      
      // Show success message and redirect
      alert('🎉 Setup completed successfully! You can now log in with your admin account.');
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-step">
      <div className="step-header">
        <h2>Review & Complete</h2>
        <p>Please review your configuration before completing the setup.</p>
      </div>

      <div className="step-form">
        {error && (
          <div className="setup-error">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <strong>Setup Error:</strong> {error}
            </div>
          </div>
        )}

        <div className="review-sections">
          {/* Admin Account Review */}
          <div className="review-section">
            <div className="section-header">
              <div className="section-icon">👤</div>
              <div>
                <h3>Admin Account</h3>
                <p>Your administrative account details</p>
              </div>
            </div>
            <div className="section-content">
              <div className="review-item">
                <span className="item-label">Username:</span>
                <span className="item-value">{data.username}</span>
              </div>
              <div className="review-item">
                <span className="item-label">Password:</span>
                <span className="item-value">••••••••</span>
              </div>
            </div>
          </div>

          {/* Discord Configuration Review */}
          <div className="review-section">
            <div className="section-header">
              <div className="section-icon">🤖</div>
              <div>
                <h3>Discord Integration</h3>
                <p>Community chat and engagement features</p>
              </div>
            </div>
            <div className="section-content">
              {hasDiscordConfig ? (
                <>
                  <div className="review-item">
                    <span className="item-label">Bot Token:</span>
                    <span className="item-value">
                      {data.discord_bot_token ? '••••••••••••••••' : 'Not configured'}
                    </span>
                  </div>
                  <div className="review-item">
                    <span className="item-label">Channel ID:</span>
                    <span className="item-value">
                      {data.discord_channel_id || 'Not configured'}
                    </span>
                  </div>
                  <div className="review-item">
                    <span className="item-label">Webhook URL:</span>
                    <span className="item-value">
                      {data.discord_webhook_url ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                  <div className="config-status success">
                    <div className="status-icon">✅</div>
                    <div>Discord integration will be enabled</div>
                  </div>
                </>
              ) : (
                <div className="config-status neutral">
                  <div className="status-icon">⏭️</div>
                  <div>Discord integration skipped - can be configured later in admin settings</div>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="review-section">
            <div className="section-header">
              <div className="section-icon">🚀</div>
              <div>
                <h3>What's Next?</h3>
                <p>After completing setup, you can:</p>
              </div>
            </div>
            <div className="section-content">
              <ul className="next-steps-list">
                <li>Log in with your admin account</li>
                <li>Configure site features and toggles</li>
                <li>Add your first game servers</li>
                <li>Customize your community settings</li>
                <li>Invite users to join your platform</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="completion-notice">
          <div className="notice-icon">🎯</div>
          <div className="notice-content">
            <strong>Ready to launch!</strong> Click "Complete Setup" to finalize your configuration 
            and start building your gaming community.
          </div>
        </div>

        <div className="step-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onPrev}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '8px' }}>
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-lg"
            onClick={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-sm" />
                Completing Setup...
              </>
            ) : (
              <>
                Complete Setup
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: '8px' }}>
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
