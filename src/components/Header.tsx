import React, { useState } from 'react';
import { Bell, Search, Settings, User, Menu } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const { announceToScreenReader } = useAccessibility();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    announceToScreenReader(`Searching for ${searchQuery}`);
  };

  return (
    <header 
      className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4"
      role="banner"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Logo - responsive sizing */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm" aria-hidden="true">A</span>
            </div>
            <h1 className="text-lg sm:text-xl font-display font-semibold text-gray-900">
              Athena
            </h1>
          </div>
          
          {/* Search - hidden on mobile, shown on tablet+ */}
          <form onSubmit={handleSearch} className="hidden md:block">
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" 
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search cases, documents, or ask a question..."
                className="pl-10 pr-4 py-2 w-64 lg:w-96 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search cases, documents, or ask a question"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile search button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <button
            className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500"
            aria-label="User profile"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:block font-medium text-sm">Sarah Chen</span>
          </button>
        </div>
      </div>
    </header>
  );
}