import React, { useState } from 'react';
import { SetupData } from './SetupWizard';

interface AdminDetailsStepProps {
  data: SetupData;
  updateData: (data: Partial<SetupData>) => void;
  onNext: () => void;
}

const AdminDetailsStep: React.FC<AdminDetailsStepProps> = ({ data, updateData, onNext }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (data.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (data.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!data.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="setup-step">
      <div className="step-header">
        <h2>Create Admin Account</h2>
        <p>This account will have full administrative privileges on your platform.</p>
      </div>

      <div className="step-form">
        <div className="form-group">
          <label className="form-label">
            <span>Admin Username</span>
            <span className="required">*</span>
          </label>
          <input
            type="text"
            className={`form-input ${errors.username ? 'error' : ''}`}
            value={data.username}
            onChange={(e) => updateData({ username: e.target.value })}
            placeholder="Enter admin username"
            autoComplete="username"
          />
          {errors.username && <div className="form-error">{errors.username}</div>}
          <div className="form-hint">Choose a unique username for the admin account</div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>Password</span>
            <span className="required">*</span>
          </label>
          <input
            type="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            value={data.password}
            onChange={(e) => updateData({ password: e.target.value })}
            placeholder="Enter secure password"
            autoComplete="new-password"
          />
          {errors.password && <div className="form-error">{errors.password}</div>}
          <div className="form-hint">Use at least 6 characters with a mix of letters and numbers</div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>Confirm Password</span>
            <span className="required">*</span>
          </label>
          <input
            type="password"
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            value={data.confirmPassword}
            onChange={(e) => updateData({ confirmPassword: e.target.value })}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
          {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
        </div>

        <div className="security-notice">
          <div className="notice-icon">🔒</div>
          <div className="notice-content">
            <strong>Security Notice:</strong> This admin account will have full access to your platform. 
            Make sure to use a strong, unique password and keep these credentials secure.
          </div>
        </div>

        <div className="step-actions">
          <button 
            type="button" 
            className="btn btn-primary btn-lg"
            onClick={handleNext}
          >
            Continue to Discord Setup
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: '8px' }}>
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDetailsStep;
