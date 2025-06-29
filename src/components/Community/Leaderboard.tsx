import React from 'react';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { Player } from '../../types/player';

interface LeaderboardProps {
  players: Player[];
  currentPlayerId?: string;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  players,
  currentPlayerId,
  className = ''
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentPlayer: boolean) => {
    if (isCurrentPlayer) return 'bg-blue-50 border-blue-200';
    
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          Local Leaderboard
        </h3>
        <span className="text-sm text-gray-500">Top collectors</span>
      </div>

      <div className="space-y-2">
        {players.slice(0, 10).map((player, index) => {
          const rank = index + 1;
          const isCurrentPlayer = player.id === currentPlayerId;
          
          return (
            <div
              key={player.id}
              className={`
                flex items-center justify-between p-3 rounded-xl border transition-all duration-200
                ${getRankBg(rank, isCurrentPlayer)}
                ${isCurrentPlayer ? 'ring-2 ring-blue-300' : ''}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(rank)}
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                    {player.avatar}
                  </div>
                  
                  <div>
                    <p className={`font-medium ${isCurrentPlayer ? 'text-blue-800' : 'text-gray-800'}`}>
                      {player.name}
                      {isCurrentPlayer && <span className="text-xs text-blue-600 ml-1">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500">Level {player.level}</p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className={`font-bold ${isCurrentPlayer ? 'text-blue-800' : 'text-gray-800'}`}>
                  {player.totalCards}
                </p>
                <p className="text-xs text-gray-500">cards</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current player's rank if not in top 10 */}
      {currentPlayerId && !players.slice(0, 10).some(p => p.id === currentPlayerId) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500 mb-2">Your rank</div>
          {(() => {
            const currentPlayer = players.find(p => p.id === currentPlayerId);
            const currentRank = players.findIndex(p => p.id === currentPlayerId) + 1;
            
            if (currentPlayer) {
              return (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-blue-600">#{currentRank}</span>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                      {currentPlayer.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">{currentPlayer.name}</p>
                      <p className="text-xs text-blue-600">Level {currentPlayer.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-800">{currentPlayer.totalCards}</p>
                    <p className="text-xs text-blue-600">cards</p>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
};