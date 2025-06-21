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
  const speechStartTimeRef = useRef<number>(0);
  const lastAudioTimeRef = useRef<number>(0);
  const finalTranscriptRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);

  const SILENCE_THRESHOLD = 0.015; // Lower threshold for better detection
  const SILENCE_DURATION = 2000; // 2 seconds of silence
  const MIN_SPEECH_DURATION = 800; // Minimum speech duration

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
      if (!isSpeaking) {
        setIsSpeaking(true);
        setHasFinishedSpeaking(false);
        speechStartTimeRef.current = currentTime;
        console.log('🎤 Speech started');
      }
      lastAudioTimeRef.current = currentTime;
      
      // Clear silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } else {
      // Silence detected
      if (isSpeaking) {
        setIsSpeaking(false);
        console.log('🔇 Silence detected');
      }
      
      // Start silence timeout if we have speech and aren't already processing
      if (speechStartTimeRef.current > 0 && finalTranscriptRef.current.trim() && !isProcessingRef.current) {
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            const speechDuration = lastAudioTimeRef.current - speechStartTimeRef.current;
            
            if (speechDuration > MIN_SPEECH_DURATION && finalTranscriptRef.current.trim()) {
              console.log('✅ Speech finished, processing:', finalTranscriptRef.current);
              setHasFinishedSpeaking(true);
              setTranscript(finalTranscriptRef.current);
              isProcessingRef.current = true;
            }
            
            silenceTimeoutRef.current = null;
          }, SILENCE_DURATION);
        }
      }
    }

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(detectSilence);
    }
  }, [isRecording, isSpeaking]);

  const resetForNextSpeech = useCallback(() => {
    console.log('🔄 Resetting for next speech');
    finalTranscriptRef.current = '';
    speechStartTimeRef.current = 0;
    lastAudioTimeRef.current = 0;
    isProcessingRef.current = false;
    setHasFinishedSpeaking(false);
    setTranscript('');
    setIsSpeaking(false);
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

      // Set up audio analysis
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        analyserRef.current.fftSize = 512;
        analyserRef.current.smoothingTimeConstant = 0.3;

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
          
          // Update final transcript
          if (finalTranscript) {
            finalTranscriptRef.current += finalTranscript;
            console.log('📝 Final transcript:', finalTranscriptRef.current);
          }
          
          // Show live transcript only if not processing
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
          
          // Restart if still recording and not processing
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
      }

      // Set up MediaRecorder
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
        setHasFinishedSpeaking(false);
        setAudioLevel(0);
        resetForNextSpeech();
        
        console.log('✅ Recording stopped');
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording, resetForNextSpeech]);

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