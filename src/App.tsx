import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuthContext } from './contexts/AuthContext';
import AccessibilityProvider from './contexts/AccessibilityContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LiveCall from './pages/LiveCall';
import LegalQA from './pages/LegalQA';
import Calendar from './pages/Calendar';
import Cases from './pages/Cases';
import AuthPage from './pages/AuthPage';

function AppContent() {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading Athena...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="call" element={<LiveCall />} />
            <Route path="qa" element={<LegalQA />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="cases" element={<Cases />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;