import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { format } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBook, FiClock, FiTrendingUp, FiTrendingDown, FiMinus, FiStar, FiSkull, FiImage } = FiIcons;

const GameHistory = () => {
  const { state } = useGame();

  const getChoiceIcon = (points) => {
    if (points === 2) return { icon: FiStar, color: 'text-green-400', emoji: '🌟' };
    if (points === 1) return { icon: FiTrendingUp, color: 'text-blue-400', emoji: '👍' };
    if (points === 0) return { icon: FiMinus, color: 'text-yellow-400', emoji: '➖' };
    if (points === -1) return { icon: FiTrendingDown, color: 'text-orange-400', emoji: '👎' };
    if (points === -2) return { icon: FiSkull, color: 'text-red-400', emoji: '💀' };
    return { icon: FiMinus, color: 'text-slate-400', emoji: '❓' };
  };

  const getScoreChangeText = (points) => {
    if (points === 2) return 'Excellent (+2)';
    if (points === 1) return 'Good (+1)';
    if (points === 0) return 'Neutral (0)';
    if (points === -1) return 'Poor (-1)';
    if (points === -2) return 'Very Bad (-2)';
    return 'Unknown';
  };

  if (!state.gameStarted || state.history.length === 0) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center"
          >
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-slate-300 mb-2">No History Yet</h2>
            <p className="text-slate-400">
              Start playing to see your investigation history here.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700/50"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-600 rounded-lg">
              <SafeIcon icon={FiBook} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Investigation History</h1>
              <p className="text-slate-300">
                Detective {state.detectiveName} • {state.history.length} decisions made
              </p>
            </div>
          </div>
        </motion.div>

        {/* Game Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700/50"
        >
          <h2 className="text-xl font-semibold text-amber-400 mb-4">Case Summary</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{state.currentScore}</div>
              <div className="text-slate-400 text-sm">Current Score</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{state.history.length}</div>
              <div className="text-slate-400 text-sm">Decisions Made</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                {state.history.filter(h => h.scoreChange === 2).length}
              </div>
              <div className="text-slate-400 text-sm">Excellent Choices</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">
                {state.history.filter(h => h.scoreChange === 1).length}
              </div>
              <div className="text-slate-400 text-sm">Good Choices</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">
                {state.history.filter(h => h.scoreChange < 0).length}
              </div>
              <div className="text-slate-400 text-sm">Poor Choices</div>
            </div>
          </div>
        </motion.div>

        {/* History Timeline */}
        <div className="space-y-4">
          {state.history.map((entry, index) => {
            const choiceInfo = getChoiceIcon(entry.scoreChange);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
              >
                {/* Turn Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {entry.turn}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Turn {entry.turn}</h3>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <SafeIcon icon={FiClock} className="w-4 h-4" />
                        {format(new Date(entry.timestamp), 'MMM d, yyyy • h:mm a')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 ${choiceInfo.color}`}>
                      <span className="text-xl">{choiceInfo.emoji}</span>
                      <SafeIcon icon={choiceInfo.icon} className="w-5 h-5" />
                      <span className="font-semibold">
                        {getScoreChangeText(entry.scoreChange)}
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm">
                      Score: {entry.newScore}/{state.maxScore}
                    </div>
                  </div>
                </div>

                {/* Scene Image */}
                {entry.image && (
                  <div className="mb-4">
                    <motion.img
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={entry.image}
                      alt={`Scene from Turn ${entry.turn}`}
                      className="w-full max-w-md mx-auto rounded-lg shadow-lg border border-slate-600/50"
                    />
                  </div>
                )}

                {/* Narrative */}
                <div className="mb-4">
                  <h4 className="text-amber-400 font-medium mb-2">Situation:</h4>
                  <p className="text-slate-200 leading-relaxed bg-slate-700/30 rounded-lg p-4">
                    {entry.narrative}
                  </p>
                </div>

                {/* Choice Made */}
                <div className="mb-4">
                  <h4 className="text-amber-400 font-medium mb-2">Your Choice:</h4>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-200">{entry.choice.text}</p>
                  </div>
                </div>

                {/* Result */}
                <div>
                  <h4 className="text-amber-400 font-medium mb-2">Outcome:</h4>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <p className="text-slate-200">{entry.result}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Game Status */}
        {state.gameStatus !== 'playing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-6 rounded-xl text-center ${
              state.gameStatus === 'won'
                ? 'bg-green-900/50 border border-green-500/50'
                : 'bg-red-900/50 border border-red-500/50'
            }`}
          >
            {/* Ending Image */}
            {state.endingImage && (
              <div className="mb-6">
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={state.endingImage}
                  alt={`${state.gameStatus === 'won' ? 'Victory' : 'Defeat'} ending`}
                  className="w-full max-w-2xl mx-auto rounded-lg shadow-2xl border border-slate-600/50"
                />
              </div>
            )}

            <div className="text-6xl mb-4">
              {state.gameStatus === 'won' ? '🎉' : '💀'}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${
              state.gameStatus === 'won' ? 'text-green-400' : 'text-red-400'
            }`}>
              {state.gameStatus === 'won' ? 'Case Solved!' : 'Case Failed'}
            </h3>
            
            {/* Ending Text */}
            {state.gameEnding && (
              <div className={`mb-4 p-4 rounded-lg ${
                state.gameStatus === 'won' ? 'bg-green-900/30' : 'bg-red-900/30'
              }`}>
                <p className={`leading-relaxed ${
                  state.gameStatus === 'won' ? 'text-green-100' : 'text-red-100'
                } whitespace-pre-wrap`}>
                  {state.gameEnding}
                </p>
              </div>
            )}

            <p className={`${
              state.gameStatus === 'won' ? 'text-green-300' : 'text-red-300'
            }`}>
              {state.gameStatus === 'won'
                ? 'Congratulations on solving this supernatural mystery!'
                : 'The supernatural forces proved too powerful this time.'
              }
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GameHistory;