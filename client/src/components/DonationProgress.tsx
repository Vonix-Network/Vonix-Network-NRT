import React from 'react';
import { getDonationProgress, formatDonationAmount } from '../types/donationRanks';
import DonationRank from './DonationRank';
import './DonationProgress.css';

interface DonationProgressProps {
  totalDonated: number | undefined | null;
  showDetails?: boolean;
  showPerks?: boolean;
  className?: string;
}

const DonationProgress: React.FC<DonationProgressProps> = ({
  totalDonated,
  showDetails = true,
  showPerks = false,
  className = ''
}) => {
  const safeTotalDonated = totalDonated || 0;
  const { currentRank, nextRank, progress } = getDonationProgress(safeTotalDonated);

  return (
    <div className={`donation-progress ${className}`}>
      {/* Current Status */}
      <div className="donation-progress__status">
        <div className="donation-progress__current">
          <span className="donation-progress__label">Total Donated:</span>
          <span className="donation-progress__amount">
            {formatDonationAmount(safeTotalDonated)}
          </span>
        </div>
        
        {currentRank && (
          <div className="donation-progress__rank">
            <span className="donation-progress__label">Current Rank:</span>
            <DonationRank 
              rank={currentRank} 
              showName={true}
              size="medium"
            />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {nextRank && (
        <div className="donation-progress__next">
          <div className="donation-progress__next-info">
            <span className="donation-progress__next-label">
              Next Rank: <strong>{nextRank.rank.name}</strong>
            </span>
            <span className="donation-progress__remaining">
              {formatDonationAmount(nextRank.remaining)} remaining
            </span>
          </div>
          
          <div className="donation-progress__bar">
            <div 
              className="donation-progress__fill"
              style={{ 
                width: `${progress}%`,
                backgroundColor: nextRank.rank.color 
              }}
            />
          </div>
          
          <div className="donation-progress__amounts">
            <span>{formatDonationAmount(currentRank?.minAmount || 0)}</span>
            <span>{formatDonationAmount(nextRank.rank.minAmount)}</span>
          </div>
        </div>
      )}

      {!nextRank && currentRank && (
        <div className="donation-progress__maxed">
          <div className="donation-progress__maxed-content">
            <span className="donation-progress__maxed-icon">🏆</span>
            <span className="donation-progress__maxed-text">
              Maximum rank achieved! Thank you for your incredible support!
            </span>
          </div>
        </div>
      )}

      {/* Perks Display */}
      {showPerks && currentRank && (
        <div className="donation-progress__perks">
          <h4 className="donation-progress__perks-title">Your Perks</h4>
          <div className="donation-progress__perks-lists">
            <div className="donation-progress__perks-section">
              <h5>Community Perks</h5>
              <ul>
                {currentRank.perks.map((perk, index) => (
                  <li key={index}>{perk}</li>
                ))}
              </ul>
            </div>
            <div className="donation-progress__perks-section">
              <h5>Minecraft Perks</h5>
              <ul>
                {currentRank.minecraftPerks.map((perk, index) => (
                  <li key={index}>{perk}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Details */}
      {showDetails && !currentRank && safeTotalDonated === 0 && (
        <div className="donation-progress-empty">
          <p>Support our community with a monthly rank subscription!</p>
          <p>Choose from our monthly ranks starting at $5/month for exclusive perks.</p>
          <p><strong>Note:</strong> After payment, contact our support team to have your rank activated.</p>
        </div>
      )}

    </div>
  );
};
export default DonationProgress;
