import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Languages } from 'lucide-react';

interface SignLanguageInterpreterProps {
  message: string;
  language: 'ASL' | 'BSL' | 'ISL';
  isActive: boolean;
}

// Real ASL hand positions for letters (simplified but more accurate)
const ASL_POSITIONS = {
  'a': { leftHand: '✊', rightHand: '✊', description: 'Closed fist with thumb on side' },
  'b': { leftHand: '🖐️', rightHand: '🖐️', description: 'Open hand, fingers together, thumb across palm' },
  'c': { leftHand: '🤏', rightHand: '🤏', description: 'Curved hand like holding a cup' },
  'd': { leftHand: '👆', rightHand: '👆', description: 'Index finger up, other fingers down' },
  'e': { leftHand: '✊', rightHand: '✊', description: 'Fingers bent down touching thumb' },
  'f': { leftHand: '👌', rightHand: '👌', description: 'Index and thumb touching, others up' },
  'g': { leftHand: '👉', rightHand: '👉', description: 'Index finger pointing sideways' },
  'h': { leftHand: '✌️', rightHand: '✌️', description: 'Index and middle finger sideways' },
  'i': { leftHand: '🤙', rightHand: '🤙', description: 'Pinky finger up' },
  'j': { leftHand: '🤙', rightHand: '🤙', description: 'Pinky finger drawing J' },
  'k': { leftHand: '✌️', rightHand: '✌️', description: 'Index up, middle out, thumb between' },
  'l': { leftHand: '🤟', rightHand: '🤟', description: 'Index and thumb forming L' },
  'm': { leftHand: '✊', rightHand: '✊', description: 'Thumb under three fingers' },
  'n': { leftHand: '✊', rightHand: '✊', description: 'Thumb under two fingers' },
  'o': { leftHand: '👌', rightHand: '👌', description: 'All fingers curved touching thumb' },
  'p': { leftHand: '👇', rightHand: '👇', description: 'Index down, middle out' },
  'q': { leftHand: '👇', rightHand: '👇', description: 'Index and thumb down' },
  'r': { leftHand: '🤞', rightHand: '🤞', description: 'Index and middle crossed' },
  's': { leftHand: '✊', rightHand: '✊', description: 'Fist with thumb over fingers' },
  't': { leftHand: '✊', rightHand: '✊', description: 'Thumb between index and middle' },
  'u': { leftHand: '✌️', rightHand: '✌️', description: 'Index and middle up together' },
  'v': { leftHand: '✌️', rightHand: '✌️', description: 'Index and middle up apart' },
  'w': { leftHand: '🖖', rightHand: '🖖', description: 'Index, middle, ring up' },
  'x': { leftHand: '☝️', rightHand: '☝️', description: 'Index finger bent' },
  'y': { leftHand: '🤙', rightHand: '🤙', description: 'Thumb and pinky out' },
  'z': { leftHand: '☝️', rightHand: '☝️', description: 'Index finger drawing Z' },
  ' ': { leftHand: '✋', rightHand: '✋', description: 'Pause - hands open' }
};

export default function SignLanguageInterpreter({ message, language, isActive }: SignLanguageInterpreterProps) {
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [isSigningActive, setIsSigningActive] = useState(false);

  useEffect(() => {
    if (message && isActive) {
      setIsSigningActive(true);
      setCurrentLetterIndex(0);
      
      const interval = setInterval(() => {
        setCurrentLetterIndex(prev => {
          if (prev >= message.length - 1) {
            setIsSigningActive(false);
            clearInterval(interval);
            return 0;
          }
          return prev + 1;
        });
      }, 800); // Slower pace for better visibility

      return () => clearInterval(interval);
    } else {
      setIsSigningActive(false);
    }
  }, [message, isActive]);

  const currentLetter = message ? message[currentLetterIndex]?.toLowerCase() : '';
  const currentSign = ASL_POSITIONS[currentLetter as keyof typeof ASL_POSITIONS] || ASL_POSITIONS[' '];

  const getLanguageColor = () => {
    switch (language) {
      case 'ASL': return 'from-blue-400 to-blue-600';
      case 'BSL': return 'from-green-400 to-green-600';
      case 'ISL': return 'from-orange-400 to-orange-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 w-64 shadow-lg border border-gray-200">
      <div className="flex items-center space-x-2 mb-3">
        <Languages className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{language} Interpreter</span>
        {isSigningActive && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-600">Live</span>
          </div>
        )}
      </div>
      
      <div className="relative h-32 flex items-center justify-center bg-gray-50 rounded-lg mb-3">
        {/* Real hand emoji display */}
        <div className="flex items-center space-x-4">
          <motion.div
            className="text-4xl"
            animate={{
              scale: isSigningActive ? [1, 1.1, 1] : 1,
              rotate: isSigningActive ? [0, -5, 5, 0] : 0,
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut"
            }}
          >
            {currentSign.leftHand}
          </motion.div>
          
          <motion.div
            className="text-4xl"
            animate={{
              scale: isSigningActive ? [1, 1.1, 1] : 1,
              rotate: isSigningActive ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
              delay: 0.1
            }}
          >
            {currentSign.rightHand}
          </motion.div>
        </div>
        
        {/* Letter being signed */}
        {isSigningActive && currentLetter !== ' ' && (
          <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded font-bold">
            {currentLetter.toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Current word progress */}
      {message && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Signing:</div>
          <div className="text-sm font-mono bg-gray-100 p-2 rounded">
            {message.split('').map((letter, index) => (
              <span
                key={index}
                className={`${
                  index === currentLetterIndex && isSigningActive
                    ? 'bg-primary-200 text-primary-800'
                    : index < currentLetterIndex
                    ? 'text-green-600'
                    : 'text-gray-400'
                } px-0.5`}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Sign description */}
      <div className="text-xs text-gray-600 text-center">
        {isSigningActive ? (
          <div>
            <div className="font-medium">{currentLetter.toUpperCase()}</div>
            <div>{currentSign.description}</div>
          </div>
        ) : (
          'Ready to interpret'
        )}
      </div>
      
      {/* Progress indicator */}
      {message && isSigningActive && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-primary-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentLetterIndex + 1) / message.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}