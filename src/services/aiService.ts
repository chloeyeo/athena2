import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export interface AIResponse {
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    type: 'statute' | 'case-law' | 'regulation' | 'guide';
    confidence: number;
  }>;
  audioUrl?: string;
  confidence: number;
}

export interface ConversationMessage {
  id: string;
  speaker: 'user' | 'athena';
  message: string;
  timestamp: Date;
  sources?: AIResponse['sources'];
  audioUrl?: string;
}

// Cloud Function callable for AI responses
const getAIResponse = httpsCallable<{ question: string; context?: string }, AIResponse>(
  functions,
  'getAIResponse'
);

// Cloud Function for speech-to-text
const transcribeAudio = httpsCallable<{ audioData: string }, { transcript: string }>(
  functions,
  'transcribeAudio'
);

// Cloud Function for text-to-speech
const synthesizeSpeech = httpsCallable<{ text: string; voiceSpeed: number }, { audioUrl: string }>(
  functions,
  'synthesizeSpeech'
);

export class AIService {
  /**
   * Get AI response using RAG pipeline
   * This calls a Cloud Function that:
   * 1. Converts question to vector using Vertex AI Embeddings
   * 2. Searches vector database (Cloud SQL with pgvector)
   * 3. Retrieves relevant document chunks
   * 4. Sends to Gemini Pro with strict prompt
   * 5. Returns response with source citations
   */
  static async askQuestion(question: string, context?: string): Promise<AIResponse> {
    try {
      const result = await getAIResponse({ question, context });
      return result.data;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  /**
   * Convert audio to text using Google Speech-to-Text
   */
  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      // Convert blob to base64
      const audioData = await this.blobToBase64(audioBlob);
      const result = await transcribeAudio({ audioData });
      return result.data.transcript;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  }

  /**
   * Convert text to speech using Google Text-to-Speech
   */
  static async synthesizeSpeech(text: string, voiceSpeed: number = 1.0): Promise<string> {
    try {
      const result = await synthesizeSpeech({ text, voiceSpeed });
      return result.data.audioUrl;
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw new Error('Failed to synthesize speech. Please try again.');
    }
  }

  /**
   * Simulate real-time conversation with Athena
   * This would integrate with the live call interface
   */
  static async startConversation(initialMessage?: string): Promise<ConversationMessage[]> {
    const conversation: ConversationMessage[] = [];

    // Add Athena's greeting
    const greeting = initialMessage || 
      "Hello! I'm Athena, your AI legal mentor. I'm here to provide accurate, source-backed legal guidance. How can I help you today?";

    const athenaMessage: ConversationMessage = {
      id: `athena-${Date.now()}`,
      speaker: 'athena',
      message: greeting,
      timestamp: new Date(),
      sources: []
    };

    // Generate audio for Athena's response
    try {
      athenaMessage.audioUrl = await this.synthesizeSpeech(greeting);
    } catch (error) {
      console.warn('Failed to generate audio for greeting:', error);
    }

    conversation.push(athenaMessage);
    return conversation;
  }

  /**
   * Process user message and get Athena's response
   */
  static async processMessage(
    message: string, 
    conversationHistory: ConversationMessage[]
  ): Promise<ConversationMessage> {
    // Create user message
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      message,
      timestamp: new Date()
    };

    // Get context from conversation history
    const context = conversationHistory
      .slice(-5) // Last 5 messages for context
      .map(msg => `${msg.speaker}: ${msg.message}`)
      .join('\n');

    // Get AI response
    const aiResponse = await this.askQuestion(message, context);

    // Create Athena's response message
    const athenaMessage: ConversationMessage = {
      id: `athena-${Date.now()}`,
      speaker: 'athena',
      message: aiResponse.answer,
      timestamp: new Date(),
      sources: aiResponse.sources
    };

    // Generate audio for Athena's response
    try {
      athenaMessage.audioUrl = await this.synthesizeSpeech(aiResponse.answer);
    } catch (error) {
      console.warn('Failed to generate audio for response:', error);
    }

    return athenaMessage;
  }

  /**
   * Helper function to convert blob to base64
   */
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}