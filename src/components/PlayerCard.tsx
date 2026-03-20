import React from 'react';
import { Player } from '../types/game';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer?: boolean;
  showScore?: boolean;
  showStatus?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentPlayer = false,
  showScore = false,
  showStatus = false,
}) => {
  // Generate avatar color based on player name
  const avatarColor = `hsl(${player.name.charCodeAt(0) * 137 % 360}, 70%, 50%)`;
  
  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
        isCurrentPlayer ? 'bg-telegram-button/10 ring-2 ring-telegram-button' : 'bg-telegram-secondaryBg'
      }`}
    >
      {/* Avatar */}
      <div
        className="player-avatar"
        style={{ backgroundColor: avatarColor }}
      >
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(player.name)
        )}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-telegram-text truncate">
            {player.name}
          </span>
          {player.isHost && (
            <span className="text-xs px-2 py-0.5 bg-telegram-button/20 text-telegram-button rounded-full">
              👑 Host
            </span>
          )}
          {isCurrentPlayer && (
            <span className="text-xs text-telegram-hint">(You)</span>
          )}
        </div>
        
        {showScore && (
          <div className="text-sm text-telegram-hint mt-0.5">
            {player.score} points
          </div>
        )}
      </div>

      {/* Status Indicators */}
      {showStatus && (
        <div className="flex items-center gap-2">
          <div
            className={`status-dot ${
              player.hasSubmitted
                ? 'status-submitted'
                : player.isOnline
                ? 'status-waiting'
                : 'bg-gray-300'
            }`}
          />
          {player.hasSubmitted && (
            <span className="text-xs text-green-500">✓</span>
          )}
        </div>
      )}
    </div>
  );
};