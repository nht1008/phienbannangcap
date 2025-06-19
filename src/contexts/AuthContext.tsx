
"use client";

import type { User, AuthError } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail // Import new function
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, db } from '@/lib/firebase'; // Import db
import { ref, get, child } from "firebase/database"; // Import Realtime Database functions

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  updateUserProfileName: (name: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>; // Add new function type
  error: AuthError | null;
  setError: React.Dispatch<React.SetStateAction<AuthError | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    }, (err) => {
      console.error("Auth state change error:", err);
      setError(err as AuthError);
      setLoading(false);
    });
    return unsubscribe; 
  }, []);

  const signIn = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      // Check employee status first (higher priority)
      const employeeRef = child(ref(db), `employees/${user.uid}`);
      const employeeSnapshot = await get(employeeRef);

      if (employeeSnapshot.exists()) {
        // User is an employee, allow login
        setCurrentUser(user);
        return user;
      }

      // If not an employee, check customer approval status
      const userStatusRef = child(ref(db), `users/${user.uid}`);
      const snapshot = await get(userStatusRef);

      if (snapshot.exists() && snapshot.val().approvalStatus === 'approved') {
        setCurrentUser(user);
        return user;
      } else {
        await firebaseSignOut(auth);
        setCurrentUser(null);
        setError({
          code: 'auth/account-not-approved',
          message: 'Tài khoản của bạn đang chờ phê duyệt hoặc chưa được kích hoạt.'
        } as AuthError);
        return null;
      }
    } catch (err) {
      setError(err as AuthError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfileName = async (name: string) => {
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: name });
      } catch (err) {
        setError(err as AuthError);
        throw err; 
      }
    } else {
      const err = new Error("No current user to update.") as AuthError;
      setError(err);
      throw err;
    }
  };

  const sendPasswordResetEmail = async (emailAddress: string) => {
    setError(null);
    try {
      await firebaseSendPasswordResetEmail(auth, emailAddress);
    } catch (err) {
      setError(err as AuthError);
      throw err; // Re-throw to allow error handling in the component
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    updateUserProfileName,
    sendPasswordResetEmail, // Provide new function
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
