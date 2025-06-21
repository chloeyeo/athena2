import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Video, 
  MessageSquare, 
  Calendar, 
  FolderOpen, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle,
  BookOpen,
  Users,
  Award
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import RecentActivity from '../components/RecentActivity';
import UpcomingDeadlines from '../components/UpcomingDeadlines';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Welcome to Athena
          </h1>
          <p className="text-gray-600 mt-1">
            Your AI legal mentor for professional development and legal guidance.
          </p>
        </div>
        
        <Link
          to="/call"
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <Video className="w-5 h-5" />
          <span>Start Call with Athena</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Legal Scenarios"
          value="25+"
          change="Practice scenarios"
          trend="up"
          icon={BookOpen}
          color="blue"
        />
        <StatsCard
          title="Skills Practiced"
          value="8"
          change="Communication, drafting, etc."
          trend="up"
          icon={Award}
          color="green"
        />
        <StatsCard
          title="Sessions Completed"
          value="12"
          change="+3 this week"
          trend="up"
          icon={CheckCircle}
          color="purple"
        />
        <StatsCard
          title="Confidence Level"
          value="85%"
          change="+15% improvement"
          trend="up"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Development Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/call"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group focus:ring-2 focus:ring-primary-500"
              >
                <Video className="w-8 h-8 text-primary-600 group-hover:text-primary-700 mb-2" />
                <h3 className="font-medium text-gray-900">Live Mentoring Call</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Practice legal scenarios with real-time feedback and guidance
                </p>
              </Link>
              
              <Link
                to="/qa"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group focus:ring-2 focus:ring-primary-500"
              >
                <MessageSquare className="w-8 h-8 text-primary-600 group-hover:text-primary-700 mb-2" />
                <h3 className="font-medium text-gray-900">Legal Q&A</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get answers to legal questions with source citations
                </p>
              </Link>

              <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                <Users className="w-8 h-8 text-primary-600 group-hover:text-primary-700 mb-2" />
                <h3 className="font-medium text-gray-900">Communication Skills</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Practice client interviews and difficult conversations
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group">
                <BookOpen className="w-8 h-8 text-primary-600 group-hover:text-primary-700 mb-2" />
                <h3 className="font-medium text-gray-900">Legal Drafting</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get feedback on contracts, letters, and legal documents
                </p>
              </div>
            </div>
          </div>

          {/* Legal Scenarios Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Practice Scenarios</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900">Contract Dispute Resolution</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Practice handling a breach of contract scenario with client communication and negotiation strategies.
                </p>
                <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Start Scenario →
                </button>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900">Employment Law Consultation</h3>
                <p className="text-sm text-green-700 mt-1">
                  Handle an unfair dismissal case with tribunal procedures and client advice.
                </p>
                <button className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium">
                  Start Scenario →
                </button>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-medium text-purple-900">Property Transaction</h3>
                <p className="text-sm text-purple-700 mt-1">
                  Navigate a complex residential conveyancing with multiple parties and issues.
                </p>
                <button className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium">
                  Start Scenario →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Tips */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Legal Tip</h3>
            <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
              <h4 className="font-medium text-accent-900 mb-2">Client Communication</h4>
              <p className="text-sm text-accent-700">
                Always confirm important instructions in writing. This protects both you and your client, 
                and ensures clear understanding of the legal advice given.
              </p>
            </div>
          </div>

          {/* Accessibility Features */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accessibility Features</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Real-time sign language interpretation</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Voice-to-text transcription</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Text-to-speech responses</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">High contrast mode</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}