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
  CheckCircle
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
            Welcome back, Sarah
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your legal practice today.
          </p>
        </div>
        
        <Link
          to="/call"
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <Video className="w-5 h-5" />
          <span>Call Athena</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Cases"
          value="12"
          change="+2 this week"
          trend="up"
          icon={FolderOpen}
          color="blue"
        />
        <StatsCard
          title="Pending Tasks"
          value="8"
          change="Due this week"
          trend="neutral"
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Completed Reviews"
          value="34"
          change="+12% this month"
          trend="up"
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Success Rate"
          value="94%"
          change="+3% improvement"
          trend="up"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/call"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group focus:ring-2 focus:ring-primary-500"
              >
                <Video className="w-8 h-8 text-primary-600 group-hover:text-primary-700 mb-2" />
                <h3 className="font-medium text-gray-900">Live Call with Athena</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get instant legal guidance with your AI mentor
                </p>
              </Link>
              
              <Link
                to="/qa"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group focus:ring-2 focus:ring-primary-500"
              >
                <MessageSquare className="w-8 h-8 text-primary-600 group-hover:text-primary-700 mb-2" />
                <h3 className="font-medium text-gray-900">Ask Legal Questions</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Search legal databases with source citations
                </p>
              </Link>

              <Link
                to="/cases"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group focus:ring-2 focus:ring-primary-500"
              >
                <FolderOpen className="w-8 h-8 text-primary-600 group-hover:text-primary-700 mb-2" />
                <h3 className="font-medium text-gray-900">Manage Cases</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Upload documents and organize case files
                </p>
              </Link>

              <Link
                to="/calendar"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors group focus:ring-2 focus:ring-primary-500"
              >
                <Calendar className="w-8 h-8 text-primary-600 group-hover:text-primary-700 mb-2" />
                <h3 className="font-medium text-gray-900">View Calendar</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Track deadlines and court dates
                </p>
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <UpcomingDeadlines />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}