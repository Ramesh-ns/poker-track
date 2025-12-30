import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as authApi from '../lib/auth';

interface AuthContextType {
  session: Session | null;
  user: any;
  isLoading: boolean;
  signUp: (emailOrPhone: string, password: string, username?: string, isPhone?: boolean) => Promise<any>;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (emailOrPhone: string, password: string, username?: string, isPhone = false) => {
    setIsLoading(true);
    try {
      const result = await authApi.signUp(emailOrPhone, password, username, isPhone);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      await authApi.signIn(identifier, password);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('AuthContext: Starting signout...');
    setIsLoading(true);
    try {
      // Clear local state first
      setSession(null);
      setUser(null);
      
      // Then sign out from Supabase
      await authApi.signOut();
      
      console.log('AuthContext: Signout successful');
      
      // Ensure state is cleared
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
      // Clear state even if there's an error
      setSession(null);
      setUser(null);
      // Don't throw - we want to clear state regardless
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        signUp,
        signIn,
        signOut,
      }}
    >
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

