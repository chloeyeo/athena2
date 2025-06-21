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
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);
  const lastSpeechTimeRef = useRef<number>(0);
  const speechStartedRef = useRef<boolean>(false);

  const SILENCE_THRESHOLD = 0.01; // Very sensitive threshold
  const SILENCE_DURATION = 1500; // 1.5 seconds of silence to finish
  const MIN_SPEECH_DURATION = 500; // Minimum 0.5 seconds of speech

  const detectSilence = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    const normalizedLevel = average / 255;
    
    setAudioLevel(normalizedLevel);

    const currentTime = Date.now();
    
    if (normalizedLevel > SILENCE_THRESHOLD) {
      // Audio detected
      lastSpeechTimeRef.current = currentTime;
      
      if (!speechStartedRef.current) {
        speechStartedRef.current = true;
        setIsSpeaking(true);
        setHasFinishedSpeaking(false);
        console.log('🎤 Speech started');
      }
      
      // Clear any existing silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } else {
      // Silence detected
      if (speechStartedRef.current && !silenceTimeoutRef.current) {
        // Start silence countdown
        silenceTimeoutRef.current = setTimeout(() => {
          const speechDuration = lastSpeechTimeRef.current - (lastSpeechTimeRef.current - MIN_SPEECH_DURATION);
          
          if (speechStartedRef.current && finalTranscriptRef.current.trim() && !isProcessingRef.current) {
            console.log('✅ Speech finished after silence, processing:', finalTranscriptRef.current);
            setIsSpeaking(false);
            setHasFinishedSpeaking(true);
            setTranscript(finalTranscriptRef.current.trim());
            isProcessingRef.current = true;
            speechStartedRef.current = false;
          }
          
          silenceTimeoutRef.current = null;
        }, SILENCE_DURATION);
      }
    }

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(detectSilence);
    }
  }, [isRecording]);

  const resetForNextSpeech = useCallback(() => {
    console.log('🔄 Resetting for next speech');
    finalTranscriptRef.current = '';
    lastSpeechTimeRef.current = 0;
    speechStartedRef.current = false;
    isProcessingRef.current = false;
    setHasFinishedSpeaking(false);
    setTranscript('');
    setIsSpeaking(false);
    
    // Clear any timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      resetForNextSpeech();
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        } 
      });

      streamRef.current = stream;

      // Set up audio analysis for silence detection
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.1;

        detectSilence();
      } catch (audioContextError) {
        console.warn('Audio analysis failed:', audioContextError);
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
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Update final transcript accumulator
          if (finalTranscript) {
            finalTranscriptRef.current += finalTranscript;
            console.log('📝 Final transcript updated:', finalTranscriptRef.current);
          }
          
          // Show live transcript (final + interim)
          if (!isProcessingRef.current) {
            const displayTranscript = finalTranscriptRef.current + interimTranscript;
            setTranscript(displayTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            setError(`Speech recognition error: ${event.error}`);
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
          console.log('🔚 Speech recognition ended');
          
          // Auto-restart if still recording and not processing
          if (isRecording && !isProcessingRef.current) {
            setTimeout(() => {
              if (recognitionRef.current && isRecording && !isProcessingRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.warn('Failed to restart recognition:', e);
                }
              }
            }, 100);
          }
        };
        
        recognitionRef.current.start();
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
      console.log('🎙️ Recording started');
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setIsRecording(false);
    }
  }, [isRecording, detectSilence, resetForNextSpeech]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      console.log('🛑 Stopping recording');
      
      // If we have transcript when stopping, process it immediately
      if (finalTranscriptRef.current.trim() && !isProcessingRef.current) {
        console.log('🔄 Processing transcript on stop:', finalTranscriptRef.current);
        setHasFinishedSpeaking(true);
        setTranscript(finalTranscriptRef.current.trim());
        isProcessingRef.current = true;
      }
      
      // Clear all timeouts
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
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