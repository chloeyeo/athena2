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
  understood: boolean;
}

export interface ConversationMessage {
  id: string;
  speaker: 'user' | 'athena';
  message: string;
  timestamp: Date;
  sources?: AIResponse['sources'];
  audioUrl?: string;
}

// Mock legal knowledge base for better responses
const LEGAL_KNOWLEDGE = {
  'contract': {
    keywords: ['contract', 'agreement', 'breach', 'terms', 'clause', 'dispute', 'negotiation'],
    response: "For contract disputes, the first step is to review the contract terms carefully. Under English contract law, you should identify any breaches and consider remedies available. I recommend documenting all communications and attempting negotiation before litigation. The Contract Rights of Third Parties Act 1999 may also be relevant depending on the circumstances.",
    sources: [
      { title: "Contract Rights of Third Parties Act 1999", url: "https://legislation.gov.uk", snippet: "An Act to make provision for the enforcement of contractual terms by third parties.", type: "statute" as const, confidence: 0.95 },
      { title: "Contract Law Principles", url: "https://gov.uk/contract-law", snippet: "Basic principles of contract formation and enforcement in English law.", type: "guide" as const, confidence: 0.88 }
    ]
  },
  'solicitor': {
    keywords: ['solicitor', 'qualify', 'sqe', 'training', 'barrister', 'lawyer', 'legal profession'],
    response: "To qualify as a solicitor in England and Wales, you need to complete the Solicitors Qualifying Examination (SQE). This consists of SQE1, which tests functioning legal knowledge, and SQE2, which assesses practical legal skills. You'll also need qualifying work experience and meet character and suitability requirements set by the SRA.",
    sources: [
      { title: "SRA Handbook - SQE Requirements", url: "https://sra.org.uk/sqa", snippet: "SQE1 is a computer-based assessment that tests functioning legal knowledge across various legal areas.", type: "regulation" as const, confidence: 0.96 },
      { title: "Solicitors Qualifying Examination Guide", url: "https://sra.org.uk/sqa-guide", snippet: "Comprehensive guide to the SQE pathway for becoming a solicitor.", type: "guide" as const, confidence: 0.92 }
    ]
  },
  'employment': {
    keywords: ['employment', 'dismissal', 'discrimination', 'tribunal', 'unfair', 'redundancy', 'workplace'],
    response: "Employment law in the UK provides various protections for workers. For unfair dismissal claims, you generally need two years of continuous employment. Discrimination claims can be brought regardless of length of service. The Employment Tribunal system handles most employment disputes, with strict time limits usually of three months less one day from the incident.",
    sources: [
      { title: "Employment Rights Act 1996", url: "https://legislation.gov.uk/ukpga/1996/18", snippet: "The main statute governing employment rights in the UK.", type: "statute" as const, confidence: 0.94 },
      { title: "ACAS Employment Law Guide", url: "https://acas.org.uk", snippet: "Practical guidance on employment law and workplace disputes.", type: "guide" as const, confidence: 0.89 }
    ]
  },
  'property': {
    keywords: ['property', 'conveyancing', 'lease', 'landlord', 'tenant', 'mortgage', 'freehold', 'leasehold'],
    response: "Property law in England and Wales covers both freehold and leasehold interests. For residential property transactions, conveyancing involves searches, surveys, and exchange of contracts. Landlord and tenant law is governed by various statutes including the Housing Act 1988 for assured tenancies and the Landlord and Tenant Act 1985 for repair obligations.",
    sources: [
      { title: "Housing Act 1988", url: "https://legislation.gov.uk/ukpga/1988/50", snippet: "Governs assured and assured shorthold tenancies in England and Wales.", type: "statute" as const, confidence: 0.93 },
      { title: "Law Society Conveyancing Handbook", url: "https://lawsociety.org.uk", snippet: "Professional guidance on residential conveyancing procedures.", type: "guide" as const, confidence: 0.87 }
    ]
  }
};

// Cloud Function callable for AI responses
const getAIResponse = httpsCallable<{ question: string; context?: string }, AIResponse>(
  functions,
  'getAIResponse'
);

