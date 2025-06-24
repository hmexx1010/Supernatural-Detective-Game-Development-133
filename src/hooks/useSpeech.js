import { useState, useCallback, useRef } from 'react';
import { generateSpeech, playAudio } from '../services/aiService';
import { useGame } from '../contexts/GameContext';

export function useSpeech() {
  const { state } = useGame();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const currentAudioRef = useRef(null);
  const speechQueueRef = useRef([]);
  const isProcessingRef = useRef(false);
  const lastSpokenTextRef = useRef(''); // Track last spoken text

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
    setIsGenerating(false);
    // Clear any queued speech
    speechQueueRef.current = [];
    isProcessingRef.current = false;
  }, []);

  const speak = useCallback(async (text) => {
    if (!state.speechEnabled || !text) {
      return;
    }

    // Prevent speaking the same text twice in a row
    if (text === lastSpokenTextRef.current && isProcessingRef.current) {
      return;
    }

    // Prevent duplicate requests for the same text in queue
    if (speechQueueRef.current.includes(text)) {
      return;
    }

    // If already processing, queue the request
    if (isProcessingRef.current) {
      speechQueueRef.current.push(text);
      return;
    }

    // Mark as processing to prevent overlapping requests
    isProcessingRef.current = true;
    lastSpokenTextRef.current = text;

    // Stop any currently playing audio
    stopAudio();
    setError(null);
    setIsGenerating(true);

    try {
      const audioData = await generateSpeech(
        text,
        state.selectedVoice,
        state.elevenlabsApiKey
      );

      setIsGenerating(false);
      setIsPlaying(true);

      // Create audio element and store reference
      const audio = new Audio(audioData.url);
      currentAudioRef.current = audio;

      // Set up event listeners
      const handleEnded = () => {
        setIsPlaying(false);
        if (audioData.cleanup) {
          audioData.cleanup();
        }
        currentAudioRef.current = null;
        isProcessingRef.current = false;

        // Process next item in queue if any
        if (speechQueueRef.current.length > 0) {
          const nextText = speechQueueRef.current.shift();
          // Only process if it's different from what we just spoke
          if (nextText !== lastSpokenTextRef.current) {
            setTimeout(() => speak(nextText), 200); // Small delay between speeches
          } else {
            isProcessingRef.current = false;
          }
        }
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
        isProcessingRef.current = false;
      };

      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      // Configure audio settings
      audio.volume = 0.8;
      audio.preload = 'auto';

      // Wait for audio to be ready before playing
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject, { once: true });
        audio.load();
      });

      await audio.play();

    } catch (err) {
      console.error('Speech synthesis error:', err);
      setError(err.message);
      setIsGenerating(false);
      setIsPlaying(false);
      isProcessingRef.current = false;
    }
  }, [state.speechEnabled, state.selectedVoice, state.elevenlabsApiKey, stopAudio]);

  const speakNarrative = useCallback((narrative) => {
    if (state.speechEnabled && narrative) {
      speak(narrative);
    }
  }, [speak, state.speechEnabled]);

  // Enhanced stop function that clears everything
  const forceStop = useCallback(() => {
    stopAudio();
    speechQueueRef.current = [];
    isProcessingRef.current = false;
    lastSpokenTextRef.current = ''; // Clear last spoken text
  }, [stopAudio]);

  return {
    speak,
    speakNarrative,
    stopAudio: forceStop,
    isPlaying,
    isGenerating,
    error,
    isEnabled: state.speechEnabled && (state.elevenlabsApiKey || state.openaiApiKey),
    isBusy: isProcessingRef.current || isPlaying || isGenerating
  };
}