import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameSetup from './components/GameSetup';
import GamePlay from './components/GamePlay';
import Settings from './components/Settings';
import GameHistory from './components/GameHistory';
import { GameProvider, useGame } from './contexts/GameContext';
import SafeIcon from './common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import './App.css';

const { FiSettings, FiBook, FiHome, FiPlay, FiRefreshCw } = FiIcons;

// Loading component
const LoadingScreen = ({ message = "Loading Supernatural Detective..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="inline-block mb-4"
      >
        <SafeIcon icon={FiRefreshCw} className="w-12 h-12 text-amber-400" />
      </motion.div>
      <h1 className="text-2xl font-bold text-amber-400 mb-2">🕵️ Supernatural Detective</h1>
      <p className="text-slate-300">{message}</p>
    </div>
  </div>
);

function AppContent() {
  const { state } = useGame();
  const [currentView, setCurrentView] = useState('setup');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading Supernatural Detective...');

  // Simulate loading process
  useEffect(() => {
    const loadingSteps = [
      { message: 'Loading Supernatural Detective...', duration: 500 },
      { message: 'Preparing investigation tools...', duration: 300 },
      { message: 'Connecting to the supernatural realm...', duration: 400 },
      { message: 'Ready for investigation!', duration: 200 }
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

    // Start loading process
    const timer = setTimeout(progressLoading, 100);
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

  // Show navigation when game is started OR when we're in settings view
  const showNavigation = state.gameStarted || currentView === 'settings';
  
  // Show floating settings button only when on setup screen AND game is NOT started AND not already in settings
  const showFloatingSettings = !state.gameStarted && currentView === 'setup';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
      </div>

      {/* Navigation */}
      {showNavigation && (
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-4 border-b border-slate-700/50 backdrop-blur-sm"
        >
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <motion.h1
              className="text-2xl font-bold text-amber-400 tracking-wider cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => state.gameStarted ? setCurrentView('game') : setCurrentView('setup')}
            >
              🕵️ SUPERNATURAL DETECTIVE
            </motion.h1>

            <div className="flex space-x-4">
              {!state.gameStarted && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView('setup')}
                  className={`p-2 rounded-lg transition-colors ${
                    currentView === 'setup'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <SafeIcon icon={FiPlay} className="w-5 h-5" />
                </motion.button>
              )}

              {state.gameStarted && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentView('game')}
                    className={`p-2 rounded-lg transition-colors ${
                      currentView === 'game'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <SafeIcon icon={FiHome} className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentView('history')}
                    className={`p-2 rounded-lg transition-colors ${
                      currentView === 'history'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <SafeIcon icon={FiBook} className="w-5 h-5" />
                  </motion.button>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('settings')}
                className={`p-2 rounded-lg transition-colors ${
                  currentView === 'settings'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <SafeIcon icon={FiSettings} className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.nav>
      )}

      {/* Floating Settings Button (only on setup screen when game not started) */}
      {showFloatingSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4 z-20"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentView('settings')}
            className="p-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-lg border border-slate-600 transition-all backdrop-blur-sm"
            title="Settings"
          >
            <SafeIcon icon={FiSettings} className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="relative z-10">
        <Suspense fallback={<LoadingScreen message="Loading component..." />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {views[currentView]}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Mark that React has loaded successfully
    if (typeof window !== 'undefined') {
      window.reactLoaded = true;
      console.log('✅ React App loaded successfully');
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