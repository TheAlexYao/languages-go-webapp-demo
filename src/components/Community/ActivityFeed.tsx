import React from 'react';
import { Activity as ActivityIcon, Trophy, Zap, MapPin, BookOpen } from 'lucide-react';
import { Activity } from '../../types/player';

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  className = ''
}) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'discovered':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'collected':
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'streak':
        return <Zap className="h-4 w-4 text-orange-500" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'discovered':
        return (
          <>
            <span className="font-medium">{activity.playerName}</span> discovered{' '}
            <span className="font-medium text-blue-600">"{activity.word}"</span>
            {activity.location && (
              <>
                {' '}at <span className="text-gray-600">{activity.location}</span>
              </>
            )}
          </>
        );
      case 'collected':
        return (
          <>
            <span className="font-medium">{activity.playerName}</span> collected{' '}
            <span className="font-medium text-green-600">"{activity.word}"</span>
            {activity.location && (
              <>
                {' '}from <span className="text-gray-600">{activity.location}</span>
              </>
            )}
          </>
        );
      case 'achievement':
        return (
          <>
            <span className="font-medium">{activity.playerName}</span> unlocked{' '}
            <span className="font-medium text-yellow-600">"{activity.achievement}"</span>
          </>
        );
      case 'streak':
        return (
          <>
            <span className="font-medium">{activity.playerName}</span> started a learning streak!
          </>
        );
      default:
        return <span>{activity.playerName} did something</span>;
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <ActivityIcon className="h-5 w-5 mr-2 text-blue-500" />
          Recent Activity
        </h3>
        <span className="text-sm text-gray-500">Live feed</span>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">
                {getActivityText(activity)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{activity.timeAgo}</p>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <ActivityIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No recent activity</p>
          <p className="text-xs text-gray-400 mt-1">Start exploring to see community updates!</p>
        </div>
      )}
    </div>
  );
};