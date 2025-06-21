import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages } from 'lucide-react';

interface SignLanguageInterpreterProps {
  message: string;
  language: 'ASL' | 'BSL' | 'ISL';
  isActive: boolean;
}

// Realistic ASL hand positions with SVG-like representations
const ASL_HAND_SHAPES = {
  'a': { 
    description: 'Closed fist with thumb alongside',
    leftHand: { fingers: [0, 0, 0, 0], thumb: 0, wrist: 0 },
    rightHand: { fingers: [0, 0, 0, 0], thumb: 0, wrist: 0 }
  },
  'b': { 
    description: 'Flat hand, fingers together, thumb across palm',
    leftHand: { fingers: [1, 1, 1, 1], thumb: 0.5, wrist: 0 },
    rightHand: { fingers: [1, 1, 1, 1], thumb: 0.5, wrist: 0 }
  },
  'c': { 
    description: 'Curved hand forming C shape',
    leftHand: { fingers: [0.7, 0.7, 0.7, 0.7], thumb: 0.7, wrist: 0 },
    rightHand: { fingers: [0.7, 0.7, 0.7, 0.7], thumb: 0.7, wrist: 0 }
  },
  'd': { 
    description: 'Index finger pointing up',
    leftHand: { fingers: [1, 0, 0, 0], thumb: 0, wrist: 0 },
    rightHand: { fingers: [1, 0, 0, 0], thumb: 0, wrist: 0 }
  },
  'e': { 
    description: 'Fingers bent touching thumb',
    leftHand: { fingers: [0.3, 0.3, 0.3, 0.3], thumb: 0.3, wrist: 0 },
    rightHand: { fingers: [0.3, 0.3, 0.3, 0.3], thumb: 0.3, wrist: 0 }
  },
  'f': { 
    description: 'Index and thumb touching, others extended',
    leftHand: { fingers: [0.5, 1, 1, 1], thumb: 0.5, wrist: 0 },
    rightHand: { fingers: [0.5, 1, 1, 1], thumb: 0.5, wrist: 0 }
  },
  'g': { 
    description: 'Index finger pointing sideways',
    leftHand: { fingers: [1, 0, 0, 0], thumb: 0, wrist: 90 },
    rightHand: { fingers: [1, 0, 0, 0], thumb: 0, wrist: -90 }
  },
  'h': { 
    description: 'Index and middle finger extended sideways',
    leftHand: { fingers: [1, 1, 0, 0], thumb: 0, wrist: 90 },
    rightHand: { fingers: [1, 1, 0, 0], thumb: 0, wrist: -90 }
  },
  'i': { 
    description: 'Pinky finger extended',
    leftHand: { fingers: [0, 0, 0, 1], thumb: 0, wrist: 0 },
    rightHand: { fingers: [0, 0, 0, 1], thumb: 0, wrist: 0 }
  },
  'l': { 
    description: 'Index and thumb forming L',
    leftHand: { fingers: [1, 0, 0, 0], thumb: 1, wrist: 0 },
    rightHand: { fingers: [1, 0, 0, 0], thumb: 1, wrist: 0 }
  },
  'o': { 
    description: 'All fingertips touching thumb',
    leftHand: { fingers: [0.8, 0.8, 0.8, 0.8], thumb: 0.8, wrist: 0 },
    rightHand: { fingers: [0.8, 0.8, 0.8, 0.8], thumb: 0.8, wrist: 0 }
  },
  'r': { 
    description: 'Index and middle fingers crossed',
    leftHand: { fingers: [0.8, 0.9, 0, 0], thumb: 0, wrist: 0 },
    rightHand: { fingers: [0.8, 0.9, 0, 0], thumb: 0, wrist: 0 }
  },
  's': { 
    description: 'Fist with thumb over fingers',
    leftHand: { fingers: [0, 0, 0, 0], thumb: 0.2, wrist: 0 },
    rightHand: { fingers: [0, 0, 0, 0], thumb: 0.2, wrist: 0 }
  },
  'u': { 
    description: 'Index and middle fingers together',
    leftHand: { fingers: [1, 1, 0, 0], thumb: 0, wrist: 0 },
    rightHand: { fingers: [1, 1, 0, 0], thumb: 0, wrist: 0 }
  },
  'v': { 
    description: 'Index and middle fingers apart',
    leftHand: { fingers: [1, 1, 0, 0], thumb: 0, wrist: 0 },
    rightHand: { fingers: [1, 1, 0, 0], thumb: 0, wrist: 0 }
  },
  'y': { 
    description: 'Thumb and pinky extended',
    leftHand: { fingers: [0, 0, 0, 1], thumb: 1, wrist: 0 },
    rightHand: { fingers: [0, 0, 0, 1], thumb: 1, wrist: 0 }
  },
  ' ': { 
    description: 'Pause - hands open',
    leftHand: { fingers: [1, 1, 1, 1], thumb: 1, wrist: 0 },
    rightHand: { fingers: [1, 1, 1, 1], thumb: 1, wrist: 0 }
  }
};

