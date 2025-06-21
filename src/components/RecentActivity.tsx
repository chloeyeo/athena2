import React from 'react';
import { Activity, FileText, MessageSquare, Video, Upload } from 'lucide-react';
import { format } from 'date-fns';

const mockActivities = [
  {
    id: 1,
    type: 'call' as const,
    title: 'Completed call with Athena',
    description: 'Discussed UK immigration law requirements',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 2,
    type: 'document' as const,
    title: 'Uploaded case documents',
    description: 'Added 3 files to Johnson Property Dispute',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    id: 3,
    type: 'question' as const,
    title: 'Asked legal question',
    description: 'Contract termination clauses in UK law',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: 4,
    type: 'upload' as const,
    title: 'Document review completed',
    description: 'Patent application reviewed and annotated',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
];

const activityIcons = {
  call: Video,
  document: FileText,
  question: MessageSquare,
  upload: Upload,
};

const activityColors = {
  call: 'text-blue-600 bg-blue-50',
  document: 'text-green-600 bg-green-50',
  question: 'text-purple-600 bg-purple-50',
  upload: 'text-amber-600 bg-amber-50',
};

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="w-5 h-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>
      
      <div className="space-y-4">
        {mockActivities.map((activity) => {
          const Icon = activityIcons[activity.type];
          
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 p-2 rounded-lg ${activityColors[activity.type]}`}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(activity.timestamp, 'MMM dd, h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  );
}