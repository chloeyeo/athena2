import { VertexAI } from '@google-cloud/aiplatform';
import * as admin from 'firebase-admin';

interface AIResponse {
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    type: 'statute' | 'case-law' | 'regulation' | 'guide';
    confidence: number;
  }>;
  confidence: number;
}

interface DocumentChunk {
  id: string;
  content: string;
  title: string;
  url: string;
  type: string;
  embedding: number[];
}

class AIService {
  private vertexAI: VertexAI;
  private projectId: string;
  private location: string;

  constructor() {
    this.projectId = process.env.GCP_PROJECT_ID || 'your-project-id';
    this.location = process.env.GCP_REGION || 'us-central1';
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location
    });
  }

  /**
   * Main RAG pipeline for AI responses
   * This is the core "No Hallucination" engine
   */
  async getAIResponse(question: string, context?: string): Promise<AIResponse> {
    try {
      // Step 1: Generate embedding for the question
      const questionEmbedding = await this.generateEmbedding(question);

      // Step 2: Search for relevant document chunks using semantic similarity
      const relevantChunks = await this.searchDocuments(questionEmbedding);

      if (relevantChunks.length === 0) {
        return {
          answer: "I don't have enough information in my knowledge base to answer that question accurately. Could you please rephrase or ask about a different legal topic?",
          sources: [],
          confidence: 0
        };
      }

      // Step 3: Generate response using Gemini Pro with retrieved context
      const response = await this.generateResponse(question, relevantChunks, context);

      return response;
    } catch (error) {
      console.error('Error in getAIResponse:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate embedding using Vertex AI Text Embeddings
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.vertexAI.preview.getGenerativeModel({
        model: 'textembedding-gecko@003'
      });

      const result = await model.embedContent({
        content: [{ role: 'user', parts: [{ text }] }]
      });

      return result.response.predictions[0].embeddings.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Search documents using vector similarity
   * This queries the curated legal knowledge base
   */
  private async searchDocuments(queryEmbedding: number[]): Promise<DocumentChunk[]> {
    try {
      // In a production system, this would query a vector database like:
      // - Cloud SQL with pgvector extension
      // - AlloyDB AI
      // - Vertex AI Vector Search
      
      // For now, we'll simulate with Firestore and compute similarity
      const documentsRef = admin.firestore().collection('document_chunks');
      const snapshot = await documentsRef.limit(100).get();

      const chunks: DocumentChunk[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.embedding) {
          chunks.push({
            id: doc.id,
            content: data.content,
            title: data.title,
            url: data.url,
            type: data.type,
            embedding: data.embedding
          });
        }
      });

      // Calculate cosine similarity and sort by relevance
      const scoredChunks = chunks.map(chunk => ({
        ...chunk,
        similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
      })).sort((a, b) => b.similarity - a.similarity);

      // Return top 5 most relevant chunks with similarity > 0.7
      return scoredChunks
        .filter(chunk => chunk.similarity > 0.7)
        .slice(0, 5);
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error('Failed to search documents');
    }
  }

  /**
   * Generate response using Gemini Pro with strict prompt engineering
   */
  private async generateResponse(
    question: string, 
    relevantChunks: DocumentChunk[], 
    context?: string
  ): Promise<AIResponse> {
    try {
      const model = this.vertexAI.preview.getGenerativeModel({
        model: 'gemini-1.5-pro-preview-0409',
        generationConfig: {
          temperature: 0.1, // Low temperature for consistency
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024
        }
      });

      // Construct the context from retrieved chunks
      const retrievedContext = relevantChunks.map((chunk, index) => 
        `[Source ${index + 1}] ${chunk.title}\n${chunk.content}\n`
      ).join('\n');

      // Strict prompt engineering to prevent hallucination
      const systemPrompt = `You are Athena, an AI legal mentor. You MUST follow these rules:

1. ONLY use information from the provided sources below
2. NEVER make up or infer information not explicitly stated in the sources
3. Always cite your sources using [Source X] format
4. If the sources don't contain enough information, say so clearly
5. Provide accurate, helpful legal guidance based solely on the retrieved context
6. Be conversational but professional

Retrieved Legal Sources:
${retrievedContext}

${context ? `Previous conversation context:\n${context}\n` : ''}

User Question: ${question}

Provide a helpful answer using ONLY the information from the sources above. Include source citations for all claims.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
      });

      const answer = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 
        "I apologize, but I couldn't generate a response. Please try again.";

      // Extract sources with confidence scores
      const sources = relevantChunks.map(chunk => ({
        title: chunk.title,
        url: chunk.url,
        snippet: chunk.content.substring(0, 200) + '...',
        type: chunk.type as 'statute' | 'case-law' | 'regulation' | 'guide',
        confidence: chunk.similarity || 0.8
      }));

      // Calculate overall confidence based on source relevance
      const avgConfidence = sources.reduce((sum, source) => sum + source.confidence, 0) / sources.length;

      return {
        answer,
        sources,
        confidence: avgConfidence
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate response');
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const aiService = new AIService();