// Legal terms with specific ASL signs
const LEGAL_SIGNS = {
  'law': {
    description: 'Law sign - L handshape on flat palm',
    leftHand: { fingers: [1, 1, 1, 1], thumb: 1, wrist: 0 },
    rightHand: { fingers: [1, 0, 0, 0], thumb: 1, wrist: 0 }
  },
  'court': {
    description: 'Court sign - Judge gesture',
    leftHand: { fingers: [1, 1, 1, 1], thumb: 1, wrist: -20 },
    rightHand: { fingers: [1, 1, 1, 1], thumb: 1, wrist: 20 }
  },
  'contract': {
    description: 'Contract sign - Paper and signature',
    leftHand: { fingers: [1, 1, 1, 1], thumb: 1, wrist: 0 },
    rightHand: { fingers: [1, 0, 0, 0], thumb: 0, wrist: 0 }
  },
  'lawyer': {
    description: 'Lawyer sign - L handshape',
    leftHand: { fingers: [1, 0, 0, 0], thumb: 1, wrist: 0 },
    rightHand: { fingers: [1, 0, 0, 0], thumb: 1, wrist: 0 }
  }
};

// Realistic hand component
const RealisticHand: React.FC<{
  handShape: { fingers: number[], thumb: number, wrist: number },
  isLeft: boolean,
  position: { x: number, y: number, rotate: number }
}> = ({ handShape, isLeft, position }) => {
  return (
    <motion.div
      className="absolute"
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
      }}
      animate={{
        x: position.x,
        y: position.y,
        rotate: position.rotate + handShape.wrist,
      }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Arm */}
      <div 
        className="absolute bg-gradient-to-b from-amber-100 to-amber-200 rounded-full"
        style={{
          width: '12px',
          height: '40px',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          transformOrigin: 'top center'
        }}
      />
      
      {/* Wrist */}
      <div 
        className="absolute bg-gradient-to-b from-amber-200 to-amber-300 rounded-full"
        style={{
          width: '16px',
          height: '12px',
          top: '8px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      {/* Palm */}
      <div 
        className="relative bg-gradient-to-br from-amber-200 to-amber-300 rounded-lg shadow-sm"
        style={{
          width: '24px',
          height: '32px',
          border: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        {/* Thumb */}
        <div
          className="absolute bg-gradient-to-br from-amber-200 to-amber-300 rounded-full shadow-sm"
          style={{
            width: '8px',
            height: `${12 + handShape.thumb * 8}px`,
            left: isLeft ? '-6px' : '22px',
            top: '8px',
            transform: `rotate(${isLeft ? -30 : 30}deg) scaleY(${handShape.thumb})`,
            transformOrigin: 'bottom center',
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        />
        
        {/* Fingers */}
        {handShape.fingers.map((extension, index) => (
          <div
            key={index}
            className="absolute bg-gradient-to-b from-amber-200 to-amber-300 rounded-full shadow-sm"
            style={{
              width: '5px',
              height: `${8 + extension * 12}px`,
              left: `${4 + index * 4}px`,
              top: '-2px',
              transform: `scaleY(${0.3 + extension * 0.7})`,
              transformOrigin: 'bottom center',
              border: '1px solid rgba(0,0,0,0.1)'
            }}
          />
        ))}
        
        {/* Palm lines for realism */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-full h-px bg-amber-600 top-1/3"></div>
          <div className="absolute w-2/3 h-px bg-amber-600 top-1/2 left-1/6"></div>
          <div className="absolute w-1/2 h-px bg-amber-600 top-2/3 left-1/4"></div>
        </div>
      </div>
    </motion.div>
  );
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
      
      {/* Realistic signing area with human-like interpreter */}
      <div className="relative h-48 flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg mb-3 overflow-hidden">
        {/* Interpreter silhouette */}
        <div className="absolute bottom-0 w-32 h-24 bg-gradient-to-t from-blue-200 to-blue-300 rounded-t-3xl opacity-60"></div>
        
        {/* Head and shoulders */}
        <div className="absolute top-4 w-16 h-16 bg-gradient-to-b from-amber-200 to-amber-300 rounded-full border border-amber-400 opacity-80"></div>
        <div className="absolute top-16 w-20 h-12 bg-gradient-to-b from-blue-300 to-blue-400 rounded-t-lg opacity-70"></div>
        
        {/* Realistic hands */}
        <RealisticHand
          handShape={currentSign.leftHand}
          isLeft={true}
          position={{ x: -40, y: 10, rotate: 0 }}
        />
        
        <RealisticHand
          handShape={currentSign.rightHand}
          isLeft={false}
          position={{ x: 40, y: 10, rotate: 0 }}
        />
        
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