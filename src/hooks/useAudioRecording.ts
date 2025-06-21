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
  const lastSpeechTimeRef = useRef<number>(0);
  const finalTranscriptRef = useRef<string>('');

  const SILENCE_THRESHOLD = 0.02; // Audio level threshold for silence
  const SILENCE_DURATION = 2500; // 2.5 seconds of silence before considering speech finished
  const MIN_SPEECH_DURATION = 1000; // Minimum 1 second of speech before processing

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
      // User is speaking
      if (!isSpeaking) {
        setIsSpeaking(true);
        setHasFinishedSpeaking(false);
        console.log('Speech detected');
      }
      lastSpeechTimeRef.current = currentTime;
      
      // Clear any existing silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } else {
      // Silence detected
      if (isSpeaking) {
        setIsSpeaking(false);
        console.log('Silence detected');
      }
      
      // Only start silence timeout if we've had meaningful speech
      const speechDuration = currentTime - lastSpeechTimeRef.current;
      if (lastSpeechTimeRef.current > 0 && speechDuration < SILENCE_DURATION && finalTranscriptRef.current.trim()) {
        if (!silenceTimeoutRef.current) {
          console.log('Starting silence timeout...');
          silenceTimeoutRef.current = setTimeout(() => {
            // User has stopped speaking for SILENCE_DURATION
            const totalSpeechTime = Date.now() - (lastSpeechTimeRef.current - speechDuration);
            
            if (finalTranscriptRef.current.trim() && totalSpeechTime > MIN_SPEECH_DURATION) {
              console.log('Speech finished, processing transcript:', finalTranscriptRef.current);
              setHasFinishedSpeaking(true);
              setTranscript(finalTranscriptRef.current);
              
              // Reset for next speech after a delay
              setTimeout(() => {
                if (isRecording) {
                  console.log('Ready for next speech');
                  finalTranscriptRef.current = '';
                  setHasFinishedSpeaking(false);
                  setTranscript('');
                  lastSpeechTimeRef.current = 0;
                }
              }, 1000);
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

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      setIsSpeaking(false);
      setHasFinishedSpeaking(false);
      lastSpeechTimeRef.current = 0;
      finalTranscriptRef.current = '';
      
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

      // Set up audio level monitoring and silence detection
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        analyserRef.current.fftSize = 512;
        analyserRef.current.smoothingTimeConstant = 0.8;

        // Start silence detection
        detectSilence();
      } catch (audioContextError) {
        console.warn('Audio level monitoring failed:', audioContextError);
      }

      // Set up Web Speech API for real-time transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
          console.log('Speech recognition started');
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
          
          // Update final transcript reference for silence detection
          if (finalTranscript) {
            finalTranscriptRef.current += finalTranscript;
            console.log('Final transcript updated:', finalTranscriptRef.current);
          }
          
          // Only show interim results while speaking, don't process them
          if (!hasFinishedSpeaking) {
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
          console.log('Speech recognition ended');
          // Restart recognition if still recording and not processing
          if (isRecording && !hasFinishedSpeaking && recognitionRef.current) {
            try {
              setTimeout(() => {
                if (recognitionRef.current && isRecording) {
                  recognitionRef.current.start();
                }
              }, 100);
            } catch (e) {
              console.warn('Failed to restart speech recognition:', e);
            }
          }
        };
        
        recognitionRef.current.start();
      } else {
        console.warn('Speech recognition not supported');
      }

      // Set up MediaRecorder for backup audio recording
      if (window.MediaRecorder) {
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = '';
            }
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

        mediaRecorderRef.current.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          setError('Recording failed');
        };

        mediaRecorderRef.current.start(100);
      }

      setIsRecording(true);
      console.log('Recording started with improved speech detection');
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setIsRecording(false);
    }
  }, [isRecording, detectSilence, hasFinishedSpeaking]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
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
        lastSpeechTimeRef.current = 0;
        finalTranscriptRef.current = '';
        console.log('Recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setHasFinishedSpeaking(false);
    finalTranscriptRef.current = '';
    lastSpeechTimeRef.current = 0;
  }, []);

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