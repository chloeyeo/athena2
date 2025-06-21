import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { aiService } from './services/aiService';
import { documentProcessor } from './services/documentProcessor';
import { speechService } from './services/speechService';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function for AI responses using RAG pipeline
 * This implements the "No Hallucination" guarantee by:
 * 1. Converting questions to vectors using Vertex AI Embeddings
 * 2. Searching curated legal database with semantic similarity
 * 3. Retrieving only relevant, verified document chunks
 * 4. Sending to Gemini Pro with strict prompt constraints
 * 5. Returning responses with mandatory source citations
 */
export const getAIResponse = functions.region('europe-west2').https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { question, context: conversationContext } = data;

  if (!question || typeof question !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Question is required');
  }

  try {
    // Use AI service to get response with RAG pipeline
    const response = await aiService.getAIResponse(question, conversationContext);
    
    // Log the interaction for monitoring
    await admin.firestore().collection('ai_interactions').add({
      userId: context.auth.uid,
      question,
      response: response.answer,
      sources: response.sources,
      confidence: response.confidence,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return response;
  } catch (error) {
    console.error('Error in getAIResponse:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get AI response');
  }
});

/**
 * Cloud Function for speech-to-text transcription
 * Uses Google Cloud Speech-to-Text API for real-time transcription
 */
export const transcribeAudio = functions.region('europe-west2').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { audioData } = data;

  if (!audioData) {
    throw new functions.https.HttpsError('invalid-argument', 'Audio data is required');
  }

  try {
    const transcript = await speechService.transcribeAudio(audioData);
    return { transcript };
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw new functions.https.HttpsError('internal', 'Failed to transcribe audio');
  }
});

/**
 * Cloud Function for text-to-speech synthesis
 * Uses Google Cloud Text-to-Speech API with accessibility features
 */
export const synthesizeSpeech = functions.region('europe-west2').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { text, voiceSpeed = 1.0 } = data;

  if (!text || typeof text !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Text is required');
  }

  try {
    const audioUrl = await speechService.synthesizeSpeech(text, voiceSpeed);
    return { audioUrl };
  } catch (error) {
    console.error('Error in synthesizeSpeech:', error);
    throw new functions.https.HttpsError('internal', 'Failed to synthesize speech');
  }
});

/**
 * Cloud Function for document processing
 * Extracts text, generates summaries, and creates embeddings for RAG
 */
export const processDocument = functions.region('europe-west2').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { documentId, fileUrl } = data;

  if (!documentId || !fileUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Document ID and file URL are required');
  }

  try {
    const result = await documentProcessor.processDocument(documentId, fileUrl);
    return result;
  } catch (error) {
    console.error('Error in processDocument:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process document');
  }
});

/**
 * Firestore trigger for real-time document processing
 * Automatically processes documents when uploaded
 */
export const onDocumentCreated = functions.region('europe-west2').firestore
  .document('documents/{documentId}')
  .onCreate(async (snap, context) => {
    const documentData = snap.data();
    const documentId = context.params.documentId;

    try {
      // Process the document
      const result = await documentProcessor.processDocument(documentId, documentData.fileUrl);
      
      // Update the document with processed data
      await snap.ref.update({
        processed: true,
        extractedText: result.extractedText,
        summary: result.summary,
        tags: result.tags,
        lastProcessed: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      
      // Mark as processing failed
      await snap.ref.update({
        processed: false,
        processingError: error instanceof Error ? error.message : 'Unknown error',
        lastProcessed: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });