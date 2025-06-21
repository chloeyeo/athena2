import { useState, useRef, useCallback } from 'react';

interface UseAudioRecordingReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  audioLevel: number;
  error: string | null;
  isListening: boolean;
  transcript: string;
  clearTranscript: () => void;
  isSpeaking: boolean;
  hasFinishedSpeaking: boolean;
}

export function useAudioRecording(): UseAudioRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasFinishedSpeaking, setHasFinishedSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);
  const speechStartTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);

  // Simplified but effective voice detection
  const SILENCE_DURATION = 1500;     // 1.5 seconds of silence
  const MIN_SPEECH_DURATION = 800;   // Minimum 0.8 seconds of speech
  const AUDIO_THRESHOLD = 0.01;      // Minimum audio level

  // Simple but effective audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyserRef.current.getByteTimeDomainData(dataArray);
    
    // Calculate RMS (Root Mean Square) for audio level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const sample = (dataArray[i] - 128) / 128;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / bufferLength);
    setAudioLevel(rms);

    // Simple voice activity detection based on audio level
    const currentTime = Date.now();
    const hasAudio = rms > AUDIO_THRESHOLD;
    
    if (hasAudio) {
      lastSpeechTimeRef.current = currentTime;
      
      if (!isSpeaking) {
        speechStartTimeRef.current = currentTime;
        setIsSpeaking(true);
        setHasFinishedSpeaking(false);
        console.log('🎤 Speech detected - level:', rms.toFixed(3));
      }
      
      // Clear any existing silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } else if (isSpeaking && !silenceTimeoutRef.current) {
      // Start silence countdown
      silenceTimeoutRef.current = setTimeout(() => {
        const speechDuration = lastSpeechTimeRef.current - speechStartTimeRef.current;
        
        if (speechDuration >= MIN_SPEECH_DURATION && finalTranscriptRef.current.trim() && !isProcessingRef.current) {
          console.log('✅ Speech finished - duration:', speechDuration, 'ms');
          console.log('📝 Final transcript:', finalTranscriptRef.current);
          setIsSpeaking(false);
          setHasFinishedSpeaking(true);
          setTranscript(finalTranscriptRef.current.trim());
          isProcessingRef.current = true;
        } else {
          console.log('⚠️ Speech too short or no transcript, ignoring');
          setIsSpeaking(false);
          finalTranscriptRef.current = '';
        }
        
        silenceTimeoutRef.current = null;
      }, SILENCE_DURATION);
    }

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  }, [isRecording, isSpeaking]);

  const resetForNextSpeech = useCallback(() => {
    console.log('🔄 Resetting for next speech');
    finalTranscriptRef.current = '';
    speechStartTimeRef.current = 0;
    lastSpeechTimeRef.current = 0;
    isProcessingRef.current = false;
    setHasFinishedSpeaking(false);
    setTranscript('');
    setIsSpeaking(false);
    
    // Clear timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      resetForNextSpeech();
      
      console.log('🎙️ Requesting microphone access...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access not supported in this browser');
      }
      
      // Request microphone with optimal settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        } 
      });

      streamRef.current = stream;
      console.log('✅ Microphone access granted');

      // Set up audio analysis
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        // Optimized settings for voice detection
        analyserRef.current.fftSize = 1024;
        analyserRef.current.smoothingTimeConstant = 0.8;
        
        console.log('🔊 Audio analysis setup complete');
        monitorAudioLevel();
      } catch (audioContextError) {
        console.warn('Audio analysis failed:', audioContextError);
        setError('Audio monitoring not available');
      }

      // Set up speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
          console.log('🎧 Speech recognition started');
        };
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;
            
            if (event.results[i].isFinal) {
              if (confidence > 0.5) { // Lower confidence threshold
                finalTranscript += transcript;
                console.log('📝 Final transcript added:', transcript, 'confidence:', confidence);
              }
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Update final transcript accumulator
          if (finalTranscript) {
            finalTranscriptRef.current += finalTranscript + ' ';
          }
          
          // Show live transcript
          if (!isProcessingRef.current) {
            const displayTranscript = (finalTranscriptRef.current + interimTranscript).trim();
            if (displayTranscript) {
              setTranscript(displayTranscript);
            }
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'network') {
            setError('Network error - check internet connection');
          } else if (event.error === 'not-allowed') {
            setError('Microphone permission denied');
          } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.warn('Speech recognition error:', event.error);
          }
        };
        
        recognitionRef.current.onend = () => {
          console.log('🔚 Speech recognition ended');
          setIsListening(false);
          
          // Auto-restart if still recording and not processing
          if (isRecording && !isProcessingRef.current) {
            setTimeout(() => {
              if (recognitionRef.current && isRecording && !isProcessingRef.current) {
                try {
                  recognitionRef.current.start();
                  console.log('🔄 Restarting speech recognition');
                } catch (e) {
                  console.warn('Failed to restart recognition:', e);
                }
              }
            }, 100);
          }
        };
        
        recognitionRef.current.start();
        console.log('🎧 Starting speech recognition');
      } else {
        setError('Speech recognition not supported in this browser');
      }

      // Set up MediaRecorder for backup
      if (window.MediaRecorder) {
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
          }
        }

        const options = mimeType ? { mimeType } : {};
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.start(100);
      }

      setIsRecording(true);
      console.log('🎙️ Recording started successfully');
      
    } catch (err) {
      console.error('❌ Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setIsRecording(false);
    }
  }, [isRecording, monitorAudioLevel, resetForNextSpeech]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      console.log('🛑 Stopping recording');
      
      // If we have transcript when stopping, process it immediately
      if (finalTranscriptRef.current.trim() && !isProcessingRef.current) {
        const speechDuration = lastSpeechTimeRef.current - speechStartTimeRef.current;
        if (speechDuration >= MIN_SPEECH_DURATION) {
          console.log('🔄 Processing transcript on manual stop:', finalTranscriptRef.current);
          setHasFinishedSpeaking(true);
          setTranscript(finalTranscriptRef.current.trim());
          isProcessingRef.current = true;
        }
      }
      
      // Clear timeouts
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
        });
        
        // Clean up
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        setIsRecording(false);
        setIsListening(false);
        setIsSpeaking(false);
        setAudioLevel(0);
        
        console.log('✅ Recording stopped');
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording]);

  const clearTranscript = useCallback(() => {
    console.log('🧹 Clearing transcript');
    resetForNextSpeech();
  }, [resetForNextSpeech]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioLevel,
    error,
    isListening,
    transcript,
    clearTranscript,
    isSpeaking,
    hasFinishedSpeaking
  };
}