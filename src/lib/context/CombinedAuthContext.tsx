
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
  const [authMethod, setAuthMethod] = useState<AuthMethod>('erpnext');

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
      } else {
        setIsErpLoading(false);
      }
      return result;
    }
  }, [authMethod, firebase, checkErpSession]);

  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (authMethod === 'firebase') {
      await firebase.signOutUser();
    } else {
      await logoutFromERPNext();
      setErpUser(null);
    }
    return { success: true };
  }, [authMethod, firebase]);

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    return authMethod === 'firebase'
      ? firebase.sendPasswordReset(email)
      : resetERPNextPassword(email);
  }, [authMethod, firebase]);

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
