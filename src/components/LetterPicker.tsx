import React, { useState } from 'react';
import { GAME_LETTERS, UI_TEXT, Language } from '../types/game';

interface LetterPickerProps {
  language: Language;
  isMyTurn: boolean;
  onSelectLetter: (letter: string) => void;
  disabled?: boolean;
}

export const LetterPicker: React.FC<LetterPickerProps> = ({
  language,
  isMyTurn,
  onSelectLetter,
  disabled = false,
}) => {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const handleSelect = (letter: string) => {
    if (disabled || !isMyTurn) return;
    setSelectedLetter(letter);
    onSelectLetter(letter);
  };

  const text = UI_TEXT[language];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Instruction */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-telegram-text mb-2">
          {text.selectLetter}
        </h2>
        {isMyTurn ? (
          <p className="text-telegram-button font-medium">
            {text.yourTurn}
          </p>
        ) : (
          <p className="text-telegram-hint">
            {text.waitingFor}...
          </p>
        )}
      </div>

      {/* Letter Grid */}
      <div className="grid grid-cols-6 gap-2 max-w-sm">
        {GAME_LETTERS.map((letter) => (
          <button
            key={letter}
            onClick={() => handleSelect(letter)}
            disabled={disabled || !isMyTurn}
            className={`letter-btn ${
              selectedLetter === letter ? 'letter-btn-selected' : ''
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Waiting State */}
      {!isMyTurn && (
        <div className="flex items-center gap-3 text-telegram-hint">
          <div className="w-5 h-5 border-2 border-telegram-hint border-t-transparent rounded-full animate-spin" />
          <span>{text.toSelectLetter}</span>
        </div>
      )}
    </div>
  );
};