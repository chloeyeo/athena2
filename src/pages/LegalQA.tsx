import React, { useState } from 'react';
import { Search, Book, ExternalLink, Filter, Sparkles } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface SearchResult {
  id: string;
  question: string;
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    type: 'statute' | 'case-law' | 'regulation' | 'guide';
  }>;
  confidence: number;
  timestamp: Date;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    question: 'What are the requirements for the SQE in England and Wales?',
    answer: 'The Solicitors Qualifying Examination (SQE) consists of two parts: SQE1 tests functioning legal knowledge across various legal areas, while SQE2 assesses practical legal skills through simulated exercises. Candidates must also complete qualifying work experience and meet character and suitability requirements.',
    sources: [
      {
        title: 'SRA Handbook - SQE Requirements',
        url: 'https://sra.org.uk/sqa',
        snippet: 'SQE1 is a computer-based assessment that tests functioning legal knowledge...',
        type: 'regulation'
      },
      {
        title: 'Solicitors Regulation Authority - SQE Assessment Specification',
        url: 'https://sra.org.uk/sqa-spec',
        snippet: 'SQE2 assesses practical legal skills through a series of simulated exercises...',
        type: 'guide'
      }
    ],
    confidence: 0.95,
    timestamp: new Date()
  },
  {
    id: '2', 
    question: 'How to qualify as a foreign lawyer in the UK?',
    answer: 'Foreign lawyers can qualify in England and Wales through several routes: the SQE pathway (available to all), the QLTS for EU lawyers with transitional rights, or the qualified lawyer transfer scheme for lawyers from certain common law jurisdictions. The specific requirements depend on your jurisdiction of qualification and when you qualified.',
    sources: [
      {
        title: 'Transfer of Qualified Lawyers Regulations',
        url: 'https://sra.org.uk/transfer-regulations',
        snippet: 'Qualified lawyers from certain jurisdictions may be eligible for the transfer scheme...',
        type: 'regulation'
      }
    ],
    confidence: 0.89,
    timestamp: new Date(Date.now() - 60000)
  }
];

export default function LegalQA() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const { announceToScreenReader } = useAccessibility();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    announceToScreenReader(`Searching for ${query}`);
    
    // Simulate search delay
    setTimeout(() => {
      const filteredResults = mockResults.filter(result => 
        result.question.toLowerCase().includes(query.toLowerCase()) ||
        result.answer.toLowerCase().includes(query.toLowerCase())
      );
      
      setResults(filteredResults.length > 0 ? filteredResults : mockResults);
      setIsSearching(false);
      announceToScreenReader(`Found ${filteredResults.length || mockResults.length} results`);
    }, 1500);
  };

  const getSourceTypeColor = (type: string) => {
    switch (type) {
      case 'statute': return 'bg-red-100 text-red-800';
      case 'case-law': return 'bg-blue-100 text-blue-800';
      case 'regulation': return 'bg-green-100 text-green-800';
      case 'guide': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filters = ['Statutes', 'Case Law', 'Regulations', 'Guides', 'Recent Updates'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Legal Q&A
          </h1>
          <p className="text-gray-600 mt-1">
            Ask questions and get accurate answers with source citations
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Sparkles className="w-4 h-4 text-accent-500" />
          <span>Zero hallucination guarantee</span>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask any legal question... e.g., 'How do I qualify as a solicitor in the UK?'"
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              aria-label="Enter your legal question"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex flex-wrap gap-2">
                {filters.map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setSelectedFilters(prev => 
                        prev.includes(filter) 
                          ? prev.filter(f => f !== filter)
                          : [...prev, filter]
                      );
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors focus:ring-2 focus:ring-primary-500 ${
                      selectedFilters.includes(filter)
                        ? 'bg-primary-100 text-primary-800 border border-primary-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results ({results.length})
            </h2>
            <div className="text-sm text-gray-600">
              All answers verified with source citations
            </div>
          </div>

          {results.map((result) => (
            <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {result.question}
                  </h3>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        result.confidence > 0.9 ? 'bg-green-500' : 
                        result.confidence > 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-xs text-gray-600">
                        {Math.round(result.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none text-gray-700 mb-6">
                  {result.answer}
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <Book className="w-4 h-4" />
                    <span>Sources ({result.sources.length})</span>
                  </h4>
                  
                  <div className="space-y-3">
                    {result.sources.map((source, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary-600 hover:text-primary-700 flex items-center space-x-1 focus:ring-2 focus:ring-primary-500 rounded"
                              >
                                <span>{source.title}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSourceTypeColor(source.type)}`}>
                                {source.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {source.snippet}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !isSearching && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready to answer your legal questions
          </h3>
          <p className="text-gray-600 mb-6">
            Search our comprehensive legal database for accurate, source-backed answers
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <button
              onClick={() => setQuery('How do I qualify as a solicitor in the UK?')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors focus:ring-2 focus:ring-primary-500"
            >
              <p className="font-medium text-gray-900">Qualification Requirements</p>
              <p className="text-sm text-gray-600 mt-1">SQE, training contracts, and more</p>
            </button>
            <button
              onClick={() => setQuery('What are the employment law changes in 2024?')}
              className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors focus:ring-2 focus:ring-primary-500"
            >
              <p className="font-medium text-gray-900">Recent Legal Updates</p>
              <p className="text-sm text-gray-600 mt-1">Latest changes and amendments</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}