import React, { useState } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Filter, 
  Upload,
  FileText,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface CaseFile {
  id: string;
  title: string;
  client: string;
  type: 'litigation' | 'corporate' | 'employment' | 'immigration' | 'property' | 'intellectual-property';
  status: 'active' | 'pending' | 'completed' | 'on-hold';
  priority: 'high' | 'medium' | 'low';
  lastUpdated: Date;
  nextDeadline?: Date;
  documentsCount: number;
  progress: number;
}

const mockCases: CaseFile[] = [
  {
    id: '1',
    title: 'Johnson Property Dispute',
    client: 'Michael Johnson',
    type: 'property',
    status: 'active',
    priority: 'high',
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nextDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    documentsCount: 12,
    progress: 65
  },
  {
    id: '2',
    title: 'ABC Corp Merger Documentation',
    client: 'ABC Corporation',
    type: 'corporate',
    status: 'active',
    priority: 'medium',
    lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000),
    nextDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    documentsCount: 28,
    progress: 40
  },
  {
    id: '3',
    title: 'TechCorp Patent Application',
    client: 'TechCorp Industries',
    type: 'intellectual-property',
    status: 'pending',
    priority: 'high',
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    nextDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    documentsCount: 8,
    progress: 90
  },
  {
    id: '4',
    title: 'Smith Employment Case',
    client: 'Sarah Smith',
    type: 'employment',
    status: 'completed',
    priority: 'low',
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    documentsCount: 15,
    progress: 100
  }
];

export default function Cases() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'on-hold': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'on-hold': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'litigation': return 'bg-red-100 text-red-800';
      case 'corporate': return 'bg-blue-100 text-blue-800';
      case 'employment': return 'bg-green-100 text-green-800';
      case 'immigration': return 'bg-purple-100 text-purple-800';
      case 'property': return 'bg-amber-100 text-amber-800';
      case 'intellectual-property': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCases = mockCases.filter(caseFile => {
    const matchesSearch = caseFile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         caseFile.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || caseFile.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || caseFile.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Case Management
          </h1>
          <p className="text-gray-600 mt-1">
            Organize and track all your legal cases
          </p>
        </div>
        
        <button
          onClick={() => setShowNewCaseModal(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Case</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases or clients..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="litigation">Litigation</option>
                <option value="corporate">Corporate</option>
                <option value="employment">Employment</option>
                <option value="immigration">Immigration</option>
                <option value="property">Property</option>
                <option value="intellectual-property">IP</option>
              </select>
            </div>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((caseFile) => (
          <div key={caseFile.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-5 h-5 text-primary-600" />
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(caseFile.type)}`}>
                  {caseFile.type.replace('-', ' ')}
                </span>
              </div>
              
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(caseFile.status)}`}>
                {getStatusIcon(caseFile.status)}
                <span className="ml-1">{caseFile.status}</span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {caseFile.title}
            </h3>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <Users className="w-4 h-4" />
              <span>{caseFile.client}</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{caseFile.progress}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${caseFile.progress}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>{caseFile.documentsCount} docs</span>
                </div>
                {caseFile.nextDeadline && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <Calendar className="w-4 h-4" />
                    <span>Due {caseFile.nextDeadline.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Updated {caseFile.lastUpdated.toLocaleString()}
                </span>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium focus:ring-2 focus:ring-primary-500 rounded">
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCases.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No cases found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search or filters' : 'Get started by creating your first case'}
          </p>
          <button
            onClick={() => setShowNewCaseModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 mx-auto transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Case</span>
          </button>
        </div>
      )}

      {/* Quick Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Document Upload</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
          <p className="text-sm text-gray-500">Supports PDF, DOC, DOCX, and image files</p>
          <button className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-gray-500">
            Choose Files
          </button>
        </div>
      </div>
    </div>
  );
}