import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'court' | 'meeting' | 'deadline' | 'review';
  location?: string;
  priority: 'high' | 'medium' | 'low';
  case?: string;
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Court Hearing - Property Dispute',
    date: new Date(),
    time: '10:00 AM',
    type: 'court',
    location: 'Royal Courts of Justice',
    priority: 'high',
    case: 'Johnson vs. Smith Properties'
  },
  {
    id: '2',
    title: 'Client Meeting - Contract Review',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    time: '2:00 PM',
    type: 'meeting',
    location: 'Office Conference Room A',
    priority: 'medium',
    case: 'ABC Corp Merger'
  },
  {
    id: '3',
    title: 'Patent Filing Deadline',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    time: '5:00 PM',
    type: 'deadline',
    priority: 'high',
    case: 'TechCorp Patent Application'
  }
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getEventsForDate = (date: Date) => {
    return mockEvents.filter(event => isSameDay(event.date, date));
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'court': return 'bg-red-100 text-red-800 border-red-200';
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deadline': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'review': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const upcomingEvents = mockEvents
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Legal Calendar
          </h1>
          <p className="text-gray-600 mt-1">
            Track court dates, deadlines, and meetings
          </p>
        </div>
        
        <button
          onClick={() => setShowEventModal(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center space-x-1">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map(day => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              
              return (
                <div
                  key={day.toString()}
                  className={`bg-white min-h-[120px] p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !isCurrentMonth ? 'text-gray-400' : ''
                  } ${isDayToday ? 'bg-primary-50 border-2 border-primary-500' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${isDayToday ? 'text-primary-700' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded border ${getEventTypeColor(event.type)} truncate`}
                        title={event.title}
                      >
                        {event.time} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Upcoming Events</span>
            </h3>
            
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="border-l-4 border-primary-500 pl-4 py-2">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </div>
                  <p className="font-medium text-gray-900 text-sm">
                    {event.title}
                  </p>
                  <div className="text-xs text-gray-600 mt-1 space-y-1">
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{format(event.date, 'MMM dd')}</span>
                      <span>at {event.time}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.case && (
                      <div className="text-gray-500">
                        {event.case}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Add Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Add Event
            </h3>
            
            <form className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Event title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <input
                  type="time"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="meeting">Meeting</option>
                <option value="court">Court Hearing</option>
                <option value="deadline">Deadline</option>
                <option value="review">Review</option>
              </select>
              
              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Add Event
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}