import React, { useState, useEffect } from 'react';
import DonationRank from '../components/DonationRank';
import DonationSubscription from '../components/DonationSubscription';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './DonationRanks.css';

const DonationRanks: React.FC = () => {
  const { user } = useAuth();
  const [userDonations, setUserDonations] = useState<any>(null);
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanks();
    if (user) {
      loadUserDonations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadRanks = async () => {
    try {
      const response = await api.get('/donations/ranks');
      setRanks(response.data);
    } catch (error) {
      console.error('Error loading ranks:', error);
      // Fallback to static ranks if API fails
      const { DONATION_RANKS } = await import('../types/donationRanks');
      setRanks(Object.values(DONATION_RANKS));
    }
  };

  const loadUserDonations = async () => {
    try {
      const response = await api.get(`/donations/user/${user?.id}`);
      setUserDonations(response.data);
    } catch (error) {
      console.error('Error loading user donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDonationAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="donation-ranks-page mobile-content">
      {/* Hero Section */}
      <section className="ranks-hero">
        <div className="ranks-hero-background"></div>
        <div className="container">
          <div className="ranks-hero-content">
            <h1 className="page-title">💎 Donation Ranks</h1>
            <p className="page-subtitle">
              Support our community and unlock exclusive perks for both our website and Minecraft servers!
            </p>
          </div>
        </div>
      </section>

      <div className="container">
        {/* User Status */}
        {user && (
          <div className="user-status-section">
            {loading ? (
              <div className="loading-container">Loading your donation status...</div>
            ) : userDonations ? (
              <DonationSubscription 
                totalDonated={user?.total_donated || userDonations.totalDonated} 
                donationRank={user?.donation_rank}
                donationRankExpiresAt={user?.donation_rank_expires_at}
                showPerks={true}
                ranks={ranks}
              />
            ) : (
              <div className="no-donations-card">
                <div className="card">
                  <div className="card-header">
                    <h3>🌟 Start Your Journey</h3>
                  </div>
                  <p>You haven't made any donations yet. Start supporting our community today!</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ranks Grid */}
        <section className="ranks-section">
          <div className="section-header">
            <h2 className="section-title">Monthly Subscription Ranks</h2>
            <p className="section-subtitle">Choose your level of support and unlock exclusive benefits</p>
          </div>

          <div className="ranks-grid">
            {ranks.map((rank: any) => (
              <div key={rank.id} className="rank-card">
                <div className="rank-card-header">
                  <div className="rank-name-line">
                    <DonationRank 
                      rank={rank} 
                      showName={false} 
                      size="medium"
                      className="rank-badge"
                    />
                    <h3 className="rank-title">{rank.name}</h3>
                  </div>
                  <div className="rank-price-line">
                    <div className="rank-price">{formatDonationAmount(rank.minAmount)}</div>
                    <div className="rank-period">per month</div>
                  </div>
                </div>
                
                <div className="rank-card-content">
                  {rank.subtitle && (
                    <p className="rank-subtitle">{rank.subtitle}</p>
                  )}
                  
                  <div className="rank-perks">
                    <h4>Community Perks</h4>
                    <ul>
                      {rank.perks.map((perk: string, index: number) => (
                        <li key={index}>{perk}</li>
                      ))}
                    </ul>
                    
                    <h4>Minecraft Perks</h4>
                    <ul>
                      {rank.minecraftPerks.map((perk: string, index: number) => (
                        <li key={index}>{perk}</li>
                      ))}
                    </ul>
                  </div>

                  <button className="btn btn-primary btn-lg rank-subscribe-btn">
                    Subscribe Now
                  </button>
                  <p className="rank-activation-note">
                    💬 After payment, contact support to activate your rank
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="how-it-works-section">
          <div className="card">
            <div className="card-header">
              <h3>🕐 How Monthly Ranks Work</h3>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-icon">📅</div>
                <div className="info-content">
                  <h4>Monthly Subscriptions</h4>
                  <p>Each rank is a separate monthly subscription - choose the one that fits your budget</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">💬</div>
                <div className="info-content">
                  <h4>Support Activation</h4>
                  <p>After payment, contact our support team to have your rank manually activated</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">🔄</div>
                <div className="info-content">
                  <h4>Monthly Renewal</h4>
                  <p>Ranks are monthly subscriptions that need to be renewed each month</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">💰</div>
                <div className="info-content">
                  <h4>Server Support</h4>
                  <p>Your contribution helps cover server costs and improvements</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="card cta-card">
            <div className="cta-content">
              <h3>Ready to Support Our Community?</h3>
              <p>Choose a rank that fits your budget and start enjoying exclusive perks today!</p>
              <div className="cta-actions">
                <button className="btn btn-primary btn-lg">
                  View Payment Options
                </button>
                <button className="btn btn-secondary btn-lg">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DonationRanks;
