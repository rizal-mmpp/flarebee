'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { AuthProvider as FirebaseAuthProvider, useAuth as useFirebaseAuth } from '@/lib/firebase/AuthContext';
import { ERPNextAuthProvider, useERPNextAuth } from './ERPNextAuthContext';

type AuthMethod = 'firebase' | 'erpnext';

interface CombinedAuthContextType {
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
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
      <ERPNextAuthProvider>
        <CombinedAuthContent authMethod={authMethod} setAuthMethod={setAuthMethod}>
          {children}
        </CombinedAuthContent>
      </ERPNextAuthProvider>
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
  const erpnext = useERPNextAuth();

  const isAuthenticated = authMethod === 'firebase' ? !!firebase.user : !!erpnext.user;
  const loading = authMethod === 'firebase' ? firebase.loading : erpnext.loading;

  const signIn = async (username: string, password: string) => {
    return authMethod === 'firebase'
      ? firebase.signInWithEmailPassword(username, password)
      : erpnext.signIn(username, password);
  };

  const signOut = async () => {
    if (authMethod === 'firebase') {
      await firebase.signOutUser();
      return { success: true };
    } else {
      return erpnext.signOut();
    }
  };

  const resetPassword = async (email: string) => {
    return authMethod === 'firebase'
      ? firebase.sendPasswordReset(email)
      : erpnext.resetPassword(email);
  };

  const value = {
    authMethod,
    setAuthMethod,
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