import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages } from 'lucide-react';

interface SignLanguageInterpreterProps {
  message: string;
  language: 'ASL' | 'BSL' | 'ISL';
  isActive: boolean;
}

// Real ASL hand positions with more accurate representations
const ASL_HAND_SHAPES = {
  'a': { 
    leftHand: '✊🏽', 
    rightHand: '✊🏽', 
    description: 'Closed fist with thumb alongside',
    position: { left: { x: -20, y: 0, rotate: 0 }, right: { x: 20, y: 0, rotate: 0 } }
  },
  'b': { 
    leftHand: '🖐🏽', 
    rightHand: '🖐🏽', 
    description: 'Flat hand, fingers together, thumb across palm',
    position: { left: { x: -25, y: -5, rotate: -10 }, right: { x: 25, y: -5, rotate: 10 } }
  },
  'c': { 
    leftHand: '🤏🏽', 
    rightHand: '🤏🏽', 
    description: 'Curved hand forming C shape',
    position: { left: { x: -30, y: 0, rotate: 15 }, right: { x: 30, y: 0, rotate: -15 } }
  },
  'd': { 
    leftHand: '👆🏽', 
    rightHand: '👆🏽', 
    description: 'Index finger pointing up',
    position: { left: { x: -20, y: -10, rotate: 0 }, right: { x: 20, y: -10, rotate: 0 } }
  },
  'e': { 
    leftHand: '✊🏽', 
    rightHand: '✊🏽', 
    description: 'Fingers bent touching thumb',
    position: { left: { x: -25, y: 5, rotate: -5 }, right: { x: 25, y: 5, rotate: 5 } }
  },
  'f': { 
    leftHand: '👌🏽', 
    rightHand: '👌🏽', 
    description: 'Index and thumb touching, others extended',
    position: { left: { x: -20, y: -5, rotate: 10 }, right: { x: 20, y: -5, rotate: -10 } }
  },
  'g': { 
    leftHand: '👉🏽', 
    rightHand: '👉🏽', 
    description: 'Index finger pointing sideways',
    position: { left: { x: -30, y: 0, rotate: 0 }, right: { x: 30, y: 0, rotate: 0 } }
  },
  'h': { 
    leftHand: '✌🏽', 
    rightHand: '✌🏽', 
    description: 'Index and middle finger extended sideways',
    position: { left: { x: -25, y: 0, rotate: -15 }, right: { x: 25, y: 0, rotate: 15 } }
  },
  'i': { 
    leftHand: '🤙🏽', 
    rightHand: '🤙🏽', 
    description: 'Pinky finger extended',
    position: { left: { x: -20, y: -5, rotate: 20 }, right: { x: 20, y: -5, rotate: -20 } }
  },
  'j': { 
    leftHand: '🤙🏽', 
    rightHand: '🤙🏽', 
    description: 'Pinky finger drawing J motion',
    position: { left: { x: -25, y: 0, rotate: 25 }, right: { x: 25, y: 0, rotate: -25 } }
  },
  'k': { 
    leftHand: '✌🏽', 
    rightHand: '✌🏽', 
    description: 'Index up, middle out, thumb between',
    position: { left: { x: -20, y: -10, rotate: 10 }, right: { x: 20, y: -10, rotate: -10 } }
  },
  'l': { 
    leftHand: '🤟🏽', 
    rightHand: '🤟🏽', 
    description: 'Index and thumb forming L',
    position: { left: { x: -25, y: -5, rotate: 0 }, right: { x: 25, y: -5, rotate: 0 } }
  },
  'm': { 
    leftHand: '✊🏽', 
    rightHand: '✊🏽', 
    description: 'Thumb under three fingers',
    position: { left: { x: -20, y: 5, rotate: -10 }, right: { x: 20, y: 5, rotate: 10 } }
  },
  'n': { 
    leftHand: '✊🏽', 
    rightHand: '✊🏽', 
    description: 'Thumb under two fingers',
    position: { left: { x: -20, y: 5, rotate: -5 }, right: { x: 20, y: 5, rotate: 5 } }
  },
  'o': { 
    leftHand: '👌🏽', 
    rightHand: '👌🏽', 
    description: 'All fingertips touching thumb',
    position: { left: { x: -25, y: 0, rotate: 15 }, right: { x: 25, y: 0, rotate: -15 } }
  },
  'p': { 
    leftHand: '👇🏽', 
    rightHand: '👇🏽', 
    description: 'Index pointing down, middle extended',
    position: { left: { x: -20, y: 10, rotate: 0 }, right: { x: 20, y: 10, rotate: 0 } }
  },
  'q': { 
    leftHand: '👇🏽', 
    rightHand: '👇🏽', 
    description: 'Index and thumb pointing down',
    position: { left: { x: -25, y: 10, rotate: -10 }, right: { x: 25, y: 10, rotate: 10 } }
  },
  'r': { 
    leftHand: '🤞🏽', 
    rightHand: '🤞🏽', 
    description: 'Index and middle fingers crossed',
    position: { left: { x: -20, y: -5, rotate: 5 }, right: { x: 20, y: -5, rotate: -5 } }
  },
  's': { 
    leftHand: '✊🏽', 
    rightHand: '✊🏽', 
    description: 'Fist with thumb over fingers',
    position: { left: { x: -20, y: 0, rotate: 0 }, right: { x: 20, y: 0, rotate: 0 } }
  },
  't': { 
    leftHand: '✊🏽', 
    rightHand: '✊🏽', 
    description: 'Thumb between index and middle',
    position: { left: { x: -20, y: 0, rotate: -5 }, right: { x: 20, y: 0, rotate: 5 } }
  },
  'u': { 
    leftHand: '✌🏽', 
    rightHand: '✌🏽', 
    description: 'Index and middle fingers together',
    position: { left: { x: -20, y: -10, rotate: 0 }, right: { x: 20, y: -10, rotate: 0 } }
  },
  'v': { 
    leftHand: '✌🏽', 
    rightHand: '✌🏽', 
    description: 'Index and middle fingers apart',
    position: { left: { x: -25, y: -10, rotate: -10 }, right: { x: 25, y: -10, rotate: 10 } }
  },
  'w': { 
    leftHand: '🖖🏽', 
    rightHand: '🖖🏽', 
    description: 'Three fingers extended',
    position: { left: { x: -25, y: -10, rotate: -5 }, right: { x: 25, y: -10, rotate: 5 } }
  },
  'x': { 
    leftHand: '☝🏽', 
    rightHand: '☝🏽', 
    description: 'Index finger bent at knuckle',
    position: { left: { x: -20, y: -5, rotate: 15 }, right: { x: 20, y: -5, rotate: -15 } }
  },
  'y': { 
    leftHand: '🤙🏽', 
    rightHand: '🤙🏽', 
    description: 'Thumb and pinky extended',
    position: { left: { x: -25, y: 0, rotate: 20 }, right: { x: 25, y: 0, rotate: -20 } }
  },
  'z': { 
    leftHand: '☝🏽', 
    rightHand: '☝🏽', 
    description: 'Index finger tracing Z',
    position: { left: { x: -20, y: -5, rotate: 10 }, right: { x: 20, y: -5, rotate: -10 } }
  },
  ' ': { 
    leftHand: '✋🏽', 
    rightHand: '✋🏽', 
    description: 'Pause - hands open',
    position: { left: { x: -30, y: 0, rotate: 0 }, right: { x: 30, y: 0, rotate: 0 } }
  }
};

