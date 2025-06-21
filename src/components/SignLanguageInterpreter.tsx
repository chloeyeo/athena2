import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages } from 'lucide-react';

interface SignLanguageInterpreterProps {
  message: string;
  language: 'ASL' | 'BSL' | 'ISL';
  isActive: boolean;
}

// Legal terms with specific ASL signs
const LEGAL_SIGNS = {
  'law': {
    description: 'Law sign - L handshape on flat palm',
    gesture: '⚖️'
  },
  'court': {
    description: 'Court sign - Judge gesture',
    gesture: '🏛️'
  },
  'contract': {
    description: 'Contract sign - Paper and signature',
    gesture: '📋'
  },
  'lawyer': {
    description: 'Lawyer sign - L handshape',
    gesture: '👨‍💼'
  },
  'legal': {
    description: 'Legal sign - L handshape',
    gesture: '⚖️'
  },
  'client': {
    description: 'Client sign - Person gesture',
    gesture: '👤'
  },
  'case': {
    description: 'Case sign - Folder gesture',
    gesture: '📁'
  },
  'judge': {
    description: 'Judge sign - Authority gesture',
    gesture: '👨‍⚖️'
  }
};

// Realistic human interpreter component
const HumanInterpreter: React.FC<{
  currentSign: string,
  isActive: boolean,
  description: string
}> = ({ currentSign, isActive, description }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Professional interpreter background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg"></div>
      
      {/* Human silhouette with realistic proportions */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Head */}
        <motion.div 
          className="w-12 h-12 bg-gradient-to-b from-amber-200 to-amber-300 rounded-full border border-amber-400 mb-2"
          animate={isActive ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Face features */}
          <div className="relative w-full h-full">
            {/* Eyes */}
            <div className="absolute top-3 left-3 w-1 h-1 bg-gray-700 rounded-full"></div>
            <div className="absolute top-3 right-3 w-1 h-1 bg-gray-700 rounded-full"></div>
            {/* Mouth */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-gray-600 rounded-full"></div>
          </div>
        </motion.div>
        
        {/* Shoulders and torso */}
        <div className="w-16 h-8 bg-gradient-to-b from-blue-300 to-blue-400 rounded-t-lg mb-2"></div>
        
        {/* Arms and hands area */}
        <div className="relative w-20 h-16 flex items-center justify-center">
          {/* Left arm */}
          <motion.div 
            className="absolute left-2 top-2 w-3 h-8 bg-gradient-to-b from-amber-200 to-amber-300 rounded-full"
            animate={isActive ? { 
              rotate: [-10, 10, -5, 5, 0],
              x: [-2, 2, -1, 1, 0]
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          {/* Right arm */}
          <motion.div 
            className="absolute right-2 top-2 w-3 h-8 bg-gradient-to-b from-amber-200 to-amber-300 rounded-full"
            animate={isActive ? { 
              rotate: [10, -10, 5, -5, 0],
              x: [2, -2, 1, -1, 0]
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          
          {/* Left hand */}
          <motion.div 
            className="absolute left-0 top-8 w-4 h-4 bg-gradient-to-br from-amber-200 to-amber-300 rounded-lg border border-amber-400 flex items-center justify-center"
            animate={isActive ? { 
              scale: [1, 1.1, 0.9, 1.05, 1],
              rotate: [-15, 15, -10, 10, 0]
            } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <div className="text-xs">✋</div>
          </motion.div>
          
          {/* Right hand */}
          <motion.div 
            className="absolute right-0 top-8 w-4 h-4 bg-gradient-to-br from-amber-200 to-amber-300 rounded-lg border border-amber-400 flex items-center justify-center"
            animate={isActive ? { 
              scale: [1, 0.9, 1.1, 0.95, 1],
              rotate: [15, -15, 10, -10, 0]
            } : {}}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
          >
            <div className="text-xs">🤚</div>
          </motion.div>
          
          {/* Central sign display */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center text-2xl"
            animate={isActive ? { 
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8]
            } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            {currentSign}
          </motion.div>
        </div>
      </div>
      
      {/* Professional interpreter badge */}
      <div className="absolute bottom-2 left-2 bg-white/90 rounded px-2 py-1 text-xs font-medium text-gray-700">
        Certified ASL Interpreter
      </div>
    </div>
  );
};

export default function SignLanguageInterpreter({ message, language, isActive }: SignLanguageInterpreterProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [isSigningActive, setIsSigningActive] = useState(false);
  const [currentSign, setCurrentSign] = useState('👋');
  const [currentDescription, setCurrentDescription] = useState('Ready to interpret');

  useEffect(() => {
    if (message && isActive) {
      setIsSigningActive(true);
      setCurrentWordIndex(0);
      setCurrentLetterIndex(0);
      
      const words = message.toLowerCase().split(' ').filter(word => word.length > 0);
      let wordIndex = 0;
      let letterIndex = 0;
      
      const signInterval = setInterval(() => {
        if (wordIndex >= words.length) {
          setIsSigningActive(false);
          setCurrentSign('👋');
          setCurrentDescription('Interpretation complete');
          clearInterval(signInterval);
          return;
        }
        
        const currentWord = words[wordIndex];
        
        // Check if it's a legal term that has a specific sign
        if (letterIndex === 0 && LEGAL_SIGNS[currentWord]) {
          setCurrentSign(LEGAL_SIGNS[currentWord].gesture);
          setCurrentDescription(LEGAL_SIGNS[currentWord].description);
          setCurrentWordIndex(wordIndex);
          setCurrentLetterIndex(0);
          
          // Hold the sign for the whole word
          setTimeout(() => {
            wordIndex++;
            letterIndex = 0;
            // Brief pause between words
            setCurrentSign('✋');
            setCurrentDescription('Pause between words');
          }, 1500);
          
          return;
        }
        
        // Finger spell the word letter by letter
        if (letterIndex < currentWord.length) {
          const letter = currentWord[letterIndex].toUpperCase();
          
          // Use hand gestures for letters
          const letterSigns: { [key: string]: string } = {
            'A': '✊', 'B': '🖐️', 'C': '🤏', 'D': '👆', 'E': '✊',
            'F': '👌', 'G': '👉', 'H': '✌️', 'I': '🤙', 'J': '🤙',
            'K': '✌️', 'L': '🤟', 'M': '✊', 'N': '✊', 'O': '👌',
            'P': '👇', 'Q': '👇', 'R': '🤞', 'S': '✊', 'T': '✊',
            'U': '✌️', 'V': '✌️', 'W': '🖖', 'X': '☝️', 'Y': '🤙', 'Z': '☝️'
          };
          
          setCurrentSign(letterSigns[letter] || '✋');
          setCurrentDescription(`Letter ${letter} - ${currentWord}`);
          setCurrentWordIndex(wordIndex);
          setCurrentLetterIndex(letterIndex);
          
          letterIndex++;
        } else {
          // Move to next word with a pause
          setCurrentSign('✋');
          setCurrentDescription('Pause between words');
          wordIndex++;
          letterIndex = 0;
        }
      }, 1000); // Slower pace for better visibility

      return () => clearInterval(signInterval);
    } else {
      setIsSigningActive(false);
      setCurrentSign('👋');
      setCurrentDescription('Ready to interpret');
    }
  }, [message, isActive]);

  const words = message ? message.split(' ').filter(word => word.length > 0) : [];
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
      
      {/* Professional human interpreter */}
      <div className="relative h-48 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg mb-3 overflow-hidden">
        <HumanInterpreter 
          currentSign={currentSign}
          isActive={isSigningActive}
          description={currentDescription}
        />
        
        {/* Current letter/word indicator */}
        {isSigningActive && (
          <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded font-bold">
            {LEGAL_SIGNS[currentWord.toLowerCase()] ? 
              currentWord.toUpperCase() : 
              currentWord[currentLetterIndex]?.toUpperCase() || 'PAUSE'
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
        <div className="font-medium">
          {currentDescription}
        </div>
      </div>
      
      {/* Progress indicator */}
      {message && isSigningActive && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-primary-600 h-1 rounded-full transition-all duration-300"
              style={{ 
                width: `${words.length > 0 ? ((currentWordIndex + (currentLetterIndex / Math.max(currentWord.length, 1))) / words.length) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}