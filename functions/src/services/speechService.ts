import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import { Storage } from '@google-cloud/storage';

class SpeechService {
  private ttsClient: TextToSpeechClient;
  private speechClient: SpeechClient;
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.ttsClient = new TextToSpeechClient();
    this.speechClient = new SpeechClient();
    this.storage = new Storage();
    this.bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'your-project-id.appspot.com';
  }

  /**
   * Convert text to speech using Google Cloud Text-to-Speech
   * Supports accessibility features like variable speech speed
   */
  async synthesizeSpeech(text: string, voiceSpeed: number = 1.0): Promise<string> {
    try {
      const request = {
        input: { text },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Neural2-F', // Professional female voice
          ssmlGender: 'FEMALE' as const
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: Math.max(0.25, Math.min(4.0, voiceSpeed)), // Clamp between 0.25x and 4x
          pitch: 0,
          volumeGainDb: 0
        }
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      if (!response.audioContent) {
        throw new Error('No audio content generated');
      }

      // Upload audio to Firebase Storage
      const fileName = `speech/${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
      const file = this.storage.bucket(this.bucketName).file(fileName);
      
      await file.save(response.audioContent as Buffer, {
        metadata: {
          contentType: 'audio/mpeg',
          cacheControl: 'public, max-age=3600' // Cache for 1 hour
        }
      });

      // Make file publicly accessible
      await file.makePublic();

      // Return public URL
      return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  /**
   * Convert speech to text using Google Cloud Speech-to-Text
   * Optimized for real-time transcription during live calls
   */
  async transcribeAudio(audioData: string): Promise<string> {
    try {
      const audioBytes = Buffer.from(audioData, 'base64');

      const request = {
        audio: {
          content: audioBytes
        },
        config: {
          encoding: 'WEBM_OPUS' as const, // Common format for web audio
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false,
          model: 'latest_long', // Best for longer audio segments
          useEnhanced: true // Use enhanced model for better accuracy
        }
      };

      const [response] = await this.speechClient.recognize(request);
      
      if (!response.results || response.results.length === 0) {
        return '';
      }

      // Combine all transcription results
      const transcript = response.results
        .map(result => result.alternatives?.[0]?.transcript || '')
        .join(' ')
        .trim();

      return transcript;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Stream audio transcription for real-time processing
   * This would be used for live call transcription
   */
  async streamTranscription(audioStream: NodeJS.ReadableStream): Promise<NodeJS.ReadableStream> {
    try {
      const request = {
        config: {
          encoding: 'WEBM_OPUS' as const,
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          interimResults: true, // Get partial results
          singleUtterance: false,
          model: 'latest_short' // Optimized for streaming
        },
        interimResults: true
      };

      const recognizeStream = this.speechClient
        .streamingRecognize(request)
        .on('error', (error) => {
          console.error('Streaming transcription error:', error);
        });

      // Pipe audio stream to recognition
      audioStream.pipe(recognizeStream);

      return recognizeStream;
    } catch (error) {
      console.error('Error setting up streaming transcription:', error);
      throw new Error('Failed to setup streaming transcription');
    }
  }
}

export const speechService = new SpeechService();