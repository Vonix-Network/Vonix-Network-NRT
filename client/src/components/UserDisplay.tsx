import React from 'react';
import { getDonationRankByAmount, DonationRank as DonationRankType } from '../types/donationRanks';
import DonationRank from './DonationRank';
import './UserDisplay.css';

interface UserDisplayProps {
  username: string;
  minecraftUsername?: string;
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
  showDonationRank?: boolean;
  showIcon?: boolean;
  showBadge?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const UserDisplay: React.FC<UserDisplayProps> = ({
  username,
  minecraftUsername,
  totalDonated = 0,
  donationRank,
  showDonationRank = true,
  showIcon = true,
  showBadge = true,
  size = 'medium',
  className = ''
}) => {
  // Determine the donation rank to display
  // Only show rank if user has an active donationRank object (not based on total donated)
  let rankToShow: DonationRankType | null = null;
  if (donationRank) {
    // Try to get the full rank object by ID
    const fullRank = getDonationRankByAmount(totalDonated);
    if (fullRank && fullRank.id === donationRank.id) {
      rankToShow = fullRank;
    } else {
      // Fallback: create a minimal rank object from the provided data
      rankToShow = {
        id: donationRank.id,
        name: donationRank.name,
        minAmount: 0,
        color: donationRank.color,
        textColor: donationRank.textColor,
        icon: donationRank.icon,
        badge: donationRank.badge,
        glow: donationRank.glow,
        duration: 30,
        subtitle: '',
        perks: [],
        minecraftPerks: []
      };
    }
  }
  // Note: Removed the fallback to totalDonated calculation - ranks are subscription-based only

  const displayName = minecraftUsername || username;
  const hasRank = showDonationRank && rankToShow;
  
  const containerClasses = `user-display user-display--${size} ${className}`.trim();
  const usernameClasses = hasRank && rankToShow?.glow 
    ? 'user-display__username user-display__username--glow' 
    : 'user-display__username';

  const customStyle = hasRank && rankToShow ? {
    '--rank-color': rankToShow.color,
    '--rank-text-color': rankToShow.textColor
  } as React.CSSProperties : {};

  return (
    <div className={containerClasses} style={customStyle}>
      <span 
        className={usernameClasses}
        style={hasRank && rankToShow ? { color: rankToShow.color } : {}}
      >
        {displayName}
      </span>
      {hasRank && rankToShow && (
        <DonationRank
          rank={rankToShow}
          showIcon={showIcon}
          showBadge={showBadge}
          showName={false}
          size={size}
        />
      )}
    </div>
  );
};

export default UserDisplay;
