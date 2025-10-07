import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './RegisterPage.css';

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [minecraftUsername, setMinecraftUsername] = useState('');
  const [, setMinecraftUuid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (code && code.length === 6) {
      checkCode(code);
    }
  }, [code]);

  const checkCode = async (codeValue: string) => {
    setChecking(true);
    setError('');
    try {
      const response = await api.get(`/registration/check-code/${codeValue}`);
      if (response.data.valid) {
        setMinecraftUsername(response.data.minecraft_username);
        setMinecraftUuid(response.data.minecraft_uuid || '');
      } else {
        setError('Invalid or expired registration code');
        setMinecraftUsername('');
        setMinecraftUuid('');
      }
    } catch (err) {
      setError('Invalid or expired registration code');
      setMinecraftUsername('');
      setMinecraftUuid('');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/registration/register', {
        code: code.toUpperCase(),
        password
      });

      // Auto-login
      login(response.data.token, response.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <h1 className="register-title">🎮 Register with Minecraft</h1>
          <p className="register-subtitle">
            Enter your registration code from the game
          </p>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label className="form-label">Registration Code</label>
              <input
                type="text"
                className="form-input code-input"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-F0-9]/g, '');
                  setCode(value);
                  if (value.length === 6) {
                    checkCode(value);
                  }
                }}
                maxLength={6}
                placeholder="ABC123"
                required
              />
              <small className="form-hint">
                Run <code>/vonixregister</code> in Minecraft to get your code
              </small>
            </div>

            {checking && (
              <div className="checking-code">
                <div className="spinner-small"></div>
                <span>Checking code...</span>
              </div>
            )}

            {minecraftUsername && (
              <div className="minecraft-user-preview">
                <img 
                  src={`https://mc-heads.net/avatar/${minecraftUsername}/48`} 
                  alt={minecraftUsername}
                  className="minecraft-head"
                />
                <div>
                  <div className="minecraft-label">Minecraft Account</div>
                  <div className="minecraft-name">{minecraftUsername}</div>
                </div>
              </div>
            )}

            {minecraftUsername && (
              <>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </>
            )}

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !minecraftUsername}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="register-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </div>

        <div className="register-info">
          <h3>How to Register</h3>
          <ol>
            <li>Join our Minecraft server</li>
            <li>Run the command <code>/vonixregister</code></li>
            <li>Copy the 6-character code shown in chat</li>
            <li>Enter the code here and set a password</li>
            <li>Your account will be created with your Minecraft username!</li>
          </ol>

          <div className="register-benefits">
            <h4>Benefits of Registering</h4>
            <ul>
              <li>💬 Chat on the website with your Minecraft account</li>
              <li>🎨 Display your Minecraft skin as avatar</li>
              <li>⚡ Real-time sync between game and website</li>
              <li>🏆 Track your stats and achievements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
