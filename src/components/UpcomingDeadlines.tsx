import React from 'react';
import { Clock, AlertTriangle, Calendar } from 'lucide-react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';

const mockDeadlines = [
  {
    id: 1,
    title: 'Patent Application Filing',
    case: 'TechCorp vs. Innovate Ltd',
    date: new Date(),
    priority: 'high' as const,
  },
  {
    id: 2,
    title: 'Discovery Response Due',
    case: 'Smith Employment Case',
    date: addDays(new Date(), 1),
    priority: 'medium' as const,
  },
  {
    id: 3,
    title: 'Court Hearing Preparation',
    case: 'Johnson Property Dispute',
    date: addDays(new Date(), 3),
    priority: 'high' as const,
  },
  {
    id: 4,
    title: 'Contract Review Deadline',
    case: 'ABC Corp Merger',
    date: addDays(new Date(), 7),
    priority: 'low' as const,
  },
];

export default function UpcomingDeadlines() {
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-amber-600" />
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
      </div>
      
      <div className="space-y-4">
        {mockDeadlines.map((deadline) => (
          <div key={deadline.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex-shrink-0">
              {deadline.priority === 'high' && (
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              {deadline.priority !== 'high' && (
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {deadline.title}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {deadline.case}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-gray-500">
                  {getDateLabel(deadline.date)}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(deadline.priority)}`}>
                  {deadline.priority}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View all deadlines →
        </button>
      </div>
    </div>
  );
}