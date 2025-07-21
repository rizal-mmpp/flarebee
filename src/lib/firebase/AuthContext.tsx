
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile, getUserProfile, updateUserProfileInFirestore } from './firestore';
import type { AuthUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadFileToVercelBlob } from '../actions/vercelBlob.actions';

interface ProfileUpdateData {
  displayName?: string;
  photoFile?: File | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  role: 'admin' | 'user' | null;
  signInWithGoogle: () => Promise<boolean>;
  signUpWithEmailPassword: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        let userProfile = await getUserProfile(firebaseUser.uid);
        if (!userProfile) {
          userProfile = await createUserProfile(firebaseUser, firebaseUser.displayName || "New User");
        }
        
        const authUser: AuthUser = {
          ...firebaseUser,
          displayName: userProfile?.displayName || firebaseUser.displayName,
          photoURL: userProfile?.photoURL || firebaseUser.photoURL,
          role: userProfile?.role || 'user',
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

  const signInWithGoogle = async (): Promise<boolean> => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
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
        toast({ title: "Sign In Successful", description: "Welcome back!" });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error during Google sign-in:', error);
      toast({ title: "Sign In Failed", description: error.message || "Could not sign in with Google.", variant: "destructive" });
      setUser(null);
      setRole(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmailPassword = async (email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      await updateProfile(firebaseUser, { displayName: displayName });

      const userProfile = await createUserProfile(firebaseUser, displayName);
      
      if (userProfile) {
        const authUser: AuthUser = {
          ...firebaseUser,
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL,
          role: userProfile.role || 'user',
        };
        setUser(authUser);
        setRole(authUser.role);
        toast({ title: "Account Created", description: "Welcome to RIO!" });
        return { success: true };
      } else {
        throw new Error("Failed to create user profile in database.");
      }
    } catch (error: any) {
      console.error('Error signing up with email/password:', error);
      let errorMessage = "An unexpected error occurred during sign up.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already in use.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      toast({ title: "Sign Up Failed", description: errorMessage, variant: "destructive" });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  const signInWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Sign In Successful", description: "Welcome back!" });
      return { success: true };
    } catch (error: any) {
      console.error('Error signing in with email/password:', error);
      let errorMessage = "An unexpected error occurred during sign in.";
       if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      toast({ title: "Sign In Failed", description: errorMessage, variant: "destructive" });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password Reset Email Sent", description: "If an account exists for this email, a password reset link has been sent." });
      return { success: true };
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      let errorMessage = "Failed to send password reset email.";
      if (error.code === 'auth/user-not-found') {
         toast({ title: "Password Reset Email Sent", description: "If an account exists for this email, a password reset link has been sent." });
         return { success: true };
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid.';
      }
      toast({ title: "Password Reset Failed", description: errorMessage, variant: "destructive" });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) {
      return { success: false, error: 'You must be logged in to update your profile.' };
    }
    
    setLoading(true);
    try {
      let newPhotoURL = user?.photoURL || null;
      if (data.photoFile) {
        const formData = new FormData();
        formData.append('file', data.photoFile);
        const uploadResult = await uploadFileToVercelBlob(formData);
        if (!uploadResult.success || !uploadResult.data?.url) {
          throw new Error(uploadResult.error || 'Failed to upload new profile picture.');
        }
        newPhotoURL = uploadResult.data.url;
      }

      const profileUpdateForAuth = {
        displayName: data.displayName,
        photoURL: newPhotoURL,
      };

      const profileUpdateForFirestore = {
        displayName: data.displayName,
        photoURL: newPhotoURL,
      };

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, profileUpdateForAuth);
      
      // Update Firestore profile
      await updateUserProfileInFirestore(auth.currentUser.uid, profileUpdateForFirestore);

      // Update local state to reflect changes immediately
      setUser(prevUser => prevUser ? ({
        ...prevUser,
        ...profileUpdateForAuth
      }) : null);

      return { success: true };
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message || 'An unexpected error occurred.' };
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
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, role, signInWithGoogle, signUpWithEmailPassword, signInWithEmailPassword, sendPasswordReset, signOutUser, updateUserProfile }}>
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

export type { AuthUser };
