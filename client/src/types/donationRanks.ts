export interface DonationRank {
  id: string;
  name: string;
  minAmount: number;
  color: string;
  textColor: string;
  icon: string;
  perks: string[];
  minecraftPerks: string[];
  badge: string;
  glow: boolean;
  duration: number; // days
  subtitle?: string; // monthly description
}

export const DONATION_RANKS: Record<string, DonationRank> = {
  SUPPORTER: {
    id: 'supporter',
    name: 'Supporter',
    minAmount: 5,
    color: '#10b981', // Emerald green
    textColor: '#ffffff',
    icon: '🌟',
    badge: 'SUP',
    glow: false,
    duration: 30,
    subtitle: '$5 Monthly',
    perks: [
      'Custom username color',
      'Supporter badge',
      'Priority support',
      'Access to supporter-only channels'
    ],
    minecraftPerks: [
      'Supporter prefix in chat',
      'Access to /hat command',
      'Priority queue access'
    ]
  },
  PATRON: {
    id: 'patron',
    name: 'Patron',
    minAmount: 10,
    color: '#3b82f6', // Blue
    textColor: '#ffffff',
    icon: '💎',
    badge: 'PAT',
    glow: true,
    duration: 30,
    subtitle: '$10 Monthly — These people cover the cost of the Pixelmon server monthly',
    perks: [
      'All Supporter perks',
      'Custom username color with glow effect',
      'Patron badge',
      'Early access to new features',
      'Custom profile banner'
    ],
    minecraftPerks: [
      'All Supporter perks',
      'Patron prefix in chat',
      'Access to /fly command in lobby',
      'Access to patron-only areas',
      '2x daily rewards'
    ]
  },
  CHAMPION: {
    id: 'champion',
    name: 'Champion',
    minAmount: 15,
    color: '#8b5cf6', // Purple
    textColor: '#ffffff',
    icon: '👑',
    badge: 'CHA',
    glow: true,
    duration: 30,
    subtitle: '$15 Monthly',
    perks: [
      'All Patron perks',
      'Champion badge with crown',
      'Custom animated username effects',
      'Exclusive champion role',
      'Monthly exclusive content'
    ],
    minecraftPerks: [
      'All Patron perks',
      'Champion prefix in chat',
      'Access to /nick command',
      'Champion-only server events',
      '3x daily rewards',
      'Access to exclusive cosmetics'
    ]
  },
  LEGEND: {
    id: 'legend',
    name: 'Legend',
    minAmount: 20,
    color: '#f59e0b', // Gold/Amber
    textColor: '#000000',
    icon: '🏆',
    badge: 'LEG',
    glow: true,
    duration: 30,
    subtitle: '$20 Monthly — These people cover the full cost of the BMC5 server monthly',
    perks: [
      'All Champion perks',
      'Legendary golden username',
      'Legend badge with trophy',
      'Exclusive legend title',
      'Direct line to staff',
      'Custom profile effects'
    ],
    minecraftPerks: [
      'All Champion perks',
      'Legend prefix in chat',
      'Access to all cosmetic commands',
      'Legend-only server areas',
      '5x daily rewards',
      'Custom particle effects',
      'Priority in all queues'
    ]
  }
};

export function getDonationRankByAmount(totalDonated: number): DonationRank | null {
  const ranks = Object.values(DONATION_RANKS).sort((a, b) => b.minAmount - a.minAmount);
  
  for (const rank of ranks) {
    if (totalDonated >= rank.minAmount) {
      return rank;
    }
  }
  
  return null;
}

export function getNextDonationRank(currentAmount: number): { rank: DonationRank; remaining: number } | null {
  const ranks = Object.values(DONATION_RANKS).sort((a, b) => a.minAmount - b.minAmount);
  
  for (const rank of ranks) {
    if (currentAmount < rank.minAmount) {
      return {
        rank,
        remaining: rank.minAmount - currentAmount
      };
    }
  }
  
  return null;
}

export function formatDonationAmount(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0.00';
  }
  return `$${amount.toFixed(2)}`;
}

export function getDonationProgress(currentAmount: number | undefined | null): {
  currentRank: DonationRank | null;
  nextRank: { rank: DonationRank; remaining: number } | null;
  progress: number;
} {
  const safeAmount = currentAmount || 0;
  const currentRank = getDonationRankByAmount(safeAmount);
  const nextRank = getNextDonationRank(safeAmount);
  
  let progress = 0;
  if (nextRank) {
    const prevAmount = currentRank ? currentRank.minAmount : 0;
    const totalNeeded = nextRank.rank.minAmount - prevAmount;
    const currentProgress = safeAmount - prevAmount;
    progress = Math.min(100, (currentProgress / totalNeeded) * 100);
  } else {
    progress = 100; // Max rank achieved
  }
  
  return {
    currentRank,
    nextRank,
    progress
  };
}
