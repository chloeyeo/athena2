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
}

export function useAudioRecording(): UseAudioRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
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

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      
      // Check if getUserMedia is supported
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

      // Set up audio level monitoring
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateAudioLevel = () => {
          if (analyserRef.current && isRecording) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
            setAudioLevel(average / 255);
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          }
        };

        updateAudioLevel();
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
          
          setTranscript(finalTranscript + interimTranscript);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error !== 'no-speech') {
            setError(`Speech recognition error: ${event.error}`);
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
          console.log('Speech recognition ended');
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
      console.log('Recording started');
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setIsRecording(false);
    }
  }, [isRecording]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
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
        setAudioLevel(0);
        console.log('Recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioLevel,
    error,
    isListening,
    transcript,
    clearTranscript
  };
}