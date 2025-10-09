import React from 'react';
import { DonationRank as DonationRankType } from '../types/donationRanks';
import './DonationRank.css';

interface DonationRankProps {
  rank: DonationRankType;
  showIcon?: boolean;
  showBadge?: boolean;
  showName?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const DonationRank: React.FC<DonationRankProps> = ({
  rank,
  showIcon = true,
  showBadge = true,
  showName = false,
  size = 'medium',
  className = ''
}) => {
  const baseClasses = `donation-rank donation-rank--${size}`;
  const glowClass = rank.glow ? 'donation-rank--glow' : '';
  const classes = `${baseClasses} ${glowClass} ${className}`.trim();

  return (
    <div 
      className={classes}
      style={{
        '--rank-color': rank.color,
        '--rank-text-color': rank.textColor
      } as React.CSSProperties}
      title={`${rank.name} - $${rank.minAmount}+ donated`}
    >
      {showIcon && (
        <span className="donation-rank__icon">{rank.icon}</span>
      )}
      {showBadge && (
        <span className="donation-rank__badge">{rank.badge}</span>
      )}
      {showName && (
        <span className="donation-rank__name">{rank.name}</span>
      )}
    </div>
  );
};

export default DonationRank;
