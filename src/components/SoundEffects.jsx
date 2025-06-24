import React, { useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';

const SoundEffects = ({ enabled = true, volume = 0.3 }) => {
  const soundsRef = useRef({});

  useEffect(() => {
    if (!enabled) return;

    // Sound effect definitions with data URLs for small sounds
    const sounds = {
      hover: {
        src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiKz/DRfzAIJHfE7NCITAcWaLPp5KdWEAqf2/G8diAGInbAf8+ETQkQY7zg5J1OEAo+ltryxnkqBSl+zPLaizsIGGS57OObUQwLToTY79eHOwgWZLfn6q9YEQhGnuH0wmEcBDWKz/LNeSsFJH7H8N+QQAoXYrTp66hWEAlGnt/0w2IdBDWKzfLNeSsFJH7K7N6PQgkSYrPq7KlXEQhGnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWK'],
        volume: 0.1,
        rate: 1.5
      },
      click: {
        src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiKz/DRfzAIJHfE7NCITAcWaLPp5KdWEAqf2/G8diAGInbAf8+ETQkQY7zg5J1OEAo+ltryxnkqBSl+zPLaizsIGGS57OObUQwLToTY79eHOwgWZLfn6q9YEQhGnuH0wmEcBDWKz/LNeSsFJH7H8N+QQAoXYrTp66hWEAlGnt/0w2IdBDWKzfLNeSsFJH7K7N6PQgkSYrPq7KlXEQhGnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWK'],
        volume: 0.2,
        rate: 2.0
      },
      success: {
        src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiKz/DRfzAIJHfE7NCITAcWaLPp5KdWEAqf2/G8diAGInbAf8+ETQkQY7zg5J1OEAo+ltryxnkqBSl+zPLaizsIGGS57OObUQwLToTY79eHOwgWZLfn6q9YEQhGnuH0wmEcBDWKz/LNeSsFJH7H8N+QQAoXYrTp66hWEAlGnt/0w2IdBDWKzfLNeSsFJH7K7N6PQgkSYrPq7KlXEQhGnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWK'],
        volume: 0.3,
        rate: 1.2
      },
      error: {
        src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBjiKz/DRfzAIJHfE7NCITAcWaLPp5KdWEAqf2/G8diAGInbAf8+ETQkQY7zg5J1OEAo+ltryxnkqBSl+zPLaizsIGGS57OObUQwLToTY79eHOwgWZLfn6q9YEQhGnuH0wmEcBDWKz/LNeSsFJH7H8N+QQAoXYrTp66hWEAlGnt/0w2IdBDWKzfLNeSsFJH7K7N6PQgkSYrPq7KlXEQhGnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWKzfLOeSsFJH7K7N6PQgkSYbPq7KlXEQhFnuD0w2IdBDWK'],
        volume: 0.25,
        rate: 0.8
      }
    };

    // Initialize all sounds
    Object.entries(sounds).forEach(([key, config]) => {
      try {
        soundsRef.current[key] = new Howl({
          src: config.src,
          volume: config.volume * volume,
          rate: config.rate,
          preload: true
        });
      } catch (error) {
        console.warn(`Failed to load sound effect: ${key}`, error);
      }
    });

    // Set global volume
    Howler.volume(volume);

    return () => {
      // Cleanup all sounds
      Object.values(soundsRef.current).forEach(sound => {
        if (sound && typeof sound.unload === 'function') {
          sound.unload();
        }
      });
    };
  }, [enabled, volume]);

  // Expose play function to parent components
  const playSound = (soundName) => {
    if (!enabled || !soundsRef.current[soundName]) return;
    
    try {
      soundsRef.current[soundName].play();
    } catch (error) {
      console.warn(`Failed to play sound: ${soundName}`, error);
    }
  };

  // Attach to window for global access
  useEffect(() => {
    window.playSound = playSound;
    return () => {
      delete window.playSound;
    };
  }, [playSound]);

  return null; // This component doesn't render anything
};

export default SoundEffects;