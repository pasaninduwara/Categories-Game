import React from 'react';
import { UI_TEXT } from '../types/game';

interface TimerProps {
  seconds: number;
  totalSeconds: number;
  isCritical?: boolean;
  language?: 'en' | 'si';
}

export const Timer: React.FC<TimerProps> = ({
  seconds,
  totalSeconds,
  isCritical = false,
  language = 'si',
}) => {
  const percentage = (seconds / totalSeconds) * 100;
  const isLow = seconds <= 10;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Label */}
      <span className="text-sm text-telegram-hint">
        {UI_TEXT[language].timeRemaining}
      </span>

      {/* Timer Display */}
      <div className="relative w-24 h-24">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-telegram-secondaryBg"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.83} 283`}
            className={`transition-all duration-1000 ${
              isLow || isCritical ? 'text-red-500' : 'text-telegram-button'
            }`}
          />
        </svg>

        {/* Time Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-2xl font-bold ${
              isLow || isCritical ? 'timer-critical' : 'text-telegram-text'
            }`}
          >
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Critical Warning */}
      {(isLow || isCritical) && (
        <div className="text-red-500 text-sm font-medium animate-pulse">
          {language === 'si' ? 'ඉක්මනින්!' : 'Hurry up!'}
        </div>
      )}
    </div>
  );
};