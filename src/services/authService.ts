import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    accessibility: {
      reducedMotion: boolean;
      highContrast: boolean;
      largeText: boolean;
      screenReader: boolean;
      signLanguage: boolean;
      signLanguageType: 'ASL' | 'BSL' | 'ISL';
      voiceSpeed: number;
      transcriptionEnabled: boolean;
    };
    notifications: {
      email: boolean;
      push: boolean;
      deadlineReminders: boolean;
    };
  };
}

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          accessibility: {
            reducedMotion: false,
            highContrast: false,
            largeText: false,
            screenReader: true,
            signLanguage: false,
            signLanguageType: 'ASL',
            voiceSpeed: 1.0,
            transcriptionEnabled: true,
          },
          notifications: {
            email: true,
            push: true,
            deadlineReminders: true,
          }
        }
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error signing up:', error);
      throw new Error('Failed to create account. Please try again.');
    }
  }

  /**
   * Sign in existing user
   */
  static async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last login time
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { lastLoginAt: new Date() }, { merge: true });

      // Get user profile
      const userProfile = await this.getUserProfile(user.uid);
      return userProfile;
    } catch (error) {
      console.error('Error signing in:', error);
      throw new Error('Invalid email or password. Please try again.');
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  /**
   * Get user profile from Firestore
   */
  static async getUserProfile(uid: string): Promise<UserProfile> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        lastLoginAt: data.lastLoginAt.toDate()
      } as UserProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to load user profile. Please try again.');
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    uid: string, 
    preferences: Partial<UserProfile['preferences']>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { preferences }, { merge: true });
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences. Please try again.');
    }
  }

  /**
   * Listen to authentication state changes
   */
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
}