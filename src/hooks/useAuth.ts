import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AuthService, UserProfile } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        
        if (firebaseUser) {
          const profile = await AuthService.getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const profile = await AuthService.signIn(email, password);
      setUserProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      const profile = await AuthService.signUp(email, password, displayName);
      setUserProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await AuthService.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
      throw err;
    }
  };

  const updatePreferences = async (preferences: Partial<UserProfile['preferences']>) => {
    if (!user) return;
    
    try {
      setError(null);
      await AuthService.updateUserPreferences(user.uid, preferences);
      
      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          preferences: { ...userProfile.preferences, ...preferences }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    }
  };

  return {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updatePreferences,
    isAuthenticated: !!user
  };
}