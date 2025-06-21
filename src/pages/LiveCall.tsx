import React, { useState, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  Settings,
  MessageSquare,
  Volume2,
  VolumeX,
  AlertCircle
} from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { AIService } from '../services/aiService';
import AthenaAvatar from '../components/AthenaAvatar';
import LiveTranscript from '../components/LiveTranscript';

interface ConversationMessage {
  id: string;
  speaker: 'user' | 'athena';
  message: string;
  timestamp: Date;
  sources?: Array<{ title: string; url: string }>;
}

export default function LiveCall() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  
  const { settings, announceToScreenReader } = useAccessibility();
  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    audioLevel, 
    error: recordingError,
    isListening,
    transcript,
    clearTranscript,
    isSpeaking: isUserSpeaking,
    hasFinishedSpeaking
  } = useAudioRecording();
  const { speak, stop: stopSpeaking, isSpeaking: isAthenaSpeaking, error: speechError } = useTextToSpeech();

  // Auto-start recording when mic is on and call is active
  useEffect(() => {
    if (isCallActive && isMicOn && !isRecording) {
      console.log('🎙️ Auto-starting recording');
      startRecording();
    } else if (!isMicOn && isRecording) {
      console.log('🔇 Mic off, stopping recording');
      stopRecording();
    }
  }, [isCallActive, isMicOn, isRecording, startRecording, stopRecording]);

  // Process transcript ONLY when user has finished speaking
  useEffect(() => {
    if (hasFinishedSpeaking && transcript && transcript.trim().length > 0 && !isProcessingResponse) {
      console.log('🔄 Processing finished speech:', transcript);
      processUserMessage(transcript.trim());
    }
  }, [hasFinishedSpeaking, transcript, isProcessingResponse]);

  const processUserMessage = async (message: string) => {
    if (isProcessingResponse) {
      console.log('⏳ Already processing, ignoring:', message);
      return;
    }
    
    console.log('🚀 Starting to process message:', message);
    setIsProcessingResponse(true);
    
    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      message,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    
    try {
      // Get Athena's response
      const athenaResponse = await AIService.processMessage(message, conversation);
      
      setConversation(prev => [...prev, athenaResponse]);
      
      if (settings.screenReader) {
        announceToScreenReader(`Athena says: ${athenaResponse.message}`);
      }
      
      // Speak Athena's response if speaker is on
      if (isSpeakerOn) {
        speak(athenaResponse.message);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      
      const errorMessage: ConversationMessage = {
        id: `athena-error-${Date.now()}`,
        speaker: 'athena',
        message: "I apologize, but I'm having trouble processing your request right now. Could you please try rephrasing your question?",
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, errorMessage]);
      
      if (isSpeakerOn) {
        speak(errorMessage.message);
      }
    } finally {
      setIsProcessingResponse(false);
      clearTranscript();
      
      // Small delay before ready for next speech
      setTimeout(() => {
        console.log('✅ Ready for next speech');
      }, 1000);
    }
  };

  const startCall = async () => {
    setIsCallActive(true);
    announceToScreenReader('Call with Athena started');
    
    // Start conversation
    try {
      const initialConversation = await AIService.startConversation();
      setConversation(initialConversation);
      
      const greeting = initialConversation[0].message;
      if (settings.screenReader) {
        announceToScreenReader(greeting);
      }
      
      // Speak the greeting if speaker is on
      if (isSpeakerOn) {
        speak(greeting);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const endCall = async () => {
    console.log('📞 Ending call');
    if (isRecording) {
      await stopRecording();
    }
    stopSpeaking();
    setIsCallActive(false);
    setConversation([]);
    clearTranscript();
    setIsProcessingResponse(false);
    announceToScreenReader('Call with Athena ended');
  };

  const toggleMic = async () => {
    console.log(`🎤 Toggling mic: ${isMicOn} -> ${!isMicOn}`);
    
    if (isMicOn && isRecording) {
      // Force stop recording when muting
      await stopRecording();
      console.log('🔇 Mic muted, recording stopped');
    }
    
    setIsMicOn(!isMicOn);
    
    // If we have a transcript when muting, process it immediately
    if (isMicOn && transcript && transcript.trim().length > 0 && !isProcessingResponse) {
      console.log('🔄 Processing transcript on mic mute:', transcript);
      processUserMessage(transcript.trim());
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isProcessingResponse) return;
    
    await processUserMessage(currentMessage.trim());
    setCurrentMessage('');
  };

  const currentSpeaker = conversation.length > 0 ? conversation[conversation.length - 1]?.speaker : 'athena';
  const currentSpeakerMessage = conversation.length > 0 ? conversation[conversation.length - 1]?.message : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Responsive */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-gray-900">
              Live Call with Athena
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Your AI legal mentor for professional development
            </p>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end space-x-4">
            {isCallActive && (
              <>
                <span className="flex items-center space-x-2 text-green-600 font-medium text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </span>
                <span className="text-xs sm:text-sm text-gray-500">
                  {new Date().toLocaleTimeString()}
                </span>
                {(recordingError || speechError) && (
                  <div className="flex items-center space-x-1 text-red-600 text-xs sm:text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{recordingError || speechError}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
        {/* Video Area - Full width on mobile, 2/3 on desktop */}
        <div className="flex-1 lg:flex-[2] bg-black relative overflow-hidden">
          {isCallActive ? (
            <div className="h-full flex items-center justify-center relative">
              <AthenaAvatar 
                isActive={isCallActive}
                isSpeaking={isAthenaSpeaking && currentSpeaker === 'athena'}
                currentMessage={currentSpeakerMessage}
              />
              
              {/* Live Transcript - Responsive positioning */}
              {settings.transcriptionEnabled && (
                <div className="absolute bottom-20 sm:bottom-24 left-2 right-2 sm:left-4 sm:right-4">
                  <LiveTranscript 
                    currentMessage={currentSpeaker === 'athena' ? currentSpeakerMessage : ''}
                    speaker={currentSpeaker}
                    isListening={isListening && !hasFinishedSpeaking && !isProcessingResponse}
                    userTranscript={transcript}
                  />
                </div>
              )}
              
              {/* Your video preview - Responsive sizing */}
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-20 h-16 sm:w-32 sm:h-24 bg-gray-800 rounded-lg border-2 border-white overflow-hidden">
                {isVideoOn ? (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center relative">
                    <span className="text-white text-xs sm:text-sm">You</span>
                    {/* Audio level indicator */}
                    {isMicOn && (
                      <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-700 rounded">
                        <div 
                          className="h-full bg-green-500 rounded transition-all duration-100"
                          style={{ width: `${audioLevel * 100}%` }}
                        />
                      </div>
                    )}
                    {/* Status indicators */}
                    {isUserSpeaking && (
                      <div className="absolute top-1 left-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Speaking" />
                    )}
                    {isListening && !hasFinishedSpeaking && !isProcessingResponse && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Listening" />
                    )}
                    {hasFinishedSpeaking && !isProcessingResponse && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Processing" />
                    )}
                    {isProcessingResponse && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" title="Athena thinking" />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                    <VideoOff className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Processing indicator */}
              {isProcessingResponse && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-sm">Athena is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-800 p-4">
              <div className="text-center text-white max-w-md">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 sm:w-12 sm:h-12" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Ready to meet Athena?</h2>
                <p className="text-primary-200 mb-6 text-sm sm:text-base">
                  Start your live call for legal mentoring and professional development
                </p>
                <button
                  onClick={startCall}
                  className="bg-accent-500 hover:bg-accent-600 text-white px-6 sm:px-8 py-3 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-primary-800"
                >
                  Start Call
                </button>
              </div>
            </div>
          )}

          {/* Call Controls - Responsive positioning and sizing */}
          {isCallActive && (
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-2 sm:space-x-4 bg-white/90 backdrop-blur-sm rounded-full px-3 sm:px-6 py-2 sm:py-3">
                <button
                  onClick={toggleMic}
                  className={`p-2 sm:p-3 rounded-full transition-colors focus:ring-2 focus:ring-offset-2 relative ${
                    isMicOn 
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500' 
                      : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400'
                  }`}
                  aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {isMicOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                  {/* Status indicators */}
                  {isRecording && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                  {isListening && !hasFinishedSpeaking && (
                    <div className="absolute -top-1 -left-1 w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse" />
                  )}
                  {hasFinishedSpeaking && (
                    <div className="absolute -top-1 -left-1 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full animate-pulse" />
                  )}
                </button>
                
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-2 sm:p-3 rounded-full transition-colors focus:ring-2 focus:ring-offset-2 ${
                    isVideoOn 
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500' 
                      : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400'
                  }`}
                  aria-label={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                <button
                  onClick={() => {
                    setIsSpeakerOn(!isSpeakerOn);
                    if (!isSpeakerOn) {
                      stopSpeaking();
                    }
                  }}
                  className={`p-2 sm:p-3 rounded-full transition-colors focus:ring-2 focus:ring-offset-2 ${
                    isSpeakerOn 
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500' 
                      : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400'
                  }`}
                  aria-label={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
                >
                  {isSpeakerOn ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
                  {/* Speaking indicator */}
                  {isAthenaSpeaking && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>
                
                <button
                  onClick={endCall}
                  className="p-2 sm:p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                  aria-label="End call"
                >
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                <button
                  className="p-2 sm:p-3 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Call settings"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel - Responsive width and positioning */}
        <div className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col max-h-96 lg:max-h-none">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm sm:text-base">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Conversation</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {conversation.map((item, index) => (
              <div key={index} className={`${item.speaker === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`inline-block max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg ${
                    item.speaker === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-xs sm:text-sm">{item.message}</p>
                  {item.sources && item.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      {item.sources.map((source, sourceIndex) => (
                        <a
                          key={sourceIndex}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          📖 {source.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            
            {/* Show current transcript if user is speaking */}
            {transcript && isListening && !hasFinishedSpeaking && !isProcessingResponse && (
              <div className="text-right">
                <div className="inline-block max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg bg-blue-100 text-blue-900 border-2 border-blue-300">
                  <p className="text-xs sm:text-sm">{transcript}</p>
                  <div className="text-xs text-blue-600 mt-1 flex items-center justify-end space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Speaking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Show when speech is finished and being processed */}
            {hasFinishedSpeaking && transcript && !isProcessingResponse && (
              <div className="text-right">
                <div className="inline-block max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg bg-yellow-100 text-yellow-900 border-2 border-yellow-300">
                  <p className="text-xs sm:text-sm">{transcript}</p>
                  <div className="text-xs text-yellow-600 mt-1 flex items-center justify-end space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span>Processing...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Processing indicator */}
            {isProcessingResponse && (
              <div className="text-left">
                <div className="inline-block p-2 sm:p-3 rounded-lg bg-gray-100 text-gray-900">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                    <span className="text-xs sm:text-sm">Athena is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {isCallActive && (
            <div className="p-3 sm:p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your question..."
                  className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  aria-label="Type your question"
                  disabled={isProcessingResponse}
                />
                <button
                  onClick={sendMessage}
                  disabled={!currentMessage.trim() || isProcessingResponse}
                  className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-sm"
                  aria-label="Send message"
                >
                  Send
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                {isProcessingResponse ? (
                  <span className="text-purple-600 font-medium">🤖 Athena is thinking...</span>
                ) : hasFinishedSpeaking ? (
                  <span className="text-yellow-600 font-medium">⏳ Processing your speech...</span>
                ) : isUserSpeaking ? (
                  <span className="text-green-600 font-medium">🎤 Speaking detected</span>
                ) : isListening && isMicOn ? (
                  <span className="text-blue-600 font-medium">🎧 Listening for speech...</span>
                ) : isMicOn ? (
                  'Ready to listen - start speaking'
                ) : (
                  'Microphone muted - click to unmute or type your question'
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}