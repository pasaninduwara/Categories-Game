import React from 'react';
import { 
  Player, 
  CATEGORIES, 
  UI_TEXT, 
  Language,
  RoundResult,
  CategoryAnswers
} from '../types/game';

interface ScoreboardProps {
  language: Language;
  roundNumber: number;
  totalRounds: number;
  letter: string;
  players: Player[];
  roundResult: RoundResult | null;
  isFinalResults: boolean;
  onNextRound: () => void;
  onPlayAgain: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  language,
  roundNumber,
  totalRounds,
  letter,
  players,
  roundResult,
  isFinalResults,
  onNextRound,
  onPlayAgain,
}) => {
  const text = UI_TEXT[language];

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Get winner info
  const winner = sortedPlayers[0];
  const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score;

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="text-center mb-6">
        {isFinalResults ? (
          <>
            <h1 className="text-2xl font-bold text-telegram-text mb-2">
              {text.finalResults}
            </h1>
            {winner && !isTie && (
              <div className="text-telegram-button text-lg font-medium">
                🏆 {text.winner} {winner.name}!
              </div>
            )}
            {isTie && (
              <div className="text-telegram-button text-lg font-medium">
                🤝 {language === 'si' ? 'සමාන ලකුණු!' : 'It\'s a tie!'}
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-telegram-text mb-2">
              {text.roundResults}
            </h1>
            <div className="text-telegram-hint">
              {text.round} {roundNumber} {text.of} {totalRounds}
            </div>
          </>
        )}
      </div>

      {/* Round Summary */}
      {!isFinalResults && roundResult && (
        <div className="card mb-4">
          <div className="text-center mb-4">
            <span className="text-lg text-telegram-hint">{text.round} {roundNumber}</span>
            <span className="mx-2">•</span>
            <span className="text-lg font-bold text-telegram-button">{letter}</span>
          </div>

          {/* Answers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-telegram-secondaryBg">
                  <th className="text-left py-2 text-telegram-hint font-medium">
                    {text.players}
                  </th>
                  {CATEGORIES.map(({ key, labelSinhala, labelEnglish }) => (
                    <th key={key} className="text-center py-2 text-telegram-hint font-medium text-xs">
                      {language === 'si' ? labelSinhala : labelEnglish}
                    </th>
                  ))}
                  <th className="text-center py-2 text-telegram-hint font-medium">
                    +{language === 'si' ? 'ලකුණු' : 'Pts'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => {
                  const answers = roundResult.answers.get(player.id) as CategoryAnswers | undefined;
                  const roundScore = roundResult.scores.get(player.id) || 0;
                  
                  return (
                    <tr key={player.id} className="border-b border-telegram-secondaryBg/50">
                      <td className="py-2 font-medium text-telegram-text">
                        {player.name}
                      </td>
                      {CATEGORIES.map(({ key }) => {
                        const answer = answers?.[key] || '-';
                        return (
                          <td key={key} className="text-center py-2 text-xs">
                            {answer}
                          </td>
                        );
                      })}
                      <td className="text-center py-2 font-bold text-telegram-button">
                        +{roundScore}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rankings */}
      <div className="card mb-4">
        <h2 className="font-semibold text-telegram-text mb-3">
          {language === 'si' ? 'ශ්‍රේණිගත කිරීම' : 'Rankings'}
        </h2>
        
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
            
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  rank === 1 ? 'bg-yellow-50 ring-2 ring-yellow-400' : 'bg-telegram-secondaryBg'
                }`}
              >
                <div className="w-8 text-center font-bold text-telegram-text">
                  {medal || rank}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-telegram-text truncate">
                    {player.name}
                  </div>
                  {isFinalResults && player.isHost && (
                    <span className="text-xs text-telegram-hint">👑 Host</span>
                  )}
                </div>
                
                <div className="score-badge">
                  {player.score} {text.points}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="space-y-3">
        {!isFinalResults ? (
          <button onClick={onNextRound} className="btn-primary">
            {text.nextRound}
          </button>
        ) : (
          <>
            {isFinalResults && winner && !isTie && (
              <Confetti />
            )}
            <button onClick={onPlayAgain} className="btn-primary">
              {text.playAgain}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Simple confetti component
const Confetti: React.FC = () => {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-full animate-confetti"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            backgroundColor: piece.color,
          }}
        />
      ))}
    </div>
  );
};