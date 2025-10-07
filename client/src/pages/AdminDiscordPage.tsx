import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AdminDiscordPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [form, setForm] = useState({ token: '', channel_id: '', webhook_url: '' });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/discord/settings');
      setForm({
        token: '', // never prefill sensitive token
        channel_id: res.data?.channel_id || '',
        webhook_url: res.data?.webhook_url || ''
      });
      setRunning(!!res.data?.running);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/discord/settings', form);
      await load();
      alert('Discord settings saved and bot reloaded');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const call = async (path: string) => {
    setStatusLoading(true);
    setError('');
    try {
      const res = await api.post(`/admin/discord/${path}`);
      if (res.data?.success) {
        await load();
      } else {
        setError('Operation failed');
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Operation failed');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container"><div className="spinner" /><p>Loading Discord settings...</p></div>
    );
  }

  return (
    <div className="manage-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">🤖 Discord Bot</h1>
          <p className="section-subtitle">Manage Discord integration and live chat</p>
        </div>
        <div>
          <button className="btn btn-secondary" disabled={statusLoading} onClick={()=>call('reload')}>Reload</button>{' '}
          {running ? (
            <button className="btn btn-danger" disabled={statusLoading} onClick={()=>call('stop')}>Stop</button>
          ) : (
            <button className="btn btn-primary" disabled={statusLoading} onClick={()=>call('start')}>Start</button>
          )}
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={save} className="modal-form">
        <div className="form-group">
          <label className="form-label">Bot Token</label>
          <input
            className="form-input"
            placeholder="Paste new token to update"
            value={form.token}
            onChange={(e)=>setForm({...form, token: e.target.value})}
          />
          <small className="form-hint">Token is never shown. Paste to update.</small>
        </div>

        <div className="form-group">
          <label className="form-label">Channel ID</label>
          <input
            className="form-input"
            value={form.channel_id}
            onChange={(e)=>setForm({...form, channel_id: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Webhook URL (optional)</label>
          <input
            className="form-input"
            value={form.webhook_url}
            onChange={(e)=>setForm({...form, webhook_url: e.target.value})}
          />
        </div>

        <div className="modal-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save & Reload'}</button>
        </div>
      </form>
    </div>
  );
};

export default AdminDiscordPage;
