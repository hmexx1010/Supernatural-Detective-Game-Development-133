import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameSetup from './components/GameSetup';
import GamePlay from './components/GamePlay';
import Settings from './components/Settings';
import GameHistory from './components/GameHistory';
import AtmosphericBackground from './components/AtmosphericBackground';
import SoundEffects from './components/SoundEffects';
import { GameProvider, useGame } from './contexts/GameContext';
import SafeIcon from './common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import './App.css';

const { FiSettings, FiBook, FiHome, FiPlay, FiRefreshCw } = FiIcons;

// Enhanced Loading component
const LoadingScreen = ({ message = "Loading Supernatural Detective..." }) => (
  <div className="min-h-screen atmospheric-bg flex items-center justify-center">
    <div className="text-center relative z-10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="inline-block mb-6"
      >
        <SafeIcon icon={FiRefreshCw} className="w-16 h-16 text-cyan-400" />
      </motion.div>
      <motion.h1
        className="font-display text-4xl font-bold mb-4"
        style={{
          background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        🕵️ Supernatural Detective
      </motion.h1>
      <motion.p
        className="text-slate-300 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {message}
      </motion.p>
      
      {/* Loading progress dots */}
      <div className="flex justify-center space-x-2 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-cyan-400"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

function AppContent() {
  const { state } = useGame();
  const [currentView, setCurrentView] = useState('setup');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading Supernatural Detective...');

  // Enhanced loading sequence
  useEffect(() => {
    const loadingSteps = [
      { message: 'Initializing investigation protocols...', duration: 800 },
      { message: 'Calibrating supernatural sensors...', duration: 600 },
      { message: 'Establishing connection to the ethereal plane...', duration: 700 },
      { message: 'Preparing detective toolkit...', duration: 500 },
      { message: 'Ready for investigation!', duration: 400 }
    ];

    let currentStep = 0;
    const progressLoading = () => {
      if (currentStep < loadingSteps.length) {
        setLoadingMessage(loadingSteps[currentStep].message);
        setTimeout(() => {
          currentStep++;
          if (currentStep < loadingSteps.length) {
            progressLoading();
          } else {
            setIsLoading(false);
          }
        }, loadingSteps[currentStep].duration);
      }
    };

    const timer = setTimeout(progressLoading, 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-redirect to game if already started
  useEffect(() => {
    if (state.gameStarted && currentView === 'setup') {
      setCurrentView('game');
    }
  }, [state.gameStarted, currentView]);

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  const views = {
    setup: <GameSetup onGameStart={() => setCurrentView('game')} />,
    game: <GamePlay />,
    settings: <Settings />,
    history: <GameHistory />
  };

  const showNavigation = state.gameStarted || currentView === 'settings';
  const showFloatingSettings = !state.gameStarted && currentView === 'setup';

  // Enhanced page transitions
  const pageVariants = {
    initial: { opacity: 0, x: 20, filter: 'blur(10px)' },
    in: { opacity: 1, x: 0, filter: 'blur(0px)' },
    out: { opacity: 0, x: -20, filter: 'blur(10px)' }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  };

  return (
    <AtmosphericBackground intensity="medium">
      <SoundEffects enabled={true} volume={0.3} />
      <div className="app-container">
        {/* Enhanced Navigation */}
        <AnimatePresence>
          {showNavigation && (
            <motion.nav
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="nav-container p-6 border-b border-white border-opacity-10"
            >
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Enhanced Title */}
                <motion.h1
                  className="nav-title"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => state.gameStarted ? setCurrentView('game') : setCurrentView('setup')}
                  onMouseEnter={() => window.playSound?.('hover')}
                >
                  🕵️ SUPERNATURAL DETECTIVE
                </motion.h1>

                {/* Enhanced Navigation Buttons */}
                <div className="flex space-x-3">
                  {!state.gameStarted && (
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setCurrentView('setup');
                        window.playSound?.('click');
                      }}
                      onMouseEnter={() => window.playSound?.('hover')}
                      className={`nav-button ${currentView === 'setup' ? 'active' : ''}`}
                    >
                      <SafeIcon icon={FiPlay} className="w-5 h-5" />
                    </motion.button>
                  )}

                  {state.gameStarted && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setCurrentView('game');
                          window.playSound?.('click');
                        }}
                        onMouseEnter={() => window.playSound?.('hover')}
                        className={`nav-button ${currentView === 'game' ? 'active' : ''}`}
                      >
                        <SafeIcon icon={FiHome} className="w-5 h-5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setCurrentView('history');
                          window.playSound?.('click');
                        }}
                        onMouseEnter={() => window.playSound?.('hover')}
                        className={`nav-button ${currentView === 'history' ? 'active' : ''}`}
                      >
                        <SafeIcon icon={FiBook} className="w-5 h-5" />
                      </motion.button>
                    </>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCurrentView('settings');
                      window.playSound?.('click');
                    }}
                    onMouseEnter={() => window.playSound?.('hover')}
                    className={`nav-button ${currentView === 'settings' ? 'active' : ''}`}
                  >
                    <SafeIcon icon={FiSettings} className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Enhanced Floating Settings Button */}
        <AnimatePresence>
          {showFloatingSettings && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
              className="floating-settings"
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCurrentView('settings');
                  window.playSound?.('click');
                }}
                onMouseEnter={() => window.playSound?.('hover')}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
                title="Settings"
              >
                <SafeIcon icon={FiSettings} className="w-6 h-6" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Main Content */}
        <div className="content-area">
          <Suspense fallback={<LoadingScreen message="Loading component..." />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                {views[currentView]}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </div>
    </AtmosphericBackground>
  );
}

function App() {
  useEffect(() => {
    // Enhanced app initialization
    if (typeof window !== 'undefined') {
      window.reactLoaded = true;
      console.log('✅ Supernatural Detective initialized successfully');
    }
  }, []);

  return (
    <GameProvider>
      <Suspense fallback={<LoadingScreen />}>
        <AppContent />
      </Suspense>
    </GameProvider>
  );
}

export default App;