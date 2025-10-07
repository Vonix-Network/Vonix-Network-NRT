import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminEmailPage: React.FC = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    host: '',
    port: '587',
    secure: false,
    user: '',
    password: '',
    from: '',
    hasPassword: false
  });

  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/email/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching email settings:', error);
      setMessage({ type: 'error', text: 'Failed to load email settings' });
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/admin/email/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Email settings saved successfully!' });
      fetchSettings(); // Refresh to get updated hasPassword
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to save email settings' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Please enter a test email address' });
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/admin/email/test`,
        { testEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Test email failed' });
      }
    } catch (error: any) {
      console.error('Error testing email:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to test email configuration' 
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <h1>📧 Email Configuration</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">📧 Email Configuration</h1>
          <p className="section-subtitle">
            Configure SMTP settings to enable email notifications, password resets, and more.
          </p>
        </div>
      </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

      <div className="settings-card">
        <div className="settings-card-header">
          <h2 className="settings-card-title">Email Settings</h2>
        </div>
        <div className="settings-card-body">
          
        <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                />
                Enable Email Service
              </label>
              <small>Enable this to activate email notifications and features</small>
            </div>

            {settings.enabled && (
              <>
                <div className="form-group">
                  <label>SMTP Host *</label>
                  <input
                    type="text"
                    value={settings.host}
                    onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    required
                  />
                  <small>Your SMTP server address (e.g., smtp.gmail.com, smtp.sendgrid.net)</small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Port *</label>
                    <input
                      type="number"
                      value={settings.port}
                      onChange={(e) => setSettings({ ...settings, port: e.target.value })}
                      required
                    />
                    <small>Usually 587 (TLS) or 465 (SSL)</small>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={settings.secure}
                        onChange={(e) => setSettings({ ...settings, secure: e.target.checked })}
                      />
                      Use SSL (port 465)
                    </label>
                    <small>Check for port 465, uncheck for port 587</small>
                  </div>
                </div>

                <div className="form-group">
                  <label>Username/Email *</label>
                  <input
                    type="text"
                    value={settings.user}
                    onChange={(e) => setSettings({ ...settings, user: e.target.value })}
                    placeholder="your-email@example.com"
                    required
                  />
                  <small>SMTP username (usually your email address)</small>
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={settings.password}
                    onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                    placeholder={settings.hasPassword ? '••••••••' : 'Enter SMTP password'}
                    required={!settings.hasPassword}
                  />
                  <small>
                    {settings.hasPassword 
                      ? 'Leave blank to keep current password' 
                      : 'SMTP password or app-specific password'}
                  </small>
                </div>

                <div className="form-group">
                  <label>"From" Address</label>
                  <input
                    type="email"
                    value={settings.from}
                    onChange={(e) => setSettings({ ...settings, from: e.target.value })}
                    placeholder="noreply@vonix.network"
                  />
                  <small>The email address that appears in the "From" field (defaults to username)</small>
                </div>

                <div className="info-box">
                  <strong>📌 Gmail Users:</strong>
                  <ul>
                    <li>Enable 2-Factor Authentication</li>
                    <li>Create an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">App Password</a></li>
                    <li>Use the app password instead of your regular password</li>
                  </ul>
                </div>
              </>
            )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
        </div>
      </div>

      {settings.enabled && (
        <div className="settings-card">
          <div className="settings-card-header">
            <h2 className="settings-card-title">Test Email Configuration</h2>
            <p className="settings-card-description">Send a test email to verify your SMTP settings are working correctly.</p>
          </div>
          <div className="settings-card-body">

          <form onSubmit={handleTest}>
            <div className="form-group">
              <label>Test Email Address</label>
              <input
                type="email"
                className="form-control"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-secondary" disabled={testing}>
                {testing ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title">🔧 Supported Email Providers</h3>
        </div>
        <div className="settings-card-body">
        <ul className="provider-list">
          <li><strong>Gmail:</strong> smtp.gmail.com:587 (TLS) - Requires app password</li>
          <li><strong>Outlook/Office365:</strong> smtp-mail.outlook.com:587 (TLS)</li>
          <li><strong>SendGrid:</strong> smtp.sendgrid.net:587 (TLS)</li>
          <li><strong>Mailgun:</strong> smtp.mailgun.org:587 (TLS)</li>
          <li><strong>Amazon SES:</strong> Check AWS console for SMTP endpoint</li>
        </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailPage;
