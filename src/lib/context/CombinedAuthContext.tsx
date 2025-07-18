
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { AuthProvider as FirebaseAuthProvider, useAuth as useFirebaseAuth, type AuthUser } from '@/lib/firebase/AuthContext';
import { loginWithERPNext, logoutFromERPNext, resetERPNextPassword, getUserDetailsFromERPNext } from '@/lib/services/erpnext-auth';
import { useToast } from '@/hooks/use-toast';

type AuthMethod = 'firebase' | 'erpnext';

interface ERPNextUser {
  username: string;
  email: string;
  fullName: string;
  photoURL?: string | null;
}

// A unified user type that can represent either auth system
type CombinedUser = AuthUser | (ERPNextUser & { uid: string });

interface CombinedAuthContextType {
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  user: CombinedUser | null;
  role: 'admin' | 'user' | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const CombinedAuthContext = createContext<CombinedAuthContextType | undefined>(undefined);

export function CombinedAuthProvider({ children }: { children: ReactNode }) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('firebase');

  return (
    <FirebaseAuthProvider>
      <CombinedAuthContent authMethod={authMethod} setAuthMethod={setAuthMethod}>
        {children}
      </CombinedAuthContent>
    </FirebaseAuthProvider>
  );
}

function CombinedAuthContent({
  children,
  authMethod,
  setAuthMethod,
}: {
  children: ReactNode;
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
}) {
  const firebase = useFirebaseAuth();
  const { toast } = useToast();
  
  const [erpUser, setErpUser] = useState<ERPNextUser | null>(null);
  const [isErpLoading, setIsErpLoading] = useState(true);

  const checkErpSession = useCallback(async () => {
    setIsErpLoading(true);
    try {
      const result = await getUserDetailsFromERPNext();
      if (result.success && result.user) {
        setErpUser(result.user);
      } else {
        setErpUser(null);
      }
    } catch (error) {
      setErpUser(null);
    } finally {
      setIsErpLoading(false);
    }
  }, []);
  
  useEffect(() => {
    // This is the key fix: Check for an existing ERPNext session on initial load.
    checkErpSession();
  }, [checkErpSession]);

  const user = authMethod === 'firebase' ? firebase.user : erpUser ? { ...erpUser, uid: erpUser.username } : null;
  const role = authMethod === 'firebase' ? firebase.role : (user ? 'user' : null); // ERPNext role logic can be added here
  const isAuthenticated = !!user;
  const loading = firebase.loading || isErpLoading;

  const signIn = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (authMethod === 'firebase') {
      return firebase.signInWithEmailPassword(username, password);
    } else {
      setIsErpLoading(true);
      const result = await loginWithERPNext(username, password);
      if (result.success) {
        // After a successful login, immediately check the session to get user data and update the state.
        await checkErpSession();
        toast({ title: "Login Successful", description: 'Welcome back!' });
      } else {
        toast({ title: "Login Failed", description: result.error, variant: 'destructive'});
        setIsErpLoading(false);
      }
      return result;
    }
  }, [authMethod, firebase, checkErpSession, toast]);

  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (authMethod === 'firebase') {
      await firebase.signOutUser();
    } else {
      await logoutFromERPNext();
      setErpUser(null);
      toast({ title: 'Logout Successful', description: 'You have been successfully logged out.' });
    }
    return { success: true };
  }, [authMethod, firebase, toast]);

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (authMethod === 'firebase') {
        return firebase.sendPasswordReset(email);
    } else {
        const result = await resetERPNextPassword(email);
        if (result.success) {
             toast({ title: 'Password Reset Email Sent', description: 'If an account exists for this email, a password reset link has been sent.' });
        } else {
             toast({ title: 'Password Reset Failed', description: result.error, variant: 'destructive' });
        }
        return result;
    }
  }, [authMethod, firebase, toast]);

  const value = {
    authMethod,
    setAuthMethod,
    user,
    role,
    isAuthenticated,
    loading,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <CombinedAuthContext.Provider value={value}>
      {children}
    </CombinedAuthContext.Provider>
  );
}

export function useCombinedAuth() {
  const context = useContext(CombinedAuthContext);
  if (context === undefined) {
    throw new Error('useCombinedAuth must be used within a CombinedAuthProvider');
  }
  return context;
}
