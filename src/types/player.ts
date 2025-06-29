export interface Player {
  id: string;
  name: string;
  avatar: string;
  totalCards: number;
  streak: number;
  level: number;
  xp: number;
  recentActivity: Activity[];
  achievements: string[];
  joinedAt: Date;
  distance?: string;
  isOnline?: boolean;
}

export interface Activity {
  id: string;
  playerId: string;
  playerName: string;
  type: 'discovered' | 'collected' | 'achievement' | 'streak';
  word?: string;
  location?: string;
  achievement?: string;
  timestamp: Date;
  timeAgo: string;
}

export interface MockCommunityData {
  nearbyPlayers: Player[];
  leaderboard: Player[];
  activityFeed: Activity[];
  areaStats: {
    totalPlayers: number;
    totalCards: number;
    activeToday: number;
  };
}