import React, { createContext, useContext, useReducer, useEffect } from 'react';

const GameContext = createContext();

const initialState = {
  // Game Setup
  detectiveName: '',
  supernaturalElement: '',
  primaryLocation: '',
  mainObjective: '',

  // Game State
  gameStarted: false,
  currentScore: 0,
  maxScore: 8,
  gameStatus: 'playing', // playing, won, lost

  // Current Turn
  currentNarrative: '',
  currentChoices: [],
  currentImage: null, // New: store current scene image
  turnNumber: 0,

  // Game History
  history: [],
  clues: [],
  inventory: [],

  // Settings
  openaiApiKey: '',
  elevenlabsApiKey: '',
  selectedVoice: 'alloy',
  speechEnabled: false,

  // AI State
  isGenerating: false,
  isGeneratingImage: false, // New: track image generation
  lastResponse: null,

  // Ending State
  gameEnding: null,
  endingImage: null, // New: store ending image
  isGeneratingEnding: false
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'LOAD_SETTINGS':
      return { ...state, ...action.payload };

    case 'SET_GAME_SETUP':
      return {
        ...state,
        detectiveName: action.payload.detectiveName,
        supernaturalElement: action.payload.supernaturalElement,
        primaryLocation: action.payload.primaryLocation,
        mainObjective: action.payload.mainObjective
      };

    case 'START_GAME':
      return {
        ...state,
        gameStarted: true,
        currentScore: 0,
        gameStatus: 'playing',
        turnNumber: 1,
        history: [],
        clues: [],
        inventory: [],
        currentNarrative: '',
        currentChoices: [],
        currentImage: null,
        gameEnding: null,
        endingImage: null,
        isGeneratingEnding: false
      };

    case 'SET_CURRENT_TURN':
      return {
        ...state,
        currentNarrative: action.payload.narrative,
        currentChoices: action.payload.choices,
        currentImage: action.payload.imageUrl || null,
        isGenerating: false,
        isGeneratingImage: false
      };

    case 'SET_GENERATING_IMAGE':
      return {
        ...state,
        isGeneratingImage: action.payload
      };

    case 'MAKE_CHOICE':
      const choice = action.payload;
      const newScore = Math.max(0, Math.min(state.maxScore, state.currentScore + choice.points));
      const newStatus = newScore >= state.maxScore ? 'won' : newScore <= 0 ? 'lost' : 'playing';

      return {
        ...state,
        currentScore: newScore,
        gameStatus: newStatus,
        turnNumber: state.turnNumber + 1,
        history: [
          ...state.history,
          {
            turn: state.turnNumber,
            narrative: state.currentNarrative,
            image: state.currentImage,
            choice: choice,
            result: choice.result,
            scoreChange: choice.points,
            newScore: newScore,
            timestamp: new Date().toISOString()
          }
        ]
      };

    case 'ADD_CLUE':
      return {
        ...state,
        clues: [...state.clues, action.payload]
      };

    case 'ADD_INVENTORY_ITEM':
      return {
        ...state,
        inventory: [...state.inventory, action.payload]
      };

    case 'SET_SETTINGS':
      const newSettings = { ...state, ...action.payload };
      // Save to localStorage
      localStorage.setItem('gameSettings', JSON.stringify({
        openaiApiKey: newSettings.openaiApiKey,
        elevenlabsApiKey: newSettings.elevenlabsApiKey,
        selectedVoice: newSettings.selectedVoice,
        speechEnabled: newSettings.speechEnabled
      }));
      return newSettings;

    case 'SET_GENERATING':
      return {
        ...state,
        isGenerating: action.payload
      };

    case 'SET_GENERATING_ENDING':
      return {
        ...state,
        isGeneratingEnding: action.payload
      };

    case 'SET_GAME_ENDING':
      return {
        ...state,
        gameEnding: action.payload.text || action.payload,
        endingImage: action.payload.imageUrl || null,
        isGeneratingEnding: false
      };

    case 'RESET_GAME':
      return {
        ...initialState,
        openaiApiKey: state.openaiApiKey,
        elevenlabsApiKey: state.elevenlabsApiKey,
        selectedVoice: state.selectedVoice,
        speechEnabled: state.speechEnabled
      };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load settings on initialization
  useEffect(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: 'LOAD_SETTINGS', payload: settings });
      } catch (error) {
        console.error('Failed to load saved settings:', error);
      }
    }
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}