import React from 'react';
import { Language } from '../types/game';

interface LanguageToggleProps {
  language: Language;
  onChange: (lang: Language) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ language, onChange }) => {
  return (
    <div className="flex items-center gap-2 bg-telegram-secondaryBg rounded-full p-1">
      <button
        onClick={() => onChange('si')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
          language === 'si'
            ? 'bg-telegram-button text-white'
            : 'text-telegram-text'
        }`}
      >
        සිංහල
      </button>
      <button
        onClick={() => onChange('en')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
          language === 'en'
            ? 'bg-telegram-button text-white'
            : 'text-telegram-text'
        }`}
      >
        English
      </button>
    </div>
  );
};