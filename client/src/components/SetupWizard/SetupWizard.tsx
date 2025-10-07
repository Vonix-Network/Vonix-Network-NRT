import React, { useState } from 'react';
import AdminDetailsStep from './AdminDetailsStep';
import DiscordConfigStep from './DiscordConfigStep';
import ReviewStep from './ReviewStep';
import './SetupWizard.css';

export interface SetupData {
  username: string;
  password: string;
  confirmPassword: string;
  discord_bot_token: string;
  discord_channel_id: string;
  discord_webhook_url: string;
}

const SetupWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>({
    username: '',
    password: '',
    confirmPassword: '',
    discord_bot_token: '',
    discord_channel_id: '',
    discord_webhook_url: ''
  });

  const steps = [
    { number: 1, title: 'Admin Account', description: 'Create your admin account' },
    { number: 2, title: 'Discord Setup', description: 'Configure Discord integration' },
    { number: 3, title: 'Review', description: 'Review and complete setup' }
  ];

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateData = (data: Partial<SetupData>) => {
    setSetupData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="setup-wizard">
      <div className="setup-container">
        <div className="setup-header">
          <h1 className="setup-title">Welcome to Vonix Network</h1>
          <p className="setup-subtitle">Let's get your community platform set up</p>
          
          {/* Progress Steps */}
          <div className="setup-progress">
            {steps.map((step, index) => (
              <div key={step.number} className="progress-step">
                <div className={`step-indicator ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}>
                  {currentStep > step.number ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <div className="step-content">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`step-connector ${currentStep > step.number ? 'completed' : ''}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="setup-content">
          {currentStep === 1 && (
            <AdminDetailsStep
              data={setupData}
              updateData={updateData}
              onNext={nextStep}
            />
          )}
          {currentStep === 2 && (
            <DiscordConfigStep
              data={setupData}
              updateData={updateData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          {currentStep === 3 && (
            <ReviewStep
              data={setupData}
              onPrev={prevStep}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
