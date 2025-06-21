import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Video, 
  MessageSquare, 
  Calendar, 
  FolderOpen,
  Settings,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/call', icon: Video, label: 'Live Call with Athena' },
  { to: '/qa', icon: MessageSquare, label: 'Legal Q&A' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/cases', icon: FolderOpen, label: 'Cases' },
];

const secondaryItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help & Support' },
];

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-primary-600 text-white rounded-lg shadow-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation sidebar */}
      <nav 
        className={`fixed left-0 top-0 h-full w-64 bg-primary-950 text-white p-4 overflow-y-auto z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="space-y-8 mt-16 lg:mt-20">
          <div>
            <h2 className="text-xs font-semibold text-primary-300 uppercase tracking-wider mb-3">
              Main Menu
            </h2>
            <ul className="space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors focus:ring-2 focus:ring-primary-400 ${
                        isActive
                          ? 'bg-primary-700 text-white'
                          : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                      }`
                    }
                    aria-current={({ isActive }) => isActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="text-sm sm:text-base">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-primary-300 uppercase tracking-wider mb-3">
              Support
            </h2>
            <ul className="space-y-1">
              {secondaryItems.map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-primary-200 hover:bg-primary-800 hover:text-white transition-colors focus:ring-2 focus:ring-primary-400"
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="text-sm sm:text-base">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}