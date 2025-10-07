import React, { useEffect, useState } from 'react';
import api from '../services/api';
import SetupWizard from '../components/SetupWizard/SetupWizard';
import './LoginPage.css';

const SetupPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/setup/status');
        if (!res.data?.setup_required) {
          setAlreadyDone(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Checking setup status...</p>
      </div>
    );
  }

  if (alreadyDone) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Setup already completed</h1>
          <p>You can log in to your account.</p>
          <a className="btn btn-primary" href="/login">Go to Login</a>
        </div>
      </div>
    );
  }

  return <SetupWizard />;
};

export default SetupPage;