export class AIService {
  /**
   * Enhanced AI response with better understanding and legal scenario simulation
   */
  static async askQuestion(question: string, context?: string): Promise<AIResponse> {
    try {
      // Analyze question for legal topics
      const analyzedResponse = this.analyzeQuestion(question);
      
      if (analyzedResponse.understood) {
        return analyzedResponse;
      }

      // Fallback to cloud function for complex queries
      try {
        const result = await getAIResponse({ question, context });
        return result.data;
      } catch (cloudError) {
        console.warn('Cloud function failed, using local analysis:', cloudError);
        return this.getNotUnderstoodResponse(question);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      return this.getNotUnderstoodResponse(question);
    }
  }

  /**
   * Analyze question locally for better understanding
   */
  private static analyzeQuestion(question: string): AIResponse {
    const lowerQuestion = question.toLowerCase();
    
    // Check for greetings
    if (this.isGreeting(lowerQuestion)) {
      return {
        answer: "Hello! I'm Athena, your AI legal mentor. I'm here to help you with legal questions and provide guidance on various areas of law. I can assist with contract law, employment issues, property matters, and professional development for lawyers. What would you like to discuss today?",
        sources: [],
        confidence: 1.0,
        understood: true
      };
    }

    // Check for legal scenarios and professional development
    if (this.isProfessionalDevelopmentQuery(lowerQuestion)) {
      return this.getProfessionalDevelopmentResponse(lowerQuestion);
    }

    // Check against knowledge base
    for (const [topic, knowledge] of Object.entries(LEGAL_KNOWLEDGE)) {
      if (knowledge.keywords.some(keyword => lowerQuestion.includes(keyword))) {
        return {
          answer: knowledge.response,
          sources: knowledge.sources,
          confidence: 0.9,
          understood: true
        };
      }
    }

    // Check for specific legal scenarios
    if (this.isLegalScenario(lowerQuestion)) {
      return this.getLegalScenarioResponse(lowerQuestion);
    }

    return {
      answer: "",
      sources: [],
      confidence: 0,
      understood: false
    };
  }

  /**
   * Check if the input is a greeting
   */
  private static isGreeting(question: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => question.includes(greeting));
  }

  /**
   * Check if the question is about professional development
   */
  private static isProfessionalDevelopmentQuery(question: string): boolean {
    const professionalKeywords = [
      'junior lawyer', 'trainee', 'pupil', 'legal career', 'law school', 'legal skills',
      'communication skills', 'drafting', 'legal writing', 'client interview', 'negotiation',
      'court appearance', 'advocacy', 'legal research', 'case preparation', 'confidence',
      'judgment', 'decision making', 'legal practice', 'professional development'
    ];
    
    return professionalKeywords.some(keyword => question.includes(keyword));
  }

