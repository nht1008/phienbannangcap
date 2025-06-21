
"use client";

import type { User, AuthError } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, db } from '@/lib/firebase'; 
import { ref, get, child, set } from "firebase/database";
import type { UserAccessRequest } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  updateUserProfileName: (name: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  signUpAndRequestAccess: (details: Omit<UserAccessRequest, 'id' | 'status' | 'requestDate' | 'reviewedBy' | 'reviewDate' | 'rejectionReason' | 'requestedRole'> & {password: string}) => Promise<void>;
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
      
      const employeeSnapshot = await get(child(ref(db), `employees/${user.uid}`));
      if (user.email === "nthe1008@gmail.com" || employeeSnapshot.exists()) {
        setCurrentUser(user);
        return user;
      }

      const employeeAccessRequestSnapshot = await get(child(ref(db), `userAccessRequests/${user.uid}`));
      if (employeeAccessRequestSnapshot.exists()) {
        const requestData = employeeAccessRequestSnapshot.val() as UserAccessRequest;
        if (requestData.status === 'approved') {
            setCurrentUser(user);
            return user;
        } else if (requestData.status === 'pending') {
            await firebaseSignOut(auth);
            setError({ code: "auth/account-not-approved", message: "Yêu cầu nhân viên của bạn đang chờ phê duyệt." } as AuthError);
            return null;
        } else if (requestData.status === 'rejected') {
            await firebaseSignOut(auth);
            setError({ code: "auth/account-rejected", message: `Yêu cầu nhân viên đã bị từ chối. Lý do: ${requestData.rejectionReason || 'Không có'}` } as AuthError);
            return null;
        }
      }
      
      setCurrentUser(user); 
      return user;

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
        setCurrentUser(prevUser => prevUser ? ({ ...prevUser, displayName: name }) : null);
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
      throw err; 
    }
  };

  const signUpAndRequestAccess = async (details: Omit<UserAccessRequest, 'id' | 'status' | 'requestDate' | 'reviewedBy' | 'reviewDate' | 'rejectionReason' | 'requestedRole'> & {password: string}) => {
    setLoading(true);
    setError(null);
    const { email, password, fullName, phone, address, zaloName } = details;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      const accessRequestData: Omit<UserAccessRequest, 'id'> = {
        fullName,
        email,
        phone,
        address,
        zaloName,
        requestedRole: 'employee', 
        status: 'pending',
        requestDate: new Date().toISOString(),
      };
      
      await set(ref(db, `userAccessRequests/${user.uid}`), accessRequestData);
      
      await firebaseSignOut(auth);
      setCurrentUser(null);

    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    updateUserProfileName,
    sendPasswordResetEmail,
    signUpAndRequestAccess,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
