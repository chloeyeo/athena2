import { useState, useRef, useCallback } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface UseTextToSpeechReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  error: string | null;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useAccessibility();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(async (text: string) => {
    try {
      setError(null);
      
      // Check if speech synthesis is supported
      if (!('speechSynthesis' in window)) {
        throw new Error('Speech synthesis not supported in this browser');
      }
      
      // Stop any current speech
      speechSynthesis.cancel();
      
      // Wait for voices to load if they haven't already
      let voices = speechSynthesis.getVoices();
      if (voices.length === 0) {
        await new Promise<void>((resolve) => {
          const checkVoices = () => {
            voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
              resolve();
            } else {
              setTimeout(checkVoices, 100);
            }
          };
          checkVoices();
        });
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Configure voice settings
      utterance.rate = Math.max(0.1, Math.min(10, settings.voiceSpeed));
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Try to use a female voice
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('susan') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel') ||
        (voice.gender && voice.gender.toLowerCase() === 'female')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      } else {
        // Fallback to any English voice
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en')
        );
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('Speech started');
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('Speech ended');
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setError(`Speech error: ${event.error}`);
        setIsSpeaking(false);
      };

      console.log('Starting speech synthesis with voice:', utterance.voice?.name || 'default');
      speechSynthesis.speak(utterance);
      
    } catch (err) {
      console.error('Error in text-to-speech:', err);
      setError(err instanceof Error ? err.message : 'Text-to-speech failed');
      setIsSpeaking(false);
    }
  }, [settings.voiceSpeed]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    error
  };
}