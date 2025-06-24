import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { testOpenAIConnection } from '../services/aiService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSettings, FiKey, FiVolume2, FiRefreshCw, FiSave, FiCheck, FiAlertCircle, FiInfo, FiPlay } = FiIcons;

const Settings = () => {
  const { state, dispatch } = useGame();
  const [localSettings, setLocalSettings] = useState({
    openaiApiKey: state.openaiApiKey,
    elevenlabsApiKey: state.elevenlabsApiKey,
    selectedVoice: state.selectedVoice,
    speechEnabled: state.speechEnabled
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [testingVoice, setTestingVoice] = useState(false);

  // Update local settings when state changes
  useEffect(() => {
    setLocalSettings({
      openaiApiKey: state.openaiApiKey,
      elevenlabsApiKey: state.elevenlabsApiKey,
      selectedVoice: state.selectedVoice,
      speechEnabled: state.speechEnabled
    });
  }, [state.openaiApiKey, state.elevenlabsApiKey, state.selectedVoice, state.speechEnabled]);

  const handleSave = () => {
    dispatch({ type: 'SET_SETTINGS', payload: localSettings });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the game? This will clear all progress.')) {
      dispatch({ type: 'RESET_GAME' });
      setSaveStatus('reset');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const testOpenAIKey = async () => {
    if (!localSettings.openaiApiKey) {
      setSaveStatus('error');
      return;
    }

    setSaveStatus('testing');
    
    try {
      await testOpenAIConnection(localSettings.openaiApiKey);
      setSaveStatus('connected');
    } catch (error) {
      console.error('API test failed:', error);
      setSaveStatus('error');
    }
    
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const testElevenLabsVoice = async () => {
    if (!localSettings.elevenlabsApiKey) {
      alert('Please enter your ElevenLabs API key first');
      return;
    }

    setTestingVoice(true);
    
    try {
      const { generateSpeech, playAudio } = await import('../services/aiService');
      const testText = "Hello! This is a test of your ElevenLabs voice synthesis. Your supernatural detective game is ready to speak!";
      const audioData = await generateSpeech(testText, 'alloy', localSettings.elevenlabsApiKey);
      await playAudio(audioData);
      setSaveStatus('voice-tested');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Voice test failed:', error);
      alert(`Voice test failed: ${error.message}`);
    } finally {
      setTestingVoice(false);
    }
  };

  const voices = [
    { id: 'alloy', name: 'Alloy (Neutral)' },
    { id: 'echo', name: 'Echo (Male)' },
    { id: 'fable', name: 'Fable (British Male)' },
    { id: 'onyx', name: 'Onyx (Deep Male)' },
    { id: 'nova', name: 'Nova (Female)' },
    { id: 'shimmer', name: 'Shimmer (Female)' }
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-600 rounded-lg">
              <SafeIcon icon={FiSettings} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-slate-300">Configure your game experience</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* API Configuration */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-amber-400 flex items-center gap-3">
                <SafeIcon icon={FiKey} />
                API Configuration
              </h2>

              {/* OpenAI API Key */}
              <div>
                <label className="block text-slate-300 mb-2 font-medium">
                  OpenAI API Key *
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={localSettings.openaiApiKey}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                    placeholder="sk-proj-... (your complete OpenAI API key)"
                    className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all pr-20"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                    <button
                      type="button"
                      onClick={testOpenAIKey}
                      disabled={!localSettings.openaiApiKey || saveStatus === 'testing'}
                      className="text-slate-400 hover:text-amber-400 disabled:opacity-50"
                      title="Test API Key"
                    >
                      {saveStatus === 'testing' ? '🔄' : '🔍'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {showApiKey ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* API Key Status */}
                {saveStatus === 'testing' && (
                  <div className="flex items-center gap-2 mt-2 text-amber-400">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
                    </motion.div>
                    <span className="text-sm">Testing connection...</span>
                  </div>
                )}

                {saveStatus === 'connected' && (
                  <div className="flex items-center gap-2 mt-2 text-green-400">
                    <SafeIcon icon={FiCheck} className="w-4 h-4" />
                    <span className="text-sm">API key is valid!</span>
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 mt-2 text-red-400">
                    <SafeIcon icon={FiAlertCircle} className="w-4 h-4" />
                    <span className="text-sm">Invalid API key or connection failed</span>
                  </div>
                )}

                <div className="mt-2 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <SafeIcon icon={FiInfo} className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Required for AI-generated narratives and choices.</p>
                      <p>Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">OpenAI Platform</a></p>
                      <p className="mt-1 text-xs">Make sure to copy the complete key including "sk-proj-" prefix</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ElevenLabs API Key */}
              <div>
                <label className="block text-slate-300 mb-2 font-medium">
                  ElevenLabs API Key (For Voice Narration)
                </label>
                <div className="relative">
                  <input
                    type={showElevenLabsKey ? 'text' : 'password'}
                    value={localSettings.elevenlabsApiKey}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, elevenlabsApiKey: e.target.value }))}
                    placeholder="Enter ElevenLabs API key for high-quality voice narration..."
                    className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all pr-20"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                    <button
                      type="button"
                      onClick={testElevenLabsVoice}
                      disabled={!localSettings.elevenlabsApiKey || testingVoice}
                      className="text-slate-400 hover:text-amber-400 disabled:opacity-50"
                      title="Test Voice"
                    >
                      {testingVoice ? '🔄' : '🔊'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowElevenLabsKey(!showElevenLabsKey)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {showElevenLabsKey ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {saveStatus === 'voice-tested' && (
                  <div className="flex items-center gap-2 mt-2 text-green-400">
                    <SafeIcon icon={FiCheck} className="w-4 h-4" />
                    <span className="text-sm">Voice test successful!</span>
                  </div>
                )}

                <div className="mt-2 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <SafeIcon icon={FiInfo} className="w-4 h-4 text-purple-400 mt-0.5" />
                    <div className="text-sm text-purple-300">
                      <p className="font-medium mb-1">Optional: For high-quality voice narration of game stories.</p>
                      <p>Get your key from <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">ElevenLabs</a> • Free tier available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Settings */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-amber-400 flex items-center gap-3">
                <SafeIcon icon={FiVolume2} />
                Voice Settings
              </h2>

              {/* Speech Enabled */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Enable Voice Narration</label>
                  <p className="text-slate-400 text-sm">Automatically narrate game stories with AI voice</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLocalSettings(prev => ({ ...prev, speechEnabled: !prev.speechEnabled }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    localSettings.speechEnabled ? 'bg-amber-600' : 'bg-slate-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: localSettings.speechEnabled ? 24 : 0 }}
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                  />
                </motion.button>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="block text-slate-300 mb-2 font-medium">
                  Voice Selection (OpenAI Voices)
                </label>
                <select
                  value={localSettings.selectedVoice}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, selectedVoice: e.target.value }))}
                  className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  disabled={!localSettings.speechEnabled}
                >
                  <option value="">Select a voice...</option>
                  {voices.map(voice => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
                <p className="text-slate-400 text-sm mt-2">
                  Note: ElevenLabs API will override voice selection with high-quality synthesis
                </p>
              </div>

              {/* Voice Status */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-slate-300 font-medium mb-2">Voice Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${localSettings.speechEnabled ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                    <span className="text-slate-400">Voice Narration: {localSettings.speechEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${localSettings.elevenlabsApiKey ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                    <span className="text-slate-400">ElevenLabs: {localSettings.elevenlabsApiKey ? 'Configured (High Quality)' : 'Not configured'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${localSettings.selectedVoice ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                    <span className="text-slate-400">OpenAI Voice: {localSettings.selectedVoice || 'Not selected'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Actions */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-amber-400 flex items-center gap-3">
                <SafeIcon icon={FiRefreshCw} />
                Game Actions
              </h2>

              <div className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <SafeIcon icon={FiSave} />
                  Save Settings
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <SafeIcon icon={FiRefreshCw} />
                  Reset Game
                </motion.button>
              </div>

              {/* Save Status */}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-green-400">
                  <SafeIcon icon={FiCheck} className="w-4 h-4" />
                  <span className="text-sm">Settings saved successfully!</span>
                </div>
              )}

              {saveStatus === 'reset' && (
                <div className="flex items-center gap-2 text-amber-400">
                  <SafeIcon icon={FiCheck} className="w-4 h-4" />
                  <span className="text-sm">Game reset successfully!</span>
                </div>
              )}
            </div>

            {/* Current Game Info */}
            {state.gameStarted && (
              <div className="bg-slate-700/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">Current Game</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Detective:</span>
                    <span className="text-white ml-2">{state.detectiveName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Element:</span>
                    <span className="text-white ml-2">{state.supernaturalElement}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Location:</span>
                    <span className="text-white ml-2">{state.primaryLocation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Progress:</span>
                    <span className="text-white ml-2">{state.currentScore}/{state.maxScore}</span>
                  </div>
                </div>
              </div>
            )}

            {/* API Key Requirements Warning */}
            {!localSettings.openaiApiKey && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-medium mb-1">API Key Required</h4>
                    <p className="text-red-300 text-sm mb-2">
                      You need to provide an OpenAI API key to play the game. The game uses AI to generate dynamic storylines and choices.
                    </p>
                    <div className="text-xs text-red-200 space-y-1">
                      <p>• Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline">OpenAI Platform</a></p>
                      <p>• Create a new API key</p>
                      <p>• Copy the complete key (starts with "sk-proj-")</p>
                      <p>• Paste it in the field above</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;