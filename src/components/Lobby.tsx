import React, { useState } from 'react';
import { Player, UI_TEXT, Language, GameSettings } from '../types/game';
import { PlayerCard } from './PlayerCard';
import { LanguageToggle } from './LanguageToggle';

interface LobbyProps {
  language: Language;
  players: Player[];
  currentPlayerId: string | null;
  sessionId: string | null;
  isHost: boolean;
  settings: GameSettings;
  onLanguageChange: (lang: Language) => void;
  onStartGame: () => void;
  onSettingsChange: (settings: Partial<GameSettings>) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  language,
  players,
  currentPlayerId,
  sessionId,
  isHost,
  settings,
  onLanguageChange,
  onStartGame,
  onSettingsChange,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const text = UI_TEXT[language];

  // Generate shareable link
  const shareLink = sessionId 
    ? `https://t.me/your_bot_name?startapp=${sessionId.replace('session-', '')}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    // Show feedback
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: text.title,
        text: `Join my Categories Game!`,
        url: shareLink,
      });
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-telegram-text">
          {text.title}
        </h1>
        <LanguageToggle language={language} onChange={onLanguageChange} />
      </div>

      {/* Session Code */}
      {sessionId && (
        <div className="card mb-4">
          <div className="text-center">
            <p className="text-sm text-telegram-hint mb-2">
              {language === 'si' ? 'කේතය පිටපත් කර යහළුවන්ට එවන්න' : 'Copy code & share with friends'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-2xl font-mono font-bold text-telegram-button tracking-wider">
                {sessionId.replace('session-', '')}
              </code>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg bg-telegram-button/10 text-telegram-button"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-telegram-text">
            {text.players} ({players.length}/{settings.maxPlayers})
          </h2>
        </div>
        
        <div className="space-y-2">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayerId}
              showScore={false}
            />
          ))}
        </div>

        {players.length < 2 && (
          <p className="text-sm text-telegram-hint mt-3 text-center">
            {language === 'si' 
              ? 'ක්‍රීඩාව ආරම්භ කිරීමට අවම වශයෙන් ක්‍රීඩකයින් 2 දෙනෙකු අවශ්‍යයි'
              : 'Need at least 2 players to start'}
          </p>
        )}
      </div>

      {/* Settings (Host Only) */}
      {isHost && (
        <div className="card mb-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex justify-between items-center w-full"
          >
            <span className="font-semibold text-telegram-text">
              {text.settings}
            </span>
            <span className="text-telegram-hint">
              {showSettings ? '▲' : '▼'}
            </span>
          </button>

          {showSettings && (
            <div className="mt-4 space-y-4">
              {/* Round Duration */}
              <div>
                <label className="text-sm text-telegram-hint mb-2 block">
                  {text.timePerRound}
                </label>
                <div className="flex gap-2">
                  {[60, 90].map((duration) => (
                    <button
                      key={duration}
                      onClick={() => onSettingsChange({ roundDuration: duration })}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        settings.roundDuration === duration
                          ? 'bg-telegram-button text-white'
                          : 'bg-telegram-secondaryBg text-telegram-text'
                      }`}
                    >
                      {duration}{text.seconds}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Rounds */}
              <div>
                <label className="text-sm text-telegram-hint mb-2 block">
                  {text.rounds}
                </label>
                <div className="flex gap-2">
                  {[3, 5, 10].map((rounds) => (
                    <button
                      key={rounds}
                      onClick={() => onSettingsChange({ totalRounds: rounds })}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        settings.totalRounds === rounds
                          ? 'bg-telegram-button text-white'
                          : 'bg-telegram-secondaryBg text-telegram-text'
                      }`}
                    >
                      {rounds}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="space-y-3">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <span>📤</span>
          <span>{language === 'si' ? 'ආරාධනා කරන්න' : 'Invite Friends'}</span>
        </button>

        {/* Start Game Button */}
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={players.length < 2}
            className="btn-primary"
          >
            {text.startGame}
          </button>
        ) : (
          <div className="text-center text-telegram-hint py-3">
            <div className="animate-pulse">{text.waitingForHost}</div>
          </div>
        )}
      </div>
    </div>
  );
};