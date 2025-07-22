
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { AuthProvider as FirebaseAuthProvider, useAuth as useFirebaseAuth } from '@/lib/firebase/AuthContext';
import { loginWithERPNext, logoutFromERPNext, resetERPNextPassword, getUserDetailsFromERPNext } from '@/lib/services/erpnext-auth';
import { useToast } from '@/hooks/use-toast';
import type { AuthUser } from '@/lib/types';

type AuthMethod = 'firebase' | 'erpnext';

interface CombinedAuthContextType {
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  erpSid: string | null; // Expose the SID
}

const CombinedAuthContext = createContext<CombinedAuthContextType | undefined>(undefined);

const AUTH_METHOD_STORAGE_KEY = 'rio_auth_method';
const ERPNEXT_SID_STORAGE_KEY = 'rio_erpnext_sid';

function getInitialAuthMethod(): AuthMethod {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem(AUTH_METHOD_STORAGE_KEY) as AuthMethod) || 'firebase';
  }
  return 'firebase';
}

export function CombinedAuthProvider({ children }: { children: ReactNode }) {
  const [authMethod, setAuthMethodState] = useState<AuthMethod>(getInitialAuthMethod());

  const setAuthMethod = (method: AuthMethod) => {
    localStorage.setItem(AUTH_METHOD_STORAGE_KEY, method);
    setAuthMethodState(method);
  };

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
  
  const [erpUser, setErpUser] = useState<AuthUser | null>(null);
  const [erpSid, setErpSid] = useState<string | null>(null);
  const [isErpLoading, setIsErpLoading] = useState(true);

  const checkErpSession = useCallback(async (sid: string) => {
    if (authMethod !== 'erpnext' || !sid) {
        setIsErpLoading(false);
        setErpUser(null);
        return;
    }
    setIsErpLoading(true);
    try {
      const result = await getUserDetailsFromERPNext(sid);
      if (result.success && result.user) {
        const role = result.user.username === 'Administrator' ? 'admin' : 'user';

        setErpUser({
            uid: result.user.username,
            displayName: result.user.fullName,
            email: result.user.email,
            photoURL: result.user.photoURL,
            role: role,
        });
        setErpSid(sid); 
      } else {
        setErpUser(null);
        setErpSid(null);
        localStorage.removeItem(ERPNEXT_SID_STORAGE_KEY);
      }
    } catch (error) {
      setErpUser(null);
      setErpSid(null);
      localStorage.removeItem(ERPNEXT_SID_STORAGE_KEY);
    } finally {
      setIsErpLoading(false);
    }
  }, [authMethod]);
  
  useEffect(() => {
    const storedSid = localStorage.getItem(ERPNEXT_SID_STORAGE_KEY);
    if (authMethod === 'erpnext' && storedSid) {
        checkErpSession(storedSid);
    } else {
        setIsErpLoading(false);
    }
  }, [checkErpSession, authMethod]);

  const user = authMethod === 'firebase' ? firebase.user : erpUser;
  const isAuthenticated = !!user;
  const loading = firebase.loading || isErpLoading;

  const signIn = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (authMethod === 'firebase') {
      return firebase.signInWithEmailPassword(username, password);
    } else {
      setIsErpLoading(true);
      const result = await loginWithERPNext(username, password);
      if (result.success && result.sid) {
        localStorage.setItem(ERPNEXT_SID_STORAGE_KEY, result.sid);
        await checkErpSession(result.sid);
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
      localStorage.removeItem(ERPNEXT_SID_STORAGE_KEY);
      setErpUser(null);
      setErpSid(null);
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
    isAuthenticated,
    loading,
    signIn,
    signOut,
    resetPassword,
    erpSid,
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
