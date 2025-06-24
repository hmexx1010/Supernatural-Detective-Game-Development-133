import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiZap, FiMapPin, FiTarget, FiPlay, FiAlertCircle } = FiIcons;

const GameSetup = ({ onGameStart }) => {
  const { state, dispatch } = useGame();
  const [formData, setFormData] = useState({
    detectiveName: '',
    supernaturalElement: '',
    primaryLocation: '',
    mainObjective: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if API key is configured
    if (!state.openaiApiKey) {
      alert('Please configure your OpenAI API key in Settings before starting the game.');
      return;
    }

    if (Object.values(formData).every(value => value.trim())) {
      dispatch({ type: 'SET_GAME_SETUP', payload: formData });
      dispatch({ type: 'START_GAME' });
      onGameStart();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const suggestions = {
    supernaturalElement: [
      'Vengeful Spirits', 'Ancient Curses', 'Demonic Possession', 'Time Anomalies',
      'Shadow People', 'Psychic Vampires', 'Haunted Objects', 'Dimensional Rifts'
    ],
    primaryLocation: [
      'Abandoned Asylum', 'Victorian Mansion', 'Old Theater', 'Forgotten Cemetery',
      'Underground Tunnels', 'Decrepit Library', 'Haunted Hotel', 'Ancient Church'
    ],
    mainObjective: [
      'Stop the supernatural killings', 'Banish an ancient evil', 'Solve a century-old mystery',
      'Save the innocent victims', 'Prevent an apocalyptic ritual', 'Break a family curse',
      'Find the missing persons', 'Restore balance to the supernatural realm'
    ]
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden contain-layout"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-6 text-center">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-4xl mb-2 will-change-transform"
          >
            🕵️‍♂️
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Supernatural Detective</h1>
          <p className="text-amber-100">Create your mystery and begin the investigation</p>
        </div>

        {/* API Key Warning */}
        {!state.openaiApiKey && (
          <div className="bg-red-900/30 border-b border-red-500/30 p-4">
            <div className="flex items-center gap-3">
              <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-300 text-sm">
                  <strong>API Key Required:</strong> Configure your OpenAI API key in Settings to play the game.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 contain-layout">
          {/* Detective Name */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <label className="flex items-center gap-3 text-slate-300 mb-3 text-lg font-medium">
              <SafeIcon icon={FiUser} className="text-amber-400" />
              Detective Name
            </label>
            <input
              type="text"
              value={formData.detectiveName}
              onChange={(e) => handleChange('detectiveName', e.target.value)}
              placeholder="e.g., Detective Morgan Kane"
              className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all will-change-auto"
            />
          </motion.div>

          {/* Supernatural Element */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label className="flex items-center gap-3 text-slate-300 mb-3 text-lg font-medium">
              <SafeIcon icon={FiZap} className="text-amber-400" />
              Supernatural Element
            </label>
            <input
              type="text"
              value={formData.supernaturalElement}
              onChange={(e) => handleChange('supernaturalElement', e.target.value)}
              placeholder="e.g., Vengeful Spirits"
              className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all will-change-auto"
            />
            <div className="flex flex-wrap gap-2 mt-3 overflow-container">
              {suggestions.supernaturalElement.map((suggestion, index) => (
                <motion.button
                  key={index}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChange('supernaturalElement', suggestion)}
                  className="px-3 py-1 bg-slate-700 hover:bg-amber-600 text-slate-300 hover:text-white rounded-full text-sm transition-all will-change-transform"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Primary Location */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="flex items-center gap-3 text-slate-300 mb-3 text-lg font-medium">
              <SafeIcon icon={FiMapPin} className="text-amber-400" />
              Primary Location
            </label>
            <input
              type="text"
              value={formData.primaryLocation}
              onChange={(e) => handleChange('primaryLocation', e.target.value)}
              placeholder="e.g., Abandoned Asylum"
              className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all will-change-auto"
            />
            <div className="flex flex-wrap gap-2 mt-3 overflow-container">
              {suggestions.primaryLocation.map((suggestion, index) => (
                <motion.button
                  key={index}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChange('primaryLocation', suggestion)}
                  className="px-3 py-1 bg-slate-700 hover:bg-amber-600 text-slate-300 hover:text-white rounded-full text-sm transition-all will-change-transform"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Main Objective */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="flex items-center gap-3 text-slate-300 mb-3 text-lg font-medium">
              <SafeIcon icon={FiTarget} className="text-amber-400" />
              Main Objective
            </label>
            <input
              type="text"
              value={formData.mainObjective}
              onChange={(e) => handleChange('mainObjective', e.target.value)}
              placeholder="e.g., Stop the supernatural killings"
              className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all will-change-auto"
            />
            <div className="flex flex-wrap gap-2 mt-3 overflow-container">
              {suggestions.mainObjective.map((suggestion, index) => (
                <motion.button
                  key={index}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChange('mainObjective', suggestion)}
                  className="px-3 py-1 bg-slate-700 hover:bg-amber-600 text-slate-300 hover:text-white rounded-full text-sm transition-all will-change-transform"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.button
            type="submit"
            disabled={!Object.values(formData).every(value => value.trim()) || !state.openaiApiKey}
            whileHover={{ scale: state.openaiApiKey ? 1.02 : 1 }}
            whileTap={{ scale: state.openaiApiKey ? 0.98 : 1 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-slate-600 disabled:to-slate-500 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-3 text-lg disabled:cursor-not-allowed will-change-transform"
          >
            <SafeIcon icon={FiPlay} className="w-6 h-6" />
            Begin Investigation
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default GameSetup;