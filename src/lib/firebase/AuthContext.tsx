
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile, getUserProfile } from './firestore';
import type { AuthUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  role: 'admin' | 'user' | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        let userProfile = await getUserProfile(firebaseUser.uid);
        if (!userProfile) {
          // If profile doesn't exist, try to create it
          userProfile = await createUserProfile(firebaseUser);
        }
        
        const authUser: AuthUser = {
          ...firebaseUser,
          role: userProfile?.role || 'user', // Default to 'user' if role is somehow missing
        };
        setUser(authUser);
        setRole(authUser.role);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        let userProfile = await getUserProfile(result.user.uid);
        if (!userProfile) {
          userProfile = await createUserProfile(result.user);
        }
        const authUser: AuthUser = {
          ...result.user,
          role: userProfile?.role || 'user',
        };
        setUser(authUser);
        setRole(authUser.role);
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      setUser(null); // Ensure user is null on error
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, role, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
