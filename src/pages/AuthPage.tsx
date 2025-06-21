import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import SignUpForm from '../components/auth/SignUpForm';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {isSignUp ? (
            <SignUpForm onToggleMode={() => setIsSignUp(false)} />
          ) : (
            <LoginForm onToggleMode={() => setIsSignUp(true)} />
          )}
        </div>
        
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}