import React, { useEffect, useState } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useGame } from './hooks/useGame';
import { Lobby } from './components/Lobby';
import { LetterPicker } from './components/LetterPicker';
import { GameBoard } from './components/GameBoard';
import { Scoreboard } from './components/Scoreboard';
import { LanguageToggle } from './components/LanguageToggle';
import { UI_TEXT, CategoryAnswers } from './types/game';

type Screen = 'welcome' | 'lobby' | 'selecting' | 'playing' | 'results' | 'finished';

export const App: React.FC = () => {
  const telegram = useTelegram();
  const game = useGame();
  const [screen, setScreen] = useState<Screen>('welcome');
  const [error, setError] = useState<string | null>(null);

  // Handle start parameter (join game via link)
  useEffect(() => {
    if (telegram.isReady && telegram.startParam) {
      // User clicked a join link
      handleJoinFromLink(telegram.startParam);
    }
  }, [telegram.isReady, telegram.startParam]);

  // Update screen based on game status
  useEffect(() => {
    switch (game.status) {
      case 'waiting':
        setScreen('lobby');
        break;
      case 'selecting':
        setScreen('selecting');
        break;
      case 'playing':
        setScreen('playing');
        break;
      case 'scoring':
      case 'results':
        setScreen('results');
        break;
      case 'finished':
        setScreen('finished');
        break;
      default:
        setScreen('welcome');
    }
  }, [game.status]);

  // Handle join from link
  const handleJoinFromLink = async (code: string) => {
    if (!telegram.user) {
      setError('Please open this link in Telegram');
      return;
    }

    try {
      const sessionId = `session-${code}`;
      await game.joinGame(
        sessionId,
        telegram.user.id,
        telegram.user.firstName
      );
      telegram.haptic('notification');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join game';
      setError(message);
      telegram.alert(message);
    }
  };

  // Handle create game
  const handleCreateGame = async () => {
    if (!telegram.user) {
      setError('Please open this app in Telegram');
      return;
    }

    try {
      await game.createGame(
        telegram.user.id,
        telegram.user.firstName,
        game.settings
      );
      telegram.haptic('notification');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create game';
      setError(message);
      telegram.alert(message);
    }
  };

  // Handle start game
  const handleStartGame = async () => {
    try {
      await game.startGame();
      telegram.haptic('impact');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start game';
      telegram.alert(message);
    }
  };

  // Handle letter selection
  const handleSelectLetter = async (letter: string) => {
    try {
      await game.selectLetter(letter);
      telegram.haptic('impact');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select letter';
      telegram.alert(message);
    }
  };

  // Handle submit answers
  const handleSubmitAnswers = async (answers: CategoryAnswers) => {
    try {
      await game.submitAnswers(answers);
      telegram.haptic('notification');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit answers';
      telegram.alert(message);
    }
  };

  // Handle next round
  const handleNextRound = async () => {
    try {
      await game.nextRound();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to proceed';
      telegram.alert(message);
    }
  };

  // Handle play again
  const handlePlayAgain = () => {
    game.leaveGame();
    setScreen('welcome');
  };

  const text = UI_TEXT[game.language];

  // Welcome Screen
  if (screen === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-telegram-text mb-2">
            {text.title}
          </h1>
          <p className="text-telegram-hint">
            {game.language === 'si' 
              ? 'සිංහල කාණ්ඩ ක්‍රීඩාව'
              : 'Sinhala Categories Game'}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <button onClick={handleCreateGame} className="btn-primary">
            {text.createGame}
          </button>
          
          <div className="text-telegram-hint text-sm">
            {game.language === 'si' ? 'හෝ' : 'or'}
          </div>

          <JoinGameForm 
            onJoin={handleJoinFromLink}
            language={game.language}
          />
        </div>

        <div className="mt-8">
          <LanguageToggle 
            language={game.language} 
            onChange={game.setLanguage} 
          />
        </div>

        {error && (
          <div className="mt-4 text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Lobby Screen
  if (screen === 'lobby') {
    return (
      <Lobby
        language={game.language}
        players={game.players}
        currentPlayerId={game.currentPlayer?.id || null}
        sessionId={game.sessionId}
        isHost={game.isHost()}
        settings={game.settings}
        onLanguageChange={game.setLanguage}
        onStartGame={handleStartGame}
        onSettingsChange={game.setSettings}
      />
    );
  }

  // Letter Selection Screen
  if (screen === 'selecting') {
    return (
      <div className="min-h-screen flex flex-col p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-telegram-hint">
            {text.round} {game.currentRound} {text.of} {game.settings.totalRounds}
          </div>
          <LanguageToggle 
            language={game.language} 
            onChange={game.setLanguage} 
          />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <LetterPicker
            language={game.language}
            isMyTurn={game.isMyTurn()}
            onSelectLetter={handleSelectLetter}
          />
        </div>

        {/* Letter Picker Info */}
        <div className="text-center py-4">
          <span className="text-telegram-hint">
            {game.language === 'si' ? 'අකුරු තෝරන්නා:' : 'Letter picker:'}
          </span>
          <span className="font-medium text-telegram-text ml-2">
            {game.players.find(p => p.id === game.letterPickerId)?.name || '...'}
          </span>
        </div>
      </div>
    );
  }

  // Playing Screen
  if (screen === 'playing') {
    return (
      <GameBoard
        language={game.language}
        letter={game.currentLetter || ''}
        timeRemaining={game.timeRemaining || game.settings.roundDuration}
        players={game.players}
        hasSubmitted={game.hasSubmitted()}
        onSubmit={handleSubmitAnswers}
      />
    );
  }

  // Results Screen
  if (screen === 'results' || screen === 'finished') {
    return (
      <Scoreboard
        language={game.language}
        roundNumber={game.currentRound}
        totalRounds={game.settings.totalRounds}
        letter={game.currentLetter || ''}
        players={game.players}
        roundResult={game.roundResults}
        isFinalResults={screen === 'finished'}
        onNextRound={handleNextRound}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return null;
};

// Join Game Form Component
const JoinGameForm: React.FC<{
  onJoin: (code: string) => void;
  language: 'en' | 'si';
}> = ({ onJoin, language }) => {
  const [code, setCode] = useState('');
  const text = UI_TEXT[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onJoin(code.trim().toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder={language === 'si' ? 'කේතය ඇතුළත් කරන්න' : 'Enter game code'}
        maxLength={6}
        className="game-input text-center text-lg tracking-wider font-mono"
      />
      <button
        type="submit"
        disabled={code.length < 4}
        className="btn-secondary"
      >
        {text.joinGame}
      </button>
    </form>
  );
};

export default App;