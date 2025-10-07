import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AdminPage.css';

interface RegistrationStats {
  total_codes: number;
  used_codes: number;
  active_codes: number;
  expired_codes: number;
  registered_users: number;
  recent_registrations: Array<{
    minecraft_username: string;
    created_at: string;
  }>;
}

interface ApiKeyInfo {
  api_key: string;
  created_at: string;
  last_regenerated: string;
}

const AdminRegistrationPage: React.FC = () => {
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [keyResponse, statsResponse] = await Promise.all([
        api.get('/admin/registration/api-key'),
        api.get('/admin/registration/stats')
      ]);
      setApiKeyInfo(keyResponse.data);
      setStats(statsResponse.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load registration data');
      console.error('Error loading registration data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirmRegenerate) {
      setConfirmRegenerate(true);
      return;
    }

    try {
      const response = await api.post('/admin/registration/regenerate-key');
      setApiKeyInfo(response.data);
      setSuccess('API key regenerated successfully! Update your Minecraft mod/plugin configuration.');
      setError('');
      setConfirmRegenerate(false);
      setShowApiKey(true); // Show the new key
      
      // Hide success message after 10 seconds
      setTimeout(() => setSuccess(''), 10000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to regenerate API key');
      setConfirmRegenerate(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('API key copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>🔐 Registration Management</h1>
        </div>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🔐 Registration Management</h1>
        <p className="admin-subtitle">Manage Minecraft in-game registration system</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* API Key Section */}
      <div className="admin-card">
        <h2>🔑 Registration API Key</h2>
        <p className="card-description">
          This API key is required for your Minecraft mod/plugin to generate registration codes.
          Keep it secure and only share it with server administrators.
        </p>

        <div className="api-key-section">
          <div className="api-key-display">
            <label>Current API Key:</label>
            <div className="api-key-container">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInfo?.api_key || ''}
                readOnly
                className="api-key-input"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="btn-secondary btn-small"
                title={showApiKey ? 'Hide' : 'Show'}
              >
                {showApiKey ? '🙈' : '👁️'}
              </button>
              <button
                onClick={() => copyToClipboard(apiKeyInfo?.api_key || '')}
                className="btn-primary btn-small"
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
            </div>
          </div>

          <div className="api-key-metadata">
            <div className="metadata-item">
              <span className="metadata-label">Created:</span>
              <span className="metadata-value">
                {apiKeyInfo?.created_at !== 'Unknown' 
                  ? new Date(apiKeyInfo?.created_at || '').toLocaleString()
                  : 'Unknown'}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Last Regenerated:</span>
              <span className="metadata-value">
                {apiKeyInfo?.last_regenerated !== 'Never'
                  ? new Date(apiKeyInfo?.last_regenerated || '').toLocaleString()
                  : 'Never'}
              </span>
            </div>
          </div>

          <div className="api-key-actions">
            {!confirmRegenerate ? (
              <button onClick={handleRegenerateKey} className="btn-warning">
                🔄 Regenerate API Key
              </button>
            ) : (
              <div className="confirm-regenerate">
                <p className="warning-text">
                  ⚠️ Warning: This will invalidate the current API key and break any existing Minecraft mod/plugin configurations!
                </p>
                <div className="confirm-buttons">
                  <button onClick={handleRegenerateKey} className="btn-danger">
                    ✓ Yes, Regenerate Key
                  </button>
                  <button onClick={() => setConfirmRegenerate(false)} className="btn-secondary">
                    ✗ Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="integration-guide">
          <h3>📝 Integration Guide</h3>
          <p>Add this header to your Minecraft mod/plugin requests:</p>
          <pre className="code-block">
{`POST /api/registration/generate-code
Content-Type: application/json
X-API-Key: ${showApiKey ? apiKeyInfo?.api_key : '••••••••••••••••••••••••••••••••'}

{
  "minecraft_username": "PlayerName",
  "minecraft_uuid": "12345678-1234-1234-1234-123456789abc"
}`}
          </pre>
        </div>
      </div>

      {/* Statistics Section */}
      {stats && (
        <div className="admin-card">
          <h2>📊 Registration Statistics</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total_codes}</div>
              <div className="stat-label">Total Codes Generated</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.used_codes}</div>
              <div className="stat-label">Codes Used</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.active_codes}</div>
              <div className="stat-label">Active Codes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.expired_codes}</div>
              <div className="stat-label">Expired Codes</div>
            </div>
            <div className="stat-card stat-highlight">
              <div className="stat-value">{stats.registered_users}</div>
              <div className="stat-label">Registered Minecraft Users</div>
            </div>
          </div>

          {stats.recent_registrations && stats.recent_registrations.length > 0 && (
            <div className="recent-registrations">
              <h3>Recent Registrations</h3>
              <div className="registrations-list">
                {stats.recent_registrations.map((reg, index) => (
                  <div key={index} className="registration-item">
                    <span className="registration-username">👤 {reg.minecraft_username}</span>
                    <span className="registration-date">
                      {new Date(reg.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Documentation Section */}
      <div className="admin-card">
        <h2>📚 Documentation</h2>
        <div className="documentation-section">
          <h3>Security Features</h3>
          <ul>
            <li>✅ 64-character cryptographically secure API key</li>
            <li>✅ Rate limiting prevents abuse (configurable per IP)</li>
            <li>✅ Registration codes expire after 10 minutes</li>
            <li>✅ One-time use codes prevent duplicate registrations</li>
            <li>✅ Audit logging of all authentication attempts</li>
          </ul>

          <h3>For Mod/Plugin Developers</h3>
          <p>To integrate with your Minecraft server:</p>
          <ol>
            <li>Copy the API key from above</li>
            <li>Store it securely in your mod/plugin configuration</li>
            <li>Include <code>X-API-Key</code> header in all requests to <code>/api/registration/generate-code</code></li>
            <li>Display the generated code to the player in-game</li>
            <li>Instruct player to visit the registration page with the code</li>
          </ol>

          <p>
            <a 
              href="https://github.com/yourusername/vonix-network#minecraft-registration-system" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-link"
            >
              📖 View Full Documentation →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegistrationPage;
