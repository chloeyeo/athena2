import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import Header from './Header';
import AccessibilityToolbar from './AccessibilityToolbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AccessibilityToolbar />
      
      {/* Mobile-first responsive layout */}
      <div className="lg:flex">
        {/* Navigation - Hidden on mobile, shown as sidebar on desktop */}
        <div className="hidden lg:block">
          <Navigation />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 lg:ml-64">
          <Header />
          <main 
            className="p-4 sm:p-6"
            role="main"
            aria-label="Main content"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}