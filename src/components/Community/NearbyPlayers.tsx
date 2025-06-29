import React from 'react';
import { Users, MapPin, Trophy, Zap, Crown } from 'lucide-react';
import { Player } from '../../types/player';

interface NearbyPlayersProps {
  players: Player[];
  onPlayerClick?: (player: Player) => void;
  className?: string;
}

export const NearbyPlayers: React.FC<NearbyPlayersProps> = ({
  players,
  onPlayerClick,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-3xl shadow-xl p-6 border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Nearby Players</h3>
            <p className="text-sm text-gray-500">Explorers in your area</p>
          </div>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
          {players.length} online
        </div>
      </div>

      <div className="space-y-3">
        {players.map((player, index) => (
          <div
            key={player.id}
            onClick={() => onPlayerClick?.(player)}
            className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:from-blue-50 hover:to-purple-50 transition-all duration-300 cursor-pointer border border-gray-200 hover:border-blue-200 hover:shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  {player.avatar}
                </div>
                {player.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg"></div>
                )}
                {index === 0 && (
                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-bold text-gray-800">{player.name}</p>
                  {index < 3 && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      #{index + 1}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{player.distance}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>Level {player.level}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-2 text-lg font-bold text-gray-800 mb-1">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span>{player.totalCards}</span>
              </div>
              {player.streak > 0 && (
                <div className="flex items-center space-x-1 text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  <Zap className="h-3 w-3" />
                  <span className="font-medium">{player.streak} day streak</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {players.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="font-bold text-gray-800 mb-2">No players nearby</h4>
          <p className="text-sm text-gray-500">Be the first to explore this area!</p>
        </div>
      )}
    </div>
  );
};