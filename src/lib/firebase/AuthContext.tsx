
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
import { createUserProfile, getUserProfile } from './firestore';
import type { AuthUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  role: 'admin' | 'user' | null;
  signInWithGoogle: () => Promise<boolean>;
  signUpWithEmailPassword: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
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
        // This check is important. If a user was created with email/pass, 
        // their display name might not be set on the FirebaseUser object immediately.
        // createUserProfile handles setting the initial profile in Firestore.
        if (!userProfile) {
          // Attempt to create profile if it truly doesn't exist. 
          // This might happen if an auth record exists without a firestore profile.
          userProfile = await createUserProfile(firebaseUser, firebaseUser.displayName || "New User");
        }
        
        const authUser: AuthUser = {
          ...firebaseUser,
          // Ensure displayName in AuthUser reflects Firestore profile if available, or FirebaseUser's
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
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        let userProfile = await getUserProfile(result.user.uid);
        if (!userProfile) {
          userProfile = await createUserProfile(result.user); // Uses displayName from Google
        }
        const authUser: AuthUser = {
          ...result.user,
          role: userProfile?.role || 'user',
        };
        setUser(authUser);
        setRole(authUser.role);
        toast({ title: "Login Successful", description: "Welcome back!" });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error during Google sign-in:', error);
      toast({ title: "Login Failed", description: error.message || "Could not sign in with Google.", variant: "destructive" });
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
      
      // Update Firebase Auth profile with displayName
      await updateProfile(firebaseUser, { displayName: displayName });

      // Create user profile in Firestore
      const userProfile = await createUserProfile(firebaseUser, displayName);
      
      if (userProfile) {
        const authUser: AuthUser = {
          ...firebaseUser,
          displayName: userProfile.displayName, // Use name from profile
          photoURL: userProfile.photoURL,     // Use photo from profile
          role: userProfile.role || 'user',
        };
        setUser(authUser);
        setRole(authUser.role);
        toast({ title: "Account Created", description: "Welcome to RIO!" });
        return { success: true };
      } else {
        // This case should ideally not happen if createUserProfile is robust
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
            errorMessage = 'The password is too weak. Please choose a stronger password.';
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
      // onAuthStateChanged will handle setting user and role
      toast({ title: "Login Successful", description: "Welcome back!" });
      return { success: true };
    } catch (error: any) {
      console.error('Error signing in with email/password:', error);
      let errorMessage = "An unexpected error occurred during sign in.";
       if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // More generic error for wrong email/password
            errorMessage = 'Invalid email or password. Please try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
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
        // Don't reveal if user exists, for security
         toast({ title: "Password Reset Email Sent", description: "If an account exists for this email, a password reset link has been sent." });
         return { success: true }; // Pretend success
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid.';
      }
      toast({ title: "Password Reset Failed", description: errorMessage, variant: "destructive" });
      return { success: false, error: errorMessage };
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
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) { // Adjusted loading state for initial load or when signing out
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, role, signInWithGoogle, signUpWithEmailPassword, signInWithEmailPassword, sendPasswordReset, signOutUser }}>
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
