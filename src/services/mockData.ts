import { Player, Activity, MockCommunityData } from '../types/player';

const generateTimeAgo = (minutesAgo: number): string => {
  if (minutesAgo < 1) return 'just now';
  if (minutesAgo < 60) return `${Math.floor(minutesAgo)} mins ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  return `${Math.floor(hoursAgo / 24)}d ago`;
};

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: '👩‍🎓',
    totalCards: 47,
    streak: 5,
    level: 8,
    xp: 2340,
    distance: '0.3 km',
    isOnline: true,
    recentActivity: [],
    achievements: ['first-card', 'explorer', 'streak-master'],
    joinedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Alex Rivera',
    avatar: '👨‍💻',
    totalCards: 32,
    streak: 3,
    level: 6,
    xp: 1680,
    distance: '1.2 km',
    isOnline: true,
    recentActivity: [],
    achievements: ['first-card', 'collector'],
    joinedAt: new Date('2024-02-01')
  },
  {
    id: '3',
    name: 'Maria Santos',
    avatar: '👩‍🏫',
    totalCards: 28,
    streak: 7,
    level: 5,
    xp: 1420,
    distance: '2.1 km',
    isOnline: false,
    recentActivity: [],
    achievements: ['first-card', 'streak-master'],
    joinedAt: new Date('2024-01-28')
  },
  {
    id: '4',
    name: 'David Kim',
    avatar: '👨‍🎨',
    totalCards: 63,
    streak: 12,
    level: 10,
    xp: 3150,
    distance: '3.5 km',
    isOnline: true,
    recentActivity: [],
    achievements: ['first-card', 'explorer', 'streak-master', 'legend'],
    joinedAt: new Date('2024-01-10')
  },
  {
    id: '5',
    name: 'Emma Wilson',
    avatar: '👩‍🔬',
    totalCards: 19,
    streak: 2,
    level: 4,
    xp: 950,
    distance: '4.2 km',
    isOnline: true,
    recentActivity: [],
    achievements: ['first-card'],
    joinedAt: new Date('2024-02-10')
  }
];

const mockActivities: Activity[] = [
  {
    id: '1',
    playerId: '1',
    playerName: 'Sarah Chen',
    type: 'discovered',
    word: 'árbol',
    location: 'Central Park',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    timeAgo: generateTimeAgo(2)
  },
  {
    id: '2',
    playerId: '2',
    playerName: 'Alex Rivera',
    type: 'collected',
    word: 'perro',
    location: 'Washington Square',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    timeAgo: generateTimeAgo(5)
  },
  {
    id: '3',
    playerId: '4',
    playerName: 'David Kim',
    type: 'achievement',
    achievement: 'Streak Master',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    timeAgo: generateTimeAgo(8)
  },
  {
    id: '4',
    playerId: '3',
    playerName: 'Maria Santos',
    type: 'discovered',
    word: 'gato',
    location: 'Bryant Park',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    timeAgo: generateTimeAgo(12)
  },
  {
    id: '5',
    playerId: '5',
    playerName: 'Emma Wilson',
    type: 'collected',
    word: 'libro',
    location: 'Public Library',
    timestamp: new Date(Date.now() - 18 * 60 * 1000),
    timeAgo: generateTimeAgo(18)
  },
  {
    id: '6',
    playerId: '1',
    playerName: 'Sarah Chen',
    type: 'streak',
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    timeAgo: generateTimeAgo(25)
  }
];

export const getMockCommunityData = (): MockCommunityData => {
  return {
    nearbyPlayers: mockPlayers.slice(0, 4),
    leaderboard: [...mockPlayers].sort((a, b) => b.totalCards - a.totalCards),
    activityFeed: mockActivities,
    areaStats: {
      totalPlayers: 127,
      totalCards: 1834,
      activeToday: 23
    }
  };
};

export const getPlayerById = (id: string): Player | undefined => {
  return mockPlayers.find(player => player.id === id);
};