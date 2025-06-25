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
  currentImage: null,
  turnNumber: 0,

  // Game History - Enhanced for story continuity
  history: [],
  storyContext: '', // Cumulative story context
  narrativeFlow: [], // Track narrative progression
  clues: [],
  inventory: [],

  // Settings
  openaiApiKey: '',
  elevenlabsApiKey: '',
  selectedVoice: 'alloy',
  speechEnabled: false,

  // AI State
  isGenerating: false,
  isGeneratingImage: false,
  lastResponse: null,

  // Ending State
  gameEnding: null,
  endingImage: null,
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
        storyContext: '',
        narrativeFlow: [],
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
      console.log('SET_CURRENT_TURN payload:', action.payload);
      
      // Build narrative flow for story continuity
      const newNarrativeFlow = [
        ...state.narrativeFlow,
        {
          turn: state.turnNumber,
          narrative: action.payload.narrative,
          timestamp: new Date().toISOString()
        }
      ];

      return {
        ...state,
        currentNarrative: action.payload.narrative,
        currentChoices: action.payload.choices,
        currentImage: action.payload.imageUrl || null,
        narrativeFlow: newNarrativeFlow,
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

      // Enhanced history entry with story context
      const historyEntry = {
        turn: state.turnNumber,
        narrative: state.currentNarrative,
        image: state.currentImage,
        choice: choice,
        result: choice.result,
        scoreChange: choice.points,
        newScore: newScore,
        timestamp: new Date().toISOString(),
        // Add story context for continuity
        cumulativeContext: buildCumulativeContext(state.history, choice),
        gameState: {
          detectiveName: state.detectiveName,
          supernaturalElement: state.supernaturalElement,
          primaryLocation: state.primaryLocation,
          mainObjective: state.mainObjective
        }
      };

      // Update story context for future reference
      const updatedStoryContext = updateStoryContext(state.storyContext, historyEntry);

      return {
        ...state,
        currentScore: newScore,
        gameStatus: newStatus,
        turnNumber: state.turnNumber + 1,
        storyContext: updatedStoryContext,
        history: [...state.history, historyEntry]
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
      console.log('SET_GAME_ENDING payload:', action.payload);
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

// Build cumulative context for story continuity
function buildCumulativeContext(history, currentChoice) {
  const context = {
    totalChoices: history.length + 1,
    recentChoices: history.slice(-2).map(h => ({
      choice: h.choice.text,
      result: h.result,
      impact: h.scoreChange
    })),
    currentChoice: {
      choice: currentChoice.text,
      result: currentChoice.result,
      impact: currentChoice.points
    },
    significantEvents: history.filter(h => Math.abs(h.scoreChange) >= 2),
    trendAnalysis: analyzeTrend(history, currentChoice)
  };

  return context;
}

// Analyze choice trend for story momentum
function analyzeTrend(history, currentChoice) {
  const recentChoices = [...history.slice(-3), { scoreChange: currentChoice.points }];
  const trendScore = recentChoices.reduce((sum, choice) => sum + choice.scoreChange, 0);
  
  if (trendScore >= 4) {
    return 'strongly_positive';
  } else if (trendScore >= 2) {
    return 'positive';
  } else if (trendScore >= -1) {
    return 'neutral';
  } else if (trendScore >= -3) {
    return 'negative';
  } else {
    return 'strongly_negative';
  }
}

// Update cumulative story context
function updateStoryContext(currentContext, newEntry) {
  const contextElements = [];
  
  // Add basic info
  contextElements.push(`Turn ${newEntry.turn}: ${newEntry.choice.text} → ${newEntry.result}`);
  
  // Add score impact
  const impactText = getScoreImpactDescription(newEntry.scoreChange);
  contextElements.push(`Impact: ${impactText} (Score: ${newEntry.newScore})`);
  
  // Add trend information
  contextElements.push(`Trend: ${newEntry.cumulativeContext.trendAnalysis}`);
  
  return currentContext + '\n' + contextElements.join('\n') + '\n';
}

// Get descriptive text for score impact
function getScoreImpactDescription(scoreChange) {
  switch (scoreChange) {
    case 2: return 'Major breakthrough - supernatural advantage gained';
    case 1: return 'Positive progress - investigation advancing well';
    case 0: return 'Neutral outcome - situation stable';
    case -1: return 'Minor setback - supernatural pressure increased';
    case -2: return 'Serious mistake - supernatural forces strengthened';
    default: return 'Unknown impact';
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

  // Enhanced context value with story continuity helpers
  const contextValue = {
    state,
    dispatch,
    // Helper functions for story continuity
    getStoryMomentum: () => {
      if (state.history.length === 0) return 'neutral';
      const recentChoices = state.history.slice(-3);
      const momentum = recentChoices.reduce((sum, choice) => sum + choice.scoreChange, 0);
      
      if (momentum >= 3) return 'very_positive';
      if (momentum >= 1) return 'positive';
      if (momentum <= -3) return 'very_negative';
      if (momentum <= -1) return 'negative';
      return 'neutral';
    },
    getLastSignificantEvent: () => {
      const significantEvents = state.history.filter(h => Math.abs(h.scoreChange) >= 2);
      return significantEvents.length > 0 ? significantEvents[significantEvents.length - 1] : null;
    },
    getStoryThemes: () => {
      // Analyze recurring themes in choices and outcomes
      const themes = [];
      const choices = state.history.map(h => h.choice.text.toLowerCase());
      
      if (choices.some(c => c.includes('investigate') || c.includes('examine'))) {
        themes.push('thorough_investigation');
      }
      if (choices.some(c => c.includes('confront') || c.includes('attack'))) {
        themes.push('direct_action');
      }
      if (choices.some(c => c.includes('avoid') || c.includes('retreat'))) {
        themes.push('cautious_approach');
      }
      if (choices.some(c => c.includes('help') || c.includes('save'))) {
        themes.push('protective_instinct');
      }
      
      return themes;
    }
  };

  return (
    <GameContext.Provider value={contextValue}>
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