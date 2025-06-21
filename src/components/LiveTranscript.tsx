import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Subtitles, Mic, MicOff } from 'lucide-react';

interface LiveTranscriptProps {
  currentMessage: string;
  speaker: 'user' | 'athena';
  isListening?: boolean;
  userTranscript?: string;
}

export default function LiveTranscript({ 
  currentMessage, 
  speaker, 
  isListening = false, 
  userTranscript = '' 
}: LiveTranscriptProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (speaker === 'athena' && currentMessage) {
      setIsTyping(true);
      setDisplayedText('');

      let index = 0;
      const timer = setInterval(() => {
        if (index < currentMessage.length) {
          setDisplayedText(currentMessage.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 30);

      return () => clearInterval(timer);
    } else if (speaker === 'user' && userTranscript) {
      setDisplayedText(userTranscript);
      setIsTyping(false);
    }
  }, [currentMessage, speaker, userTranscript]);

  const messageToShow = speaker === 'user' ? userTranscript : currentMessage;

  return (
    <AnimatePresence>
      {(messageToShow || isListening) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-black/80 backdrop-blur-sm text-white p-3 sm:p-4 rounded-lg max-w-full sm:max-w-2xl mx-auto"
        >
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="flex-shrink-0">
              {speaker === 'user' ? (
                <div className="flex items-center space-x-1">
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    </motion.div>
                  ) : (
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  )}
                </div>
              ) : (
                <Subtitles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                <span className={`text-xs sm:text-sm font-medium ${
                  speaker === 'athena' ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {speaker === 'athena' ? 'Athena' : 'You'}
                </span>
                <div className="text-xs text-gray-400">
                  {new Date().toLocaleTimeString()}
                </div>
                {speaker === 'user' && isListening && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-400">Listening</span>
                  </div>
                )}
              </div>
              
              <div className="text-white leading-relaxed text-sm sm:text-base break-words">
                {messageToShow ? (
                  <>
                    {displayedText}
                    {isTyping && speaker === 'athena' && (
                      <motion.span
                        className="inline-block w-0.5 h-4 sm:h-5 bg-white ml-1"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                    {speaker === 'user' && userTranscript && !userTranscript.trim() && (
                      <span className="text-gray-400 italic">Listening for speech...</span>
                    )}
                  </>
                ) : isListening ? (
                  <span className="text-gray-400 italic">Listening for speech...</span>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}