  /**
   * Get professional development response
   */
  private static getProfessionalDevelopmentResponse(question: string): AIResponse {
    if (question.includes('communication') || question.includes('client')) {
      return {
        answer: "Effective client communication is crucial for junior lawyers. Key principles include: active listening, clear explanations avoiding legal jargon, regular updates on case progress, and setting realistic expectations. Practice scenarios: initial client meetings, explaining complex legal concepts, delivering difficult news, and managing client expectations during lengthy proceedings.",
        sources: [
          { title: "SRA Code of Conduct - Client Care", url: "https://sra.org.uk/code-conduct", snippet: "Professional standards for client communication and care.", type: "regulation" as const, confidence: 0.94 },
          { title: "Law Society Practice Note - Client Care", url: "https://lawsociety.org.uk", snippet: "Best practice guidance for client relationship management.", type: "guide" as const, confidence: 0.89 }
        ],
        confidence: 0.92,
        understood: true
      };
    }

    if (question.includes('drafting') || question.includes('writing')) {
      return {
        answer: "Legal drafting requires precision, clarity, and attention to detail. For junior lawyers, focus on: understanding the purpose and audience, using plain English where possible, structuring documents logically, and thorough proofreading. Practice with contracts, letters before action, witness statements, and court documents. Always have senior review before finalizing.",
        sources: [
          { title: "Legal Writing Style Guide", url: "https://lawsociety.org.uk/writing", snippet: "Professional guidance on legal writing and drafting.", type: "guide" as const, confidence: 0.88 },
          { title: "Contract Drafting Best Practices", url: "https://sra.org.uk/drafting", snippet: "Standards for legal document preparation.", type: "guide" as const, confidence: 0.85 }
        ],
        confidence: 0.90,
        understood: true
      };
    }

    if (question.includes('confidence') || question.includes('judgment')) {
      return {
        answer: "Building confidence as a junior lawyer comes through practice and experience. Key strategies: prepare thoroughly for all matters, ask questions when uncertain, observe senior colleagues, practice presentations and advocacy, seek feedback regularly, and learn from mistakes. Remember that good judgment develops over time through exposure to various legal scenarios.",
        sources: [
          { title: "Junior Lawyer Development Guide", url: "https://lawsociety.org.uk/careers", snippet: "Career development resources for junior legal professionals.", type: "guide" as const, confidence: 0.87 },
          { title: "Legal Professional Development", url: "https://sra.org.uk/cpd", snippet: "Continuing professional development requirements and guidance.", type: "regulation" as const, confidence: 0.91 }
        ],
        confidence: 0.89,
        understood: true
      };
    }

    // General professional development response
    return {
      answer: "Professional development for junior lawyers should focus on building core competencies: legal knowledge, practical skills, client care, and professional conduct. Key areas include legal research, case analysis, document drafting, client communication, time management, and ethical practice. Regular supervision, feedback, and continuing education are essential for career progression.",
      sources: [
        { title: "SRA Training Regulations", url: "https://sra.org.uk/training", snippet: "Requirements for legal training and professional development.", type: "regulation" as const, confidence: 0.93 },
        { title: "Law Society Career Development", url: "https://lawsociety.org.uk/careers", snippet: "Resources for legal career progression and skills development.", type: "guide" as const, confidence: 0.88 }
      ],
      confidence: 0.88,
      understood: true
    };
  }

  /**
   * Check if the question describes a legal scenario
   */
  private static isLegalScenario(question: string): boolean {
    const scenarioIndicators = [
      'what if', 'suppose', 'imagine', 'scenario', 'situation', 'case study',
      'my client', 'a client', 'someone', 'what would you do', 'how would you handle',
      'what advice', 'what should', 'how to deal with'
    ];
    
    return scenarioIndicators.some(indicator => question.includes(indicator));
  }

  /**
   * Get response for legal scenarios
   */
  private static getLegalScenarioResponse(question: string): AIResponse {
    return {
      answer: "I understand you're presenting a legal scenario. To provide the most accurate guidance, I need to analyze this against established legal principles and precedents. Could you provide more specific details about the situation? For example: the jurisdiction, relevant dates, parties involved, and specific legal issues you're concerned about. This will help me give you more targeted advice with appropriate source citations.",
      sources: [
        { title: "Legal Problem-Solving Methodology", url: "https://lawsociety.org.uk/methodology", snippet: "Systematic approach to analyzing legal problems and scenarios.", type: "guide" as const, confidence: 0.85 }
      ],
      confidence: 0.75,
      understood: true
    };
  }

  /**
   * Get "not understood" response
   */
  private static getNotUnderstoodResponse(question: string): AIResponse {
    return {
      answer: "I don't understand your question or I don't have enough information in my legal knowledge base to provide an accurate answer. Could you please rephrase your question or provide more specific details? I can help with contract law, employment issues, property matters, professional development for lawyers, and general legal guidance in England and Wales.",
      sources: [],
      confidence: 0,
      understood: false
    };
  }

  /**
   * Process user message and get Athena's response for live conversation
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
      .slice(-3) // Last 3 messages for context
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

    return athenaMessage;
  }

  /**
   * Start conversation with greeting
   */
  static async startConversation(): Promise<ConversationMessage[]> {
    const greeting = "Hello! I'm Athena, your AI legal mentor. I'm here to provide accurate, source-backed legal guidance and help with your professional development. I can assist with legal scenarios, answer questions about law, and provide feedback on legal skills. How can I help you today?";

    const athenaMessage: ConversationMessage = {
      id: `athena-${Date.now()}`,
      speaker: 'athena',
      message: greeting,
      timestamp: new Date(),
      sources: []
    };

    return [athenaMessage];
  }
}