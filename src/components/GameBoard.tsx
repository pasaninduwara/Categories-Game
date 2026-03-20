import React, { useState, useCallback } from 'react';
import { 
  CategoryAnswers, 
  CATEGORIES, 
  UI_TEXT, 
  Language,
  Player 
} from '../types/game';
import { Timer } from './Timer';
import { useTimer } from '../hooks/useTimer';

interface GameBoardProps {
  language: Language;
  letter: string;
  timeRemaining: number;
  players: Player[];
  hasSubmitted: boolean;
  onSubmit: (answers: CategoryAnswers) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  language,
  letter,
  timeRemaining,
  players,
  hasSubmitted,
  onSubmit,
}) => {
  const text = UI_TEXT[language];
  
  // Form state
  const [answers, setAnswers] = useState<Omit<CategoryAnswers, 'points'>>({
    femaleName: '',
    maleName: '',
    flower: '',
    fruit: '',
    animal: '',
    city: '',
  });

  // Timer
  const { pause, timeRemaining: currentTime } = useTimer({
    duration: timeRemaining,
    onComplete: () => {
      handleSubmit();
    },
    autoStart: true,
  });

  // Handle input change
  const handleChange = (key: keyof typeof answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (hasSubmitted) return;
    
    onSubmit({
      ...answers,
      points: 0,
    });
    pause();
  }, [answers, hasSubmitted, onSubmit, pause]);

  // Calculate completion percentage
  const filledCount = Object.values(answers).filter((a) => a.trim()).length;
  const totalCategories = CATEGORIES.length;
  const progress = (filledCount / totalCategories) * 100;

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-telegram-hint">{text.round}</span>
          <span className="text-lg font-bold text-telegram-text">
            1
          </span>
        </div>
        
        <div className="px-4 py-2 rounded-full bg-telegram-button text-white font-bold text-xl">
          {letter}
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-4">
        <Timer
          seconds={currentTime}
          totalSeconds={timeRemaining}
          language={language}
        />
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-telegram-hint mb-1">
          <span>{filledCount}/{totalCategories} filled</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-telegram-secondaryBg rounded-full overflow-hidden">
          <div
            className="h-full bg-telegram-button transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Category Inputs */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {CATEGORIES.map(({ key, labelSinhala, labelEnglish, placeholder }) => (
          <div key={key} className="category-row">
            <div className="flex justify-between items-center mb-1">
              <label className="font-medium text-telegram-text">
                {language === 'si' ? labelSinhala : labelEnglish}
              </label>
              {answers[key] && (
                <span className="text-xs text-green-500">✓</span>
              )}
            </div>
            <input
              type="text"
              value={answers[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              disabled={hasSubmitted}
              className="game-input"
            />
          </div>
        ))}
      </div>

      {/* Players Status */}
      <div className="mt-4 py-3 border-t border-telegram-secondaryBg">
        <div className="flex flex-wrap gap-2 justify-center">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                player.hasSubmitted
                  ? 'bg-green-100 text-green-700'
                  : 'bg-telegram-secondaryBg text-telegram-hint'
              }`}
            >
              <span>{player.name.split(' ')[0]}</span>
              {player.hasSubmitted && <span>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      {!hasSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={filledCount === 0}
          className="btn-primary mt-4"
        >
          {text.submit}
        </button>
      )}

      {/* Waiting State */}
      {hasSubmitted && (
        <div className="text-center py-4">
          <div className="text-green-500 font-medium mb-2">
            ✓ {text.submitted}
          </div>
          <div className="text-telegram-hint text-sm">
            {text.waitingForPlayers}
          </div>
        </div>
      )}
    </div>
  );
};