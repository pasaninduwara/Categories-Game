import { create } from 'zustand';
import { 
  Player, 
  GameSession, 
  GameStatus, 
  CategoryAnswers, 
  RoundResult,
  GameSettings
} from '../types/game';

interface GameState {
  // Session data
  sessionId: string | null;
  currentPlayer: Player | null;
  session: GameSession | null;
  
  // Game flow
  status: GameStatus;
  currentRound: number;
  currentLetter: string | null;
  letterPickerId: string | null;
  
  // Player data
  players: Player[];
  roundAnswers: Map<string, CategoryAnswers>;
  roundResults: RoundResult | null;
  
  // Timer
  timeRemaining: number;
  
  // Settings
  settings: GameSettings;
  
  // UI State
  language: 'en' | 'si';
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSession: (session: GameSession | null) => void;
  setCurrentPlayer: (player: Player | null) => void;
  setPlayers: (players: Player[]) => void;
  setStatus: (status: GameStatus) => void;
  setCurrentRound: (round: number) => void;
  setCurrentLetter: (letter: string | null) => void;
  setLetterPicker: (playerId: string | null) => void;
  setTimeRemaining: (time: number) => void;
  setSettings: (settings: Partial<GameSettings>) => void;
  setRoundAnswers: (playerId: string, answers: CategoryAnswers) => void;
  setRoundResults: (results: RoundResult | null) => void;
  setLanguage: (lang: 'en' | 'si') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Game actions
  initializeGame: (sessionId: string, player: Player, settings: GameSettings) => void;
  joinGame: (sessionId: string, player: Player) => void;
  startGame: () => void;
  selectLetter: (letter: string) => void;
  submitAnswers: (answers: CategoryAnswers) => void;
  nextRound: () => void;
  endGame: () => void;
  resetGame: () => void;
  
  // Helpers
  isHost: () => boolean;
  isMyTurn: () => boolean;
  hasSubmitted: () => boolean;
  getPlayerScore: (playerId: string) => number;
}

const DEFAULT_SETTINGS: GameSettings = {
  roundDuration: 60,
  totalRounds: 5,
  maxPlayers: 8,
};

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  sessionId: null,
  currentPlayer: null,
  session: null,
  status: 'waiting',
  currentRound: 0,
  currentLetter: null,
  letterPickerId: null,
  players: [],
  roundAnswers: new Map(),
  roundResults: null,
  timeRemaining: 0,
  settings: DEFAULT_SETTINGS,
  language: 'si',
  isLoading: false,
  error: null,
  
  // Setters
  setSession: (session) => set({ session }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setPlayers: (players) => set({ players }),
  setStatus: (status) => set({ status }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setCurrentLetter: (letter) => set({ currentLetter: letter }),
  setLetterPicker: (playerId) => set({ letterPickerId: playerId }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setSettings: (settings) => set((state) => ({ 
    settings: { ...state.settings, ...settings } 
  })),
  setRoundAnswers: (playerId, answers) => set((state) => {
    const newAnswers = new Map(state.roundAnswers);
    newAnswers.set(playerId, answers);
    return { roundAnswers: newAnswers };
  }),
  setRoundResults: (results) => set({ roundResults: results }),
  setLanguage: (lang) => set({ language: lang }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Game actions
  initializeGame: (sessionId, player, settings) => set({
    sessionId,
    currentPlayer: { ...player, isHost: true },
    status: 'waiting',
    players: [{ ...player, isHost: true }],
    settings: { ...DEFAULT_SETTINGS, ...settings },
    currentRound: 0,
    roundAnswers: new Map(),
    error: null,
  }),
  
  joinGame: (sessionId, player) => {
    const state = get();
    set({
      sessionId,
      currentPlayer: player,
      players: [...state.players.filter(p => p.id !== player.id), player],
    });
  },
  
  startGame: () => {
    const state = get();
    if (!state.players.length) return;
    
    // First player picks the letter in round 1
    const firstPickerIndex = 0;
    const letterPickerId = state.players[firstPickerIndex]?.id || null;
    
    set({
      status: 'selecting',
      currentRound: 1,
      letterPickerId,
    });
  },
  
  selectLetter: (letter) => {
    const state = get();
    set({
      currentLetter: letter,
      status: 'playing',
      timeRemaining: state.settings.roundDuration,
      roundAnswers: new Map(),
    });
  },
  
  submitAnswers: (answers) => {
    const state = get();
    if (!state.currentPlayer) return;
    
    const newAnswers = new Map(state.roundAnswers);
    newAnswers.set(state.currentPlayer.id, answers);
    
    // Mark player as submitted
    const updatedPlayers = state.players.map(p => 
      p.id === state.currentPlayer?.id 
        ? { ...p, hasSubmitted: true }
        : p
    );
    
    set({ 
      roundAnswers: newAnswers,
      players: updatedPlayers,
    });
    
    // Check if all players submitted
    if (newAnswers.size === state.players.length) {
      set({ status: 'scoring' });
    }
  },
  
  nextRound: () => {
    const state = get();
    const nextRoundNum = state.currentRound + 1;
    
    if (nextRoundNum > state.settings.totalRounds) {
      set({ status: 'finished' });
      return;
    }
    
    // Rotate letter picker
    const pickerIndex = (nextRoundNum - 1) % state.players.length;
    const letterPickerId = state.players[pickerIndex]?.id || null;
    
    set({
      status: 'selecting',
      currentRound: nextRoundNum,
      currentLetter: null,
      letterPickerId,
      roundAnswers: new Map(),
      roundResults: null,
      players: state.players.map(p => ({ ...p, hasSubmitted: false })),
    });
  },
  
  endGame: () => set({ status: 'finished' }),
  
  resetGame: () => set({
    sessionId: null,
    currentPlayer: null,
    session: null,
    status: 'waiting',
    currentRound: 0,
    currentLetter: null,
    letterPickerId: null,
    players: [],
    roundAnswers: new Map(),
    roundResults: null,
    timeRemaining: 0,
    error: null,
  }),
  
  // Helpers
  isHost: () => get().currentPlayer?.isHost ?? false,
  
  isMyTurn: () => {
    const state = get();
    return state.letterPickerId === state.currentPlayer?.id;
  },
  
  hasSubmitted: () => {
    const state = get();
    if (!state.currentPlayer) return false;
    return state.players.find(p => p.id === state.currentPlayer?.id)?.hasSubmitted ?? false;
  },
  
  getPlayerScore: (playerId) => {
    const state = get();
    return state.players.find(p => p.id === playerId)?.score ?? 0;
  },
}));