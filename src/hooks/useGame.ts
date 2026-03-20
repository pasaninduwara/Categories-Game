import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { 
  GameRealtimeManager, 
  gameDb
} from '../utils/supabase';
import { 
  Player, 
  CategoryAnswers, 
  GameSettings
} from '../types/game';
import { calculateRoundScores, updatePlayerScores } from '../utils/scoring';

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate a session code (6 characters)
function generateSessionCode(): string {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

export function useGame() {
  const store = useGameStore();
  const realtimeRef = useRef<GameRealtimeManager | null>(null);

  // Initialize realtime connection
  const initRealtime = useCallback(async (sessionId: string, playerId: string) => {
    if (realtimeRef.current) {
      await realtimeRef.current.disconnect();
    }

    const realtime = new GameRealtimeManager();
    await realtime.connect(sessionId);
    await realtime.joinAsPlayer(playerId, {
      name: store.currentPlayer?.name || 'Player',
      isOnline: true,
    });

    // Subscribe to player presence
    realtime.subscribeToPlayers((players) => {
      store.setPlayers(
        players.map((p) => ({
          id: p.user as string,
          telegramId: 0,
          name: p.name as string || 'Player',
          isHost: p.isHost as boolean || false,
          isOnline: true,
          lastSeen: Date.now(),
          score: p.score as number || 0,
          hasSubmitted: p.hasSubmitted as boolean || false,
        }))
      );
    });

    // Subscribe to game state updates
    realtime.subscribeToGameState((state) => {
      if (state.status) store.setStatus(state.status as Parameters<typeof store.setStatus>[0]);
      if (state.currentRound) store.setCurrentRound(state.currentRound as number);
      if (state.currentLetter) store.setCurrentLetter(state.currentLetter as string);
      if (state.letterPickerId) store.setLetterPicker(state.letterPickerId as string);
      if (state.timeRemaining) store.setTimeRemaining(state.timeRemaining as number);
    });

    // Subscribe to round updates
    realtime.subscribeToRoundUpdate((data) => {
      if (data.type === 'submitted') {
        const playerId = data.playerId as string;
        const updatedPlayers = store.players.map(p =>
          p.id === playerId ? { ...p, hasSubmitted: true } : p
        );
        store.setPlayers(updatedPlayers);
      }
    });

    realtimeRef.current = realtime;
  }, [store]);

  // Create a new game
  const createGame = useCallback(async (
    telegramId: number,
    playerName: string,
    settings: GameSettings
  ): Promise<string> => {
    store.setLoading(true);
    store.setError(null);

    try {
      const playerId = generateId();
      const sessionCode = generateSessionCode();
      const sessionId = `session-${sessionCode}`;

      // Create session in database
      await gameDb.createSession(sessionId, settings);

      // Add host as first player
      const player: Player = {
        id: playerId,
        telegramId,
        name: playerName,
        isHost: true,
        isOnline: true,
        lastSeen: Date.now(),
        score: 0,
        hasSubmitted: false,
      };

      await gameDb.addPlayer({
        session_id: sessionId,
        telegram_id: telegramId,
        name: playerName,
        is_host: true,
        is_online: true,
        last_seen: new Date().toISOString(),
        score: 0,
        has_submitted: false,
        photo_url: null,
      });

      // Initialize local state
      store.initializeGame(sessionId, player, settings);

      // Connect to realtime
      await initRealtime(sessionId, playerId);

      return sessionId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create game';
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }, [store, initRealtime]);

  // Join an existing game
  const joinGame = useCallback(async (
    sessionId: string,
    telegramId: number,
    playerName: string
  ): Promise<void> => {
    store.setLoading(true);
    store.setError(null);

    try {
      // Check if session exists
      const session = await gameDb.getSession(sessionId);
      if (!session) {
        throw new Error('Game not found');
      }

      if (session.status !== 'waiting') {
        throw new Error('Game already started');
      }

      // Check player count
      const existingPlayers = await gameDb.getPlayers(sessionId);
      if (existingPlayers.length >= session.settings.maxPlayers) {
        throw new Error('Game is full');
      }

      const playerId = generateId();

      // Add player to database
      await gameDb.addPlayer({
        session_id: sessionId,
        telegram_id: telegramId,
        name: playerName,
        is_host: false,
        is_online: true,
        last_seen: new Date().toISOString(),
        score: 0,
        has_submitted: false,
        photo_url: null,
      });

      const player: Player = {
        id: playerId,
        telegramId,
        name: playerName,
        isHost: false,
        isOnline: true,
        lastSeen: Date.now(),
        score: 0,
        hasSubmitted: false,
      };

      // Join game locally
      store.joinGame(sessionId, player);

      // Connect to realtime
      await initRealtime(sessionId, playerId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join game';
      store.setError(message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }, [store, initRealtime]);

  // Start the game (host only)
  const startGame = useCallback(async () => {
    if (!store.isHost()) {
      throw new Error('Only host can start the game');
    }

    if (store.players.length < 2) {
      throw new Error('Need at least 2 players to start');
    }

    store.startGame();

    // Broadcast game state
    await realtimeRef.current?.broadcastGameState({
      status: 'selecting',
      currentRound: 1,
    });

    // Update database
    if (store.sessionId) {
      await gameDb.updateSession(store.sessionId, {
        status: 'selecting',
        current_round: 1,
        letter_picker_id: store.players[0]?.id,
      });
    }
  }, [store]);

  // Select a letter
  const selectLetter = useCallback(async (letter: string) => {
    if (!store.isMyTurn()) {
      throw new Error('Not your turn to select letter');
    }

    store.selectLetter(letter);

    // Broadcast letter selection
    await realtimeRef.current?.broadcastLetterSelection(letter, store.currentRound);

    // Update database
    if (store.sessionId) {
      await gameDb.updateSession(store.sessionId, {
        status: 'playing',
        current_letter: letter,
        round_start_time: Date.now(),
      });
    }
  }, [store]);

  // Submit answers
  const submitAnswers = useCallback(async (answers: CategoryAnswers) => {
    if (!store.currentPlayer || !store.sessionId || !store.currentLetter) {
      return;
    }

    store.submitAnswers(answers);

    // Save to database
    await gameDb.submitAnswers({
      session_id: store.sessionId,
      round_number: store.currentRound,
      player_id: store.currentPlayer.id,
      letter: store.currentLetter,
      female_name: answers.femaleName,
      male_name: answers.maleName,
      flower: answers.flower,
      fruit: answers.fruit,
      animal: answers.animal,
      city: answers.city,
      points: 0, // Will be calculated after round ends
    });

    // Broadcast submission
    await realtimeRef.current?.broadcastSubmission(
      store.currentPlayer.id,
      store.currentRound
    );

    // Check if all players submitted
    const allSubmitted = store.players.every(p => p.hasSubmitted);
    if (allSubmitted) {
      await calculateAndShowResults();
    }
  }, [store]);

  // Calculate results
  const calculateAndShowResults = useCallback(async () => {
    if (!store.sessionId || !store.currentLetter) return;

    store.setStatus('scoring');

    // Get all answers for this round
    const roundAnswers = await gameDb.getRoundAnswers(store.sessionId, store.currentRound);
    
    // Convert to map format
    const answersMap = new Map<string, CategoryAnswers>();
    roundAnswers.forEach((answer) => {
      answersMap.set(answer.player_id, {
        femaleName: answer.female_name,
        maleName: answer.male_name,
        flower: answer.flower,
        fruit: answer.fruit,
        animal: answer.animal,
        city: answer.city,
        points: answer.points,
      });
    });

    // Calculate scores
    const scores = calculateRoundScores(answersMap, store.currentLetter);
    
    // Update player scores
    const currentScores = new Map(store.players.map(p => [p.id, p.score]));
    const newScores = updatePlayerScores(currentScores, scores);

    // Update store with results
    store.setRoundResults({
      round: store.currentRound,
      letter: store.currentLetter,
      answers: answersMap,
      scores: new Map(Array.from(scores.entries()).map(([id, s]) => [id, s.totalPoints])),
      duplicates: new Map(),
    });

    // Update players with new scores
    store.setPlayers(
      store.players.map(p => ({
        ...p,
        score: newScores.get(p.id) || p.score,
      }))
    );

    store.setStatus('results');
  }, [store]);

  // Move to next round
  const nextRound = useCallback(async () => {
    store.nextRound();

    // Broadcast state
    await realtimeRef.current?.broadcastGameState({
      status: store.status,
      currentRound: store.currentRound,
      letterPickerId: store.letterPickerId,
    });
  }, [store]);

  // Leave game
  const leaveGame = useCallback(async () => {
    if (realtimeRef.current) {
      await realtimeRef.current.disconnect();
    }
    store.resetGame();
  }, [store]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeRef.current) {
        realtimeRef.current.disconnect();
      }
    };
  }, []);

  return {
    // State
    sessionId: store.sessionId,
    currentPlayer: store.currentPlayer,
    players: store.players,
    status: store.status,
    currentRound: store.currentRound,
    currentLetter: store.currentLetter,
    letterPickerId: store.letterPickerId,
    timeRemaining: store.timeRemaining,
    settings: store.settings,
    roundAnswers: store.roundAnswers,
    roundResults: store.roundResults,
    language: store.language,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    createGame,
    joinGame,
    startGame,
    selectLetter,
    submitAnswers,
    nextRound,
    leaveGame,

    // Helpers
    isHost: store.isHost,
    isMyTurn: store.isMyTurn,
    hasSubmitted: store.hasSubmitted,
    setLanguage: store.setLanguage,
    setSettings: store.setSettings,
  };
}