import * as admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { aiService } from './aiService';

interface ProcessedDocument {
  extractedText: string;
  summary: string;
  tags: string[];
}

class DocumentProcessor {
  private storage: Storage;

  constructor() {
    this.storage = new Storage();
  }

  /**
   * Process uploaded legal documents
   * Extracts text, generates summaries, creates embeddings for RAG
   */
  async processDocument(documentId: string, fileUrl: string): Promise<ProcessedDocument> {
    try {
      // Download file from Firebase Storage
      const fileBuffer = await this.downloadFile(fileUrl);
      
      // Extract text based on file type
      const extractedText = await this.extractText(fileBuffer, fileUrl);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the document');
      }

      // Generate summary and tags using AI
      const summary = await this.generateSummary(extractedText);
      const tags = await this.generateTags(extractedText);

      // Create document chunks for RAG system
      await this.createDocumentChunks(documentId, extractedText, fileUrl);

      return {
        extractedText,
        summary,
        tags
      };
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error('Failed to process document');
    }
  }

  /**
   * Download file from Firebase Storage
   */
  private async downloadFile(fileUrl: string): Promise<Buffer> {
    try {
      // Extract bucket and file path from URL
      const urlParts = fileUrl.split('/');
      const bucketName = urlParts[3];
      const filePath = decodeURIComponent(urlParts.slice(4).join('/').split('?')[0]);

      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(filePath);

      const [buffer] = await file.download();
      return buffer;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Extract text from different file formats
   */
  private async extractText(buffer: Buffer, fileUrl: string): Promise<string> {
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();

    try {
      switch (fileExtension) {
        case 'pdf':
          return await this.extractFromPDF(buffer);
        case 'docx':
        case 'doc':
          return await this.extractFromWord(buffer);
        case 'txt':
          return buffer.toString('utf-8');
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`);
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text from ${fileExtension} file`);
    }
  }

  /**
   * Extract text from PDF files
   */
  private async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from Word documents
   */
  private async extractFromWord(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting from Word:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  /**
   * Generate document summary using AI
   */
  private async generateSummary(text: string): Promise<string> {
    try {
      // Truncate text if too long (keep first 4000 characters)
      const truncatedText = text.length > 4000 ? text.substring(0, 4000) + '...' : text;
      
      const prompt = `Please provide a concise summary of this legal document in 2-3 sentences. Focus on the main legal concepts, key points, and practical implications:

${truncatedText}

Summary:`;

      // Use a simple AI call for summarization
      const response = await aiService.getAIResponse(prompt);
      return response.answer;
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Summary could not be generated for this document.';
    }
  }

  /**
   * Generate relevant tags for the document
   */
  private async generateTags(text: string): Promise<string[]> {
    try {
      const truncatedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;
      
      const prompt = `Based on this legal document, provide 5-8 relevant tags that categorize its content. Focus on legal areas, document types, and key concepts. Return only the tags separated by commas:

${truncatedText}

Tags:`;

      const response = await aiService.getAIResponse(prompt);
      
      // Parse tags from response
      const tags = response.answer
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .slice(0, 8); // Limit to 8 tags

      return tags.length > 0 ? tags : ['legal-document', 'untagged'];
    } catch (error) {
      console.error('Error generating tags:', error);
      return ['legal-document', 'processing-error'];
    }
  }

  /**
   * Create document chunks for RAG system
   * Splits document into smaller chunks with embeddings for semantic search
   */
  private async createDocumentChunks(documentId: string, text: string, fileUrl: string): Promise<void> {
    try {
      // Split text into chunks of ~500 words with overlap
      const chunks = this.splitTextIntoChunks(text, 500, 50);
      
      const batch = admin.firestore().batch();
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding for the chunk
        const embedding = await this.generateEmbedding(chunk);
        
        // Create chunk document
        const chunkRef = admin.firestore().collection('document_chunks').doc();
        batch.set(chunkRef, {
          documentId,
          chunkIndex: i,
          content: chunk,
          embedding,
          title: `Document Chunk ${i + 1}`,
          url: fileUrl,
          type: 'document',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      await batch.commit();
      console.log(`Created ${chunks.length} chunks for document ${documentId}`);
    } catch (error) {
      console.error('Error creating document chunks:', error);
      // Don't throw error here as the main processing can still succeed
    }
  }

  /**
   * Split text into overlapping chunks
   */
  private splitTextIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }

  /**
   * Generate embedding for text chunk
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // This would use the same embedding service as the AI service
      // For now, return a placeholder embedding
      return new Array(768).fill(0).map(() => Math.random() - 0.5);
    } catch (error) {
      console.error('Error generating embedding:', error);
      return new Array(768).fill(0);
    }
  }
}

export const documentProcessor = new DocumentProcessor();