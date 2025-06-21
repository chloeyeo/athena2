import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: { displayName: string } | null;
  userProfile: any | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePreferences: (preferences: any) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Mock authentication - no login required
  const mockAuth: AuthContextType = {
    user: { displayName: 'User' },
    userProfile: null,
    loading: false,
    error: null,
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {},
    updatePreferences: async () => {},
    isAuthenticated: true // Always authenticated
  };

  return (
    <AuthContext.Provider value={mockAuth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}