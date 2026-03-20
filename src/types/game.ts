// Game Types for Categories Game

export interface Player {
  id: string;
  telegramId: number;
  name: string;
  photoUrl?: string;
  isHost: boolean;
  isOnline: boolean;
  lastSeen: number;
  score: number;
  hasSubmitted: boolean;
}

export interface GameSession {
  id: string;
  hostId: string;
  players: Map<string, Player>;
  status: GameStatus;
  currentRound: number;
  totalRounds: number;
  currentLetter: string | null;
  letterPickerId: string | null;
  roundStartTime: number | null;
  roundDuration: number; // in seconds
  createdAt: number;
  updatedAt: number;
  settings: GameSettings;
}

export interface GameSettings {
  roundDuration: number; // 60 or 90 seconds
  totalRounds: number; // 3, 5, or 10
  maxPlayers: number; // 2-8
}

export type GameStatus = 
  | 'idle'        // No game session (welcome screen)
  | 'waiting'     // Waiting for players to join
  | 'selecting'   // Letter selection phase
  | 'playing'     // Active round
  | 'scoring'     // Round ended, calculating scores
  | 'results'     // Showing round results
  | 'finished';   // Game completed

export interface RoundAnswer {
  playerId: string;
  answers: CategoryAnswers;
  submittedAt: number;
}

export interface CategoryAnswers {
  femaleName: string;      // ගැහැනු
  maleName: string;        // පිරිමි
  flower: string;          // මල්
  fruit: string;           // පලතුරු
  animal: string;          // සත්තු
  city: string;            // නගර
  points: number;          // ලකුණු
}

export interface RoundResult {
  round: number;
  letter: string;
  answers: Map<string, CategoryAnswers>;
  scores: Map<string, number>; // playerId -> score for this round
  duplicates: Map<string, string[]>; // answer -> playerIds who gave same answer
}

export interface GameResult {
  rankings: PlayerRanking[];
  totalScores: Map<string, number>;
}

export interface PlayerRanking {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

// Sinhala categories with English translations
export const CATEGORIES: CategoryDefinition[] = [
  { key: 'femaleName', labelSinhala: 'ගැහැනු', labelEnglish: 'Female Names', placeholder: 'e.g., නිමාලි' },
  { key: 'maleName', labelSinhala: 'පිරිමි', labelEnglish: 'Male Names', placeholder: 'e.g., කමල්' },
  { key: 'flower', labelSinhala: 'මල්', labelEnglish: 'Flowers', placeholder: 'e.g., රෝස' },
  { key: 'fruit', labelSinhala: 'පලතුරු', labelEnglish: 'Fruits', placeholder: 'e.g., අඹ' },
  { key: 'animal', labelSinhala: 'සත්තු', labelEnglish: 'Animals', placeholder: 'e.g., අලියා' },
  { key: 'city', labelSinhala: 'නගර', labelEnglish: 'Cities', placeholder: 'e.g., කොළඹ' },
];

export interface CategoryDefinition {
  key: keyof Omit<CategoryAnswers, 'points'>;
  labelSinhala: string;
  labelEnglish: string;
  placeholder: string;
}

// Available letters (excluding difficult ones)
export const AVAILABLE_LETTERS = [
  'අ', 'ආ', 'ඇ', 'ඈ', 'ඉ', 'ඊ', 'උ', 'ඌ', 'එ', 'ඒ',
  'ඔ', 'ඕ', 'ක', 'ඛ', 'ග', 'ඝ', 'ඟ', 'ච', 'ඡ', 'ජ',
  'ඣ', 'ඤ', 'ට', 'ඨ', 'ඩ', 'ඪ', 'ණ', 'ත', 'ථ', 'ද',
  'ධ', 'න', 'ප', 'ඵ', 'බ', 'භ', 'ම', 'ය', 'ර', 'ල',
  'ව', 'ස', 'හ', 'ළ', 'ෆ'
];

// Common Sinhala letters for the game (simplified set)
export const GAME_LETTERS = [
  'අ', 'ආ', 'ඇ', 'ඉ', 'එ', 'ඔ',
  'ක', 'ග', 'ච', 'ජ', 'ට', 'ඩ', 'න', 'ත', 'ද', 'ප', 'බ', 'ම', 'ය', 'ර', 'ල', 'ව', 'ස', 'හ'
];

// Sinhala and English UI text
export const UI_TEXT = {
  en: {
    title: 'Categories Game',
    waitingRoom: 'Waiting Room',
    players: 'Players',
    startGame: 'Start Game',
    waitingForHost: 'Waiting for host to start...',
    selectLetter: 'Select a Letter',
    yourTurn: 'Your turn to pick a letter!',
    waitingFor: 'Waiting for',
    toSelectLetter: 'to select a letter...',
    timeRemaining: 'Time Remaining',
    submit: 'Submit Answers',
    submitted: 'Submitted!',
    waitingForPlayers: 'Waiting for other players...',
    roundResults: 'Round Results',
    nextRound: 'Next Round',
    finalResults: 'Final Results',
    playAgain: 'Play Again',
    winner: 'Winner!',
    points: 'points',
    round: 'Round',
    of: 'of',
    unique: 'Unique',
    duplicate: 'Duplicate',
    empty: 'Empty',
    joinGame: 'Join Game',
    createGame: 'Create Game',
    settings: 'Settings',
    rounds: 'Rounds',
    timePerRound: 'Time per Round',
    seconds: 'seconds',
  },
  si: {
    title: '��ාණ්ඩ ක්‍රීඩාව',
    waitingRoom: 'බලාගැනීමේ කාමරය',
    players: 'ක්‍රීඩකයින්',
    startGame: 'ක්‍රීඩාව ආරම්භ කරන්න',
    waitingForHost: 'සත්කාරකයා ආරම්භ කිරීමට බලා සිටී...',
    selectLetter: 'අකුරක් තෝරන්න',
    yourTurn: 'ඔබේ අවස්ථාව අකුරක් තෝරීමට!',
    waitingFor: 'බලා සිටී',
    toSelectLetter: 'අකුරක් තෝරීමට...',
    timeRemaining: 'ඉතිරි කාලය',
    submit: 'පිළිතුරු ඉදිරිපත් කරන්න',
    submitted: 'ඉදිරිපත් කළා!',
    waitingForPlayers: 'අනෙක් ක්‍රීඩකයින් බලා සිටී...',
    roundResults: 'වටයේ ප්‍රතිඵල',
    nextRound: 'ඊළඟ වටය',
    finalResults: 'අවසාන ප්‍රතිඵල',
    playAgain: 'නැවත ක්‍රීඩා කරන්න',
    winner: 'ජයග්‍රාහකයා!',
    points: 'ලකුණු',
    round: 'වටය',
    of: 'න්',
    unique: 'අද්විතීය',
    duplicate: 'අනුපිටපත',
    empty: 'හිස්',
    joinGame: 'ක්‍රීඩාවට එකතු වන්න',
    createGame: 'ක්‍රීඩාව සාදන්න',
    settings: 'සැකසුම්',
    rounds: 'වට',
    timePerRound: 'වටයකට කාලය',
    seconds: 'තත්පර',
  }
};

export type Language = 'en' | 'si';
