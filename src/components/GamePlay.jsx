import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { generateGameContent, generateGameEnding } from '../services/aiService';
import { useSpeech } from '../hooks/useSpeech';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiRefreshCw, FiHome, FiBook, FiEye, FiVolume2, FiVolumeX, FiPause, FiAlertTriangle, FiWifi, FiWifiOff } = FiIcons;

const GamePlay = () => {
  const { state, dispatch } = useGame();
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isProcessingChoice, setIsProcessingChoice] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const hasSpokenNarrativeRef = useRef(new Set());
  const lastNarrativeRef = useRef('');

  const {
    speak,
    speakNarrative,
    stopAudio,
    isPlaying,
    isGenerating: isSpeechGenerating,
    error: speechError,
    isEnabled: speechEnabled,
    isBusy: speechBusy
  } = useSpeech();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Connection restored');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize game with opening narrative - ONLY ONCE
  useEffect(() => {
    if (state.gameStarted && !state.currentNarrative && !state.isGenerating && !hasInitialized) {
      setHasInitialized(true);
      setError(null);
      generateOpeningNarrative();
    }
  }, [state.gameStarted, hasInitialized]);

  // Generate ending when game status changes to won/lost
  useEffect(() => {
    if ((state.gameStatus === 'won' || state.gameStatus === 'lost') && !state.gameEnding && !state.isGeneratingEnding) {
      generateEnding(state.gameStatus === 'won');
    }
  }, [state.gameStatus, state.gameEnding, state.isGeneratingEnding]);

  // Reset initialization flag when game resets
  useEffect(() => {
    if (!state.gameStarted) {
      setHasInitialized(false);
      hasSpokenNarrativeRef.current.clear();
      lastNarrativeRef.current = '';
      setError(null);
      setRetryCount(0);
    }
  }, [state.gameStarted]);

  // Auto-speak narrative when it changes (prevent duplicates)
  useEffect(() => {
    if (
      state.currentNarrative &&
      state.speechEnabled &&
      !showResult &&
      !speechBusy &&
      state.currentNarrative !== lastNarrativeRef.current &&
      !hasSpokenNarrativeRef.current.has(state.currentNarrative) &&
      !isProcessingChoice
    ) {
      hasSpokenNarrativeRef.current.add(state.currentNarrative);
      lastNarrativeRef.current = state.currentNarrative;

      const timeoutId = setTimeout(() => {
        speakNarrative(state.currentNarrative);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [state.currentNarrative, state.speechEnabled, showResult, speakNarrative, speechBusy, isProcessingChoice]);

  // Auto-speak game ending when it's generated
  useEffect(() => {
    if (state.gameEnding && state.speechEnabled && !speechBusy) {
      const timeoutId = setTimeout(() => {
        speakNarrative(state.gameEnding);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [state.gameEnding, state.speechEnabled, speechBusy, speakNarrative]);

  const generateOpeningNarrative = async () => {
    dispatch({ type: 'SET_GENERATING', payload: true });
    
    try {
      console.log('Generating opening narrative...');
      const content = await generateGameContent({
        detectiveName: state.detectiveName,
        supernaturalElement: state.supernaturalElement,
        primaryLocation: state.primaryLocation,
        mainObjective: state.mainObjective,
        turnNumber: 1,
        currentScore: 0,
        history: [],
        isOpening: true
      }, state.openaiApiKey);

      console.log('Opening narrative generated successfully');
      dispatch({
        type: 'SET_CURRENT_TURN',
        payload: {
          narrative: content.narrative,
          choices: content.choices
        }
      });
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error('Error generating opening:', error);
      dispatch({ type: 'SET_GENERATING', payload: false });
      setError(`Failed to generate opening: ${error.message}`);
    }
  };

  const generateEnding = async (isVictory) => {
    dispatch({ type: 'SET_GENERATING_ENDING', payload: true });
    
    try {
      console.log(`Generating ${isVictory ? 'victory' : 'defeat'} ending...`);
      const ending = await generateGameEnding(state, state.openaiApiKey, isVictory);
      
      console.log(`${isVictory ? 'Victory' : 'Defeat'} ending generated successfully`);
      dispatch({
        type: 'SET_GAME_ENDING',
        payload: ending
      });
    } catch (error) {
      console.error('Error generating ending:', error);
      dispatch({ type: 'SET_GENERATING_ENDING', payload: false });
      
      // Set fallback ending if generation fails
      const fallbackEnding = isVictory 
        ? `Detective ${state.detectiveName} stands triumphant, having successfully confronted the ${state.supernaturalElement} in ${state.primaryLocation}. The supernatural threat has been neutralized, and the ${state.mainObjective} has been achieved. Victory belongs to those who dare to face the unknown.`
        : `The darkness claims Detective ${state.detectiveName} in the ${state.primaryLocation}. The ${state.supernaturalElement} has proven too powerful, and the ${state.mainObjective} remains unfulfilled. Some mysteries are destined to remain unsolved, consumed by the shadows of the supernatural realm.`;
      
      dispatch({
        type: 'SET_GAME_ENDING',
        payload: fallbackEnding
      });
    }
  };

  const handleChoiceSelect = async (choice) => {
    if (isProcessingChoice || speechBusy) {
      return;
    }

    setIsProcessingChoice(true);
    setError(null);
    stopAudio();
    setSelectedChoice(choice);
    setShowResult(true);

    try {
      // Update game state with choice
      dispatch({ type: 'MAKE_CHOICE', payload: choice });

      // Speak the choice result if enabled
      if (state.speechEnabled && choice.result) {
        setTimeout(() => {
          speak(choice.result);
        }, 500);
      }

      // Wait for speech to complete
      const waitForSpeech = () => {
        return new Promise((resolve) => {
          const checkSpeech = () => {
            if (!speechBusy && !isPlaying && !isSpeechGenerating) {
              resolve();
            } else {
              setTimeout(checkSpeech, 300);
            }
          };
          setTimeout(checkSpeech, state.speechEnabled ? 2500 : 500);
        });
      };

      await waitForSpeech();

      // Generate next turn if game continues
      const newScore = Math.max(0, Math.min(state.maxScore, state.currentScore + choice.points));
      const newStatus = newScore >= state.maxScore ? 'won' : newScore <= 0 ? 'lost' : 'playing';

      if (newStatus === 'playing') {
        dispatch({ type: 'SET_GENERATING', payload: true });
        
        try {
          console.log('Generating next turn...');
          const content = await generateGameContent({
            detectiveName: state.detectiveName,
            supernaturalElement: state.supernaturalElement,
            primaryLocation: state.primaryLocation,
            mainObjective: state.mainObjective,
            turnNumber: state.turnNumber + 1,
            currentScore: newScore,
            history: state.history,
            lastChoice: choice,
            isOpening: false
          }, state.openaiApiKey);

          console.log('Next turn generated successfully');
          dispatch({
            type: 'SET_CURRENT_TURN',
            payload: {
              narrative: content.narrative,
              choices: content.choices
            }
          });
        } catch (error) {
          console.error('Error generating next turn:', error);
          dispatch({ type: 'SET_GENERATING', payload: false });
          setError(`Failed to generate next turn: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error processing choice:', error);
      setError(`Error processing choice: ${error.message}`);
    }

    // Reset choice state
    setTimeout(() => {
      setShowResult(false);
      setSelectedChoice(null);
      setIsProcessingChoice(false);
    }, 1000);
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    
    if (!state.currentNarrative) {
      // Force re-initialization
      setHasInitialized(false);
      // This will trigger the useEffect to generate opening narrative again
      setTimeout(() => {
        if (!hasInitialized) {
          setHasInitialized(true);
          generateOpeningNarrative();
        }
      }, 100);
    } else if (state.isGenerating) {
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  };

  const handleSpeakNarrative = () => {
    if (speechBusy) {
      stopAudio();
    } else if (state.gameEnding) {
      speakNarrative(state.gameEnding);
    } else if (state.currentNarrative) {
      speakNarrative(state.currentNarrative);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 6) return 'text-green-400';
    if (score >= 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getChoiceEmoji = (points) => {
    if (points === 2) return '🌟';
    if (points === 1) return '👍';
    if (points === 0) return '⚖️';
    if (points === -1) return '⚠️';
    if (points === -2) return '💀';
    return '❓';
  };

  const getChoiceColor = (points) => {
    if (points === 2) return 'border-green-400/50 hover:border-green-400 bg-green-900/10';
    if (points === 1) return 'border-blue-400/50 hover:border-blue-400 bg-blue-900/10';
    if (points === 0) return 'border-yellow-400/50 hover:border-yellow-400 bg-yellow-900/10';
    if (points === -1) return 'border-orange-400/50 hover:border-orange-400 bg-orange-900/10';
    if (points === -2) return 'border-red-400/50 hover:border-red-400 bg-red-900/10';
    return 'border-slate-600 hover:border-amber-400/50 bg-slate-700/50';
  };

  const getScoreChangeText = (points) => {
    if (points === 2) return 'Excellent! +2 Points';
    if (points === 1) return 'Good Choice! +1 Point';
    if (points === 0) return 'Neutral (No Change)';
    if (points === -1) return 'Poor Choice (-1 Point)';
    if (points === -2) return 'Very Bad Choice (-2 Points)';
    return 'Unknown';
  };

  const resetGame = () => {
    stopAudio();
    hasSpokenNarrativeRef.current.clear();
    lastNarrativeRef.current = '';
    setHasInitialized(false);
    setError(null);
    setRetryCount(0);
    dispatch({ type: 'RESET_GAME' });
  };

  if (!state.gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-slate-300">
          <p className="text-xl">Game not started. Please set up your detective story first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Score Display */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700/50"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-amber-400 mb-2">
                🕵️ Detective {state.detectiveName}
              </h2>
              <p className="text-slate-300">
                {state.supernaturalElement} • {state.primaryLocation}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(state.currentScore)}`}>
                Case Progress: {state.currentScore}/{state.maxScore}
              </div>
              <div className="w-48 bg-slate-700 rounded-full h-3 mt-2">
                <motion.div
                  className="bg-gradient-to-r from-amber-600 to-amber-400 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(state.currentScore / state.maxScore) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Connection Status */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-900/50 border border-orange-500/50 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <SafeIcon icon={FiWifiOff} className="w-5 h-5 text-orange-400" />
              <div>
                <h4 className="text-orange-400 font-medium">Connection Lost</h4>
                <p className="text-orange-300 text-sm">
                  You're currently offline. Please check your internet connection to continue the game.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-900/50 border border-red-500/50 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <SafeIcon icon={FiAlertTriangle} className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-red-400 font-medium mb-1">Generation Error</h4>
                  <p className="text-red-300 text-sm mb-3">{error}</p>
                  
                  {/* Connection status in error */}
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <SafeIcon icon={isOnline ? FiWifi : FiWifiOff} className={`w-4 h-4 ${isOnline ? 'text-green-400' : 'text-red-400'}`} />
                    <span className={isOnline ? 'text-green-300' : 'text-red-300'}>
                      {isOnline ? 'Connected' : 'Offline'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRetry}
                      disabled={!isOnline}
                      className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🔄 Retry {retryCount > 0 && `(${retryCount})`}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetGame}
                      className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      🏠 Reset Game
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Status Messages with Dynamic Endings */}
        <AnimatePresence>
          {state.gameStatus === 'won' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-green-900/50 border border-green-500/50 rounded-xl p-6 mb-6"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-green-400 mb-4">Case Solved!</h3>
                
                {/* Voice Controls for Ending */}
                {speechEnabled && state.gameEnding && (
                  <div className="flex justify-center mb-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSpeakNarrative}
                      disabled={isSpeechGenerating}
                      className={`p-2 rounded-lg transition-colors ${
                        speechBusy
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-green-600 hover:bg-green-500 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={speechBusy ? 'Stop narration' : 'Play victory ending'}
                    >
                      {isSpeechGenerating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
                        </motion.div>
                      ) : speechBusy ? (
                        <SafeIcon icon={FiPause} className="w-4 h-4" />
                      ) : (
                        <SafeIcon icon={FiVolume2} className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>
                )}

                {/* Dynamic Victory Ending */}
                {state.isGeneratingEnding ? (
                  <div className="mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="inline-block mb-2"
                    >
                      <SafeIcon icon={FiRefreshCw} className="w-6 h-6 text-green-400" />
                    </motion.div>
                    <p className="text-green-300">Crafting your victory story...</p>
                  </div>
                ) : state.gameEnding ? (
                  <div className="bg-green-900/30 rounded-lg p-4 mb-4">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-green-100 leading-relaxed whitespace-pre-wrap">
                        {state.gameEnding}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-green-300 mb-4">
                    Congratulations, Detective {state.detectiveName}! You've successfully completed your investigation.
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetGame}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  🆕 Start New Case
                </motion.button>
              </div>
            </motion.div>
          )}

          {state.gameStatus === 'lost' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-red-900/50 border border-red-500/50 rounded-xl p-6 mb-6"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">💀</div>
                <h3 className="text-2xl font-bold text-red-400 mb-4">Case Failed</h3>
                
                {/* Voice Controls for Ending */}
                {speechEnabled && state.gameEnding && (
                  <div className="flex justify-center mb-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSpeakNarrative}
                      disabled={isSpeechGenerating}
                      className={`p-2 rounded-lg transition-colors ${
                        speechBusy
                          ? 'bg-orange-600 hover:bg-orange-500 text-white'
                          : 'bg-red-600 hover:bg-red-500 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={speechBusy ? 'Stop narration' : 'Play defeat ending'}
                    >
                      {isSpeechGenerating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
                        </motion.div>
                      ) : speechBusy ? (
                        <SafeIcon icon={FiPause} className="w-4 h-4" />
                      ) : (
                        <SafeIcon icon={FiVolume2} className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>
                )}

                {/* Dynamic Defeat Ending */}
                {state.isGeneratingEnding ? (
                  <div className="mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="inline-block mb-2"
                    >
                      <SafeIcon icon={FiRefreshCw} className="w-6 h-6 text-red-400" />
                    </motion.div>
                    <p className="text-red-300">Sealing your fate...</p>
                  </div>
                ) : state.gameEnding ? (
                  <div className="bg-red-900/30 rounded-lg p-4 mb-4">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-red-100 leading-relaxed whitespace-pre-wrap">
                        {state.gameEnding}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-300 mb-4">
                    The investigation has taken a dark turn, Detective {state.detectiveName}. The supernatural forces have won.
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetGame}
                  className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  🔄 Try Again
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Narrative */}
        {state.gameStatus === 'playing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-8 mb-6 border border-slate-700/50"
          >
            {state.isGenerating ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <SafeIcon icon={FiRefreshCw} className="w-8 h-8 text-amber-400" />
                </motion.div>
                <p className="text-slate-300 text-lg mb-4">🎭 Generating your next turn...</p>
                <div className="text-slate-400 text-sm">
                  <p>Please wait while the AI creates your story...</p>
                  <p className="mt-1">This may take a few moments depending on server load.</p>
                  {retryCount > 0 && (
                    <p className="mt-2 text-amber-400">Retry attempt #{retryCount}</p>
                  )}
                  {!isOnline && (
                    <p className="mt-2 text-red-400">⚠️ No internet connection detected</p>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    dispatch({ type: 'SET_GENERATING', payload: false });
                    setError('Generation cancelled by user');
                  }}
                  className="mt-4 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Cancel Generation
                </motion.button>
              </div>
            ) : (
              <>
                {/* Voice Controls */}
                {speechEnabled && (
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSpeakNarrative}
                        disabled={isSpeechGenerating || isProcessingChoice}
                        className={`p-2 rounded-lg transition-colors ${
                          speechBusy
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={speechBusy ? 'Stop narration' : 'Play narration'}
                      >
                        {isSpeechGenerating ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
                          </motion.div>
                        ) : speechBusy ? (
                          <SafeIcon icon={FiPause} className="w-4 h-4" />
                        ) : (
                          <SafeIcon icon={FiVolume2} className="w-4 h-4" />
                        )}
                      </motion.button>

                      {speechBusy && (
                        <span className="text-amber-400 text-sm animate-pulse">
                          🔊 Playing narration...
                        </span>
                      )}

                      {speechError && (
                        <span className="text-red-400 text-sm">
                          ❌ Voice error: {speechError}
                        </span>
                      )}
                    </div>

                    {!speechEnabled && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <SafeIcon icon={FiVolumeX} className="w-4 h-4" />
                        <span>🔇 Voice disabled</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">
                    {state.currentNarrative}
                  </p>
                </div>

                {/* Five Choices */}
                {state.currentChoices.length > 0 && (
                  <div className="mt-8 space-y-4">
                    <h4 className="text-amber-400 font-semibold text-lg mb-4 flex items-center gap-2">
                      🎯 Choose your approach:
                    </h4>
                    {state.currentChoices.map((choice, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02, x: 10 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleChoiceSelect(choice)}
                        disabled={showResult || isProcessingChoice || speechBusy || !isOnline}
                        className={`w-full p-4 border-2 rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getChoiceColor(choice.points)}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-bold text-lg min-w-[24px]">
                              {String.fromCharCode(65 + index)})
                            </span>
                            <span className="text-xl">
                              {getChoiceEmoji(choice.points)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-200 font-medium">{choice.text}</p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Choice Result */}
        <AnimatePresence>
          {showResult && selectedChoice && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700/50"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl">{getChoiceEmoji(selectedChoice.points)}</span>
                <div>
                  <h4 className="text-lg font-semibold text-amber-400">
                    {getScoreChangeText(selectedChoice.points)}
                  </h4>
                </div>
              </div>
              <p className="text-slate-200 leading-relaxed">
                {selectedChoice.result}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clues & Inventory */}
        {(state.clues.length > 0 || state.inventory.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {state.clues.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-amber-400 font-semibold mb-3">
                    <SafeIcon icon={FiEye} />
                    🔍 Clues Discovered
                  </h4>
                  <div className="space-y-2">
                    {state.clues.map((clue, index) => (
                      <div key={index} className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-slate-200 text-sm">{clue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {state.inventory.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-amber-400 font-semibold mb-3">
                    <SafeIcon icon={FiBook} />
                    📋 Evidence
                  </h4>
                  <div className="space-y-2">
                    {state.inventory.map((item, index) => (
                      <div key={index} className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-slate-200 text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GamePlay;