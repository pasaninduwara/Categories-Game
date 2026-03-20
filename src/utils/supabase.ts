import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

// These will be replaced with actual values from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Types for Supabase tables
export interface GameSessionRow {
  id: string;
  host_id: string;
  status: string;
  current_round: number;
  total_rounds: number;
  current_letter: string | null;
  letter_picker_id: string | null;
  round_start_time: number | null;
  round_duration: number;
  settings: {
    roundDuration: number;
    totalRounds: number;
    maxPlayers: number;
  };
  created_at: string;
  updated_at: string;
}

export interface PlayerRow {
  id: string;
  session_id: string;
  telegram_id: number;
  name: string;
  photo_url: string | null;
  is_host: boolean;
  is_online: boolean;
  last_seen: string;
  score: number;
  has_submitted: boolean;
  created_at: string;
}

export interface RoundAnswerRow {
  id: string;
  session_id: string;
  round_number: number;
  player_id: string;
  letter: string;
  female_name: string;
  male_name: string;
  flower: string;
  fruit: string;
  animal: string;
  city: string;
  points: number;
  created_at: string;
}

// Realtime channel manager
export class GameRealtimeManager {
  private channel: RealtimeChannel | null = null;
  
  async connect(sessionId: string): Promise<void> {
    
    this.channel = supabase.channel(`game:${sessionId}`, {
      config: {
        presence: {
          key: '', // Will be set when joining
        },
      },
    });
  }
  
  async joinAsPlayer(playerId: string, playerData: Record<string, unknown>): Promise<void> {
    if (!this.channel) throw new Error('Not connected');
    
    await this.channel.track({
      user: playerId,
      ...playerData,
      online_at: Date.now(),
    });
  }
  
  subscribeToPlayers(callback: (players: Record<string, unknown>[]) => void): void {
    if (!this.channel) return;
    
    this.channel
      .on('presence', { event: 'sync' }, () => {
        const newState = this.channel?.presenceState();
        if (newState) {
          const players = Object.values(newState).flat() as Record<string, unknown>[];
          callback(players);
        }
      })
      .subscribe();
  }
  
  subscribeToGameState(callback: (state: Record<string, unknown>) => void): void {
    if (!this.channel) return;
    
    this.channel
      .on('broadcast', { event: 'game_state' }, ({ payload }) => {
        callback(payload as Record<string, unknown>);
      })
      .subscribe();
  }
  
  subscribeToRoundUpdate(callback: (data: Record<string, unknown>) => void): void {
    if (!this.channel) return;
    
    this.channel
      .on('broadcast', { event: 'round_update' }, ({ payload }) => {
        callback(payload as Record<string, unknown>);
      })
      .subscribe();
  }
  
  async broadcastGameState(state: Record<string, unknown>): Promise<void> {
    if (!this.channel) return;
    
    await this.channel.send({
      type: 'broadcast',
      event: 'game_state',
      payload: state,
    });
  }
  
  async broadcastLetterSelection(letter: string, roundNumber: number): Promise<void> {
    if (!this.channel) return;
    
    await this.channel.send({
      type: 'broadcast',
      event: 'letter_selected',
      payload: { letter, roundNumber },
    });
  }
  
  async broadcastSubmission(playerId: string, roundNumber: number): Promise<void> {
    if (!this.channel) return;
    
    await this.channel.send({
      type: 'broadcast',
      event: 'player_submitted',
      payload: { playerId, roundNumber },
    });
  }
  
  async disconnect(): Promise<void> {
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// Database operations
export const gameDb = {
  // Create a new game session
  async createSession(hostId: string, settings: GameSessionRow['settings']): Promise<GameSessionRow> {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        host_id: hostId,
        settings,
        total_rounds: settings.totalRounds,
        round_duration: settings.roundDuration,
        status: 'waiting',
        current_round: 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Get session by ID
  async getSession(sessionId: string): Promise<GameSessionRow | null> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) return null;
    return data;
  },
  
  // Update session state
  async updateSession(sessionId: string, updates: Partial<GameSessionRow>): Promise<void> {
    const { error } = await supabase
      .from('game_sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    
    if (error) throw error;
  },
  
  // Add player to session
  async addPlayer(player: Omit<PlayerRow, 'id' | 'created_at'>): Promise<PlayerRow> {
    const { data, error } = await supabase
      .from('players')
      .insert(player)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Get all players in a session
  async getPlayers(sessionId: string): Promise<PlayerRow[]> {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) return [];
    return data;
  },
  
  // Update player
  async updatePlayer(playerId: string, updates: Partial<PlayerRow>): Promise<void> {
    const { error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId);
    
    if (error) throw error;
  },
  
  // Submit round answers
  async submitAnswers(answers: Omit<RoundAnswerRow, 'id' | 'created_at'>): Promise<RoundAnswerRow> {
    const { data, error } = await supabase
      .from('round_answers')
      .insert(answers)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Get round answers
  async getRoundAnswers(sessionId: string, roundNumber: number): Promise<RoundAnswerRow[]> {
    const { data, error } = await supabase
      .from('round_answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('round_number', roundNumber);
    
    if (error) return [];
    return data;
  },
  
  // Delete session and all related data
  async deleteSession(sessionId: string): Promise<void> {
    await supabase.from('players').delete().eq('session_id', sessionId);
    await supabase.from('round_answers').delete().eq('session_id', sessionId);
    await supabase.from('game_sessions').delete().eq('id', sessionId);
  },
};