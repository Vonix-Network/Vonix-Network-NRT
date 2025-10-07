import React, { useState } from 'react';
import { SetupData } from './SetupWizard';

interface DiscordConfigStepProps {
  data: SetupData;
  updateData: (data: Partial<SetupData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const DiscordConfigStep: React.FC<DiscordConfigStepProps> = ({ data, updateData, onNext, onPrev }) => {
  const [skipDiscord, setSkipDiscord] = useState(false);

  const handleNext = () => {
    if (skipDiscord) {
      // Clear Discord data if skipping
      updateData({
        discord_bot_token: '',
        discord_channel_id: '',
        discord_webhook_url: ''
      });
    }
    onNext();
  };

  return (
    <div className="setup-step">
      <div className="step-header">
        <h2>Discord Integration</h2>
        <p>Connect your Discord server to enable live chat and community features.</p>
      </div>

      <div className="step-form">
        <div className="discord-option">
          <label className="option-card">
            <input
              type="radio"
              name="discordOption"
              checked={!skipDiscord}
              onChange={() => setSkipDiscord(false)}
            />
            <div className="option-content">
              <div className="option-header">
                <div className="option-icon">🤖</div>
                <div>
                  <div className="option-title">Configure Discord Bot</div>
                  <div className="option-description">Enable live chat and community integration</div>
                </div>
              </div>
            </div>
          </label>

          <label className="option-card">
            <input
              type="radio"
              name="discordOption"
              checked={skipDiscord}
              onChange={() => setSkipDiscord(true)}
            />
            <div className="option-content">
              <div className="option-header">
                <div className="option-icon">⏭️</div>
                <div>
                  <div className="option-title">Skip Discord Setup</div>
                  <div className="option-description">Configure later in admin settings</div>
                </div>
              </div>
            </div>
          </label>
        </div>

        {!skipDiscord && (
          <div className="discord-config">
            <div className="config-notice">
              <div className="notice-icon">💡</div>
              <div className="notice-content">
                <strong>Need help?</strong> Check our{' '}
                <a href="https://docs.vonix.network/discord-setup" target="_blank" rel="noopener noreferrer">
                  Discord setup guide
                </a>{' '}
                for step-by-step instructions.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Bot Token</span>
                <span className="optional">(Optional)</span>
              </label>
              <input
                type="password"
                className="form-input"
                value={data.discord_bot_token}
                onChange={(e) => updateData({ discord_bot_token: e.target.value })}
                placeholder="Your Discord bot token"
              />
              <div className="form-hint">
                Create a bot at{' '}
                <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">
                  Discord Developer Portal
                </a>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Channel ID</span>
                <span className="optional">(Optional)</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={data.discord_channel_id}
                onChange={(e) => updateData({ discord_channel_id: e.target.value })}
                placeholder="Discord channel ID for live chat"
              />
              <div className="form-hint">
                Right-click your channel → Copy ID (Developer Mode must be enabled)
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Webhook URL</span>
                <span className="optional">(Optional)</span>
              </label>
              <input
                type="url"
                className="form-input"
                value={data.discord_webhook_url}
                onChange={(e) => updateData({ discord_webhook_url: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
              />
              <div className="form-hint">
                Channel Settings → Integrations → Webhooks → New Webhook
              </div>
            </div>

            <div className="feature-preview">
              <h4>What you'll get:</h4>
              <ul>
                <li>✅ Live chat widget on your homepage</li>
                <li>✅ Real-time message synchronization</li>
                <li>✅ Community engagement tools</li>
                <li>✅ Automated notifications</li>
              </ul>
            </div>
          </div>
        )}

        <div className="step-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onPrev}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '8px' }}>
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-lg"
            onClick={handleNext}
          >
            {skipDiscord ? 'Skip & Continue' : 'Continue to Review'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: '8px' }}>
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscordConfigStep;
