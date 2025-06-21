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
  const lastVoiceActivityRef = useRef<number>(0);
  const voiceActivityBufferRef = useRef<number[]>([]);

  // Voice Activity Detection parameters
  const VOICE_FREQUENCY_MIN = 85;    // Minimum Hz for human voice
  const VOICE_FREQUENCY_MAX = 3400;  // Maximum Hz for human voice
  const VOICE_ENERGY_THRESHOLD = 0.02; // Minimum energy for voice
  const SILENCE_DURATION = 2000;     // 2 seconds of silence to finish
  const MIN_SPEECH_DURATION = 1000;  // Minimum 1 second of speech
  const VOICE_CONFIDENCE_THRESHOLD = 0.6; // 60% confidence it's voice

  // Advanced Voice Activity Detection
  const detectVoiceActivity = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);
    
    analyserRef.current.getByteTimeDomainData(dataArray);
    analyserRef.current.getByteFrequencyData(frequencyData);
    
    // Calculate overall audio level
    const average = dataArray.reduce((sum, value) => sum + Math.abs(value - 128), 0) / bufferLength;
    const normalizedLevel = average / 128;
    setAudioLevel(normalizedLevel);

    // Voice Activity Detection
    const isVoiceDetected = analyzeVoiceActivity(frequencyData, normalizedLevel);
    const currentTime = Date.now();
    
    if (isVoiceDetected) {
      lastVoiceActivityRef.current = currentTime;
      
      if (!isSpeaking) {
        speechStartTimeRef.current = currentTime;
        setIsSpeaking(true);
        setHasFinishedSpeaking(false);
        console.log('🎤 Human voice detected - speech started');
      }
      
      // Clear silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } else {
      // No voice detected
      if (isSpeaking && !silenceTimeoutRef.current) {
        // Start silence countdown
        silenceTimeoutRef.current = setTimeout(() => {
          const speechDuration = lastVoiceActivityRef.current - speechStartTimeRef.current;
          
          if (speechDuration >= MIN_SPEECH_DURATION && finalTranscriptRef.current.trim() && !isProcessingRef.current) {
            console.log('✅ Speech finished - processing transcript:', finalTranscriptRef.current);
            setIsSpeaking(false);
            setHasFinishedSpeaking(true);
            setTranscript(finalTranscriptRef.current.trim());
            isProcessingRef.current = true;
          } else if (speechDuration < MIN_SPEECH_DURATION) {
            console.log('⚠️ Speech too short, ignoring');
            setIsSpeaking(false);
            finalTranscriptRef.current = '';
          }
          
          silenceTimeoutRef.current = null;
        }, SILENCE_DURATION);
      }
    }

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(detectVoiceActivity);
    }
  }, [isRecording, isSpeaking]);

  // Analyze if the audio contains human voice
  const analyzeVoiceActivity = (frequencyData: Uint8Array, overallLevel: number): boolean => {
    if (overallLevel < VOICE_ENERGY_THRESHOLD) {
      return false; // Too quiet to be speech
    }

    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const binSize = nyquist / frequencyData.length;
    
    let voiceEnergySum = 0;
    let totalEnergySum = 0;
    let voiceBinCount = 0;
    
    // Analyze frequency spectrum
    for (let i = 0; i < frequencyData.length; i++) {
      const frequency = i * binSize;
      const magnitude = frequencyData[i] / 255;
      
      totalEnergySum += magnitude;
      
      // Check if frequency is in human voice range
      if (frequency >= VOICE_FREQUENCY_MIN && frequency <= VOICE_FREQUENCY_MAX) {
        voiceEnergySum += magnitude;
        voiceBinCount++;
      }
    }
    
    if (voiceBinCount === 0 || totalEnergySum === 0) {
      return false;
    }
    
    // Calculate voice confidence
    const voiceRatio = voiceEnergySum / totalEnergySum;
    const voiceConfidence = Math.min(voiceRatio * 2, 1); // Boost voice ratio
    
    // Additional checks for voice characteristics
    const hasVoiceFormants = checkForFormants(frequencyData, binSize);
    const hasVoicePitch = checkForPitch(frequencyData, binSize);
    
    // Combine all factors
    let finalConfidence = voiceConfidence;
    if (hasVoiceFormants) finalConfidence += 0.2;
    if (hasVoicePitch) finalConfidence += 0.2;
    
    // Add to rolling buffer for stability
    voiceActivityBufferRef.current.push(finalConfidence);
    if (voiceActivityBufferRef.current.length > 5) {
      voiceActivityBufferRef.current.shift();
    }
    
    // Use average of recent detections for stability
    const avgConfidence = voiceActivityBufferRef.current.reduce((sum, val) => sum + val, 0) / voiceActivityBufferRef.current.length;
    
    const isVoice = avgConfidence >= VOICE_CONFIDENCE_THRESHOLD;
    
    if (isVoice) {
      console.log(`🎯 Voice detected - Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    }
    
    return isVoice;
  };

  // Check for voice formants (resonant frequencies in human speech)
  const checkForFormants = (frequencyData: Uint8Array, binSize: number): boolean => {
    const formantRanges = [
      [200, 1000],   // F1 range
      [800, 2500],   // F2 range
      [1500, 3500]   // F3 range
    ];
    
    let formantCount = 0;
    
    for (const [minFreq, maxFreq] of formantRanges) {
      const minBin = Math.floor(minFreq / binSize);
      const maxBin = Math.floor(maxFreq / binSize);
      
      let peakMagnitude = 0;
      for (let i = minBin; i < maxBin && i < frequencyData.length; i++) {
        peakMagnitude = Math.max(peakMagnitude, frequencyData[i]);
      }
      
      if (peakMagnitude > 30) { // Threshold for formant presence
        formantCount++;
      }
    }
    
    return formantCount >= 2; // At least 2 formants for voice
  };

  // Check for pitch (fundamental frequency) typical of human voice
  const checkForPitch = (frequencyData: Uint8Array, binSize: number): boolean => {
    const pitchRange = [80, 400]; // Typical human pitch range
    const minBin = Math.floor(pitchRange[0] / binSize);
    const maxBin = Math.floor(pitchRange[1] / binSize);
    
    let maxMagnitude = 0;
    for (let i = minBin; i < maxBin && i < frequencyData.length; i++) {
      maxMagnitude = Math.max(maxMagnitude, frequencyData[i]);
    }
    
    return maxMagnitude > 25; // Threshold for pitch presence
  };

  const resetForNextSpeech = useCallback(() => {
    console.log('🔄 Resetting for next speech');
    finalTranscriptRef.current = '';
    speechStartTimeRef.current = 0;
    lastVoiceActivityRef.current = 0;
    isProcessingRef.current = false;
    voiceActivityBufferRef.current = [];
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
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Disable to preserve voice characteristics
          autoGainControl: true,
          sampleRate: 44100,
        } 
      });

      streamRef.current = stream;

      // Set up audio analysis for voice detection
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        // Optimized for voice detection
        analyserRef.current.fftSize = 2048; // Higher resolution for better frequency analysis
        analyserRef.current.smoothingTimeConstant = 0.3; // Moderate smoothing
        analyserRef.current.minDecibels = -90;
        analyserRef.current.maxDecibels = -10;

        detectVoiceActivity();
      } catch (audioContextError) {
        console.warn('Audio analysis failed:', audioContextError);
        setError('Voice detection not available - using basic audio detection');
      }

      // Set up speech recognition with better settings
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
            
            // Only accept high-confidence results
            if (event.results[i].isFinal && confidence > 0.7) {
              finalTranscript += transcript;
            } else if (!event.results[i].isFinal) {
              interimTranscript += transcript;
            }
          }
          
          // Update final transcript accumulator
          if (finalTranscript) {
            finalTranscriptRef.current += finalTranscript + ' ';
            console.log('📝 High-confidence transcript:', finalTranscriptRef.current);
          }
          
          // Show live transcript only if we're actively speaking
          if (!isProcessingRef.current && isSpeaking) {
            const displayTranscript = (finalTranscriptRef.current + interimTranscript).trim();
            setTranscript(displayTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'network') {
            setError('Network error - speech recognition unavailable');
          } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
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
      console.log('🎙️ Voice-only recording started');
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setIsRecording(false);
    }
  }, [isRecording, detectVoiceActivity, resetForNextSpeech, isSpeaking]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      console.log('🛑 Stopping recording');
      
      // If we have transcript when stopping, process it immediately
      if (finalTranscriptRef.current.trim() && !isProcessingRef.current) {
        const speechDuration = lastVoiceActivityRef.current - speechStartTimeRef.current;
        if (speechDuration >= MIN_SPEECH_DURATION) {
          console.log('🔄 Processing transcript on stop:', finalTranscriptRef.current);
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