import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../config/firebase';

export interface LegalDocument {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'txt';
  caseId: string;
  uploadedAt: Date;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  processed: boolean;
  extractedText?: string;
  summary?: string;
  tags: string[];
}

export interface CaseFile {
  id: string;
  title: string;
  client: string;
  type: 'litigation' | 'corporate' | 'employment' | 'immigration' | 'property' | 'intellectual-property';
  status: 'active' | 'pending' | 'completed' | 'on-hold';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  lastUpdated: Date;
  nextDeadline?: Date;
  documents: string[]; // Document IDs
  progress: number;
  notes: string;
  userId: string;
}

// Cloud Function for document processing
const processDocument = httpsCallable<
  { documentId: string; fileUrl: string }, 
  { extractedText: string; summary: string; tags: string[] }
>(functions, 'processDocument');

export class DocumentService {
  /**
   * Upload a document to Firebase Storage and create database record
   */
  static async uploadDocument(
    file: File, 
    caseId: string, 
    userId: string
  ): Promise<LegalDocument> {
    try {
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `documents/${userId}/${caseId}/${fileName}`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(uploadResult.ref);

      // Create document record in Firestore
      const documentData = {
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        type: this.getFileType(file.name),
        caseId,
        uploadedAt: Timestamp.now(),
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        processed: false,
        tags: [],
        userId
      };

      const docRef = await addDoc(collection(db, 'documents'), documentData);
      
      // Trigger document processing
      this.processDocumentAsync(docRef.id, fileUrl);

      return {
        id: docRef.id,
        ...documentData,
        uploadedAt: documentData.uploadedAt.toDate()
      } as LegalDocument;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document. Please try again.');
    }
  }

  /**
   * Process document asynchronously using Cloud Functions
   */
  private static async processDocumentAsync(documentId: string, fileUrl: string) {
    try {
      const result = await processDocument({ documentId, fileUrl });
      
      // Update document with processed data
      await updateDoc(doc(db, 'documents', documentId), {
        processed: true,
        extractedText: result.data.extractedText,
        summary: result.data.summary,
        tags: result.data.tags,
        lastProcessed: Timestamp.now()
      });
    } catch (error) {
      console.error('Error processing document:', error);
      // Mark as processing failed
      await updateDoc(doc(db, 'documents', documentId), {
        processed: false,
        processingError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all documents for a case
   */
  static async getCaseDocuments(caseId: string): Promise<LegalDocument[]> {
    try {
      const q = query(
        collection(db, 'documents'),
        where('caseId', '==', caseId),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt.toDate()
      })) as LegalDocument[];
    } catch (error) {
      console.error('Error getting case documents:', error);
      throw new Error('Failed to load documents. Please try again.');
    }
  }

  /**
   * Create a new case
   */
  static async createCase(caseData: Omit<CaseFile, 'id' | 'createdAt' | 'lastUpdated' | 'documents'>): Promise<CaseFile> {
    try {
      const newCase = {
        ...caseData,
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now(),
        documents: []
      };

      const docRef = await addDoc(collection(db, 'cases'), newCase);
      
      return {
        id: docRef.id,
        ...newCase,
        createdAt: newCase.createdAt.toDate(),
        lastUpdated: newCase.lastUpdated.toDate(),
        nextDeadline: caseData.nextDeadline
      } as CaseFile;
    } catch (error) {
      console.error('Error creating case:', error);
      throw new Error('Failed to create case. Please try again.');
    }
  }

  /**
   * Get all cases for a user
   */
  static async getUserCases(userId: string): Promise<CaseFile[]> {
    try {
      const q = query(
        collection(db, 'cases'),
        where('userId', '==', userId),
        orderBy('lastUpdated', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        lastUpdated: doc.data().lastUpdated.toDate(),
        nextDeadline: doc.data().nextDeadline?.toDate()
      })) as CaseFile[];
    } catch (error) {
      console.error('Error getting user cases:', error);
      throw new Error('Failed to load cases. Please try again.');
    }
  }

  /**
   * Update case progress and metadata
   */
  static async updateCase(caseId: string, updates: Partial<CaseFile>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        lastUpdated: Timestamp.now()
      };

      await updateDoc(doc(db, 'cases', caseId), updateData);
    } catch (error) {
      console.error('Error updating case:', error);
      throw new Error('Failed to update case. Please try again.');
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(documentId: string): Promise<void> {
    try {
      // Get document data first
      const docSnap = await getDoc(doc(db, 'documents', documentId));
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }

      const documentData = docSnap.data() as LegalDocument;
      
      // Delete from Storage
      const storageRef = ref(storage, documentData.fileUrl);
      await deleteObject(storageRef);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'documents', documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document. Please try again.');
    }
  }

  /**
   * Helper function to determine file type
   */
  private static getFileType(fileName: string): 'pdf' | 'docx' | 'txt' {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'docx': case 'doc': return 'docx';
      case 'txt': return 'txt';
      default: return 'pdf';
    }
  }
}