// Common legal terms in ASL
const LEGAL_SIGNS = {
  'law': {
    leftHand: '📖', rightHand: '✋🏽',
    description: 'Left hand flat, right hand tapping',
    position: { left: { x: -30, y: 0, rotate: 0 }, right: { x: 10, y: -10, rotate: 0 } }
  },
  'court': {
    leftHand: '⚖️', rightHand: '👨🏽‍⚖️',
    description: 'Scales of justice gesture',
    position: { left: { x: -25, y: -5, rotate: 0 }, right: { x: 25, y: -5, rotate: 0 } }
  },
  'contract': {
    leftHand: '📄', rightHand: '✍🏽',
    description: 'Paper and signing motion',
    position: { left: { x: -30, y: 0, rotate: 0 }, right: { x: 20, y: 5, rotate: 0 } }
  },
  'lawyer': {
    leftHand: '👔', rightHand: '🎓',
    description: 'Professional attire and education',
    position: { left: { x: -25, y: 0, rotate: 0 }, right: { x: 25, y: -10, rotate: 0 } }
  }
};

export default function SignLanguageInterpreter({ message, language, isActive }: SignLanguageInterpreterProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [isSigningActive, setIsSigningActive] = useState(false);
  const [currentSign, setCurrentSign] = useState(ASL_HAND_SHAPES[' ']);

  useEffect(() => {
    if (message && isActive) {
      setIsSigningActive(true);
      setCurrentWordIndex(0);
      setCurrentLetterIndex(0);
      
      const words = message.toLowerCase().split(' ');
      let wordIndex = 0;
      let letterIndex = 0;
      
      const signInterval = setInterval(() => {
        if (wordIndex >= words.length) {
          setIsSigningActive(false);
          clearInterval(signInterval);
          return;
        }
        
        const currentWord = words[wordIndex];
        
        // Check if it's a legal term that has a specific sign
        if (letterIndex === 0 && LEGAL_SIGNS[currentWord]) {
          setCurrentSign(LEGAL_SIGNS[currentWord]);
          setCurrentWordIndex(wordIndex);
          setCurrentLetterIndex(0);
          
          // Hold the sign for the whole word
          setTimeout(() => {
            wordIndex++;
            letterIndex = 0;
            
            // Add pause between words
            setCurrentSign(ASL_HAND_SHAPES[' ']);
          }, 1500);
          
          return;
        }
        
        // Finger spell the word
        if (letterIndex < currentWord.length) {
          const letter = currentWord[letterIndex];
          const sign = ASL_HAND_SHAPES[letter as keyof typeof ASL_HAND_SHAPES] || ASL_HAND_SHAPES[' '];
          
          setCurrentSign(sign);
          setCurrentWordIndex(wordIndex);
          setCurrentLetterIndex(letterIndex);
          
          letterIndex++;
        } else {
          // Move to next word with a pause
          setCurrentSign(ASL_HAND_SHAPES[' ']);
          wordIndex++;
          letterIndex = 0;
        }
      }, 800);

      return () => clearInterval(signInterval);
    } else {
      setIsSigningActive(false);
      setCurrentSign(ASL_HAND_SHAPES[' ']);
    }
  }, [message, isActive]);

  const getLanguageColor = () => {
    switch (language) {
      case 'ASL': return 'from-blue-400 to-blue-600';
      case 'BSL': return 'from-green-400 to-green-600';
      case 'ISL': return 'from-orange-400 to-orange-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const words = message ? message.split(' ') : [];
  const currentWord = words[currentWordIndex] || '';

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 w-80 shadow-lg border border-gray-200">
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
      
      {/* Realistic signing area with human-like positioning */}
      <div className="relative h-40 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg mb-3 overflow-hidden">
        {/* Torso silhouette for context */}
        <div className="absolute bottom-0 w-24 h-20 bg-gray-300 rounded-t-full opacity-30"></div>
        
        {/* Head silhouette */}
        <div className="absolute top-2 w-12 h-12 bg-gray-300 rounded-full opacity-30"></div>
        
        {/* Hands with realistic positioning */}
        <div className="relative flex items-center justify-center w-full h-full">
          <motion.div
            className="absolute text-4xl"
            style={{
              left: `calc(50% + ${currentSign.position.left.x}px)`,
              top: `calc(50% + ${currentSign.position.left.y}px)`,
            }}
            animate={{
              x: currentSign.position.left.x,
              y: currentSign.position.left.y,
              rotate: currentSign.position.left.rotate,
              scale: isSigningActive ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut"
            }}
          >
            {currentSign.leftHand}
          </motion.div>
          
          <motion.div
            className="absolute text-4xl"
            style={{
              left: `calc(50% + ${currentSign.position.right.x}px)`,
              top: `calc(50% + ${currentSign.position.right.y}px)`,
            }}
            animate={{
              x: currentSign.position.right.x,
              y: currentSign.position.right.y,
              rotate: currentSign.position.right.rotate,
              scale: isSigningActive ? [1, 1.1, 1] : 1,
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
        
        {/* Current letter/word indicator */}
        {isSigningActive && (
          <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded font-bold">
            {LEGAL_SIGNS[currentWord.toLowerCase()] ? 
              currentWord.toUpperCase() : 
              currentWord[currentLetterIndex]?.toUpperCase() || ''
            }
          </div>
        )}
      </div>
      
      {/* Current word progress */}
      {message && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">Signing:</div>
          <div className="text-sm font-mono bg-gray-100 p-2 rounded max-h-16 overflow-y-auto">
            {words.map((word, wordIdx) => (
              <span key={wordIdx} className="mr-1">
                {word.split('').map((letter, letterIdx) => (
                  <span
                    key={letterIdx}
                    className={`${
                      wordIdx === currentWordIndex && letterIdx === currentLetterIndex && isSigningActive
                        ? 'bg-primary-200 text-primary-800'
                        : wordIdx < currentWordIndex || (wordIdx === currentWordIndex && letterIdx < currentLetterIndex)
                        ? 'text-green-600'
                        : 'text-gray-400'
                    } px-0.5`}
                  >
                    {letter}
                  </span>
                ))}
                {wordIdx < words.length - 1 && (
                  <span className={`${
                    wordIdx < currentWordIndex ? 'text-green-600' : 'text-gray-400'
                  }`}> </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Sign description */}
      <div className="text-xs text-gray-600 text-center">
        {isSigningActive ? (
          <div>
            <div className="font-medium">
              {LEGAL_SIGNS[currentWord.toLowerCase()] ? 
                `${currentWord.toUpperCase()} (Legal Sign)` : 
                currentWord[currentLetterIndex]?.toUpperCase() || 'PAUSE'
              }
            </div>
            <div className="mt-1">{currentSign.description}</div>
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
              style={{ 
                width: `${((currentWordIndex * 100) + (currentLetterIndex / currentWord.length * 100)) / words.length}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}