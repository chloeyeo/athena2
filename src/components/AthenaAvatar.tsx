import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAccessibility } from '../contexts/AccessibilityContext';
import SignLanguageInterpreter from './SignLanguageInterpreter';

interface AthenaAvatarProps {
  isActive: boolean;
  isSpeaking: boolean;
  currentMessage?: string;
}

export default function AthenaAvatar({ isActive, isSpeaking, currentMessage }: AthenaAvatarProps) {
  const [currentExpression, setCurrentExpression] = useState<'neutral' | 'speaking' | 'thinking'>('neutral');
  const { settings } = useAccessibility();

  useEffect(() => {
    if (isSpeaking) {
      setCurrentExpression('speaking');
    } else {
      setCurrentExpression('neutral');
    }
  }, [isSpeaking, currentMessage]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 relative">
      {/* Sign Language Interpreter - positioned to the side */}
      {settings.signLanguage && currentMessage && (
        <div className="absolute top-4 right-4 z-10">
          <SignLanguageInterpreter 
            message={currentMessage}
            language={settings.signLanguageType}
            isActive={isSpeaking}
          />
        </div>
      )}

      {/* Avatar */}
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Main avatar circle - Responsive sizing */}
        <motion.div
          className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-blue-600 flex items-center justify-center relative overflow-hidden"
          animate={{
            scale: isSpeaking ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 1.5,
            repeat: isSpeaking ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          {/* Face features */}
          <div className="absolute inset-2 sm:inset-3 md:inset-4 rounded-full bg-gradient-to-br from-blue-300 to-purple-400 flex items-center justify-center">
            {/* Eyes */}
            <div className="absolute top-6 sm:top-7 md:top-8 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 md:space-x-4">
              <motion.div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-white rounded-full"
                animate={{
                  scaleY: currentExpression === 'speaking' ? [1, 0.3, 1] : 1,
                }}
                transition={{
                  duration: 0.3,
                  repeat: currentExpression === 'speaking' ? Infinity : 0,
                }}
              />
              <motion.div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-white rounded-full"
                animate={{
                  scaleY: currentExpression === 'speaking' ? [1, 0.3, 1] : 1,
                }}
                transition={{
                  duration: 0.3,
                  repeat: currentExpression === 'speaking' ? Infinity : 0,
                }}
              />
            </div>

            {/* Mouth */}
            <motion.div
              className="absolute bottom-8 sm:bottom-10 md:bottom-12 left-1/2 transform -translate-x-1/2"
              animate={{
                scaleX: currentExpression === 'speaking' ? [1, 1.3, 0.8, 1] : 1,
                scaleY: currentExpression === 'speaking' ? [1, 0.8, 1.2, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: currentExpression === 'speaking' ? Infinity : 0,
              }}
            >
              <div className="w-6 h-1.5 sm:w-7 sm:h-1.5 md:w-8 md:h-2 bg-white rounded-full" />
            </motion.div>
          </div>

          {/* Animated particles around avatar */}
          {isActive && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/30 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos(i * 60 * Math.PI / 180) * 60],
                    y: [0, Math.sin(i * 60 * Math.PI / 180) * 60],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </>
          )}
        </motion.div>

        {/* Status indicator - Responsive */}
        <motion.div
          className="absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-white rounded-full shadow-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-1 sm:space-x-2">
            <motion.div
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {currentExpression === 'speaking' ? 
                (settings.signLanguage ? `Speaking & Signing (${settings.signLanguageType})` : 'Speaking...') : 
                'Listening'
              }
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Name and title - Responsive */}
      <motion.div
        className="text-center mt-4 sm:mt-6 md:mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-1 sm:mb-2">Athena</h2>
        <p className="text-blue-200 text-sm sm:text-base md:text-lg">Your AI Legal Mentor</p>
        <p className="text-blue-300 text-xs sm:text-sm mt-1">
          Powered by advanced AI • Zero hallucinations
          {settings.signLanguage && ` • ${settings.signLanguageType} Sign Language`}
        </p>
      </motion.div>
    </div>
  );
}