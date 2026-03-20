import { CategoryAnswers, CATEGORIES } from '../types/game';

// Score calculation constants
const POINTS_UNIQUE = 10;
const POINTS_DUPLICATE = 5;
const POINTS_EMPTY = 0;

export interface ScoredAnswer {
  category: keyof Omit<CategoryAnswers, 'points'>;
  answer: string;
  normalizedAnswer: string;
  points: number;
  reason: 'unique' | 'duplicate' | 'empty' | 'invalid';
}

export interface RoundScoringResult {
  playerId: string;
  scores: ScoredAnswer[];
  totalPoints: number;
}

/**
 * Normalize answer for comparison
 * - Convert to lowercase
 * - Remove diacritics for Sinhala
 * - Trim whitespace
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Check if answer starts with the given letter
 */
export function isValidForLetter(answer: string, letter: string): boolean {
  if (!answer || !letter) return false;
  
  const normalizedAnswer = normalizeAnswer(answer);
  const normalizedLetter = letter.toLowerCase();
  
  // Check if answer starts with the letter
  return normalizedAnswer.startsWith(normalizedLetter);
}

/**
 * Calculate scores for all players in a round
 */
export function calculateRoundScores(
  playersAnswers: Map<string, CategoryAnswers>,
  letter: string
): Map<string, RoundScoringResult> {
  const results = new Map<string, RoundScoringResult>();
  
  // First, collect all normalized answers by category
  const answersByCategory = new Map<keyof Omit<CategoryAnswers, 'points'>, Map<string, string[]>>();
  
  CATEGORIES.forEach(({ key }) => {
    answersByCategory.set(key, new Map());
  });
  
  playersAnswers.forEach((answers, playerId) => {
    CATEGORIES.forEach(({ key }) => {
      const answer = answers[key];
      if (!answer) return;
      
      const normalized = normalizeAnswer(answer);
      if (!normalized) return;
      
      const categoryMap = answersByCategory.get(key)!;
      if (!categoryMap.has(normalized)) {
        categoryMap.set(normalized, []);
      }
      categoryMap.get(normalized)!.push(playerId);
    });
  });
  
  // Now calculate scores for each player
  playersAnswers.forEach((answers, playerId) => {
    const scores: ScoredAnswer[] = [];
    let totalPoints = 0;
    
    CATEGORIES.forEach(({ key }) => {
      const answer = answers[key] || '';
      const normalized = normalizeAnswer(answer);
      
      let points = POINTS_EMPTY;
      let reason: ScoredAnswer['reason'] = 'empty';
      
      if (normalized) {
        // Check if valid for letter
        if (!isValidForLetter(answer, letter)) {
          points = POINTS_EMPTY;
          reason = 'invalid';
        } else {
          // Check for duplicates
          const categoryMap = answersByCategory.get(key)!;
          const playersWithSameAnswer = categoryMap.get(normalized) || [];
          
          if (playersWithSameAnswer.length > 1) {
            points = POINTS_DUPLICATE;
            reason = 'duplicate';
          } else {
            points = POINTS_UNIQUE;
            reason = 'unique';
          }
        }
      }
      
      scores.push({
        category: key,
        answer,
        normalizedAnswer: normalized,
        points,
        reason,
      });
      
      totalPoints += points;
    });
    
    results.set(playerId, {
      playerId,
      scores,
      totalPoints,
    });
  });
  
  return results;
}

/**
 * Update player scores after a round
 */
export function updatePlayerScores(
  currentScores: Map<string, number>,
  roundScores: Map<string, RoundScoringResult>
): Map<string, number> {
  const newScores = new Map(currentScores);
  
  roundScores.forEach((result, playerId) => {
    const currentScore = newScores.get(playerId) || 0;
    newScores.set(playerId, currentScore + result.totalPoints);
  });
  
  return newScores;
}

/**
 * Get rankings from scores
 */
export function getRankings(scores: Map<string, number>, playerNames: Map<string, string>): Array<{
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}> {
  const rankings = Array.from(scores.entries())
    .map(([playerId, score]) => ({
      playerId,
      playerName: playerNames.get(playerId) || 'Unknown',
      score,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score);
  
  // Assign ranks (handle ties)
  let currentRank = 1;
  let previousScore: number | null = null;
  
  rankings.forEach((player, index) => {
    if (previousScore !== null && player.score < previousScore) {
      currentRank = index + 1;
    }
    player.rank = currentRank;
    previousScore = player.score;
  });
  
  return rankings;
}

/**
 * Check if answer is a valid word (basic validation)
 */
export function isValidWord(answer: string): boolean {
  if (!answer) return false;
  const trimmed = answer.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return score.toString();
}

/**
 * Get points explanation in Sinhala and English
 */
export function getPointsExplanation(lang: 'en' | 'si'): {
  unique: string;
  duplicate: string;
  empty: string;
  invalid: string;
} {
  if (lang === 'si') {
    return {
      unique: 'අද්විතීය - 10 ලකුණු',
      duplicate: 'අනුපිටපත - 5 ලකුණු',
      empty: 'හිස් - 0 ලකුණු',
      invalid: 'වැරදි අකුර - 0 ලකුණු',
    };
  }
  
  return {
    unique: 'Unique - 10 points',
    duplicate: 'Duplicate - 5 points',
    empty: 'Empty - 0 points',
    invalid: 'Wrong letter - 0 points',
  };
}