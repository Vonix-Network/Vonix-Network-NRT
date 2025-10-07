import React from 'react';
import { Link } from 'react-router-dom';
import LiveChat from '../components/LiveChat';
import { BRAND_NAME, DISCORD_INVITE_URL } from '../config/appConfig';
import './HomePage.css';
import { useFeatures } from '../context/FeatureContext';

const HomePage: React.FC = () => {
  const { flags } = useFeatures();
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background"></div>
        <div className="container hero-content">
          <div className="hero-text animate-fadeIn">
            <h1 className="hero-title">
              Welcome to <span className="gradient-text">{BRAND_NAME}</span>
            </h1>
            <p className="hero-subtitle">
              A thriving Minecraft community featuring modded servers, live chat, and an amazing player experience
            </p>
            <div className="hero-actions">
              <Link to="/servers" className="btn btn-primary btn-lg">
                <span>🎮</span>
                View Servers
              </Link>
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-lg"
              >
                <span>💬</span>
                Join Discord
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Vonix.Network?</h2>
          <div className="features-grid">
            <div className="feature-card animate-slideInUp">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Modded Excellence</h3>
              <p className="feature-description">
                Experience curated modpacks like BMC5 by LunaPixel Studios with optimized performance
              </p>
            </div>

            <div className="feature-card animate-slideInUp" style={{ animationDelay: '0.1s' }}>
              <div className="feature-icon">🗺️</div>
              <h3 className="feature-title">Interactive Maps</h3>
              <p className="feature-description">
                Explore your world with Bluemap integration for immersive 3D server visualization
              </p>
            </div>

            <div className="feature-card animate-slideInUp" style={{ animationDelay: '0.2s' }}>
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Active Community</h3>
              <p className="feature-description">
                Join hundreds of players in our vibrant Discord community with live chat integration
              </p>
            </div>

            <div className="feature-card animate-slideInUp" style={{ animationDelay: '0.3s' }}>
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Secure & Reliable</h3>
              <p className="feature-description">
                Professional server management with 99.9% uptime and regular backups
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Section */}
      {flags.discord_chat && (
        <section className="chat-section">
          <div className="container">
            <div className="chat-wrapper">
              <div className="chat-info">
                <h2 className="section-title">Live Community Chat</h2>
                <p className="section-description">
                  Stay connected with our community through our integrated Discord chat. 
                  See what everyone's talking about in real-time!
                </p>
                <div className="chat-stats">
                  <div className="stat">
                    <div className="stat-value">500+</div>
                    <div className="stat-label">Community Members</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">24/7</div>
                    <div className="stat-label">Active Support</div>
                  </div>
                </div>
              </div>
              <div className="chat-container">
                <LiveChat />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Join the Adventure?</h2>
            <p className="cta-description">
              Connect with players, explore modded worlds, and be part of something amazing
            </p>
            <Link to="/servers" className="btn btn-primary btn-lg">
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
