import { useState, useCallback, useRef } from 'react';
import { generateSpeech, playAudio } from '../services/aiService';
import { useGame } from '../contexts/GameContext';

export function useSpeech() {
  const { state } = useGame();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const currentAudioRef = useRef(null);
  
  // Rate limiting state
  const lastRequestRef = useRef(0);
  const requestCountRef = useRef(0);
  const rateLimitWindowRef = useRef(60000); // 1 minute window

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
    setIsGenerating(false);
  }, []);

  // Rate limiting check
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const windowStart = now - rateLimitWindowRef.current;
    
    // Reset counter if outside window
    if (lastRequestRef.current < windowStart) {
      requestCountRef.current = 0;
    }
    
    // Check if we're under the limit
    const maxRequests = state.elevenlabsApiKey ? 20 : 10;
    
    if (requestCountRef.current >= maxRequests) {
      const waitTime = rateLimitWindowRef.current - (now - lastRequestRef.current);
      throw new Error(`Rate limit reached. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }
    
    return true;
  }, [state.elevenlabsApiKey]);

  // Enhanced speak function with rate limiting and smart retry
  const speak = useCallback((text) => {
    if (!state.speechEnabled || !text) {
      return Promise.resolve();
    }

    // Clean text for better speech synthesis
    const cleanText = text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (cleanText.length === 0) {
      return Promise.resolve();
    }

    const performSpeechSynthesis = async () => {
      try {
        setError(null);
        
        // Check rate limit before making request
        checkRateLimit();
        
        setIsGenerating(true);
        console.log('Generating speech for:', cleanText.substring(0, 50) + '...');

        // Update rate limiting counters
        const now = Date.now();
        lastRequestRef.current = now;
        requestCountRef.current += 1;

        const audioData = await generateSpeech(
          cleanText,
          state.selectedVoice,
          state.elevenlabsApiKey
        );

        setIsGenerating(false);
        setIsPlaying(true);

        // Create audio element and store reference
        const audio = new Audio(audioData.url);
        currentAudioRef.current = audio;

        return new Promise((resolve, reject) => {
          const handleEnded = () => {
            setIsPlaying(false);
            if (audioData.cleanup) {
              audioData.cleanup();
            }
            currentAudioRef.current = null;
            console.log('Speech completed for:', cleanText.substring(0, 50) + '...');
            resolve();
          };

          const handleError = (e) => {
            console.error('Audio playback error:', e);
            setError('Audio playback failed');
            setIsPlaying(false);
            setIsGenerating(false);
            if (audioData.cleanup) {
              audioData.cleanup();
            }
            currentAudioRef.current = null;
            reject(new Error('Audio playback failed'));
          };

          const handleCanPlayThrough = () => {
            audio.play().catch(playError => {
              console.error('Failed to start audio playback:', playError);
              handleError(playError);
            });
          };

          audio.addEventListener('ended', handleEnded);
          audio.addEventListener('error', handleError);
          audio.addEventListener('canplaythrough', handleCanPlayThrough, { once: true });

          audio.volume = 0.8;
          audio.preload = 'auto';
          audio.load();

          console.log('Started playing speech for:', cleanText.substring(0, 50) + '...');
        });

      } catch (err) {
        console.error('Speech synthesis error:', err);
        
        // Enhanced error handling with user-friendly messages
        let userFriendlyError = err.message;
        
        if (err.message.includes('rate limit') || err.message.includes('429')) {
          userFriendlyError = 'Voice service is busy. Please wait a moment and try again.';
          requestCountRef.current = Math.max(0, requestCountRef.current - 1);
        } else if (err.message.includes('quota') || err.message.includes('402')) {
          userFriendlyError = 'Voice service quota exceeded. Please check your API settings.';
        } else if (err.message.includes('invalid') || err.message.includes('401')) {
          userFriendlyError = 'Voice service authentication failed. Please check your API key.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          userFriendlyError = 'Network error. Please check your connection and try again.';
        }
        
        setError(userFriendlyError);
        setIsGenerating(false);
        setIsPlaying(false);
        throw new Error(userFriendlyError);
      }
    };

    return performSpeechSynthesis();
  }, [state.speechEnabled, state.selectedVoice, state.elevenlabsApiKey, checkRateLimit]);

  const speakNarrative = useCallback((narrative) => {
    if (state.speechEnabled && narrative) {
      return speak(narrative);
    }
    return Promise.resolve();
  }, [speak, state.speechEnabled]);

  const forceStop = useCallback(() => {
    stopAudio();
    setError(null);
  }, [stopAudio]);

  return {
    speak,
    speakNarrative,
    stopAudio: forceStop,
    isPlaying,
    isGenerating,
    error,
    isEnabled: state.speechEnabled && (state.elevenlabsApiKey || state.openaiApiKey),
    isBusy: isPlaying || isGenerating
  };
}