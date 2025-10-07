import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useFeatures } from '../context/FeatureContext';

type Flags = {
  servers: boolean;
  forum: boolean;
  social: boolean;
  messages: boolean;
  discord_chat: boolean;
};

const AdminFeaturesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [flags, setFlags] = useState<Flags>({ servers: true, forum: true, social: true, messages: true, discord_chat: true });
  const { refresh } = useFeatures();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/features');
      setFlags(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load feature flags');
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
      await api.post('/admin/features', flags);
      // Refresh the global feature context so other components get updated
      await refresh();
      alert('Feature flags saved');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to save feature flags');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><p>Loading features...</p></div>;
  }

  return (
    <div className="manage-section">
      <div className="section-header">
        <div>
          <h1 className="section-title">🧰 Site Features</h1>
          <p className="section-subtitle">Enable or disable sections of the site</p>
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={save} className="modal-form">
        <div className="form-group">
          <label className="form-checkbox">
            <input type="checkbox" checked={flags.servers} onChange={(e)=>setFlags({...flags, servers: e.target.checked})} />
            <span>Enable Servers page</span>
          </label>
        </div>
        <div className="form-group">
          <label className="form-checkbox">
            <input type="checkbox" checked={flags.discord_chat} onChange={(e)=>setFlags({...flags, discord_chat: e.target.checked})} />
            <span>Show Discord chat on Home page</span>
          </label>
        </div>
        <div className="form-group">
          <label className="form-checkbox">
            <input type="checkbox" checked={flags.forum} onChange={(e)=>setFlags({...flags, forum: e.target.checked})} />
            <span>Enable Forum pages</span>
          </label>
        </div>
        <div className="form-group">
          <label className="form-checkbox">
            <input type="checkbox" checked={flags.social} onChange={(e)=>setFlags({...flags, social: e.target.checked})} />
            <span>Enable Social pages</span>
          </label>
        </div>
        <div className="form-group">
          <label className="form-checkbox">
            <input type="checkbox" checked={flags.messages} onChange={(e)=>setFlags({...flags, messages: e.target.checked})} />
            <span>Enable Messages pages</span>
          </label>
        </div>

        <div className="modal-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
};

export default AdminFeaturesPage;
