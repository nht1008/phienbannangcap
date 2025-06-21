
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
  signUpAndRequestAccess: (details: Omit<UserAccessRequest, 'id' | 'status' | 'requestDate' | 'reviewedBy' | 'reviewDate' | 'rejectionReason'> & {password: string}) => Promise<void>;
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

const ADMIN_EMAIL = "nthe1008@gmail.com";

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

      // 1. Admin always has access
      if (user.email === ADMIN_EMAIL) {
        setCurrentUser(user);
        return user;
      }
      
      // 2. Check if user is an existing employee
      const employeeSnapshot = await get(child(ref(db), `employees/${user.uid}`));
      if (employeeSnapshot.exists()) {
        setCurrentUser(user);
        return user;
      }

      // 3. Check for customer access request status
      const customerRequestSnapshot = await get(child(ref(db), `khach_hang_cho_duyet/${user.uid}`));
      if (customerRequestSnapshot.exists()) {
          await firebaseSignOut(auth);
          setError({ code: "auth/account-not-approved", message: "Yêu cầu khách hàng của bạn đang chờ phê duyệt." } as AuthError);
          return null;
      }

      // If not an employee and no pending request, they must be a customer. Check if approved.
      const customerRecordSnapshot = await get(child(ref(db), `customers/${user.uid}`));
       if (customerRecordSnapshot.exists()) {
           // They are an approved customer
           setCurrentUser(user);
           return user;
       }

      // If user exists in auth but none of the above, they don't have access.
      await firebaseSignOut(auth);
      setError({ code: "auth/no-access-rights", message: "Tài khoản của bạn không có quyền truy cập. Vui lòng đăng ký hoặc liên hệ quản trị viên." } as AuthError);
      return null;

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

  const signUpAndRequestAccess = async (details: Omit<UserAccessRequest, 'id' | 'status' | 'requestDate' | 'reviewedBy' | 'reviewDate' | 'rejectionReason'> & {password: string}) => {
    setLoading(true);
    setError(null);
    const { email, password, fullName, phone, address, zaloName, requestedRole } = details;
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
        requestedRole,
        status: 'pending',
        requestDate: new Date().toISOString(),
      };
      
      // Always write to customer approval queue
      await set(ref(db, `khach_hang_cho_duyet/${user.uid}`), accessRequestData);
      
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
