import React from 'react';
import DonationRank from './DonationRank';
import { formatDonationAmount } from '../types/donationRanks';
import './DonationSubscription.css';

interface DonationSubscriptionProps {
  totalDonated?: number;
  donationRank?: {
    id: string;
    name: string;
    color: string;
    textColor: string;
    icon: string;
    badge: string;
    glow: boolean;
  };
  donationRankExpiresAt?: string;
  className?: string;
  showPerks?: boolean;
  ranks?: any[]; // Array of available ranks
}

const DonationSubscription: React.FC<DonationSubscriptionProps> = ({
  totalDonated,
  donationRank,
  donationRankExpiresAt,
  className = '',
  showPerks = false,
  ranks = []
}) => {
  const safeTotalDonated = totalDonated || 0;
  
  // Calculate days until expiration
  const getDaysUntilExpiration = () => {
    if (!donationRankExpiresAt) return null;
    const expirationDate = new Date(donationRankExpiresAt);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiration = getDaysUntilExpiration();
  const isExpired = daysUntilExpiration !== null && daysUntilExpiration < 0;
  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7 && daysUntilExpiration > 0;

  // Get the full rank object from the ranks prop
  const fullRank = donationRank ? ranks.find((r: any) => r.id === donationRank.id) : null;

  return (
    <div className={`donation-subscription ${className}`}>
      {/* Current Status */}
      <div className="donation-subscription__status">
        {fullRank && (
          <div className="donation-subscription__rank">
            <span className="donation-subscription__label">Current Subscription:</span>
            <DonationRank 
              rank={fullRank} 
              showName={true}
              size="medium"
            />
          </div>
        )}
        
        {donationRank && !fullRank && (
          <div className="donation-subscription__rank">
            <span className="donation-subscription__label">Current Subscription:</span>
            <div className="rank-badge-fallback" style={{ color: donationRank.color }}>
              {donationRank.icon} {donationRank.name}
            </div>
          </div>
        )}
        
        <div className="donation-subscription__total">
          <span className="donation-subscription__label">Total Contributed:</span>
          <span className="donation-subscription__amount">
            {formatDonationAmount(safeTotalDonated)}
          </span>
        </div>
      </div>

      {/* Subscription Status */}
      {donationRank && (
        <div className="donation-subscription__expiration">
          {donationRankExpiresAt ? (
            <div className={`subscription-status ${isExpired ? 'expired' : isExpiringSoon ? 'expiring' : 'active'}`}>
              {isExpired ? (
                <>
                  <span className="status-icon">❌</span>
                  <span className="status-text">
                    Subscription expired {Math.abs(daysUntilExpiration!)} days ago
                  </span>
                </>
              ) : isExpiringSoon ? (
                <>
                  <span className="status-icon">⚠️</span>
                  <span className="status-text">
                    Subscription expires in {daysUntilExpiration} days
                  </span>
                </>
              ) : (
                <>
                  <span className="status-icon">✅</span>
                  <span className="status-text">
                    Subscription active • {daysUntilExpiration} days remaining
                  </span>
                </>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Perks Display */}
      {showPerks && fullRank && (
        <div className="donation-subscription__perks">
          <h4 className="donation-subscription__perks-title">Your {fullRank.name} Perks</h4>
          <div className="donation-subscription__perks-lists">
            <div className="donation-subscription__perks-section">
              <h5>Community Perks</h5>
              <ul>
                {fullRank.perks.map((perk: string, index: number) => (
                  <li key={index}>{perk}</li>
                ))}
              </ul>
            </div>
            <div className="donation-subscription__perks-section">
              <h5>Minecraft Perks</h5>
              <ul>
                {fullRank.minecraftPerks.map((perk: string, index: number) => (
                  <li key={index}>{perk}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* No Rank Message */}
      {!donationRank && (
        <div className="donation-subscription-empty">
          <div className="empty-icon">💎</div>
          <h3>No Active Subscription</h3>
          <p>Support our community with a monthly rank subscription!</p>
          <p>Choose from our monthly ranks starting at $5/month for exclusive perks.</p>
          <div className="cta-buttons">
            <a href="/ranks" className="btn btn-primary">View Ranks</a>
            <a href="/donations" className="btn btn-secondary">Donate Now</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationSubscription;
